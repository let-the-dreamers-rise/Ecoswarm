import React from 'react';
import EventMap from '../EventMap';
import MetricsDisplay from '../MetricsDisplay';
import MilestoneReleaseBoard from '../MilestoneReleaseBoard';
import OpportunityBoard from '../OpportunityBoard';
import PortfolioChart from '../PortfolioChart';
import TokenBalancesDisplay from '../TokenBalancesDisplay';
import AIDecisionDisplay from '../AIDecisionDisplay';
import type { EventMapData } from '../EventMap';
import type { MetricsResponse, OptimizeResponse, PortfolioResponse, TokenBalancesResponse } from '../../types';

interface OperationsWorkspacePageProps {
  events: EventMapData[];
  syncedCases: EventMapData[];
  selectedCase: EventMapData | null;
  selectedCaseId: string | null;
  onSelectCase: (eventId: string) => void;
  metrics: MetricsResponse | null;
  portfolio: PortfolioResponse | null;
  previousAllocations: Record<string, number> | null;
  tokens: TokenBalancesResponse | null;
  optimizerData: OptimizeResponse | null;
}

const formatCategoryLabel = (category: string) => category.replace('_', ' ');

const OperationsWorkspacePage: React.FC<OperationsWorkspacePageProps> = ({
  events,
  syncedCases,
  selectedCase,
  selectedCaseId,
  onSelectCase,
  metrics,
  portfolio,
  previousAllocations,
  tokens,
  optimizerData
}) => {
  const latestEvent = selectedCase ?? (events.length > 0 ? events[events.length - 1] : null);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Operations workspace</div>
            <h1 className="mt-2 text-3xl font-semibold text-white">Community intake and release operations</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Field teams use this workspace to monitor project intake, proof quality, release readiness, and the AI treasury response in real time.
            </p>
          </div>
          {latestEvent && (
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-300">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest intake</div>
              <div className="mt-2 text-lg font-semibold text-white">{latestEvent.project_name}</div>
              <div className="mt-2">{latestEvent.location_label}</div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#0f1518]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Focused deployment case</h2>
            <p className="mt-1 text-sm text-slate-400">
              Teams operate faster when everyone works against one live case instead of scanning generic charts.
            </p>
          </div>

          {selectedCase?.deployment_profile ? (
            <>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xl font-semibold text-white">{selectedCase.project_name}</div>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {selectedCase.deployment_profile.release_readiness} readiness
                  </span>
                </div>
                <div className="mt-3 text-sm leading-6 text-slate-300">
                  {selectedCase.deployment_profile.deployment_summary}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Sponsor</div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {selectedCase.deployment_profile.sponsor_name}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Verifier</div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {selectedCase.deployment_profile.verifier_name}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Operator</div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {selectedCase.deployment_profile.local_operator_name}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400">
              Start the scenario feed to generate a deployment case.
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Case queue</h2>
            <p className="mt-1 text-sm text-slate-400">
              Operators can lock the workspace to a specific sponsor-ready case.
            </p>
          </div>
          <div className="space-y-3">
            {syncedCases.slice(0, 4).map((event) => (
              <button
                key={event.id}
                onClick={() => onSelectCase(event.id)}
                className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                  selectedCaseId === event.id
                    ? 'border-cyan-300/35 bg-cyan-500/10'
                    : 'border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{event.project_name}</div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {(event.priority_score ?? event.impact_score).toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-400">
                  {event.deployment_profile?.launch_wedge}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Community intake map</h2>
            <p className="mt-1 text-sm text-slate-400">
              Operators, verifiers, and sponsors all look at the same live intake inventory.
            </p>
          </div>
          <div className="h-[420px]">
            <EventMap events={events} />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#0d1510]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Operations metrics</h2>
            <p className="mt-1 text-sm text-slate-400">
              Delivery, proof, and release signals stay visible as projects move through the queue.
            </p>
          </div>
          <MetricsDisplay metrics={metrics} />
        </section>
      </div>

      <MilestoneReleaseBoard
        events={events}
        selectedCaseId={selectedCaseId}
        onSelectCase={onSelectCase}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Treasury allocation</h2>
            <p className="mt-1 text-sm text-slate-400">
              Reserve allocation follows the strongest mix of climate impact and release readiness.
            </p>
          </div>
          {portfolio ? (
            <>
              <PortfolioChart portfolio={portfolio} previousAllocations={previousAllocations} />
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Object.entries(portfolio.allocations).map(([category, allocation]) => (
                  <div key={category} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-center">
                    <div className="text-sm text-slate-400">{formatCategoryLabel(category)}</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{allocation.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-slate-400">Loading portfolio...</div>
          )}
          <TokenBalancesDisplay tokens={tokens} />
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#111319]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Treasury AI reasoning</h2>
            <p className="mt-1 text-sm text-slate-400">
              The allocator weighs urgency, proof confidence, readiness, and delivery cost together.
            </p>
          </div>
          <AIDecisionDisplay
            currentAllocation={portfolio?.allocations || null}
            optimizerData={optimizerData}
            latestEvent={latestEvent}
          />
        </section>
      </div>

      <OpportunityBoard
        events={events}
        availableCapitalUsd={Math.max(metrics?.total_capital_routed_usd ?? 0, 45000)}
        selectedCaseId={selectedCaseId}
        onSelectCase={onSelectCase}
      />
    </div>
  );
};

export default OperationsWorkspacePage;
