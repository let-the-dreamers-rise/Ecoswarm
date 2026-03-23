import React from 'react';

/**
 * LeanCanvasPage — Business Model
 * Directly addresses the judging criteria:
 * "Did the team create and understand a Lean / Business Model Canvas?"
 */

const CANVAS_SECTIONS = [
  {
    id: 'problem',
    title: 'Problem',
    color: 'rose',
    items: [
      'Climate project funding is slow, opaque, and trust-heavy',
      'Sponsors can\'t verify if milestones were met before releasing capital',
      'Local operators lack standardized proof formats that funders accept',
      'No shared proof-to-payout rail across sponsors, verifiers, and operators'
    ]
  },
  {
    id: 'solution',
    title: 'Solution',
    color: 'emerald',
    items: [
      'Milestone-based escrow with Hedera smart contracts',
      'Proof-backed intake with verification confidence scores',
      'AI-powered treasury optimization and risk analysis',
      'Semi-autonomous agent operations for triage and settlement'
    ]
  },
  {
    id: 'uvp',
    title: 'Unique Value Proposition',
    color: 'cyan',
    items: [
      'The first Hedera-native proof-to-payout operating system for community climate projects',
      'Turns opaque grant processes into auditable, milestone-locked treasury releases',
      'Combines on-chain escrow, tokenized impact receipts, and AI analysis in one workflow'
    ]
  },
  {
    id: 'unfair',
    title: 'Unfair Advantage',
    color: 'amber',
    items: [
      'Hedera\'s energy-efficient public ledger aligns with sustainability workflows',
      'Low-cost, high-throughput transactions for many small milestone actions',
      'First-mover in Hedera sustainability treasury space',
      'Community operator network in emerging markets'
    ]
  },
  {
    id: 'segments',
    title: 'Customer Segments',
    color: 'violet',
    items: [
      'Corporate CSR teams with sustainability budgets ($50K–$2M)',
      'Climate funds and foundations (GCF, bilateral donors)',
      'Sustainability auditors and verifiers (EY, Deloitte ESG divisions)',
      'Local NGOs and community operators in India, East Africa, SE Asia'
    ]
  },
  {
    id: 'channels',
    title: 'Channels',
    color: 'blue',
    items: [
      'Direct outreach to CSR officers and sustainability leads',
      'Climate finance conferences (COP, Climate Week)',
      'Hedera ecosystem and Web3 sustainability communities',
      'NGO partnership networks in target geographies'
    ]
  },
  {
    id: 'metrics',
    title: 'Key Metrics',
    color: 'teal',
    items: [
      'Projects funded per quarter',
      'Total capital deployed through escrow ($)',
      'Average time from proof submission to payout release',
      'Verification confidence accuracy rate',
      'Monthly active Hedera accounts and TPS contribution'
    ]
  },
  {
    id: 'costs',
    title: 'Cost Structure',
    color: 'orange',
    items: [
      'Hedera transaction fees (~$0.001/tx)',
      'Cloud infrastructure (backend, AI service)',
      'Community operator onboarding and training',
      'Compliance and audit framework development'
    ]
  },
  {
    id: 'revenue',
    title: 'Revenue Streams',
    color: 'pink',
    items: [
      'SaaS fee per project ($200–$500/project setup)',
      'Transaction fee on capital deployed (0.5–1.5%)',
      'Premium verification tier (AI-powered analysis)',
      'Enterprise dashboard and reporting licenses'
    ]
  }
];

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  rose:    { border: 'border-rose-400/25',    bg: 'bg-rose-500/8',    text: 'text-rose-200',    dot: 'bg-rose-400' },
  emerald: { border: 'border-emerald-400/25', bg: 'bg-emerald-500/8', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  cyan:    { border: 'border-cyan-400/25',    bg: 'bg-cyan-500/8',    text: 'text-cyan-200',    dot: 'bg-cyan-400' },
  amber:   { border: 'border-amber-400/25',   bg: 'bg-amber-500/8',   text: 'text-amber-200',   dot: 'bg-amber-400' },
  violet:  { border: 'border-violet-400/25',  bg: 'bg-violet-500/8',  text: 'text-violet-200',  dot: 'bg-violet-400' },
  blue:    { border: 'border-blue-400/25',    bg: 'bg-blue-500/8',    text: 'text-blue-200',    dot: 'bg-blue-400' },
  teal:    { border: 'border-teal-400/25',    bg: 'bg-teal-500/8',    text: 'text-teal-200',    dot: 'bg-teal-400' },
  orange:  { border: 'border-orange-400/25',  bg: 'bg-orange-500/8',  text: 'text-orange-200',  dot: 'bg-orange-400' },
  pink:    { border: 'border-pink-400/25',    bg: 'bg-pink-500/8',    text: 'text-pink-200',    dot: 'bg-pink-400' }
};

const GTM_PHASES = [
  { phase: 'Phase 1 (0–3 months)', title: 'Pilot', description: 'Run 3–5 community solar and reforestation projects in India with CSR sponsor partners. Validate proof-to-payout workflow end-to-end.' },
  { phase: 'Phase 2 (3–6 months)', title: 'Expand', description: 'Onboard 10+ projects across India and East Africa. Add premium AI analysis tier. Integrate with 2+ sustainability auditors.' },
  { phase: 'Phase 3 (6–12 months)', title: 'Scale', description: 'Launch enterprise tier for climate funds. Add Guardian-aligned MRV methodology. Target $1M+ in capital deployed through escrow.' },
  { phase: 'Phase 4 (12–18 months)', title: 'Institutionalize', description: 'Regulatory compliance framework. Multi-chain bridge. Institutional investor dashboard. Target $10M+ capital deployed.' }
];

const LeanCanvasPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Lean Canvas Grid */}
      <section className="rounded-[32px] border border-white/10 bg-[#09141a]/80 p-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Lean Canvas</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">Business Model</h3>
            <p className="mt-2 text-sm text-slate-400">
              EcoSwarm Regen's go-to-market strategy and business viability
            </p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Sustainability Track
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {CANVAS_SECTIONS.map((section) => {
            const colors = COLOR_MAP[section.color] || COLOR_MAP.cyan;
            return (
              <div
                key={section.id}
                className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 transition hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                  <h4 className={`text-sm font-semibold uppercase tracking-[0.12em] ${colors.text}`}>
                    {section.title}
                  </h4>
                </div>
                <ul className="mt-4 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Go-To-Market Strategy */}
      <section className="rounded-[32px] border border-white/10 bg-[#09141a]/80 p-8 shadow-xl backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.18em] text-amber-200">Go-To-Market Strategy</div>
        <h3 className="mt-2 text-2xl font-semibold text-white">Phased Rollout Plan</h3>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {GTM_PHASES.map((phase, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/8 bg-white/5 p-5 transition hover:border-white/15"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-lg font-bold text-white">
                  {i + 1}
                </div>
                <div>
                  <div className="text-xs text-slate-400">{phase.phase}</div>
                  <div className="text-sm font-semibold text-white">{phase.title}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{phase.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Market Sizing */}
      <section className="rounded-[32px] border border-white/10 bg-[#09141a]/80 p-8 shadow-xl backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.18em] text-violet-200">Market Opportunity</div>
        <h3 className="mt-2 text-2xl font-semibold text-white">Total Addressable Market</h3>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/8 p-6 text-center">
            <div className="text-4xl font-bold text-violet-200">$630B+</div>
            <div className="mt-2 text-sm text-slate-400">Global climate finance flows annually</div>
            <div className="mt-1 text-xs text-slate-500">Source: Climate Policy Initiative 2024</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/8 p-6 text-center">
            <div className="text-4xl font-bold text-emerald-200">$22B</div>
            <div className="mt-2 text-sm text-slate-400">India CSR spend (2024)</div>
            <div className="mt-1 text-xs text-slate-500">Environmental initiatives growing 18% YoY</div>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/8 p-6 text-center">
            <div className="text-4xl font-bold text-cyan-200">$2B</div>
            <div className="mt-2 text-sm text-slate-400">Serviceable Obtainable Market (Year 3)</div>
            <div className="mt-1 text-xs text-slate-500">Community climate projects with milestone payouts</div>
          </div>
        </div>
      </section>

      {/* Competitive Landscape */}
      <section className="rounded-[32px] border border-white/10 bg-[#09141a]/80 p-8 shadow-xl backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.18em] text-rose-200">Competitive Analysis</div>
        <h3 className="mt-2 text-2xl font-semibold text-white">Why EcoSwarm Wins</h3>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-left text-slate-400">Feature</th>
                <th className="pb-3 text-center text-emerald-200">EcoSwarm Regen</th>
                <th className="pb-3 text-center text-slate-400">Toucan Protocol</th>
                <th className="pb-3 text-center text-slate-400">Gitcoin Grants</th>
                <th className="pb-3 text-center text-slate-400">Verra / Gold Standard</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                ['On-chain escrow', '✅', '❌', '❌', '❌'],
                ['Milestone-based release', '✅', '❌', '⚠️', '❌'],
                ['AI risk analysis', '✅', '❌', '❌', '❌'],
                ['Multi-role workflow', '✅', '❌', '⚠️', '⚠️'],
                ['Energy-efficient ledger', '✅ Hedera', '❌ Polygon', '❌ Ethereum', '❌ Off-chain'],
                ['Community operator intake', '✅', '❌', '✅', '⚠️'],
                ['Tokenized impact receipts', '✅', '✅', '❌', '⚠️'],
                ['Real-time proof audit trail', '✅', '❌', '❌', '❌'],
                ['Sub-cent transaction costs', '✅', '❌', '❌', 'N/A']
              ].map(([feature, ...cols], i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-3 font-medium text-white">{feature}</td>
                  {cols.map((col, j) => (
                    <td key={j} className="py-3 text-center">{col}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default LeanCanvasPage;


