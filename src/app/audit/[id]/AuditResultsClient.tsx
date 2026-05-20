'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  TrendingDown, 
  ArrowRight, 
  Share2, 
  Check, 
  Copy, 
  Mail, 
  FileText,
  DollarSign,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { AuditRecommendation } from '@/lib/auditEngine';

interface AuditResultsClientProps {
  auditId: string;
  teamSize: number;
  useCase: string;
  initialSubmittedLead: boolean;
  initialLlmSummary?: string;
  totalCurrentSpend: number;
  totalRecommendedSpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  recommendations: AuditRecommendation[];
}

export default function AuditResultsClient({
  auditId,
  teamSize,
  useCase,
  initialSubmittedLead,
  initialLlmSummary = '',
  totalCurrentSpend,
  totalRecommendedSpend,
  totalMonthlySavings,
  totalAnnualSavings,
  recommendations
}: AuditResultsClientProps) {
  const [submittedLead, setSubmittedLead] = useState<boolean>(initialSubmittedLead);
  const [llmSummary, setLlmSummary] = useState<string>(initialLlmSummary);
  
  // Lead Form Fields
  const [email, setEmail] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [website, setWebsite] = useState<string>(''); // Honeypot
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedTweet, setCopiedTweet] = useState<boolean>(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: auditId,
          email,
          companyName,
          role,
          website // Honeypot
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit lead.');
      }

      const data = await response.json();
      setLlmSummary(data.llmSummary);
      setSubmittedLead(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/audit/${auditId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyTweetText = () => {
    const text = `I just ran my startup's AI tool stack through the free @Credex Spend Audit and uncovered $${totalAnnualSavings.toLocaleString()}/yr in redundant & oversized subscriptions! Run yours in 30 seconds for free: ${window.location.origin}/audit/${auditId}`;
    navigator.clipboard.writeText(text);
    setCopiedTweet(true);
    setTimeout(() => setCopiedTweet(false), 2000);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'cancel': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'downgrade': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'optimize': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-white/5';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* 1. HERO RESULTS SUMMARY CARD */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden border border-indigo-500/20 shadow-xl shadow-indigo-600/5 animate-fade-in-up">
        {/* Glow behind stats */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-4 text-center md:text-left">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
              <TrendingDown className="h-4 w-4" />
              AI Spend Audit Completed
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
              Save <span className="text-emerald-400 bg-clip-text">$</span>{totalAnnualSavings.toLocaleString()} <span className="text-base text-zinc-500 font-medium">/ year</span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-md font-medium leading-relaxed">
              We identified <strong className="text-white font-extrabold">${totalMonthlySavings}/mo</strong> in monthly recurring waste across your tools. Here is your cost recovery plan.
            </p>
          </div>

          <div className="bg-zinc-950/60 p-6 rounded-xl border border-white/5 text-center flex flex-col justify-center items-center h-full">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1">Stack Spend Efficiency</span>
            <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
              {totalCurrentSpend > 0 ? (
                <>
                  <span className="text-emerald-400">
                    {Math.round((totalRecommendedSpend / totalCurrentSpend) * 100)}%
                  </span>
                  <span className="text-zinc-600 text-xs font-semibold">of current</span>
                </>
              ) : (
                <span className="text-emerald-400">100%</span>
              )}
            </div>
            <div className="mt-3 flex gap-4 text-[10px] text-zinc-500 font-bold border-t border-white/5 pt-3 w-full justify-around">
              <div>
                <span className="block text-zinc-400 font-extrabold">$ {totalCurrentSpend}</span>
                <span>Current</span>
              </div>
              <div className="border-r border-white/5" />
              <div>
                <span className="block text-zinc-400 font-extrabold">$ {totalRecommendedSpend}</span>
                <span>Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC LEAD GATE OR AI PERSONALIZED SUMMARY CARD */}
      <div className="animate-fade-in-up">
        {submittedLead ? (
          /* UNLOCKED SUMMARY */
          <div className="glass-panel p-6 md:p-8 rounded-2xl border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-950/20 via-zinc-900/30 to-zinc-900/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              AI Cost Advisor Summary
            </h3>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed italic">
              "{llmSummary}"
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-zinc-500">
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified Pricing</span>
              <span className="flex items-center gap-1"><Sparkles className="h-4 w-4 text-indigo-400" /> Dynamic Context-Aware</span>
            </div>
          </div>
        ) : (
          /* LOCKED EMAIL LEAD CAPTURE FORM */
          <div className="glass-panel p-6 md:p-8 rounded-2xl relative border border-purple-500/20 shadow-lg shadow-purple-600/5">
            <div className="absolute top-4 right-4 bg-purple-500/10 text-purple-300 text-[10px] px-2.5 py-1 rounded-full border border-purple-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Unlock AI Summary
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-400" />
              Get AI cost advisor analysis + PDF report
            </h3>
            <p className="text-zinc-400 text-xs md:text-sm max-w-xl mb-6">
              Enter your email to generate a custom 100-word executive summary paragraph based on your use case, and download your dynamic CFO-ready spend recovery PDF.
            </p>

            <form onSubmit={handleLeadSubmit} className="space-y-4">
              
              {/* Bot Honeypot field */}
              <input 
                type="text" 
                name="website" 
                value={website} 
                onChange={(e) => setWebsite(e.target.value)} 
                className="hidden" 
                tabIndex={-1} 
                autoComplete="off" 
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Email Address */}
                <div className="relative md:col-span-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><Mail className="h-4 w-4" /></span>
                  <label htmlFor="email-input" className="sr-only">Work Email Address</label>
                  <input
                    id="email-input"
                    type="email"
                    required
                    placeholder="Work Email address (e.g. founder@mycompany.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500 text-zinc-300 font-semibold"
                  />
                </div>

                {/* Company Name */}
                <div className="w-full">
                  <label htmlFor="company-name-input" className="sr-only">Company Name (optional)</label>
                  <input
                    id="company-name-input"
                    type="text"
                    placeholder="Company Name (optional)"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 text-zinc-300 font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center pt-2">
                {/* Role select */}
                <div className="w-full sm:w-64 relative">
                  <label htmlFor="role-select" className="sr-only">Your Role (optional)</label>
                  <select
                    id="role-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 text-zinc-400 font-medium appearance-none"
                  >
                    <option value="">Your Role / Title (optional)</option>
                    <option value="Founder">Founder / CEO</option>
                    <option value="CTO">CTO / VP Engineering</option>
                    <option value="Lead Engineer">Lead Engineer</option>
                    <option value="Finance Manager">Finance Manager / CFO</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Unlock AI Summary & Report
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="text-red-400 text-xs font-semibold mt-2">
                  {errorMsg}
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* 3. CONDITIONAL VALUE BANNERS (CREDEX SALES CONVERSION OR STACK OPTIMIZED BANNER) */}
      <div className="animate-fade-in-up">
        {totalMonthlySavings >= 500 ? (
          /* HIGH SAVINGS -> SURFACES CREDEX CONSULTATION BOOKING */
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-900/40 to-emerald-950/20 border border-emerald-500/20 relative overflow-hidden shadow-lg shadow-emerald-500/5">
            {/* Glow accent */}
            <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2 flex-1 text-center md:text-left">
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider inline-block">
                  High Savings Tier (&gt;$500/mo)
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  You could save this much. Let Credex help you capture it.
                </h3>
                <p className="text-zinc-400 text-xs md:text-sm max-w-xl leading-relaxed">
                  Startups spending heavily on APIs can pool consumption through Credex's wholesale volumes. We route identical, fully private Claude & OpenAI keys to you at up to 15% discount.
                </p>
              </div>

              <a
                href="https://calendly.com/credex-savings-audit/15min"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.99] text-sm w-full md:w-auto"
              >
                <Calendar className="h-4.5 w-4.5" />
                Book Savings Consultation
              </a>
            </div>
          </div>
        ) : (
          /* STACK OPTIMIZED / LOW SAVINGS -> HONEST TRUST BANNER */
          <div className="p-6 rounded-xl border border-white/5 bg-zinc-900/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="bg-zinc-800 p-2 rounded-lg text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Your Stack is Optimized</h4>
                <p className="text-xs text-zinc-500">You are doing a fantastic job managing subscription costs.</p>
              </div>
            </div>
            
            {/* Newsletter opt-in / updates block */}
            <div className="w-full sm:w-auto">
              <a 
                href="https://credex.ai/subscribe"
                target="_blank"
                className="text-xs font-semibold text-zinc-400 hover:text-white border border-white/5 bg-white/5 px-4 py-2.5 rounded-lg inline-block text-center w-full"
              >
                Notify me on new vendor optimizations
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3.5. BENCHMARK COMPARISON PANEL (WOW FEATURE) */}
      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 space-y-6 animate-fade-in-up">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-indigo-400" />
            Peer Benchmark Analysis
          </h3>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">
            How your AI tool spend stacks up against similar {teamSize}-person startups in {useCase === 'coding' ? 'technical development' : useCase === 'writing' ? 'content operations' : 'mixed operations'}.
          </p>
        </div>

        {/* Benchmarking Bars */}
        <div className="space-y-4">
          {/* Bar 1: Industry Average */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-400">Industry Average (Unoptimized)</span>
              <span className="text-white">${Math.round(teamSize * 135).toLocaleString()}/mo</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-600 rounded-full" style={{ width: '75%' }} />
            </div>
          </div>

          {/* Bar 2: Your Current Spend */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-rose-400 font-bold flex items-center gap-1">
                Your Current Spend
                {totalMonthlySavings > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold uppercase">Overspending</span>}
              </span>
              <span className="text-rose-400 font-bold">${totalCurrentSpend.toLocaleString()}/mo</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full" 
                style={{ 
                  width: `${Math.min(100, Math.max(10, (totalCurrentSpend / (teamSize * 135 || 1)) * 75))}%` 
                }} 
              />
            </div>
          </div>

          {/* Bar 3: Peer Lean Target */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                Your Optimized Spend (Credex Target)
                {totalMonthlySavings > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase">Optimal</span>}
              </span>
              <span className="text-emerald-400 font-bold">${totalRecommendedSpend.toLocaleString()}/mo</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ 
                  width: `${Math.min(100, Math.max(10, (totalRecommendedSpend / (teamSize * 135 || 1)) * 75))}%` 
                }} 
              />
            </div>
          </div>
        </div>

        {/* Insight callout */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 text-xs text-zinc-400 leading-relaxed">
          {totalMonthlySavings > 0 ? (
            <span>
              💡 <strong>Efficiency Insight:</strong> Your current spend is approximately <strong className="text-white">{Math.round((totalCurrentSpend / (teamSize * 135 || 1)) * 100)}%</strong> of the peer startup average. By executing our right-sizing recovery plan, your stack will shift into the <strong className="text-emerald-400">top 15% of cost-efficient startups</strong>, saving you <strong className="text-white">${totalAnnualSavings.toLocaleString()}/yr</strong> in structural capital.
            </span>
          ) : (
            <span>
              🎉 <strong>Efficiency Insight:</strong> Congratulations! Your AI tool stack is already in the <strong className="text-emerald-400">top 10% of highly-optimized lean startups</strong>. You are spending significantly less than the industry peer average of <strong className="text-white">${Math.round(teamSize * 135).toLocaleString()}/mo</strong>.
            </span>
          )}
        </div>
      </div>

      {/* 4. PER-TOOL DETAILED BREAKDOWN LIST */}
      <div className="space-y-6 animate-fade-in-up">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
          <Layers className="h-5 w-5 text-indigo-400" />
          Per-Tool Savings Breakdown
        </h3>

        <div className="space-y-4">
          {recommendations.map((rec) => {
            const hasSavings = rec.monthlySavings > 0;
            return (
              <div 
                key={rec.toolId}
                className={`glass-panel p-5 md:p-6 rounded-xl transition-all ${
                  hasSavings ? 'border-indigo-500/10' : 'border-white/5 bg-zinc-900/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Left: Tool Details and Action Badge */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-bold text-white text-base">{rec.toolName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${getActionBadgeColor(rec.action)}`}>
                        {rec.action === 'keep' ? 'Optimized' : rec.action}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-zinc-400 font-semibold leading-relaxed">
                      {rec.reasoning}
                    </p>
                  </div>

                  {/* Right: Cost delta comparison box */}
                  <div className="bg-zinc-950/60 p-4 rounded-lg border border-white/5 flex items-center gap-4 justify-between w-full sm:w-auto min-w-[200px] self-stretch sm:self-center">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold">Bill Delta</span>
                      <div className="flex items-center gap-2 font-black text-xs md:text-sm text-zinc-400 mt-1">
                        <span>${rec.currentSpend}</span>
                        <ArrowRightLeft className="h-3 w-3 text-zinc-600" />
                        <span className={hasSavings ? 'text-emerald-400' : 'text-zinc-400'}>
                          ${rec.recommendedSpend}
                        </span>
                      </div>
                    </div>

                    {hasSavings && (
                      <div className="text-right border-l border-white/5 pl-4">
                        <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold">Monthly Savings</span>
                        <span className="text-emerald-400 font-extrabold text-sm md:text-base block mt-0.5">
                          +${rec.monthlySavings}/mo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. VIRAL SHARE + REFERRAL BLOCK */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center bg-indigo-600/10 text-indigo-400 p-3 rounded-full">
          <Share2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Broadcast Your Cost Savings</h3>
          <p className="text-zinc-400 text-xs md:text-sm max-w-md mx-auto">
            Share this report with your team or followers! We've automatically stripped out all contact and company details to protect your privacy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={copyShareLink}
            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-5 rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {copiedLink ? (
              <>
                <Check className="h-4.5 w-4.5 text-emerald-400" />
                Copied Report URL!
              </>
            ) : (
              <>
                <Copy className="h-4.5 w-4.5 text-zinc-400" />
                Copy Report URL
              </>
            )}
          </button>

          <button
            onClick={copyTweetText}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-indigo-600/10"
          >
            {copiedTweet ? (
              <>
                <Check className="h-4.5 w-4.5" />
                Copied Tweet Text!
              </>
            ) : (
              <>
                <Share2 className="h-4.5 w-4.5" />
                Share on X / Twitter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
