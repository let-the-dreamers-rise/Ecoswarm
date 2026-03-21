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
    </div>
  );
};

export default PlatformOverviewPage;
