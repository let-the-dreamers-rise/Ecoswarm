import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import type { PortfolioResponse, MetricsResponse, TokenBalancesResponse } from '../types';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
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

  send(_data: string) {
    // Mock send
  }

  close() {
    if (this.onclose) this.onclose();
  }
}

describe('Dashboard Component', () => {
  let originalWebSocket: typeof WebSocket;
  let originalFetch: typeof fetch;

  const mockPortfolio: PortfolioResponse = {
    allocations: {
      Solar: 25,
      River_Cleanup: 25,
      Reforestation: 25,
      Carbon_Capture: 25
    },
    last_rebalanced: new Date().toISOString()
  };

  const mockMetrics: MetricsResponse = {
    total_co2_reduced_kg: 1500.5,
    total_energy_generated_kwh: 2000.75,
    total_projects_funded: 10,
    total_events_processed: 25
  };

  const mockTokens: TokenBalancesResponse = {
    SolarImpactToken: 100,
    CleanupImpactToken: 75,
    ReforestationToken: 50,
    CarbonCaptureToken: 25
  };

  beforeEach(() => {
    // Mock WebSocket
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = MockWebSocket as any;

    // Mock fetch
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn((input: string | URL | Request) => {
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
    globalThis.WebSocket = originalWebSocket;
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('renders with headline', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('EcoSwarm Regen: Verified Sustainability Treasury')).toBeInTheDocument();
  });

  it('renders layout structure with all sections', () => {
    render(<Dashboard />);
    
    // Check all main sections are present
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(screen.getByText('Proof-to-Payout Rail')).toBeInTheDocument();
    expect(screen.getByText('Live platform signals')).toBeInTheDocument();
    expect(screen.getByText('Milestone Release Queue')).toBeInTheDocument();
    expect(screen.getAllByText('Client Portal').length).toBeGreaterThan(0);
  });

  it('initializes WebSocket connection', async () => {
    render(<Dashboard wsUrl="ws://localhost:3000" />);
    
    await waitFor(() => {
      expect(screen.getByText('Connected to live proof rail')).toBeInTheDocument();
    });
  });

  it('displays mock portfolio data', async () => {
    // Clear localStorage to ensure fresh state
    localStorage.clear();
    
    render(<Dashboard />);
    
    await waitFor(() => {
      // Use getAllByText since 25.0% appears multiple times (pie chart + allocation display + AI decision display)
      const percentages = screen.getAllByText('25.0%');
      expect(percentages.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    
    // Check all categories are displayed (use getAllByText since they appear in multiple places)
    const solarElements = screen.getAllByText('Solar');
    expect(solarElements.length).toBeGreaterThan(0);
    
    const riverCleanupElements = screen.getAllByText('River Cleanup');
    expect(riverCleanupElements.length).toBeGreaterThan(0);
    
    const reforestationElements = screen.getAllByText('Reforestation');
    expect(reforestationElements.length).toBeGreaterThan(0);
    
    const carbonCaptureElements = screen.getAllByText('Carbon Capture');
    expect(carbonCaptureElements.length).toBeGreaterThan(0);
  });

  it('displays mock metrics data', async () => {
    // Clear localStorage to ensure fresh state
    localStorage.clear();
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('1500.50 kg')).toBeInTheDocument();
      expect(screen.getByText('2000.75 kWh')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Use getAllByText for numbers that appear multiple times
    const tens = screen.getAllByText('10');
    expect(tens.length).toBeGreaterThan(0);
    
    const twentyFives = screen.getAllByText('25');
    expect(twentyFives.length).toBeGreaterThan(0);
  });

  it('displays mock token balances', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    });
  });

  it('shows loading state before data is fetched', () => {
    // Clear localStorage to prevent loading persisted state
    localStorage.clear();
    
    // Mock fetch to delay
    globalThis.fetch = vi.fn(() => new Promise(() => {}));
    
    render(<Dashboard />);
    
    // The component loads persisted state first, so if localStorage is empty
    // and fetch is delayed, it should show loading state
    expect(screen.getByText('Loading portfolio...')).toBeInTheDocument();
  });

  it('displays empty event stream initially', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('No events recorded yet')).toBeInTheDocument();
  });

  it('handles WebSocket disconnection', async () => {
    const { rerender } = render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Connected to live proof rail')).toBeInTheDocument();
    });
    
    // Simulate disconnection
    const ws = (globalThis.WebSocket as any).mock?.results?.[0]?.value;
    if (ws && ws.onclose) {
      ws.onclose();
    }
    
    rerender(<Dashboard />);
  });

  it('fetches initial data from backend API', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3000/portfolio');
      expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3000/metrics');
      expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3000/tokens');
    });
  });

  it('uses dark theme styling', () => {
    const { container } = render(<Dashboard />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('bg-gray-900');
    expect(mainDiv.className).toContain('text-white');
  });
});
