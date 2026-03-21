import React, { useMemo } from 'react';
import type { MetricsResponse, OptimizeResponse } from '../types';
import type { EventMapData } from './EventMap';

interface PilotReadinessPanelProps {
  events: EventMapData[];
  metrics: MetricsResponse | null;
  optimizerData: OptimizeResponse | null;
  currentAllocation: Record<string, number> | null;
}

const formatCategoryLabel = (category: string) => category.replace('_', ' ');

const PilotReadinessPanel: React.FC<PilotReadinessPanelProps> = ({
  events,
  metrics,
  optimizerData,
  currentAllocation
}) => {
  const pilot = useMemo(() => {
    const topEvent = [...events].sort((left, right) => {
      const leftRank = left.deployment_profile?.release_readiness === 'release' ? 2 : left.deployment_profile?.release_readiness === 'review' ? 1 : 0;
      const rightRank = right.deployment_profile?.release_readiness === 'release' ? 2 : right.deployment_profile?.release_readiness === 'review' ? 1 : 0;

      if (leftRank !== rightRank) {
        return rightRank - leftRank;
      }

      return (right.priority_score ?? right.impact_score) - (left.priority_score ?? left.impact_score);
    })[0];

    const leadingCategory =
      topEvent?.event_type ||
      Object.entries(currentAllocation ?? {}).sort((left, right) => right[1] - left[1])[0]?.[0] ||
      Object.entries(optimizerData?.impact_per_dollar_ratios ?? {}).sort((left, right) => right[1] - left[1])[0]?.[0] ||
      'Reforestation';

    const profile = topEvent?.deployment_profile;
    const region = topEvent?.location_label || [topEvent?.community_name, topEvent?.region, topEvent?.country].filter(Boolean).join(' / ');

    return {
      category: leadingCategory,
      anchor: topEvent?.project_name || 'Lead regeneration pilot',
      region,
      households: topEvent?.households_supported ?? metrics?.total_households_supported ?? 0,
      confidence: topEvent?.verification_confidence ?? metrics?.average_verification_confidence ?? 0,
      profile
    };
  }, [currentAllocation, events, metrics, optimizerData]);

  const rolloutSteps = pilot.profile
    ? [
        `Start with ${pilot.anchor} as the flagship ${formatCategoryLabel(pilot.category)} deployment wedge.`,
        `Formalize ${pilot.profile.sponsor_name.toLowerCase()}, ${pilot.profile.verifier_name.toLowerCase()}, and ${pilot.profile.local_operator_name.toLowerCase()} around the first live case.`,
        `Run the first milestone release using the contract model: ${pilot.profile.contract_model.toLowerCase()}.`,
        `Use Hedera-backed receipts and event records as the audit layer between sponsor, verifier, and community operator.`
      ]
    : [
        'Start with one flagship project instead of pitching a global platform.',
        'Name the first sponsor, verifier, and local operator explicitly.',
        'Tie the pilot to one killer metric and a simple milestone contract.',
        'Use Hedera as the trust layer that links proof to treasury release.'
      ];

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#101814]/80 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pilot Readiness</h2>
          <p className="mt-1 text-sm text-slate-400">
            Judges care about whether this can leave the hackathon. This panel shows the clearest first wedge, the operating triangle around it, and the shortest path to a real pilot.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          GTM + validation path
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Best launch wedge</div>
        <div className="mt-2 text-2xl font-semibold text-white">{pilot.anchor}</div>
        <div className="mt-2 text-sm leading-6 text-slate-300">
          {pilot.region || 'Target geography still open'} / {formatCategoryLabel(pilot.category)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
            {pilot.households} households
          </span>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">
            {(pilot.confidence * 100).toFixed(0)}% confidence
          </span>
          {pilot.profile && (
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">
              KPI: {pilot.profile.beneficiary_metric}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Who pays</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {pilot.profile?.sponsor_name || 'Named sponsor still needed'}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Contract model: {pilot.profile?.contract_model || 'Milestone payouts tied to independently verified outcomes'}
          </p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Who proves trust</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {pilot.profile?.verifier_name || 'Named verifier still needed'}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Community operator: {pilot.profile?.local_operator_name || 'Local operating partner still needed'}
          </p>
        </div>
      </div>

      {pilot.profile && (
        <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Why this pilot can leave the hackathon</div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{pilot.profile.deployment_summary}</p>
          <div className="mt-3 text-sm leading-6 text-slate-300">
            Policy guardrail: {pilot.profile.policy_guardrail}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">30-day path after the hackathon</div>
        <div className="mt-4 grid gap-3">
          {rolloutSteps.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-2xl bg-slate-950/55 px-4 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-slate-200">
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PilotReadinessPanel;
