import React, { useMemo } from 'react';
import type { MetricsResponse, OptimizeResponse, TokenBalancesResponse, HederaEventRecord } from '../types';
import type { EventMapData } from './EventMap';

interface JudgeScorecardProps {
  metrics: MetricsResponse | null;
  tokens: TokenBalancesResponse | null;
  events: EventMapData[];
  hederaRecords: HederaEventRecord[];
  optimizerData: OptimizeResponse | null;
}

type StrengthLabel = 'Strong' | 'Promising' | 'Needs Proof';

interface CriterionCard {
  criterion: string;
  weight: string;
  strength: StrengthLabel;
  evidence: string;
  nextMove: string;
}

const strengthTone: Record<StrengthLabel, string> = {
  Strong: 'bg-emerald-500/15 text-emerald-200',
  Promising: 'bg-amber-500/15 text-amber-200',
  'Needs Proof': 'bg-rose-500/15 text-rose-200'
};

const JudgeScorecard: React.FC<JudgeScorecardProps> = ({
  metrics,
  tokens,
  events,
  hederaRecords,
  optimizerData
}) => {
  const scorecard = useMemo(() => {
    const tokenReceipts =
      (tokens?.SolarImpactToken ?? 0) +
      (tokens?.CleanupImpactToken ?? 0) +
      (tokens?.ReforestationToken ?? 0) +
      (tokens?.CarbonCaptureToken ?? 0);
    const communityCount = new Set(
      events.map((event) => event.community_name || event.project_name).filter(Boolean)
    ).size;
    const verificationSources = new Set(
      events.map((event) => event.verification_source).filter(Boolean)
    ).size;
    const sdgCoverage = new Set(events.flatMap((event) => event.sdg_tags ?? [])).size;
    const namedSponsors = metrics?.active_sponsors?.length ?? 0;
    const namedVerifiers = metrics?.active_verifiers?.length ?? 0;
    const releaseReadyProjects = metrics?.release_ready_projects ?? 0;
    const households = metrics?.total_households_supported ?? 0;
    const records = hederaRecords.length;
    const capital = metrics?.total_capital_routed_usd ?? 0;
    const hasRebalance = Boolean(optimizerData);

    const cards: CriterionCard[] = [
      {
        criterion: 'Innovation',
        weight: '10%',
        strength:
          events.some((event) => event.deployment_profile?.milestone_plan?.length) && sdgCoverage >= 4
            ? 'Strong'
            : 'Promising',
        evidence:
          'The product now behaves like a proof-backed milestone treasury for climate projects, not a generic dashboard or donor tracker.',
        nextMove:
          'Add one live verifier workflow or co-signed field packet so the originality feels operational, not just conceptual.'
      },
      {
        criterion: 'Feasibility',
        weight: '10%',
        strength: hasRebalance && records > 0 && releaseReadyProjects > 0 ? 'Strong' : 'Promising',
        evidence:
          'There is a functioning pipeline from intake to payout memo to treasury action, with backend, AI, and Hedera all active.',
        nextMove:
          'Show one real partner data source or field template after the hackathon to bridge from demo mode into deployment.'
      },
      {
        criterion: 'Execution',
        weight: '20%',
        strength:
          (metrics?.total_events_processed ?? 0) >= 5 && records >= 8 && tokenReceipts > 0
            ? 'Strong'
            : 'Promising',
        evidence:
          `${metrics?.total_events_processed ?? 0} live cases, ${records} Hedera records, and ${tokenReceipts} impact receipts make the MVP feel end to end.`,
        nextMove:
          'Tighten the demo choreography so judges see the strongest sponsor-verifier-operator loop in under one minute.'
      },
      {
        criterion: 'Integration',
        weight: '15%',
        strength: records >= 8 && tokenReceipts > 0 ? 'Strong' : 'Promising',
        evidence:
          'Hedera is embedded in the product flow through case recording, release checkpoints, and tokenized receipts.',
        nextMove:
          'If time permits, add one explicit policy or signer rule to deepen the Hedera-native trust story further.'
      },
      {
        criterion: 'Success',
        weight: '20%',
        strength: households >= 500 && capital >= 30000 && releaseReadyProjects > 0 ? 'Promising' : 'Needs Proof',
        evidence:
          `${households} households, ${capital.toFixed(0)} routed dollars, and ${releaseReadyProjects} release-ready cases create a strong impact narrative, but real buyer pull still needs proving.`,
        nextMove:
          'Secure one pilot commitment, NGO introduction, or sponsor quote so the success story extends beyond simulated cases.'
      },
      {
        criterion: 'Validation',
        weight: '15%',
        strength: communityCount >= 3 && namedVerifiers >= 2 && namedSponsors >= 2 ? 'Promising' : 'Needs Proof',
        evidence:
          `${communityCount} operator lanes, ${namedSponsors} named sponsors, ${namedVerifiers} named verifiers, and ${verificationSources} proof sources are visible, which is stronger than most demos but still mostly internal.`,
        nextMove:
          'Bring in at least one external sustainability practitioner, verifier, or climate buyer and quote their reaction.'
      },
      {
        criterion: 'Pitch',
        weight: '10%',
        strength: events.length > 0 && records > 0 ? 'Strong' : 'Promising',
        evidence:
          'The narrative is now easy to explain: project intake -> payout memo -> release queue -> Hedera audit trail.',
        nextMove:
          'Lead the pitch with broken trust in climate payouts, then show why milestone-backed release changes the outcome.'
      }
    ];

    const weakestCard = [...cards].sort((left, right) => {
      const rank = { Strong: 2, Promising: 1, 'Needs Proof': 0 };
      return rank[left.strength] - rank[right.strength];
    })[0];

    return { cards, weakestCard };
  }, [events, hederaRecords.length, metrics, optimizerData, tokens]);

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Judge Lens</h2>
          <p className="mt-1 text-sm text-slate-400">
            This grades the product the same way a finals judge is likely to think: where the system now feels incubator-worthy, and where outside proof still matters.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
          Brutally honest scorecard
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {scorecard.cards.map((card) => (
          <div key={card.criterion} className="rounded-3xl border border-white/8 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.weight}</div>
                <div className="mt-1 text-xl font-semibold text-white">{card.criterion}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${strengthTone[card.strength]}`}>
                {card.strength}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{card.evidence}</p>
            <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Win this criterion harder</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.nextMove}</p>
            </div>
          </div>
        ))}
      </div>

      {scorecard.weakestCard && (
        <div className="mt-5 rounded-3xl border border-amber-400/20 bg-amber-500/5 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-amber-200">Most dangerous judge objection</div>
          <div className="mt-2 text-lg font-semibold text-white">{scorecard.weakestCard.criterion}</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{scorecard.weakestCard.nextMove}</p>
        </div>
      )}
    </section>
  );
};

export default JudgeScorecard;
