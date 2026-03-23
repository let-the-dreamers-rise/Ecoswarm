import React, { useEffect, useMemo, useState } from 'react';
import type { DemoControlMessage } from '../types';
import { useTreasuryLiveData } from '../hooks/useTreasuryLiveData';
import { getWsUrl } from '../lib/runtimeConfig';
import PlatformOverviewPage from './pages/PlatformOverviewPage';
import SharedCaseRoomPage from './pages/SharedCaseRoomPage';
import OperationsWorkspacePage from './pages/OperationsWorkspacePage';
import AgentNetworkPage from './pages/AgentNetworkPage';
import DeploymentBlueprintPage from './pages/DeploymentBlueprintPage';
import ClientPortalPage from './pages/ClientPortalPage';
import AuditTrailPage from './pages/AuditTrailPage';
import LeanCanvasPage from './pages/LeanCanvasPage';

interface DashboardProps {
  wsUrl?: string;
}

type AppPage = 'overview' | 'case' | 'operations' | 'agents' | 'blueprint' | 'client' | 'audit' | 'business';

const PAGE_ITEMS: Array<{
  id: AppPage;
  label: string;
  description: string;
}> = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Product narrative and live platform signals'
  },
  {
    id: 'case',
    label: 'Case Room',
    description: 'Shared sponsor, verifier, and operator workflow'
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Field intake, release queue, and treasury controls'
  },
  {
    id: 'agents',
    label: 'Agent Network',
    description: 'Semi-autonomous triage, authorization, and settlement'
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    description: 'USP, buyer value, Hedera moat, and pilot rollout'
  },
  {
    id: 'client',
    label: 'Client Portal',
    description: 'Sponsor alerts and synchronized commitments'
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    description: 'Proof packets, receipts, and Hedera records'
  },
  {
    id: 'business',
    label: 'Business Model',
    description: 'Lean Canvas, GTM strategy, and market analysis'
  }
];

const getPageFromHash = (): AppPage => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'case' || hash === 'operations' || hash === 'agents' || hash === 'blueprint' || hash === 'client' || hash === 'audit' || hash === 'business') {
    return hash;
  }
  return 'overview';
};

const Dashboard: React.FC<DashboardProps> = ({ wsUrl = getWsUrl() }) => {
  const {
    isConnected,
    portfolio,
    previousAllocations,
    metrics,
    tokens,
    eventStream,
    mapEvents,
    syncedCases,
    selectedCase,
    selectedCaseId,
    selectedCaseRecords,
    isDemoActive,
    systemHealth,
    stateNotification,
    optimizerData,
    activeCaseAction,
    sendDemoControl,
    runCaseAction,
    setSelectedCaseId
  } = useTreasuryLiveData(wsUrl);
  const [currentPage, setCurrentPage] = useState<AppPage>(() =>
    typeof window === 'undefined' ? 'overview' : getPageFromHash()
  );

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '#/overview';
    }

    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page: AppPage) => {
    window.location.hash = `#/${page}`;
    setCurrentPage(page);
  };

  const sendControl = (action: DemoControlMessage['action']) => {
    sendDemoControl(action);
  };

  const selectCase = (eventId: string) => {
    setSelectedCaseId(eventId);
  };

  const pageTitle = useMemo(() => {
    return PAGE_ITEMS.find((item) => item.id === currentPage);
  }, [currentPage]);

  const healthEntries = systemHealth
    ? [
        ['Simulation Engine', systemHealth.simulation_engine],
        ['Impact Calculator', systemHealth.impact_calculator],
        ['Portfolio Optimizer', systemHealth.portfolio_optimizer],
        ['Token Manager', systemHealth.token_manager],
        ['Event Recorder', systemHealth.event_recorder]
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-20 left-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {stateNotification && (
        <div className="fixed right-4 top-4 z-50 rounded-2xl bg-emerald-700/90 px-6 py-3 text-white shadow-lg backdrop-blur">
          {stateNotification}
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              Hedera sustainability app
            </div>
            <div className="mt-5">
              <div className="text-3xl font-semibold tracking-tight text-white">EcoSwarm Regen</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Verified milestone payouts for community climate projects.
              </p>
            </div>

            <nav className="mt-8 space-y-3">
              {PAGE_ITEMS.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? 'border-cyan-300/30 bg-cyan-500/10'
                        : 'border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{item.description}</div>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Shared sync state</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                Operator workspace, client portal, and audit trail all read from the same live proof rail and Hedera-backed state.
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-emerald-200">
                <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {isConnected ? 'Live sync connected' : 'Disconnected'}
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-emerald-400/15 bg-emerald-500/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">Hedera Network Impact</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {metrics?.accounts_created ?? 0}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">Accounts<br/>Created</div>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
                  <div className="text-2xl font-bold text-white">{eventStream.length}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">HCS<br/>Records</div>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {Object.values(tokens || {}).reduce((s: number, v: any) => s + (typeof v === 'number' ? v : 0), 0)}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">HTS Tokens<br/>Minted</div>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
                  <div className="text-2xl font-bold text-white">7</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">Hedera<br/>Services</div>
                </div>
              </div>
              <div className="mt-3 text-[10px] leading-4 text-slate-500">
                HCS · HTS · NFTs · Contracts · Accounts · Mirror · Scheduled
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Active shared case</div>
                <button
                  onClick={() => navigate('case')}
                  className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
                >
                  Open
                </button>
              </div>

              {selectedCase ? (
                <>
                  <div className="mt-4 text-lg font-semibold text-white">{selectedCase.project_name}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedCase.location_label}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
                      {selectedCase.deployment_profile?.release_readiness || 'hold'} readiness
                    </span>
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">
                      {selectedCase.households_supported ?? 0} households
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-4 text-sm leading-6 text-slate-400">
                  Shared case focus will appear here once the first payout case is created.
                </div>
              )}

              {syncedCases.length > 0 && (
                <div className="mt-5 space-y-2">
                  {syncedCases.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectCase(item.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedCaseId === item.id
                          ? 'border-cyan-300/35 bg-cyan-500/10'
                          : 'border-white/8 bg-slate-950/55 hover:border-white/15 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-sm font-semibold text-white">{item.project_name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {item.deployment_profile?.release_readiness || 'hold'} readiness
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <main className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[#09141a]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Current workspace</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{pageTitle?.label}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                    {pageTitle?.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${isConnected ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {isConnected ? 'Connected to live proof rail' : 'Dashboard disconnected'}
                    </div>
                    <div className="inline-flex items-center rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
                      Real-time operator and client sync
                    </div>
                  </div>

                  {selectedCase && (
                    <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 px-5 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Focused case</div>
                      <div className="mt-2 text-xl font-semibold text-white">{selectedCase.project_name}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">
                        {selectedCase.deployment_profile?.deployment_summary}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] border border-white/8 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Scenario feed</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <button
                      onClick={() => sendControl('start_simulation')}
                      disabled={isDemoActive || !isConnected}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isDemoActive || !isConnected
                          ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      }`}
                    >
                      Start Simulation
                    </button>
                    <button
                      onClick={() => sendControl('stop_simulation')}
                      disabled={!isDemoActive || !isConnected}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                        !isDemoActive || !isConnected
                          ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                          : 'bg-rose-500 text-white hover:bg-rose-400'
                      }`}
                    >
                      Stop Simulation
                    </button>
                  </div>

                  {isDemoActive && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      Demo Mode Active
                    </div>
                  )}

                  {systemHealth && (
                    <div className="mt-6">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">System Health</div>
                      <div className="mt-3 space-y-2">
                        {healthEntries.map(([label, status]) => (
                          <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3">
                            <span className="text-sm text-slate-200">{label}</span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                status === 'operational'
                                  ? 'bg-emerald-500/15 text-emerald-200'
                                  : status === 'stopped'
                                    ? 'bg-amber-500/15 text-amber-200'
                                    : 'bg-rose-500/15 text-rose-200'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {currentPage === 'overview' && (
              <PlatformOverviewPage
                metrics={metrics}
                tokens={tokens}
                portfolio={portfolio}
                events={mapEvents}
                syncedCases={syncedCases}
                selectedCase={selectedCase}
                selectedCaseId={selectedCaseId}
                hederaRecords={eventStream}
                onSelectCase={selectCase}
                onNavigate={navigate}
              />
            )}

            {currentPage === 'case' && (
              <SharedCaseRoomPage
                cases={syncedCases}
                selectedCase={selectedCase}
                hederaRecords={selectedCaseRecords}
                onSelectCase={selectCase}
                activeCaseAction={activeCaseAction}
                onRunCaseAction={runCaseAction}
              />
            )}

            {currentPage === 'operations' && (
              <OperationsWorkspacePage
                events={mapEvents}
                syncedCases={syncedCases}
                selectedCase={selectedCase}
                selectedCaseId={selectedCaseId}
                onSelectCase={selectCase}
                metrics={metrics}
                portfolio={portfolio}
                previousAllocations={previousAllocations}
                tokens={tokens}
                optimizerData={optimizerData}
              />
            )}

            {currentPage === 'agents' && (
              <AgentNetworkPage
                cases={syncedCases}
                selectedCase={selectedCase}
                selectedCaseId={selectedCaseId}
                hederaRecords={selectedCaseRecords}
                activeCaseAction={activeCaseAction}
                onSelectCase={selectCase}
                onRunCaseAction={runCaseAction}
              />
            )}

            {currentPage === 'client' && (
              <ClientPortalPage
                events={mapEvents}
                selectedCase={selectedCase}
                selectedCaseId={selectedCaseId}
                onSelectCase={selectCase}
                metrics={metrics}
                hederaRecords={eventStream}
                activeCaseAction={activeCaseAction}
                onRunCaseAction={runCaseAction}
              />
            )}

            {currentPage === 'blueprint' && (
              <DeploymentBlueprintPage
                cases={syncedCases}
                selectedCase={selectedCase}
                selectedCaseId={selectedCaseId}
                metrics={metrics}
                onSelectCase={selectCase}
              />
            )}

            {currentPage === 'audit' && (
              <AuditTrailPage
                events={mapEvents}
                syncedCases={syncedCases}
                selectedCase={selectedCase}
                selectedCaseId={selectedCaseId}
                selectedCaseRecords={selectedCaseRecords}
                onSelectCase={selectCase}
                metrics={metrics}
                tokens={tokens}
                hederaRecords={eventStream}
              />
            )}

            {currentPage === 'business' && (
              <LeanCanvasPage />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
