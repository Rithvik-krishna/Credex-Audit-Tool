export interface ToolInput {
  toolId: string; // 'cursor' | 'copilot' | 'claude' | 'chatgpt' | 'gemini' | 'v0' | 'anthropic_api' | 'openai_api' | 'gemini_api'
  planId: string; // plan names e.g., 'hobby', 'pro', 'business', 'enterprise', 'individual', 'free', 'max', 'team', 'plus', 'premium', 'ultra', 'api_direct'
  seats: number;
  monthlySpend: number;
}

export interface AuditRecommendation {
  toolId: string;
  toolName: string;
  currentPlan: string;
  currentSpend: number;
  seats: number;
  action: 'keep' | 'downgrade' | 'cancel' | 'optimize';
  recommendedPlan: string;
  recommendedSpend: number;
  monthlySavings: number;
  annualSavings: number;
  reasoning: string;
}

export interface AuditResult {
  teamSize: number;
  useCase: string;
  totalCurrentSpend: number;
  totalRecommendedSpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  isOptimized: boolean;
  recommendations: AuditRecommendation[];
}

// Official pricing parameters as of May 20, 2026
export const TOOL_PRICING: Record<string, Record<string, { name: string; price: number }>> = {
  cursor: {
    hobby: { name: 'Cursor Hobby', price: 0 },
    pro: { name: 'Cursor Pro', price: 20 },
    business: { name: 'Cursor Business', price: 40 },
    enterprise: { name: 'Cursor Enterprise', price: 100 },
  },
  copilot: {
    individual: { name: 'Copilot Individual', price: 10 },
    business: { name: 'Copilot Business', price: 19 },
    enterprise: { name: 'Copilot Enterprise', price: 39 },
  },
  claude: {
    free: { name: 'Claude Free', price: 0 },
    pro: { name: 'Claude Pro', price: 20 },
    max: { name: 'Claude Max', price: 100 },
    team: { name: 'Claude Team', price: 25 },
    enterprise: { name: 'Claude Enterprise', price: 75 },
  },
  chatgpt: {
    free: { name: 'ChatGPT Free', price: 0 },
    plus: { name: 'ChatGPT Plus', price: 20 },
    team: { name: 'ChatGPT Team', price: 30 },
    enterprise: { name: 'ChatGPT Enterprise', price: 60 },
  },
  gemini: {
    plus: { name: 'Gemini AI Plus', price: 7.99 },
    pro: { name: 'Gemini AI Pro', price: 19.99 },
    ultra: { name: 'Gemini AI Ultra', price: 99.99 },
  },
  v0: {
    free: { name: 'v0 Free', price: 0 },
    premium: { name: 'v0 Premium', price: 20 },
    team: { name: 'v0 Team', price: 30 },
    enterprise: { name: 'v0 Enterprise', price: 100 },
  },
  anthropic_api: {
    api_direct: { name: 'Anthropic API Direct', price: -1 }, // pay-as-you-go
  },
  openai_api: {
    api_direct: { name: 'OpenAI API Direct', price: -1 }, // pay-as-you-go
  },
};

export const TOOL_NAMES: Record<string, string> = {
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
  claude: 'Claude (Anthropic)',
  chatgpt: 'ChatGPT (OpenAI)',
  gemini: 'Gemini (Google)',
  v0: 'v0 (Vercel)',
  anthropic_api: 'Anthropic API',
  openai_api: 'OpenAI API',
};

export function runAuditEngine(
  tools: ToolInput[],
  teamSize: number,
  useCase: string
): AuditResult {
  const recommendations: AuditRecommendation[] = [];
  
  // Track tools to check cross-tool redundancies
  const activeToolIds = new Set(tools.map(t => t.toolId));
  const hasCursor = activeToolIds.has('cursor');
  const hasCopilot = activeToolIds.has('copilot');
  const hasClaude = activeToolIds.has('claude');
  const hasChatGPT = activeToolIds.has('chatgpt');

  let totalCurrentSpend = 0;
  let totalRecommendedSpend = 0;

  for (const tool of tools) {
    totalCurrentSpend += tool.monthlySpend;

    const toolId = tool.toolId;
    const planId = tool.planId;
    const seats = tool.seats || 1;
    const currentSpend = tool.monthlySpend;
    const toolName = TOOL_NAMES[toolId] || toolId;

    let recommendedPlan = planId;
    let recommendedSpend = currentSpend;
    let action: 'keep' | 'downgrade' | 'cancel' | 'optimize' = 'keep';
    let reasoning = 'You are currently on the optimal plan for your team size and use case.';

    // Fetch official details if applicable
    const vendorPlans = TOOL_PRICING[toolId];
    const planDetails = vendorPlans ? vendorPlans[planId] : null;
    const unitPrice = planDetails ? planDetails.price : 0;

    // --- CROSS-TOOL REDUNDANCY AUDITS (HIGHEST PRIORITY) ---

    // Rule A: Cursor + Copilot Overlap
    if (toolId === 'copilot' && hasCursor) {
      action = 'cancel';
      recommendedPlan = 'Canceled';
      recommendedSpend = 0;
      reasoning = 'Cursor has its own built-in high-speed completions and chat features, making a separate Copilot subscription entirely redundant.';
      
      recommendations.push({
        toolId,
        toolName,
        currentPlan: planDetails?.name || planId,
        currentSpend,
        seats,
        action,
        recommendedPlan,
        recommendedSpend,
        monthlySavings: currentSpend,
        annualSavings: currentSpend * 12,
        reasoning,
      });
      continue; // Skip individual audits for this tool
    }

    // Rule B: Claude Pro + ChatGPT Plus chat overlap for small teams
    if (toolId === 'chatgpt' && planId === 'plus' && hasClaude && teamSize <= 2 && (useCase === 'coding' || useCase === 'writing')) {
      action = 'cancel';
      recommendedPlan = 'Canceled';
      recommendedSpend = 0;
      reasoning = 'For small teams focused on coding or writing, Claude Pro offers superior core features. ChatGPT Plus represents a redundant chat subscription.';
      
      recommendations.push({
        toolId,
        toolName,
        currentPlan: planDetails?.name || planId,
        currentSpend,
        seats,
        action,
        recommendedPlan,
        recommendedSpend,
        monthlySavings: currentSpend,
        annualSavings: currentSpend * 12,
        reasoning,
      });
      continue; // Skip individual audits for this tool
    }

    // --- DIRECT API SPEND TO CREDEX VOLUME AUDITS ---
    if ((toolId === 'anthropic_api' || toolId === 'openai_api') && currentSpend > 200) {
      action = 'optimize';
      recommendedPlan = 'Credex API Pool';
      recommendedSpend = currentSpend * 0.85; // 15% savings
      reasoning = `Your high volume API spend qualifies for Credex volume credits, securing identical API endpoints at a guaranteed 15% discount.`;

      recommendations.push({
        toolId,
        toolName,
        currentPlan: 'API Direct Pay-as-you-go',
        currentSpend,
        seats,
        action,
        recommendedPlan,
        recommendedSpend,
        monthlySavings: currentSpend - recommendedSpend,
        annualSavings: (currentSpend - recommendedSpend) * 12,
        reasoning,
      });
      totalRecommendedSpend += recommendedSpend;
      continue;
    }

    // --- INDIVIDUAL TOOL AUDITS ---

    // 1. Cursor Plan Overkill Checks
    if (toolId === 'cursor') {
      if (planId === 'business' && teamSize <= 2) {
        action = 'downgrade';
        recommendedPlan = 'pro';
        recommendedSpend = 20 * seats;
        reasoning = `With a team size of ${teamSize}, you don't need organizational features. Downgrading to Cursor Pro retains identical coding power for $20/mo less per seat.`;
      } else if (planId === 'enterprise' && teamSize < 10) {
        action = 'downgrade';
        recommendedPlan = 'business';
        recommendedSpend = 40 * seats;
        reasoning = `Your team size of ${teamSize} is below typical enterprise scale. Downgrading to the Business plan saves massive licensing overhead.`;
      }
    }

    // 2. Claude Plan Overkill Checks
    else if (toolId === 'claude') {
      if (planId === 'team' && teamSize === 1) {
        action = 'downgrade';
        recommendedPlan = 'pro';
        recommendedSpend = 20; // Pro is single seat $20/mo
        reasoning = 'Single-user environments do not benefit from Team plan administrative billing; Claude Pro offers the exact same models for $5/mo less.';
      } else if (planId === 'max' && (useCase === 'writing' || useCase === 'research')) {
        action = 'downgrade';
        recommendedPlan = 'pro';
        recommendedSpend = 20;
        reasoning = `For ${useCase} workloads, Claude Pro's standard Sonnet limits are highly sufficient. Claude Max's $100/mo quota is overkill.`;
      } else if (planId === 'enterprise' && teamSize < 15) {
        action = 'downgrade';
        recommendedPlan = 'team';
        recommendedSpend = 25 * seats;
        reasoning = `With only ${teamSize} seats, custom enterprise configurations are likely an unnecessary premium. The Team plan covers secure data boundaries.`;
      }
    }

    // 3. ChatGPT Plan Overkill Checks
    else if (toolId === 'chatgpt') {
      if (planId === 'team' && teamSize === 1) {
        action = 'downgrade';
        recommendedPlan = 'plus';
        recommendedSpend = 20;
        reasoning = 'Single-person workspaces do not require Team admin panels or shared workspaces. ChatGPT Plus saves you $10/mo.';
      } else if (planId === 'enterprise' && teamSize < 15) {
        action = 'downgrade';
        recommendedPlan = 'team';
        recommendedSpend = 30 * seats;
        reasoning = `With a small team size of ${teamSize}, you can downscale from Enterprise to the Team plan to save admin and support premiums.`;
      }
    }

    // 4. Gemini Plan Optimizations
    else if (toolId === 'gemini') {
      if (planId === 'ultra' && useCase !== 'research' && useCase !== 'mixed') {
        action = 'downgrade';
        recommendedPlan = 'pro';
        recommendedSpend = 19.99 * seats;
        reasoning = `For ${useCase} workloads, Gemini AI Pro offers comparable capability and a massive context window, saving $80/mo per user over Ultra.`;
      }
    }

    // 5. v0 Plan Optimizations
    else if (toolId === 'v0') {
      if (planId === 'team' && teamSize === 1) {
        action = 'downgrade';
        recommendedPlan = 'premium';
        recommendedSpend = 20;
        reasoning = 'v0 Premium is fully featured for single-developer workspaces, saving $10/mo by bypassing Team workspace sharing features.';
      } else if (planId === 'enterprise' && teamSize < 10) {
        action = 'downgrade';
        recommendedPlan = 'team';
        recommendedSpend = 30 * seats;
        reasoning = `For small teams under 10 members, the Team plan is highly cost-effective compared to custom Enterprise licensing.`;
      }
    }

    // Adjust values if we did an individual action
    if (action === 'downgrade') {
      const optimalPlanDetails = TOOL_PRICING[toolId][recommendedPlan];
      recommendedPlan = optimalPlanDetails?.name || recommendedPlan;
    } else {
      recommendedPlan = planDetails?.name || planId;
    }

    // Sanity check: ensure recommended spend never exceeds current spend
    if (recommendedSpend > currentSpend) {
      recommendedSpend = currentSpend;
      action = 'keep';
      reasoning = 'You are currently on the optimal plan for your team size and use case.';
    }

    const monthlySavings = currentSpend - recommendedSpend;
    const annualSavings = monthlySavings * 12;

    recommendations.push({
      toolId,
      toolName,
      currentPlan: planDetails?.name || planId,
      currentSpend,
      seats,
      action,
      recommendedPlan,
      recommendedSpend,
      monthlySavings,
      annualSavings,
      reasoning,
    });

    totalRecommendedSpend += recommendedSpend;
  }

  // Calculate global savings metrics
  const totalMonthlySavings = totalCurrentSpend - totalRecommendedSpend;
  const totalAnnualSavings = totalMonthlySavings * 12;
  const isOptimized = totalMonthlySavings <= 0;

  return {
    teamSize,
    useCase,
    totalCurrentSpend,
    totalRecommendedSpend,
    totalMonthlySavings: Math.max(0, totalMonthlySavings),
    totalAnnualSavings: Math.max(0, totalAnnualSavings),
    isOptimized,
    recommendations,
  };
}
