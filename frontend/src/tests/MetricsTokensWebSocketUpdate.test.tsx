import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import type { DashboardUpdate } from '../types';

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readyState: number = WebSocket.CONNECTING;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(_data: string) {
    // Mock send
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

describe('Metrics and Token Balances WebSocket Updates', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    // Mock fetch for initial data
    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlString = url.toString();
      if (urlString.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            allocations: {
              Solar: 25,
              River_Cleanup: 25,
              Reforestation: 25,
              Carbon_Capture: 25
            },
            last_rebalanced: new Date().toISOString()
          })
        });
      }
      if (urlString.includes('/metrics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            total_co2_reduced_kg: 0,
            total_energy_generated_kwh: 0,
            total_projects_funded: 0,
            total_events_processed: 0
          })
        });
      }
      if (urlString.includes('/tokens')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            SolarImpactToken: 0,
            CleanupImpactToken: 0,
            ReforestationToken: 0,
            CarbonCaptureToken: 0
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as any;

    // Mock WebSocket
    global.WebSocket = vi.fn((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs as any;
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates metrics display quickly when new data is received via WebSocket', async () => {
    render(<Dashboard wsUrl="ws://localhost:3000" />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('EcoSwarm Regen: Verified Sustainability Treasury')).toBeInTheDocument();
    });

    const startTime = Date.now();

    // Simulate WebSocket message with updated metrics
    const metricsUpdate: DashboardUpdate = {
      type: 'event_detected',
      payload: {
        id: 'test-event-1',
        event_type: 'Solar',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: new Date().toISOString(),
        impact_score: 65,
        metrics: {
          total_co2_reduced_kg: 150.5,
          total_energy_generated_kwh: 250.75,
          total_projects_funded: 5,
          total_events_processed: 10
        }
      },
      timestamp: new Date().toISOString()
    };

    await act(async () => {
      mockWs.simulateMessage(metricsUpdate);
    });

    // Wait for metrics to update
    await waitFor(() => {
      expect(screen.getByText('150.50 kg')).toBeInTheDocument();
    }, { timeout: 1000 });

    const endTime = Date.now();
    const updateTime = endTime - startTime;

    // Richer UI rendering can add some latency in test environments.
    expect(updateTime).toBeLessThan(1500);
    expect(screen.getByText('250.75 kWh')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('updates token balances quickly when tokens are minted', async () => {
    render(<Dashboard wsUrl="ws://localhost:3000" />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('EcoSwarm Regen: Verified Sustainability Treasury')).toBeInTheDocument();
    });

    const startTime = Date.now();

    // Simulate WebSocket message with token minting
    const tokenUpdate: DashboardUpdate = {
      type: 'tokens_minted',
      payload: {
        SolarImpactToken: 100,
        CleanupImpactToken: 200,
        ReforestationToken: 300,
        CarbonCaptureToken: 400
      },
      timestamp: new Date().toISOString()
    };

    await act(async () => {
      mockWs.simulateMessage(tokenUpdate);
    });

    // Wait for tokens to update
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    }, { timeout: 1000 });

    const endTime = Date.now();
    const updateTime = endTime - startTime;

    expect(updateTime).toBeLessThan(1500);
    
    // Verify all token balances are displayed
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
  });

  it('handles multiple rapid WebSocket updates correctly', async () => {
    render(<Dashboard wsUrl="ws://localhost:3000" />);

    await waitFor(() => {
      expect(screen.getByText('EcoSwarm Regen: Verified Sustainability Treasury')).toBeInTheDocument();
    });

    // Send multiple updates rapidly
    for (let i = 1; i <= 5; i++) {
      const update: DashboardUpdate = {
        type: 'event_detected',
        payload: {
          id: `test-event-${i}`,
          event_type: 'Solar',
          location_coordinates: { latitude: 40 + i, longitude: -74 + i },
          energy_kwh: 100 * i,
          co2_reduction_kg: 50 * i,
          ecosystem_restoration_units: 25 * i,
          timestamp: new Date().toISOString(),
          impact_score: 65 * i,
          metrics: {
            total_co2_reduced_kg: 50 * i,
            total_energy_generated_kwh: 100 * i,
            total_projects_funded: i,
            total_events_processed: i
          }
        },
        timestamp: new Date().toISOString()
      };

      await act(async () => {
        mockWs.simulateMessage(update);
      });
    }

    // Wait for final update to be reflected
    await waitFor(() => {
      expect(screen.getByText('250.00 kg')).toBeInTheDocument();
      expect(screen.getByText('500.00 kWh')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays correct units for metrics (kg, kWh, count)', async () => {
    render(<Dashboard wsUrl="ws://localhost:3000" />);

    await waitFor(() => {
      expect(screen.getByText('EcoSwarm Regen: Verified Sustainability Treasury')).toBeInTheDocument();
    });

    const metricsUpdate: DashboardUpdate = {
      type: 'event_detected',
      payload: {
        id: 'test-event-1',
        event_type: 'Solar',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: new Date().toISOString(),
        impact_score: 65,
        metrics: {
          total_co2_reduced_kg: 1234.56,
          total_energy_generated_kwh: 5678.90,
          total_projects_funded: 42,
          total_events_processed: 100
        }
      },
      timestamp: new Date().toISOString()
    };

    await act(async () => {
      mockWs.simulateMessage(metricsUpdate);
    });

    await waitFor(() => {
      // Verify units are displayed correctly
      expect(screen.getByText('1234.56 kg')).toBeInTheDocument(); // kg for CO2
      expect(screen.getByText('5678.90 kWh')).toBeInTheDocument(); // kWh for energy
      expect(screen.getByText('42')).toBeInTheDocument(); // count for projects
      expect(screen.getByText('100')).toBeInTheDocument(); // count for events
    });
  });
});
