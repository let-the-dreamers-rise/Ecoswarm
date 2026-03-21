import React, { useMemo } from 'react';
import type { EventMapData } from './EventMap';

interface OpportunityBoardProps {
  events: EventMapData[];
  availableCapitalUsd: number;
  selectedCaseId?: string | null;
  onSelectCase?: (eventId: string) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const buyerSignals: Record<string, string> = {
  Solar: 'Corporate energy transition buyers',
  River_Cleanup: 'Municipal resilience and plastic credits',
  Reforestation: 'Nature-positive brands and adaptation funds',
  Carbon_Capture: 'Climate finance and soil-carbon buyers'
};

const formatCategoryLabel = (category: string) => category.replace('_', ' ');

const OpportunityBoard: React.FC<OpportunityBoardProps> = ({
  events,
  availableCapitalUsd,
  selectedCaseId,
  onSelectCase
}) => {
  const opportunities = useMemo(() => {
    const sorted = [...events]
      .sort((left, right) => (right.priority_score ?? right.impact_score) - (left.priority_score ?? left.impact_score))
      .slice(0, 4);

    const scoreTotal = sorted.reduce(
      (sum, event) => sum + Math.max(event.priority_score ?? event.impact_score, 1),
      0
    );
    const treasuryWindow = Math.max(availableCapitalUsd, 45000);

    return sorted.map((event) => {
      const priority = Math.max(event.priority_score ?? event.impact_score, 1);
      const share = priority / Math.max(scoreTotal, 1);
      const fundingGap = Math.max(event.funding_gap_usd ?? 10000, 1000);
      const suggestedCommitment = Math.min(
        fundingGap,
        Math.max(2500, Math.round((treasuryWindow * share) / 250) * 250)
      );
      const coverageRatio = Math.min(100, Math.round((suggestedCommitment / fundingGap) * 100));
      const stage =
        event.deployment_profile?.release_readiness === 'release'
          ? 'Ready for immediate milestone release'
          : event.deployment_profile?.release_readiness === 'review'
            ? 'Committee review recommended'
            : event.proof_hash
              ? 'Proof packet is live and collecting verifier sign-off'
              : 'Needs expanded verifier coverage';

      return {
        ...event,
        suggestedCommitment,
        coverageRatio,
        stage,
        buyerSignal:
          event.deployment_profile?.buyer_signal ||
          event.buyer_signal ||
          buyerSignals[event.event_type] ||
          'Regeneration buyer pipeline'
      };
    });
  }, [availableCapitalUsd, events]);

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Treasury Committee Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            The treasury no longer watches passively. It ranks live cases, sizes sponsor commitments, and shows whether each one is ready for verifier review or release.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Community-driven capital routing
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400">
          Start the simulation to populate the treasury committee queue with ranked payout cases.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className={`rounded-3xl border p-5 ${
                selectedCaseId === opportunity.id
                  ? 'border-cyan-300/35 bg-cyan-500/10'
                  : 'border-white/8 bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {formatCategoryLabel(opportunity.event_type)}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {opportunity.project_name || 'Verified intervention'}
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                  Priority {(opportunity.priority_score ?? opportunity.impact_score).toFixed(2)}
                </span>
              </div>

              {onSelectCase && (
                <button
                  onClick={() => onSelectCase(opportunity.id)}
                  className="mt-4 inline-flex rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
                >
                  {selectedCaseId === opportunity.id ? 'Focused Case' : 'Focus Case'}
                </button>
              )}

              <div className="mt-3 text-sm leading-6 text-slate-300">
                {opportunity.location_label || [opportunity.community_name, opportunity.region, opportunity.country].filter(Boolean).join(' / ')}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Funding gap</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {currencyFormatter.format(opportunity.funding_gap_usd ?? 0)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Suggested sponsor commitment</div>
                  <div className="mt-2 text-xl font-semibold text-emerald-300">
                    {currencyFormatter.format(opportunity.suggestedCommitment)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
                  <span>Treasury coverage</span>
                  <span>{opportunity.coverageRatio}%</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-slate-900/80">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300"
                    style={{ width: `${opportunity.coverageRatio}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">
                  {(opportunity.verification_confidence ?? 0).toFixed(2)} confidence
                </span>
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-200">
                  {opportunity.households_supported ?? 0} households
                </span>
                <span className="rounded-full bg-lime-500/10 px-3 py-1 text-lime-200">
                  {opportunity.deployment_profile?.release_readiness || opportunity.urgency_level || 'stable'}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Stage</div>
                <div className="mt-2 text-sm font-medium text-slate-100">{opportunity.stage}</div>
                <div className="mt-3 text-xs leading-6 text-slate-400">
                  Buyer pull: {opportunity.buyerSignal}
                </div>
                <div className="mt-1 text-xs leading-6 text-slate-400">
                  Proof source: {opportunity.verification_source || 'Awaiting verifier metadata'}
                </div>
                {opportunity.deployment_profile && (
                  <div className="mt-1 text-xs leading-6 text-slate-400">
                    Next unlock: {opportunity.deployment_profile.milestone_plan[0]?.proof_requirement}
                  </div>
                )}
              </div>

              {opportunity.sdg_tags && opportunity.sdg_tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {opportunity.sdg_tags.map((tag) => (
                    <span key={`${opportunity.id}-${tag}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default OpportunityBoard;
