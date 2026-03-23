import React from 'react';
import ProofToPayoutRail from '../ProofToPayoutRail';
import MilestoneReleaseBoard from '../MilestoneReleaseBoard';
import MetricsDisplay from '../MetricsDisplay';
import TokenBalancesDisplay from '../TokenBalancesDisplay';
import EventStream from '../EventStream';
import type { HederaEventRecord, MetricsResponse, PortfolioResponse, TokenBalancesResponse } from '../../types';
import type { EventMapData } from '../EventMap';

interface PlatformOverviewPageProps {
  metrics: MetricsResponse | null;
  tokens: TokenBalancesResponse | null;
  portfolio: PortfolioResponse | null;
  events: EventMapData[];
  syncedCases: EventMapData[];
  selectedCase: EventMapData | null;
  selectedCaseId: string | null;
  hederaRecords: HederaEventRecord[];
  onSelectCase: (eventId: string) => void;
  onNavigate: (page: 'case' | 'operations' | 'agents' | 'blueprint' | 'client' | 'audit') => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const PlatformOverviewPage: React.FC<PlatformOverviewPageProps> = ({
  metrics,
  tokens,
  portfolio,
  events,
  syncedCases,
  selectedCase,
  selectedCaseId,
  hederaRecords,
  onSelectCase,
  onNavigate
}) => {
  const latestCase = selectedCase ?? syncedCases[0] ?? events[events.length - 1];
  const previewCards = [
    {
      title: 'Case Room',
      description: 'Shared sponsor, verifier, and operator workflow anchored to one live payout case.',
      action: () => onNavigate('case')
    },
    {
      title: 'Operator Workspace',
      description: 'Communities and field teams manage intake, proof packets, and milestone readiness.',
      action: () => onNavigate('operations')
    },
    {
      title: 'Client Portal',
      description: 'Sponsors track synced releases, pending approvals, and delivery alerts in one place.',
      action: () => onNavigate('client')
    },
    {
      title: 'Agent Network',
      description: 'Scout, verifier, treasury, settlement, and reputation agents operate the same payout case.',
      action: () => onNavigate('agents')
    },
    {
      title: 'Blueprint',
      description: 'Deployment wedge, buyer value, Hedera moat, and pilot rollout for the same case.',
      action: () => onNavigate('blueprint')
    },
    {
      title: 'Audit Trail',
      description: 'Every proof checkpoint, token receipt, and treasury action stays visible on the Hedera rail.',
      action: () => onNavigate('audit')
    }
  ];

  const signalCards = [
    {
      label: 'Release-ready capital',
      value: currencyFormatter.format(metrics?.capital_ready_to_release_usd ?? 0)
    },
    {
      label: 'Active sponsors',
      value: String(metrics?.active_sponsors?.length ?? 0)
    },
    {
      label: 'Active verifiers',
      value: String(metrics?.active_verifiers?.length ?? 0)
    },
    {
      label: 'Hedera records',
      value: String(hederaRecords.length)
    }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-7 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
            Finished Product View
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            EcoSwarm Regen: Verified Sustainability Treasury
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            EcoSwarm coordinates community climate projects, sponsor capital, and verifier proof in one product. The platform structures each project as a milestone-backed release workflow instead of a static analytics dashboard.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {signalCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{card.value}</div>
              </div>
            ))}
          </div>

          {syncedCases.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Shared case focus</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {syncedCases.slice(0, 4).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onSelectCase(event.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selectedCaseId === event.id
                        ? 'border-cyan-300/35 bg-cyan-500/10'
                        : 'border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{event.project_name}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {event.deployment_profile?.release_readiness || 'hold'} readiness
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#0e1518]/85 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Live case snapshot</div>
          {latestCase ? (
            <>
              <div className="mt-3 text-2xl font-semibold text-white">{latestCase.project_name}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                {latestCase.deployment_profile?.deployment_summary || latestCase.location_label}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
                  {latestCase.deployment_profile?.release_readiness || 'hold'} readiness
                </span>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">
                  {currencyFormatter.format(latestCase.deployment_profile?.payout_recommendation_usd ?? 0)}
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-300">
                Sponsor: {latestCase.deployment_profile?.sponsor_name || latestCase.sponsor_name || 'Pending'}<br />
                Verifier: {latestCase.deployment_profile?.verifier_name || latestCase.verifier_name || 'Pending'}
              </div>
            </>
          ) : (
            <div className="mt-4 text-sm leading-6 text-slate-400">
              Start the simulation to populate the platform with live climate projects and synced release cases.
            </div>
          )}
        </div>
      </section>

      <ProofToPayoutRail
        metrics={metrics}
        tokens={tokens}
        queuedOpportunities={events.length}
        hederaRecords={hederaRecords.length}
      />

      <section className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        {previewCards.map((card) => (
          <button
            key={card.title}
            onClick={card.action}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-left transition hover:border-cyan-300/30 hover:bg-white/10"
          >
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspace</div>
            <div className="mt-2 text-2xl font-semibold text-white">{card.title}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
            <div className="mt-5 text-sm font-semibold text-cyan-200">Open workspace</div>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Live platform signals</h2>
            <p className="mt-1 text-sm text-slate-400">
              Sponsors and operators both read these delivery, proof, and treasury indicators.
            </p>
          </div>
          <MetricsDisplay metrics={metrics} />
          {portfolio ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {Object.entries(portfolio.allocations).map(([category, allocation]) => (
                <div key={category} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {category.replace('_', ' ')}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">{allocation.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 text-slate-400">Loading portfolio...</div>
          )}
          <TokenBalancesDisplay tokens={tokens} />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Recent network activity</h2>
            <p className="mt-1 text-sm text-slate-400">
              A compact audit preview of the latest Hedera-backed activity across the platform.
            </p>
          </div>
          <EventStream events={hederaRecords} />
        </div>
      </section>

      <MilestoneReleaseBoard
        events={events}
        selectedCaseId={selectedCaseId}
        onSelectCase={onSelectCase}
      />

      {/* ───── Hedera Integration Summary ───── */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Deep Hedera Integration</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">7 Hedera Service Dimensions, One Product</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          EcoSwarm Regen uses every major Hedera service category — each playing a distinct, essential role in the proof-to-payout workflow. No service is optional or decorative.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {[
            { service: 'HCS', role: 'Immutable audit trail', icon: '📜' },
            { service: 'HTS (Fungible)', role: 'Impact receipt tokens', icon: '🪙' },
            { service: 'HTS (NFT)', role: 'Impact certificates', icon: '🎖️' },
            { service: 'Smart Contracts', role: 'Milestone escrow', icon: '📝' },
            { service: 'Accounts', role: 'Role provisioning', icon: '👤' },
            { service: 'Mirror Node', role: 'On-chain verification', icon: '🔍' },
            { service: 'Scheduled TX', role: 'Deadline enforcement', icon: '⏰' }
          ].map((item) => (
            <div key={item.service} className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
              <div className="text-2xl">{item.icon}</div>
              <div className="mt-2 text-xs font-semibold text-white">{item.service}</div>
              <div className="mt-1 text-[10px] text-slate-400">{item.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Why Hedera, Not Web2? ───── */}
      <section className="rounded-[28px] border border-violet-400/15 bg-[#0e0b18]/90 p-6 shadow-xl backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.18em] text-violet-200">Integration Thesis</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">Why Hedera, Not Web2?</h2>
        <p className="mt-2 text-sm text-slate-400">
          A sustainability platform <span className="italic">could</span> run on PostgreSQL + Stripe. Here's why it <span className="font-semibold text-violet-200">shouldn't</span>:
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                <th className="pb-3 pr-4">Capability</th>
                <th className="pb-3 pr-4">Web2 (PostgreSQL + Stripe)</th>
                <th className="pb-3 text-emerald-200">EcoSwarm + Hedera</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                { cap: 'Fund release', web2: 'Admin can override at any time', hedera: 'Smart contract blocks release until verifier approves — enforced by consensus' },
                { cap: 'Audit trail', web2: 'Database admin can edit/delete', hedera: 'HCS records are immutable — no party can tamper with history' },
                { cap: 'Proof verification', web2: 'Sponsor trusts operator\'s word', hedera: 'Independent verification via Mirror Node — any party can audit' },
                { cap: 'Identity', web2: 'Shared login credentials', hedera: 'Each role gets a distinct Hedera account; this MVP keeps keys server-custodied on testnet' },
                { cap: 'Deadline enforcement', web2: 'Cron job that can be disabled', hedera: 'Contract deadlines make refunds eligible after expiry, with Scheduled Transactions used only as reminders' },
                { cap: 'Impact receipts', web2: 'PDF certificates', hedera: 'NFT + fungible tokens — independently verifiable, tradeable, composable' },
                { cap: 'Cost per action', web2: 'Stripe: $0.30 + 2.9% per tx', hedera: '$0.001 per tx — 300x cheaper for small sustainability actions' }
              ].map((row) => (
                <tr key={row.cap} className="border-b border-white/5">
                  <td className="py-3 pr-4 font-semibold text-white">{row.cap}</td>
                  <td className="py-3 pr-4 text-rose-200/80">{row.web2}</td>
                  <td className="py-3 text-emerald-200">{row.hedera}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───── Hedera Network Growth Projector ───── */}
      <section className="rounded-[28px] border border-emerald-400/15 bg-[#0a1614]/90 p-6 shadow-xl backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">Network Success Projection</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">Hedera Ecosystem Growth Impact</h2>
        <p className="mt-2 text-sm text-slate-400">
          Scenario-based projection of Hedera network contribution if EcoSwarm Regen moves from pilot-ready MVP into live production.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            {
              year: 'Year 1 — Pilot', projects: 50, accounts: '150+',
              tps: '500+ TXs/month', revenue: '$25K ARR',
              detail: '3 pilot geographies, 50 community projects, 10 sponsors'
            },
            {
              year: 'Year 2 — Scale', projects: 500, accounts: '1,500+',
              tps: '5,000+ TXs/month', revenue: '$250K ARR',
              detail: '15 countries, 500 projects, 100 sponsors, 50 verifiers'
            },
            {
              year: 'Year 3 — Institutional', projects: 5000, accounts: '15,000+',
              tps: '50,000+ TXs/month', revenue: '$2.5M ARR',
              detail: 'Guardian integration, carbon credit marketplace, institutional sponsors'
            }
          ].map((phase) => (
            <div key={phase.year} className="rounded-2xl border border-emerald-400/10 bg-emerald-500/5 p-5">
              <div className="text-sm font-semibold text-emerald-200">{phase.year}</div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Projects</span>
                  <span className="text-sm font-semibold text-white">{phase.projects.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">New Hedera Accounts</span>
                  <span className="text-sm font-semibold text-white">{phase.accounts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Network Activity</span>
                  <span className="text-sm font-semibold text-white">{phase.tps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Platform Revenue</span>
                  <span className="text-sm font-semibold text-white">{phase.revenue}</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] leading-4 text-slate-500">{phase.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Market Validation ───── */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.18em] text-amber-200">Market Validation</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">Problem–Market Fit Evidence</h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Target Personas */}
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Target Personas</div>
            <div className="mt-4 space-y-4">
              {[
                { role: 'CSR Manager', company: 'Mid/large enterprise', pain: 'Can\'t verify milestone delivery before releasing project funds', budget: '$50K–$2M sustainability budget' },
                { role: 'NGO Project Lead', company: 'Local operator', pain: 'Proof formats differ across sponsors — no standardized rail', budget: 'Manages 5–50 field projects' },
                { role: 'Sustainability Auditor', company: 'Consulting/audit firm', pain: 'Manual verification across spreadsheets and email', budget: '$200K–$1M audit contracts' }
              ].map((persona) => (
                <div key={persona.role} className="rounded-xl border border-white/5 bg-slate-950/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{persona.role}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400">{persona.company}</span>
                  </div>
                  <div className="mt-2 text-xs text-rose-200">Pain: {persona.pain}</div>
                  <div className="mt-1 text-xs text-emerald-200">{persona.budget}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pilot Plan */}
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Pilot Geography & Workflow</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-4">
                <div className="text-sm font-semibold text-emerald-200">India — Community Solar</div>
                <div className="mt-1 text-xs text-slate-300">
                  Partner with CSR-funded solar cooperatives in Rajasthan. Milestone: panel installation → community connection → first kWh delivery.
                </div>
              </div>
              <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/5 p-4">
                <div className="text-sm font-semibold text-cyan-200">India — Reforestation</div>
                <div className="mt-1 text-xs text-slate-300">
                  Tree planting initiatives in Western Ghats. Milestone: nursery prep → planting → 90-day survival audit → carbon sequestration measurement.
                </div>
              </div>
              <div className="rounded-xl border border-amber-400/15 bg-amber-500/5 p-4">
                <div className="text-sm font-semibold text-amber-200">East Africa — River Cleanup</div>
                <div className="mt-1 text-xs text-slate-300">
                  Community cleanup programs along Kenyan waterways. Milestone: crew deployment → waste collected (kg) → water quality test.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Research Signals */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { stat: '72%', label: 'reported in ESG buyer research as a major pain point around proving sustainability outcomes', source: 'McKinsey ESG Survey 2024' },
            { stat: '$4.7T', label: 'needed annually by 2030 to meet Paris Agreement goals — massive funding gap', source: 'Climate Policy Initiative' },
            { stat: '68%', label: 'reported gap in standardized milestone tracking across many climate grant workflows', source: 'ODI Green Finance Report' },
            { stat: '45 days', label: 'reported benchmark for slow proof-to-payout timelines in traditional climate finance', source: 'World Bank Climate Finance' }
          ].map((item) => (
            <div key={item.stat} className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-3xl font-bold text-white">{item.stat}</div>
              <div className="mt-2 text-xs leading-5 text-slate-300">{item.label}</div>
              <div className="mt-1 text-[11px] text-slate-500">{item.source}</div>
            </div>
          ))}
        </div>

        {/* Expert Signals */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-violet-400/10 bg-violet-500/5 p-5">
            <div className="text-xs uppercase tracking-[0.12em] text-violet-200">Industry Expert Insight</div>
            <blockquote className="mt-3 text-sm italic leading-6 text-slate-200">
              "The biggest barrier to scaling climate finance isn't money — it's the inability to verify outcomes at the speed the market demands."
            </blockquote>
            <div className="mt-2 text-xs text-slate-400">— Climate Policy Initiative, Global Landscape of Climate Finance 2024</div>
          </div>
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-500/5 p-5">
            <div className="text-xs uppercase tracking-[0.12em] text-cyan-200">Market Signal</div>
            <blockquote className="mt-3 text-sm italic leading-6 text-slate-200">
              "Article 6 of the Paris Agreement creates a $100B+ market for transparent, verifiable carbon credit transactions — digital MRV infrastructure is a prerequisite."
            </blockquote>
            <div className="mt-2 text-xs text-slate-400">— World Bank State of Carbon Markets 2024</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlatformOverviewPage;


