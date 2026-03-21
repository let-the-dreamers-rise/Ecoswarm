import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import type { PortfolioResponse, MetricsResponse, TokenBalancesResponse } from '../types';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send(_data: string) {}
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
}

describe('Frontend State Persistence', () => {
  const STORAGE_KEY = 'ecoswarm_state';
  let originalWebSocket: typeof WebSocket;
  let originalFetch: typeof fetch;

  const mockPortfolio: PortfolioResponse = {
    allocations: {
      Solar: 25,
      River_Cleanup: 25,
      Reforestation: 25,
      Carbon_Capture: 25
    },
    last_rebalanced: '2024-01-01T00:00:00Z'
  };

  const mockMetrics: MetricsResponse = {
    total_co2_reduced_kg: 0,
    total_energy_generated_kwh: 0,
    total_projects_funded: 0,
    total_events_processed: 0
  };

  const mockTokens: TokenBalancesResponse = {
    SolarImpactToken: 0,
    CleanupImpactToken: 0,
    ReforestationToken: 0,
    CarbonCaptureToken: 0
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();

    // Mock WebSocket
    originalWebSocket = global.WebSocket;
    global.WebSocket = MockWebSocket as any;

    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = vi.fn((input: string | URL | Request) => {
      const url = input.toString();
      if (url.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPortfolio)
        } as Response);
      }
      if (url.includes('/metrics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetrics)
        } as Response);
      }
      if (url.includes('/tokens')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTokens)
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as any;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it('should save state to localStorage when state changes', async () => {
    render(<Dashboard wsUrl="ws://localhost:3000" />);

    // Wait for component to mount and fetch initial data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Wait for state to be persisted
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
    }, { timeout: 3000 });

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    
    const state = JSON.parse(stored!);
    expect(state).toHaveProperty('portfolio');
    expect(state).toHaveProperty('metrics');
    expect(state).toHaveProperty('token_balances');
    expect(state).toHaveProperty('event_stream');
  });

  it('should load persisted state on mount', async () => {
    // Pre-populate localStorage with state
    const mockState = {
      portfolio: {
        allocations: { Solar: 40, River_Cleanup: 30, Reforestation: 20, Carbon_Capture: 10 },
        last_rebalanced: '2024-01-15T12:00:00Z'
      },
      metrics: {
        total_co2_reduced_kg: 1000,
        total_energy_generated_kwh: 500,
        total_projects_funded: 10,
        total_events_processed: 25
      },
      token_balances: {
        SolarImpactToken: 100,
        CleanupImpactToken: 50,
        ReforestationToken: 75,
        CarbonCaptureToken: 25
      },
      event_stream: [
        {
          event_type: 'impact_event_detected',
          timestamp: '2024-01-15T12:00:00Z',
          payload: { test: 'data' }
        }
      ]
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));

    // Mock fetch to return the persisted state values to avoid overwriting
    global.fetch = vi.fn((input: string | URL | Request) => {
      const url = input.toString();
      if (url.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockState.portfolio)
        } as Response);
      }
      if (url.includes('/metrics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockState.metrics)
        } as Response);
      }
      if (url.includes('/tokens')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockState.token_balances)
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as any;

    render(<Dashboard wsUrl="ws://localhost:3000" />);

    // Wait for notification to appear
    await waitFor(() => {
      expect(screen.getByText('State restored from previous session')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the state was loaded (check for portfolio percentages)
    // The Solar allocation should be 40%
    await waitFor(() => {
      const solarPercentages = screen.getAllByText(/40\.0%/);
      expect(solarPercentages.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should handle corrupted state and initialize with defaults', async () => {
    // Set corrupted JSON in localStorage
    localStorage.setItem(STORAGE_KEY, 'invalid-json{corrupted}');

    render(<Dashboard wsUrl="ws://localhost:3000" />);

    // Should show "Starting fresh session" notification
    await waitFor(() => {
      expect(screen.getByText('Starting fresh session')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not crash and should continue to work
    await waitFor(() => {
      expect(screen.getByText('EcoSwarm Regen: Verified Sustainability Treasury')).toBeInTheDocument();
    });
  });

  it('should show notification when starting fresh session', async () => {
    // No state in localStorage
    render(<Dashboard wsUrl="ws://localhost:3000" />);

    // Should show "Starting fresh session" notification
    await waitFor(() => {
      expect(screen.getByText('Starting fresh session')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
