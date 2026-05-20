import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AuditResultsClient from './AuditResultsClient';

interface Props {
  params: { id: string };
}

// Enforce dynamic behavior for API and DB calls
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const audit = await db.getAudit(params.id);
  if (!audit) {
    return {
      title: 'Audit Not Found | Credex Spend Audit',
      description: 'No AI spend audit could be found with the provided identifier.',
    };
  }

  const savings = audit.auditResults.totalAnnualSavings.toLocaleString();
  const title = `AI Spend Audit Completed — Save $${savings}/year!`;
  const description = `We completed our startup's AI spend audit. Identified savings: $${savings}/yr by optimizing Cursor, Claude, ChatGPT, Gemini, v0, and API spend. Discover your opportunities on Credex Audit.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Credex AI Spend Audit',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function AuditPage({ params }: Props) {
  const audit = await db.getAudit(params.id);
  if (!audit) {
    notFound();
  }

  return (
    <main className="glow-background min-h-screen pb-20 px-4 md:px-8">
      {/* Header Navbar */}
      <nav className="max-w-6xl mx-auto py-6 flex items-center justify-between border-b border-white/5 mb-16">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <a href="/" className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Credex <span className="text-indigo-400 font-medium">Audit</span>
          </a>
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

      <AuditResultsClient
        auditId={audit.id}
        teamSize={audit.teamSize}
        useCase={audit.useCase}
        initialSubmittedLead={audit.submittedLead}
        initialLlmSummary={audit.llmSummary}
        totalCurrentSpend={audit.auditResults.totalCurrentSpend}
        totalRecommendedSpend={audit.auditResults.totalRecommendedSpend}
        totalMonthlySavings={audit.auditResults.totalMonthlySavings}
        totalAnnualSavings={audit.auditResults.totalAnnualSavings}
        recommendations={audit.auditResults.recommendations}
      />
    </main>
  );
}
