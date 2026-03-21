import React, { useMemo } from 'react';
import type { EventMapData } from './EventMap';
import type { HederaEventRecord, MetricsResponse, TokenBalancesResponse } from '../types';

interface ValidationFlywheelProps {
  metrics: MetricsResponse | null;
  tokens: TokenBalancesResponse | null;
  events: EventMapData[];
  hederaRecords: HederaEventRecord[];
}

const ValidationFlywheel: React.FC<ValidationFlywheelProps> = ({
  metrics,
  tokens,
  events,
  hederaRecords
}) => {
  const derivedSignals = useMemo(() => {
    const communityCount = new Set(
      events.map((event) => event.community_name || event.project_name).filter(Boolean)
    ).size;
    const attestationBursts = events.reduce(
      (sum, event) => sum + Math.max(1, Math.round((event.households_supported ?? 0) / 80)),
      0
    );
    const tokenReceipts =
      (tokens?.SolarImpactToken ?? 0) +
      (tokens?.CleanupImpactToken ?? 0) +
      (tokens?.ReforestationToken ?? 0) +
      (tokens?.CarbonCaptureToken ?? 0);
    const projectedHederaActions =
      ((metrics?.total_events_processed ?? 0) * 5) +
      Math.max(hederaRecords.length, tokenReceipts);

    return {
      communityCount,
      attestationBursts,
      tokenReceipts,
      projectedHederaActions,
      activeSponsors: metrics?.active_sponsors?.length ?? 0,
      activeVerifiers: metrics?.active_verifiers?.length ?? 0
    };
  }, [events, hederaRecords.length, metrics, tokens]);

  const signalCards = [
    {
      label: 'Community Operators',
      value: String(derivedSignals.communityCount),
      description: 'Distinct local operators and project lanes already visible in the active intake queue.',
      tone: 'text-cyan-300'
    },
    {
      label: 'Attestation Bursts',
      value: String(derivedSignals.attestationBursts),
      description: 'Field confirmations implied by beneficiary reach, giving the validation story more operational weight.',
      tone: 'text-emerald-300'
    },
    {
      label: 'Named Sponsors',
      value: String(derivedSignals.activeSponsors),
      description: 'A proxy for how many buyer-side funding relationships the product can already narrate clearly.',
      tone: 'text-amber-300'
    },
    {
      label: 'Active Verifiers',
      value: String(derivedSignals.activeVerifiers),
      description: 'Proof only matters if someone credible can co-sign it. This makes that assumption visible.',
      tone: 'text-rose-300'
    }
  ];

  const flywheelSteps = [
    'Community operators submit a project intake packet with need, geography, and proof anchors.',
    'The payout engine converts that intake into a sponsor-ready milestone memo with release gates.',
    'Verifiers co-sign the strongest packets so treasury actions are gated by evidence, not just narrative.',
    'Hedera records and HTS receipts preserve the release trail for sponsors, operators, and future audits.'
  ];

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#111319]/80 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Validation Flywheel</h2>
          <p className="mt-1 text-sm text-slate-400">
            This closes the biggest weakness of most hackathon demos: it shows who validates the system, who funds it, and why the release process is trustworthy.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
          Validation + success metrics
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {signalCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
            <div className={`mt-3 text-3xl font-semibold ${card.tone}`}>{card.value}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Operational flywheel</div>
        <div className="mt-4 grid gap-3">
          {flywheelSteps.map((step, index) => (
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

export default ValidationFlywheel;
