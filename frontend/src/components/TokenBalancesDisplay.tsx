import React from 'react';
import type { TokenBalancesResponse } from '../types';

interface TokenBalancesDisplayProps {
  tokens: TokenBalancesResponse | null;
}

const receiptCards = [
  ['Solar', 'SolarImpactToken', 'text-amber-300'],
  ['Cleanup', 'CleanupImpactToken', 'text-cyan-300'],
  ['Reforestation', 'ReforestationToken', 'text-emerald-300'],
  ['Carbon', 'CarbonCaptureToken', 'text-slate-200']
] as const;

const TokenBalancesDisplay: React.FC<TokenBalancesDisplayProps> = ({ tokens }) => {
  if (!tokens) {
    return null;
  }

  return (
    <div className="mt-6 rounded-3xl border border-white/8 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Impact Tokens Minted</h3>
          <p className="mt-1 text-sm text-slate-400">
            HTS receipts proving verified regeneration activity across every category.
          </p>
        </div>
        <div className="hidden sm:inline-flex rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
          Hedera Token Service
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
        {receiptCards.map(([label, key, tone]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
            <div className="text-slate-400">{label}</div>
            <div className={`mt-2 text-3xl font-semibold ${tone}`}>{tokens[key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenBalancesDisplay;
