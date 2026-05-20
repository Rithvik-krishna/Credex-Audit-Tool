'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  TrendingDown, 
  Users, 
  Code, 
  FileText, 
  BarChart4, 
  Search, 
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { TOOL_PRICING, TOOL_NAMES } from '@/lib/auditEngine';

interface ActiveTool {
  toolId: string;
  planId: string;
  seats: number;
  monthlySpend: number;
}

export default function Home() {
  const router = useRouter();
  const [teamSize, setTeamSize] = useState<number>(5);
  const [useCase, setUseCase] = useState<string>('mixed');
  const [activeTools, setActiveTools] = useState<ActiveTool[]>([]);
  const [selectedAddTool, setSelectedAddTool] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Honeypot bot protection field
  const [website, setWebsite] = useState<string>('');

  // 1. Persistent State - Load from LocalStorage on Mount
  useEffect(() => {
    try {
      const savedTeamSize = localStorage.getItem('credex_team_size');
      const savedUseCase = localStorage.getItem('credex_use_case');
      const savedTools = localStorage.getItem('credex_active_tools');

      if (savedTeamSize) setTeamSize(parseInt(savedTeamSize, 10));
      if (savedUseCase) setUseCase(savedUseCase);
      if (savedTools) {
        setActiveTools(JSON.parse(savedTools));
      } else {
        // Pre-populate with typical startup configurations to make it easy/intuitive
        setActiveTools([
          { toolId: 'cursor', planId: 'pro', seats: 5, monthlySpend: 100 },
          { toolId: 'claude', planId: 'pro', seats: 2, monthlySpend: 40 },
          { toolId: 'anthropic_api', planId: 'api_direct', seats: 1, monthlySpend: 450 }
        ]);
      }
    } catch (e) {
      console.warn('LocalStorage failed to load:', e);
    }
  }, []);

  // 2. Persistent State - Save to LocalStorage on Change
  useEffect(() => {
    localStorage.setItem('credex_team_size', teamSize.toString());
  }, [teamSize]);

  useEffect(() => {
    localStorage.setItem('credex_use_case', useCase);
  }, [useCase]);

  useEffect(() => {
    if (activeTools.length > 0) {
      localStorage.setItem('credex_active_tools', JSON.stringify(activeTools));
    }
  }, [activeTools]);

  // List of tools that can still be added
  const availableToolsToAdd = Object.keys(TOOL_NAMES).filter(
    id => !activeTools.some(t => t.toolId === id)
  );

  const handleAddTool = () => {
    if (!selectedAddTool) return;
    
    const toolId = selectedAddTool;
    const plans = TOOL_PRICING[toolId];
    const defaultPlanId = plans ? Object.keys(plans)[0] : 'api_direct';
    const unitPrice = plans && plans[defaultPlanId] ? plans[defaultPlanId].price : 0;
    
    const newTool: ActiveTool = {
      toolId,
      planId: defaultPlanId,
      seats: toolId.includes('api') ? 1 : Math.max(1, teamSize),
      monthlySpend: unitPrice === -1 ? 150 : (unitPrice * Math.max(1, teamSize))
    };

    const updated = [...activeTools, newTool];
    setActiveTools(updated);
    setSelectedAddTool('');
    setErrorMsg('');
  };

  const handleRemoveTool = (index: number) => {
    const updated = activeTools.filter((_, i) => i !== index);
    setActiveTools(updated);
    if (updated.length === 0) {
      localStorage.removeItem('credex_active_tools');
    }
  };

  const handleToolPlanChange = (index: number, planId: string) => {
    const updated = [...activeTools];
    const tool = updated[index];
    tool.planId = planId;
    
    // Auto-calculate spend based on default unit cost
    const plans = TOOL_PRICING[tool.toolId];
    if (plans && plans[planId]) {
      const unitPrice = plans[planId].price;
      if (unitPrice !== -1) {
        tool.monthlySpend = unitPrice * tool.seats;
      }
    }
    setActiveTools(updated);
  };

  const handleToolSeatsChange = (index: number, seats: number) => {
    const updated = [...activeTools];
    const tool = updated[index];
    tool.seats = Math.max(1, seats);
    
    // Recalculate spend based on seats
    const plans = TOOL_PRICING[tool.toolId];
    if (plans && plans[tool.planId]) {
      const unitPrice = plans[tool.planId].price;
      if (unitPrice !== -1) {
        tool.monthlySpend = unitPrice * tool.seats;
      }
    }
    setActiveTools(updated);
  };

  const handleToolSpendChange = (index: number, spend: number) => {
    const updated = [...activeTools];
    updated[index].monthlySpend = Math.max(0, spend);
    setActiveTools(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeTools.length === 0) {
      setErrorMsg('Please add at least one tool to audit your spend.');
      return;
    }

    // Verify all tool spend values are non-negative
    for (const t of activeTools) {
      if (t.monthlySpend < 0 || isNaN(t.monthlySpend)) {
        setErrorMsg(`Please enter a valid monthly spend for ${TOOL_NAMES[t.toolId]}.`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: activeTools,
          teamSize,
          useCase,
          // Honeypot field sent to route
          website
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error calculated.');
      }

      const data = await response.json();
      router.push(`/audit/${data.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate audit report.');
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: "Is this tool really free? Do I need to create an account?",
      a: "Yes, it is 100% free and requires no account or login to see your full financial audit. You only provide an email if you want to unlock your personalized AI-generated summary report and download a shareable PDF analysis."
    },
    {
      q: "How does Credex make money by offering this tool for free?",
      a: "Credex sells discounted institutional AI credits in bulk. If your audit shows significant API spend (> $500/mo), we offer to transition your API bills to Credex's volume pools. You save up to 15% on API costs, Credex earns a small margin on the bulk transaction, and the tool remains free for everyone."
    },
    {
      q: "Are the pricing numbers up to date?",
      a: "Yes. Every number in our Audit Engine is verified against the official public pricing pages of Cursor, GitHub Copilot, Anthropic (Claude), OpenAI (ChatGPT), Gemini, and v0. We update this data weekly."
    },
    {
      q: "How is my startup's privacy protected?",
      a: "We take privacy extremely seriously. The unique shareable URL generated for your team strips out all private contact info (such as email, company name, and role). It only showcases the anonymized stack tools and the calculated savings, so you can share it safely on social media."
    },
    {
      q: "How do you identify \"redundant\" AI tools?",
      a: "Our Audit Engine maps tools with overlapping technical features. For example, if a team uses Cursor (which has built-in code autocomplete and chat) alongside GitHub Copilot, we flag it as high-redundancy and recommend canceling Copilot to save $10 to $39 per user every month."
    }
  ];

  return (
    <main className="glow-background min-h-screen pb-20 px-4 md:px-8">
      {/* 1. Header Navbar */}
      <nav className="max-w-6xl mx-auto py-6 flex items-center justify-between border-b border-white/5 mb-16">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <TrendingDown className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Credex <span className="text-indigo-400 font-medium">Audit</span>
          </span>
        </div>
        <a 
          href="https://credex.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs md:text-sm font-semibold text-zinc-400 hover:text-white border border-white/10 px-4 py-2 rounded-full transition-colors bg-white/5 backdrop-blur"
        >
          Sponsored by Credex
        </a>
      </nav>

      {/* 2. Hero Section */}
      <section className="max-w-4xl mx-auto text-center mb-16 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Free 30-Second Financial Stack Audit
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
          Stop Bleeding Capital on <br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Overpriced AI Tool Stacks
          </span>
        </h1>
        <p className="text-zinc-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
          Discover redundant subscriptions, optimized plan downgrades, and volume credit discounts. Run a free 30-second audit to reclaim startup runway.
        </p>
      </section>

      {/* 3. Spend Calculator Form Container */}
      <section className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-2xl animate-pulse-glow">
          
          {/* Honeypot field (hidden for users, filled by bots) */}
          <input 
            type="text" 
            name="website" 
            value={website} 
            onChange={(e) => setWebsite(e.target.value)} 
            className="hidden" 
            tabIndex={-1} 
            autoComplete="off" 
          />

          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
            <Layers className="h-5 w-5 text-indigo-400" />
            1. Tell Us About Your Startup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Team Size Slider */}
            <div>
              <label htmlFor="team-size-slider" className="block text-sm font-semibold text-zinc-300 mb-3 flex justify-between">
                <span>Team Size (Engineers & Staff)</span>
                <span className="text-indigo-400 font-extrabold text-base">{teamSize} seats</span>
              </label>
              <input 
                id="team-size-slider"
                type="range" 
                min="1" 
                max="100" 
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                aria-label="Team Size"
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
              <div className="flex justify-between text-[11px] text-zinc-500 mt-2 font-medium">
                <span>1 seat</span>
                <span>50 seats</span>
                <span>100 seats</span>
              </div>
            </div>

            {/* Primary Use Case */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3">
                Primary Startup Use Case
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'coding', label: 'Coding', icon: Code },
                  { id: 'writing', label: 'Writing', icon: FileText },
                  { id: 'mixed', label: 'Mixed', icon: Layers }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUseCase(item.id)}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                        useCase === item.id 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-600/5' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              2. Build Your Current Tool Stack
            </div>
            <span className="text-xs text-zinc-500 font-medium">Add all matching bills</span>
          </h2>

          {/* Selector to Add New Tool */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <label htmlFor="add-tool-select" className="sr-only">Add an AI Tool to Your Audit</label>
              <select
                id="add-tool-select"
                value={selectedAddTool}
                onChange={(e) => setSelectedAddTool(e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-zinc-300 focus:outline-none focus:border-indigo-500 appearance-none font-medium text-sm"
              >
                <option value="">-- Add an AI Tool to Your Audit --</option>
                {availableToolsToAdd.map(id => (
                  <option key={id} value={id}>
                    {TOOL_NAMES[id]}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={handleAddTool}
              disabled={!selectedAddTool}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold rounded-xl px-6 py-3 flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Tool
            </button>
          </div>

          {/* Active Tools List */}
          {activeTools.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-zinc-500 mb-8 bg-zinc-950/20">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-sm font-semibold">Your audit stack is currently empty.</p>
              <p className="text-xs mt-1">Select a tool from the dropdown above to audit its plan.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {activeTools.map((tool, index) => {
                const vendorPlans = TOOL_PRICING[tool.toolId];
                const hasStaticPlans = vendorPlans && vendorPlans[Object.keys(vendorPlans)[0]]?.price !== -1;
                
                return (
                  <div 
                    key={tool.toolId}
                    className="p-4 md:p-5 rounded-xl border border-white/5 bg-zinc-900/30 flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in"
                  >
                    {/* Tool Info and Icon */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="bg-zinc-800 p-2.5 rounded-lg border border-white/5 text-zinc-300">
                        <Sparkles className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{TOOL_NAMES[tool.toolId]}</h4>
                        <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-extrabold">Active</span>
                      </div>
                    </div>

                    {/* Form Controls inside Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:flex-1 md:max-w-2xl">
                      {/* Plan selection */}
                      {hasStaticPlans ? (
                        <div className="relative col-span-2 sm:col-span-1">
                          <label htmlFor={`plan-select-${tool.toolId}`} className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Plan Tier</label>
                          <select
                            id={`plan-select-${tool.toolId}`}
                            value={tool.planId}
                            onChange={(e) => handleToolPlanChange(index, e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-indigo-500 appearance-none"
                          >
                            {Object.entries(vendorPlans).map(([pId, details]) => (
                              <option key={pId} value={pId}>
                                {pId.toUpperCase()} (${details.price === 0 ? 'Free' : `${details.price}/mo`})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-7 h-3 w-3 text-zinc-500 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Billing Method</label>
                          <div className="w-full bg-zinc-950/50 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-zinc-500">
                            Pay-As-You-Go API
                          </div>
                        </div>
                      )}

                      {/* Seat Count (Hidden for API Direct spend) */}
                      {hasStaticPlans ? (
                        <div>
                          <label htmlFor={`seats-input-${tool.toolId}`} className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Seats / Users</label>
                          <input
                            id={`seats-input-${tool.toolId}`}
                            type="number"
                            min="1"
                            value={tool.seats}
                            onChange={(e) => handleToolSeatsChange(index, parseInt(e.target.value, 10) || 1)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      ) : (
                        <div className="opacity-40">
                          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Seats</label>
                          <div className="w-full bg-zinc-950/20 border border-white/5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600">
                            N/A
                          </div>
                        </div>
                      )}

                      {/* Actual Spend Input */}
                      <div>
                        <label htmlFor={`spend-input-${tool.toolId}`} className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold mb-1 flex justify-between items-center">
                          <span>Monthly Bill</span>
                          <span className="flex items-center text-[9px] text-zinc-500 lowercase font-medium gap-0.5">
                            <Info className="h-2 w-2" />
                            adjust
                          </span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">$</span>
                          <input
                            id={`spend-input-${tool.toolId}`}
                            type="number"
                            min="0"
                            value={tool.monthlySpend}
                            onChange={(e) => handleToolSpendChange(index, parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-6 pr-2 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => handleRemoveTool(index)}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors self-end md:self-center"
                      title="Remove from stack"
                      aria-label={`Remove ${TOOL_NAMES[tool.toolId]} from audit stack`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 border border-red-500/20 bg-red-500/10 rounded-xl text-red-400 text-xs font-semibold text-center mb-6">
              {errorMsg}
            </div>
          )}

          {/* Submit Action button */}
          <button
            type="submit"
            disabled={loading || activeTools.length === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 border border-indigo-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Generate Audit Report
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>
      </section>

      {/* 4. FAQ / Accordion Section */}
      <section className="max-w-3xl mx-auto mt-24">
        <h2 className="text-2xl font-extrabold text-white text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="glass-panel rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-5 text-left flex items-center justify-between text-zinc-200 hover:text-white font-semibold text-sm md:text-base"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-zinc-400 leading-relaxed border-t border-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="max-w-6xl mx-auto mt-32 pt-8 border-t border-white/5 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Credex Spend Audits. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="https://credex.ai" target="_blank" className="hover:text-zinc-300 transition-colors">Credex Homepage</a>
          <a href="https://credex.ai/privacy" target="_blank" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
          <a href="https://credex.ai/terms" target="_blank" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </main>
  );
}
