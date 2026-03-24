import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CaseActionType,
  DashboardUpdate,
  DemoControlMessage,
  HederaEventRecord,
  MetricsResponse,
  OptimizeResponse,
  PortfolioResponse,
  SubmitCaseActionResponse,
  SystemHealthUpdate,
  TokenBalancesResponse
} from '../types';
import type { EventMapData } from '../components/EventMap';
import { getApiBaseUrl } from '../lib/runtimeConfig';

interface PersistedDashboardState {
  portfolio: PortfolioResponse | null;
  metrics: MetricsResponse | null;
  token_balances: TokenBalancesResponse | null;
  event_stream: HederaEventRecord[];
  map_events?: EventMapData[];
  selected_case_id?: string | null;
}

interface TopicMessageResponse {
  messages?: Array<{
    consensus_timestamp: string;
    message: string;
  }>;
}

const STORAGE_KEY = 'ecoswarm_state';
const API_BASE_URL = getApiBaseUrl();
const TOPIC_REFRESH_INTERVAL_MS = 30_000;
const readinessRank = {
  hold: 0,
  review: 1,
  release: 2
} as const;

const sortCases = (left: EventMapData, right: EventMapData) => {
  const leftReadiness = readinessRank[left.deployment_profile?.release_readiness ?? 'hold'];
  const rightReadiness = readinessRank[right.deployment_profile?.release_readiness ?? 'hold'];

  if (leftReadiness !== rightReadiness) {
    return rightReadiness - leftReadiness;
  }

  return (right.priority_score ?? right.impact_score) - (left.priority_score ?? left.impact_score);
};

const normalizeEventPayload = (payload: any): EventMapData | null => {
  const id = payload?.id ?? payload?.event_id;
  const location = payload?.location_coordinates ?? payload?.location;

  if (!id || !location || !payload?.event_type) {
    return null;
  }

  return {
    id,
    event_type: payload.event_type,
    location_coordinates: location,
    impact_score: payload.impact_score ?? 0,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    project_name: payload.project_name,
    community_name: payload.community_name,
    region: payload.region,
    country: payload.country,
    households_supported: payload.households_supported,
    funding_gap_usd: payload.funding_gap_usd,
    cost_per_impact_unit_usd: payload.cost_per_impact_unit_usd,
    verification_confidence: payload.verification_confidence,
    urgency_level: payload.urgency_level,
    verification_source: payload.verification_source,
    proof_hash: payload.proof_hash,
    sdg_tags: payload.sdg_tags,
    priority_score: payload.priority_score,
    location_label: payload.location_label,
    sponsor_name: payload.sponsor_name,
    verifier_name: payload.verifier_name,
    local_operator_name: payload.local_operator_name,
    buyer_signal: payload.buyer_signal,
    beneficiary_metric: payload.beneficiary_metric,
    deployment_profile: payload.deployment_profile
  };
};

const upsertMapEvent = (events: EventMapData[], nextEvent: EventMapData): EventMapData[] => {
  const existingIndex = events.findIndex((event) => event.id === nextEvent.id);

  if (existingIndex === -1) {
    return [...events.slice(-35), nextEvent];
  }

  const updated = [...events];
  updated[existingIndex] = {
    ...updated[existingIndex],
    ...nextEvent
  };

  return updated;
};

const extractTokenBalances = (payload: any): TokenBalancesResponse | null => {
  if (!payload) {
    return null;
  }

  if ('SolarImpactToken' in payload) {
    return {
      SolarImpactToken: payload.SolarImpactToken,
      CleanupImpactToken: payload.CleanupImpactToken,
      ReforestationToken: payload.ReforestationToken,
      CarbonCaptureToken: payload.CarbonCaptureToken
    };
  }

  if (payload.balances && 'SolarImpactToken' in payload.balances) {
    return payload.balances as TokenBalancesResponse;
  }

  return null;
};

const normalizeRecord = (payload: any): HederaEventRecord | null => {
  if (!payload) {
    return null;
  }

  if (payload.event_type && payload.timestamp) {
    return payload as HederaEventRecord;
  }

  if (payload.transaction_id) {
    return {
      event_type: 'impact_verified',
      timestamp: new Date().toISOString(),
      payload,
      transaction_id: payload.transaction_id
    };
  }

  return null;
};

const normalizeTopicMessageRecord = (topicMessage: { consensus_timestamp: string; message: string }): HederaEventRecord | null => {
  try {
    const parsed = JSON.parse(topicMessage.message);

    if (!parsed?.event_type) {
      return null;
    }

    return {
      event_type: parsed.event_type,
      timestamp: parsed.timestamp ?? new Date(Number(topicMessage.consensus_timestamp.split('.')[0]) * 1000).toISOString(),
      payload: parsed.payload ?? parsed,
      transaction_id: parsed.transaction_id ?? parsed.payload?.transaction_id,
      project_name: parsed.project_name ?? parsed.payload?.project_name,
      stage_label: parsed.stage_label,
      summary: parsed.summary
    };
  } catch {
    return null;
  }
};

const getRecordIdentity = (record: HederaEventRecord): string => {
  const transactionId = record.transaction_id ?? record.payload?.transaction_id;
  const eventId = record.payload?.event_id;
  const projectName = record.project_name ?? record.payload?.project_name ?? '';

  return [
    transactionId ?? '',
    eventId ?? '',
    record.event_type,
    projectName,
    record.timestamp
  ].join('::');
};

const mergeRecords = (
  existing: HederaEventRecord[],
  incoming: HederaEventRecord[]
): HederaEventRecord[] => {
  const recordMap = new Map<string, HederaEventRecord>();

  [...incoming, ...existing].forEach((record) => {
    recordMap.set(getRecordIdentity(record), record);
  });

  return [...recordMap.values()]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 20);
};

const fetchLiveJson = async (path: string) =>
  fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

export function useTreasuryLiveData(wsUrl: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [previousAllocations, setPreviousAllocations] = useState<Record<string, number> | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [tokens, setTokens] = useState<TokenBalancesResponse | null>(null);
  const [eventStream, setEventStream] = useState<HederaEventRecord[]>([]);
  const [mapEvents, setMapEvents] = useState<EventMapData[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealthUpdate['components'] | null>(null);
  const [stateNotification, setStateNotification] = useState<string | null>(null);
  const [optimizerData, setOptimizerData] = useState<OptimizeResponse | null>(null);
  const [activeCaseAction, setActiveCaseAction] = useState<Exclude<CaseActionType, 'proof_packet_locked'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const notificationTimeoutRef = useRef<number | null>(null);
  const syncedCases = useMemo(() => {
    return [...mapEvents].filter((event) => event.deployment_profile).sort(sortCases);
  }, [mapEvents]);

  const selectedCase = useMemo(() => {
    if (syncedCases.length === 0) {
      return null;
    }

    return syncedCases.find((event) => event.id === selectedCaseId) ?? syncedCases[0];
  }, [selectedCaseId, syncedCases]);

  const selectedCaseRecords = useMemo(() => {
    if (!selectedCase) {
      return eventStream;
    }

    return eventStream.filter((record) => {
      const recordProject = record.project_name || record.payload?.project_name;
      const recordEventId = record.payload?.event_id;

      return (
        recordProject === selectedCase.project_name ||
        recordEventId === selectedCase.id
      );
    });
  }, [eventStream, selectedCase]);

  useEffect(() => {
    loadPersistedState();

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: DashboardUpdate | SystemHealthUpdate = JSON.parse(event.data);
        if (data.type === 'health_status') {
          setSystemHealth((data as SystemHealthUpdate).components);
        } else {
          handleDashboardUpdate(data as DashboardUpdate);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    fetchInitialData();
    const refreshTimer = window.setInterval(fetchInitialData, TOPIC_REFRESH_INTERVAL_MS);

    return () => {
      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
      window.clearInterval(refreshTimer);
      ws.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    if (portfolio || metrics || tokens || eventStream.length > 0 || mapEvents.length > 0 || selectedCaseId) {
      persistState();
    }
  }, [eventStream, mapEvents, metrics, portfolio, selectedCaseId, tokens]);

  useEffect(() => {
    if (syncedCases.length === 0) {
      return;
    }

    if (!selectedCaseId || !syncedCases.some((event) => event.id === selectedCaseId)) {
      setSelectedCaseId(syncedCases[0].id);
    }
  }, [selectedCaseId, syncedCases]);

  const fetchInitialData = async () => {
    try {
      const [portfolioRes, metricsRes, tokensRes, topicMessagesRes] = await Promise.all([
        fetchLiveJson('/portfolio'),
        fetchLiveJson('/metrics'),
        fetchLiveJson('/tokens'),
        fetchLiveJson('/hedera/topic-messages')
      ]);

      if (portfolioRes.ok) {
        setPortfolio(await portfolioRes.json());
      }
      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
      if (tokensRes.ok) {
        setTokens(await tokensRes.json());
      }
      if (topicMessagesRes.ok) {
        const topicMessagesPayload = await topicMessagesRes.json() as TopicMessageResponse;
        const hydratedRecords = (topicMessagesPayload.messages ?? [])
          .map(normalizeTopicMessageRecord)
          .filter((record): record is HederaEventRecord => record !== null)
          .slice(0, 20);

        if (hydratedRecords.length > 0) {
          setEventStream((previous) => mergeRecords(previous, hydratedRecords));
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const loadPersistedState = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: PersistedDashboardState = JSON.parse(stored);
        setPortfolio(state.portfolio);
        setMetrics(state.metrics);
        setTokens(state.token_balances);
        setEventStream(state.event_stream);
        setMapEvents(state.map_events ?? []);
        setSelectedCaseId(state.selected_case_id ?? null);
        showNotification('State restored from previous session');
      } else {
        showNotification('Starting fresh session');
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      showNotification('Starting fresh session');
    }
  };

  const persistState = () => {
    try {
      const state: PersistedDashboardState = {
        portfolio,
        metrics,
        token_balances: tokens,
        event_stream: eventStream,
        map_events: mapEvents,
        selected_case_id: selectedCaseId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  };

  const showNotification = (message: string) => {
    setStateNotification(message);
    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = window.setTimeout(() => setStateNotification(null), 3000);
  };

  const handleDashboardUpdate = (update: DashboardUpdate) => {
    switch (update.type) {
      case 'event_detected': {
        const eventData = normalizeEventPayload(update.payload);
        if (eventData) {
          setMapEvents((prev) => upsertMapEvent(prev, eventData));
        }
        if (update.payload?.metrics) {
          setMetrics(update.payload.metrics);
        }
        break;
      }
      case 'case_updated': {
        const eventData = normalizeEventPayload(update.payload);
        if (eventData) {
          setMapEvents((prev) => upsertMapEvent(prev, eventData));
        }
        if (update.payload?.metrics) {
          setMetrics(update.payload.metrics);
        }
        break;
      }
      case 'portfolio_rebalanced': {
        const nextAllocation = update.payload?.new_allocation ?? update.payload?.previous_allocation;
        const rebalancingNeeded = update.payload?.rebalancing_needed ?? true;

        if (rebalancingNeeded && portfolio) {
          setPreviousAllocations(portfolio.allocations);
        }

        if (nextAllocation) {
          setPortfolio({
            allocations: nextAllocation,
            last_rebalanced: new Date().toISOString()
          });
        }

        setOptimizerData({
          recommended_allocation: update.payload?.new_allocation || nextAllocation || {},
          decision_logic: update.payload?.decision_logic || '',
          impact_per_dollar_ratios: update.payload?.impact_ratios || {},
          rebalancing_needed: rebalancingNeeded
        });
        break;
      }
      case 'tokens_minted': {
        const tokenSnapshot = extractTokenBalances(update.payload);
        if (tokenSnapshot) {
          setTokens(tokenSnapshot);
        }
        break;
      }
      case 'hedera_recorded': {
        const record = normalizeRecord(update.payload);
        if (record) {
          setEventStream((prev) => [record, ...prev].slice(0, 20));
        }
        break;
      }
      default:
        break;
    }
  };

  const sendDemoControl = (action: DemoControlMessage['action']) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: DemoControlMessage = { action };
      wsRef.current.send(JSON.stringify(message));
      setIsDemoActive(action === 'start_simulation');
      if (action === 'stop_simulation') {
        setIsDemoActive(false);
      }
    }
  };

  const runCaseAction = async (eventId: string, actionType: Exclude<CaseActionType, 'proof_packet_locked'>) => {
    try {
      setActiveCaseAction(actionType);
      const response = await fetch(`${API_BASE_URL}/cases/${eventId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action_type: actionType
        })
      });

      const payload = await response.json() as SubmitCaseActionResponse | { error?: string };

      if (!response.ok) {
        throw new Error(
          'error' in payload && payload.error
            ? payload.error
            : `Case action failed with status ${response.status}`
        );
      }

      const result = payload as SubmitCaseActionResponse;
      if (result.failure_reason) {
        showNotification(result.failure_reason);
      } else {
        showNotification(
          actionType === 'verifier_review_requested'
            ? 'Verifier review requested'
            : actionType === 'sponsor_release_authorized'
              ? 'Sponsor release authorized'
              : 'Tranche released'
        );
      }
    } catch (error) {
      console.error('Failed to run case action:', error);
      showNotification(error instanceof Error ? error.message : 'Case action failed');
    } finally {
      setActiveCaseAction(null);
    }
  };

  return {
    isConnected,
    portfolio,
    previousAllocations,
    metrics,
    tokens,
    eventStream,
    mapEvents,
    syncedCases,
    selectedCase,
    selectedCaseId: selectedCase?.id ?? selectedCaseId,
    selectedCaseRecords,
    setSelectedCaseId,
    isDemoActive,
    systemHealth,
    stateNotification,
    optimizerData,
    activeCaseAction,
    sendDemoControl,
    runCaseAction,
    dismissNotification: () => setStateNotification(null)
  };
}
