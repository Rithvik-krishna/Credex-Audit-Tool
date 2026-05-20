import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simple in-memory rate limiting map (IP -> count & reset timestamp)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // Reset counters after 24 hours
  if (now - record.lastReset > 24 * 60 * 60 * 1000) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (record.count >= 10) {
    return false;
  }

  record.count++;
  return true;
}

// Deterministic high-quality fallback template as specified in PROMPTS.md
function getFallbackSummary(data: any): string {
  const recommendations = data.auditResults?.recommendations || [];
  const biggestSavingsTool = recommendations.reduce((prev: any, current: any) =>
    (current.monthlySavings > (prev?.monthlySavings || 0)) ? current : prev
  , recommendations[0]);

  let winText = "";
  if (biggestSavingsTool && biggestSavingsTool.monthlySavings > 0) {
    winText = `The most substantial opportunity lies in your ${biggestSavingsTool.toolName} stack, where transitioning to the recommended ${biggestSavingsTool.recommendedPlan} will recover $${biggestSavingsTool.monthlySavings}/mo.`;
  } else {
    winText = "Your AI tool configurations are already highly streamlined across all layers.";
  }

  return `Your startup is spending $${data.auditResults?.totalCurrentSpend || 0}/mo on AI across team tools and APIs for a ${data.teamSize}-person team. By actioning our recommendations, you can reduce this to $${data.auditResults?.totalRecommendedSpend || 0}/mo, unlocking $${data.auditResults?.totalMonthlySavings || 0}/mo in recurring savings ($${data.auditResults?.totalAnnualSavings || 0}/year). ${winText} For high-volume API configurations, routing through Credex's customized institutional credit pools will capture additional deep discounts.`;
}

export async function POST(req: NextRequest) {
  try {
    // Abuse Protection: IP Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 10 submissions per day.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { id, email, companyName, role, website } = body;

    // Abuse Protection: Honeypot check
    // "website" is a hidden field in the frontend form. If a bot fills it, reject.
    if (website && website.trim() !== '') {
      console.warn(`Honeypot triggered by bot from IP ${ip}. Rejected submission.`);
      return NextResponse.json(
        { error: 'Security validation failed.' },
        { status: 400 }
      );
    }

    // Validation
    if (!id || !email) {
      return NextResponse.json(
        { error: 'Audit ID and email address are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    // Retrieve audit record from DB
    const record = await db.getAudit(id);
    if (!record) {
      return NextResponse.json(
        { error: 'Audit record not found.' },
        { status: 404 }
      );
    }

    // --- STEP 1: PERSONALIZED LLM SUMMARY (Claude API with AbortTimeout & Fallback) ---
    let llmSummary = '';
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey) {
      const systemPrompt = `You are an elite AI infrastructure finance consultant. Your job is to analyze a startup's AI spend and write a personalized, highly encouraging, and objective financial audit summary.
Keep your response strictly under 100 words (aim for 85-90 words). Focus on actionable savings and highlight the single biggest "quick win" opportunity. Write as a professional human advisor.`;

      const userMessage = `Analyze the following audit data for a startup with a team size of ${record.teamSize} doing primarily ${record.useCase}:
- Current Monthly Spend: $${record.auditResults.totalCurrentSpend}
- Recommended Monthly Spend: $${record.auditResults.totalRecommendedSpend}
- Net Monthly Savings: $${record.auditResults.totalMonthlySavings}
- Net Annual Savings: $${record.auditResults.totalAnnualSavings}
Tools detailed: ${JSON.stringify(record.auditResults.recommendations, null, 2)}

Write exactly one paragraph. Do not start with pleasantries. Dive straight into findings. Mention their biggest win, and encourage them to implement these optimizations or book a consultation with Credex to optimize API pipelines.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout limit

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 150,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          llmSummary = data.content?.[0]?.text?.trim() || '';
        } else {
          const errText = await response.text();
          console.warn(`Anthropic API returned error (${response.status}): ${errText}`);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn('Anthropic API request failed or timed out:', err.name === 'AbortError' ? 'Timeout' : err.message);
      }
    }

    // Fall back to template if summary generation failed or API is missing
    if (!llmSummary) {
      llmSummary = getFallbackSummary(record);
      console.log('Generating summary from fallback template.');
    }

    // --- STEP 2: DISPATCH TRANSACTIONAL EMAIL (Resend API with Console Logging Fallback) ---
    const resendKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM_EMAIL || 'noreply@your-vercel-domain.com';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const auditUrl = `${baseUrl}/audit/${id}`;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #4f46e5; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Credex AI Spend Audit</h2>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          Thank you for auditing your startup's AI tool spend. We have successfully compiled your report!
        </p>
        
        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #edd8fc 100%); padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: #6d28d9; display: block; margin-bottom: 4px;">Identified Savings</span>
          <h1 style="margin: 0 0 4px 0; font-size: 36px; font-weight: 800; color: #1e1b4b;">$${record.auditResults.totalAnnualSavings.toLocaleString()}/yr</h1>
          <p style="margin: 0; font-size: 15px; color: #5b21b6; font-weight: 500;">($${record.auditResults.totalMonthlySavings}/month in recurring overhead)</p>
        </div>

        <h3 style="font-size: 16px; margin: 0 0 12px 0; color: #1e293b; font-weight: 700;">Executive Summary:</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; font-style: italic; background-color: #f8fafc; padding: 16px; border-left: 4px solid #818cf8; border-radius: 4px;">
          "${llmSummary}"
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${auditUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 6px; text-decoration: none; display: inline-block;">
            View Full Per-Tool Breakdown
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0;">
          <strong>Is your API spend greater than $500/month?</strong> Credex provides volume discounts on Anthropic, OpenAI, and Gemini API credits. Simply click the book consultation booking CTA in your audit screen, and our team will reach out within 48 hours to route these discounts straight to your pipelines.
        </p>
      </div>
    `;

    if (resendKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Credex AI Audits <${resendFrom}>`,
            to: [email],
            subject: `AI Spend Audit Report: Save $${record.auditResults.totalAnnualSavings.toLocaleString()}/yr!`,
            html: emailHtml,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Resend API returned error (${response.status}): ${errText}`);
        } else {
          console.log(`Transactional audit report email successfully sent to ${email}`);
        }
      } catch (err: any) {
        console.warn('Resend API request failed:', err.message);
      }
    } else {
      console.log('------------------------------------------------------------');
      console.log('MOCK TRANSACTIONAL EMAIL (RESEND_API_KEY IS NOT CONFIGURED)');
      console.log(`To: ${email}`);
      console.log(`From: ${resendFrom}`);
      console.log(`Subject: AI Spend Audit Report: Save $${record.auditResults.totalAnnualSavings.toLocaleString()}/yr!`);
      console.log(`Dynamic PDF Link: ${auditUrl}`);
      console.log('------------------------------------------------------------');
    }

    // --- STEP 3: UPDATE DB AUDIT RECORD WITH LEAD DETAILS ---
    const updatedRecord = await db.updateAuditLead(id, {
      email,
      companyName: companyName || undefined,
      role: role || undefined,
      submittedLead: true,
      llmSummary,
    });

    // Strip private PII fields before returning the row to the frontend client
    const clientResponse = {
      id: updatedRecord.id,
      teamSize: updatedRecord.teamSize,
      useCase: updatedRecord.useCase,
      auditResults: updatedRecord.auditResults,
      llmSummary: updatedRecord.llmSummary,
      submittedLead: updatedRecord.submittedLead,
    };

    return NextResponse.json(clientResponse);
  } catch (err: any) {
    console.error('API Error in /api/lead:', err);
    return NextResponse.json(
      { error: 'Internal server error while capturing lead.' },
      { status: 500 }
    );
  }
}
