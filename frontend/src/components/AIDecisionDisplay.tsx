import React from 'react';
import type { DeploymentProfile, OptimizeResponse } from '../types';

interface LatestSignal {
  project_name?: string;
  verification_source?: string;
  households_supported?: number;
  verification_confidence?: number;
  priority_score?: number;
  deployment_profile?: DeploymentProfile;
}

interface AIDecisionDisplayProps {
  currentAllocation: Record<string, number> | null;
  optimizerData: OptimizeResponse | null;
  latestEvent?: LatestSignal | null;
}

const categories = ['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'];

const categoryColors: Record<string, string> = {
  Solar: 'text-yellow-400',
  River_Cleanup: 'text-blue-400',
  Reforestation: 'text-green-400',
  Carbon_Capture: 'text-gray-400'
};

const formatCategoryLabel = (category: string) => category.replace('_', ' ');

const AIDecisionDisplay: React.FC<AIDecisionDisplayProps> = ({
  currentAllocation,
  optimizerData,
  latestEvent
}) => {
  if (!currentAllocation) {
    return (
      <div className="text-slate-400 text-center py-8">
        Waiting for portfolio data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3 text-slate-200">Current Allocation</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <div key={category} className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {formatCategoryLabel(category)}
            </div>
            <div className={`mt-2 text-3xl font-semibold ${categoryColors[category]}`}>
              {currentAllocation[category]?.toFixed(1) || '0.0'}%
            </div>
          </div>
        ))}
      </div>

      {latestEvent && (
        <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest signal shaping the treasury</div>
          <div className="mt-3 text-xl font-semibold">{latestEvent.project_name || 'Verified intervention'}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            {latestEvent.verification_source || 'No verification source available.'}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">
              Priority {latestEvent.priority_score?.toFixed(2) ?? '0.00'}
            </span>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">
              {latestEvent.households_supported ?? 0} households
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
              {(((latestEvent.verification_confidence ?? 0) * 100).toFixed(0))}% confidence
            </span>
            {latestEvent.deployment_profile && (
              <>
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-200">
                  {latestEvent.deployment_profile.release_readiness} readiness
                </span>
                <span className="rounded-full bg-lime-500/10 px-3 py-1 text-lime-200">
                  ${latestEvent.deployment_profile.payout_recommendation_usd.toLocaleString()} payout
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {optimizerData?.impact_per_dollar_ratios && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-slate-200">Impact-per-Dollar Ratios</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const ratio = optimizerData.impact_per_dollar_ratios[category];
              return (
                <div key={category} className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                  <div className="text-sm text-slate-400">{formatCategoryLabel(category)}</div>
                  <div className={`mt-2 text-2xl font-semibold ${categoryColors[category]}`}>
                    {ratio !== undefined ? ratio.toFixed(2) : 'N/A'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {optimizerData?.recommended_allocation && optimizerData.rebalancing_needed && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-emerald-200">
            Recommended New Allocation
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const recommended = optimizerData.recommended_allocation[category];
              const current = currentAllocation[category] || 0;
              const change = recommended - current;
              const changeLabel = change > 0 ? `+ ${Math.abs(change).toFixed(1)}%` : `- ${Math.abs(change).toFixed(1)}%`;

              return (
                <div key={category} className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <div className="text-sm text-slate-400">{formatCategoryLabel(category)}</div>
                  <div className={`mt-2 text-2xl font-semibold ${categoryColors[category]}`}>
                    {recommended?.toFixed(1) || '0.0'}%
                  </div>
                  {Math.abs(change) > 0.1 && (
                    <div className={`mt-2 text-xs ${change > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {changeLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {optimizerData?.decision_logic && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-slate-200">AI Decision Logic</h3>
          <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
            <p className="text-slate-200 leading-7">
              {optimizerData.decision_logic}
            </p>
          </div>
        </div>
      )}

      {optimizerData && !optimizerData.rebalancing_needed && (
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-5">
          <p className="text-cyan-200 text-center">
            Portfolio is well-balanced. The AI reviewed recent interventions and kept the treasury steady.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIDecisionDisplay;
