import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import type { SystemHealthUpdate, DemoControlMessage } from '../types';

describe('Demo Mode Controls and System Health Display', () => {
  let mockWebSocket: any;
  let sentMessages: string[] = [];

  beforeEach(() => {
    sentMessages = [];
    
    // Mock WebSocket
    mockWebSocket = {
      readyState: WebSocket.OPEN,
      send: vi.fn((message: string) => {
        sentMessages.push(message);
      }),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    globalThis.WebSocket = vi.fn(() => mockWebSocket) as any;

    // Mock fetch for initial data
    globalThis.fetch = vi.fn((url: string) => {
      if (url.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            allocations: { Solar: 25, River_Cleanup: 25, Reforestation: 25, Carbon_Capture: 25 },
            last_rebalanced: new Date().toISOString()
          })
        });
      }
      if (url.includes('/metrics')) {
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
      if (url.includes('/tokens')) {
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
      return Promise.resolve({ ok: false });
    }) as any;
  });

  describe('Demo Mode Controls - Requirements 7.1, 7.4, 7.5', () => {
    it('should render Start Simulation and Stop Simulation buttons', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      await waitFor(() => {
        expect(screen.getByText('Start Simulation')).toBeDefined();
        expect(screen.getByText('Stop Simulation')).toBeDefined();
      });
    });

    it('should send start_simulation message when Start button clicked', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      // Trigger WebSocket open
      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      const startButton = screen.getByText('Start Simulation');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(sentMessages.length).toBeGreaterThan(0);
        const message: DemoControlMessage = JSON.parse(sentMessages[sentMessages.length - 1]);
        expect(message.action).toBe('start_simulation');
      });
    });

    it('should send stop_simulation message when Stop button clicked', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      // Trigger WebSocket open
      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      // First start the simulation
      const startButton = screen.getByText('Start Simulation');
      fireEvent.click(startButton);

      // Then stop it
      const stopButton = screen.getByText('Stop Simulation');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(sentMessages.length).toBeGreaterThanOrEqual(2);
        const lastMessage: DemoControlMessage = JSON.parse(sentMessages[sentMessages.length - 1]);
        expect(lastMessage.action).toBe('stop_simulation');
      });
    });

    it('should display Demo Mode Active indicator when simulation is running', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      // Trigger WebSocket open
      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      // Initially, indicator should not be visible
      expect(screen.queryByText('Demo Mode Active')).toBeNull();

      // Click Start Simulation
      const startButton = screen.getByText('Start Simulation');
      fireEvent.click(startButton);

      // Indicator should now be visible
      await waitFor(() => {
        expect(screen.getByText('Demo Mode Active')).toBeDefined();
      });
    });

    it('should hide Demo Mode Active indicator when simulation is stopped', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      // Trigger WebSocket open
      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      // Start simulation
      const startButton = screen.getByText('Start Simulation');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Demo Mode Active')).toBeDefined();
      });

      // Stop simulation
      const stopButton = screen.getByText('Stop Simulation');
      fireEvent.click(stopButton);

      // Indicator should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Demo Mode Active')).toBeNull();
      });
    });

    it('should disable Start button when demo is active', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      const startButton = screen.getByText('Start Simulation') as HTMLButtonElement;
      expect(startButton.disabled).toBe(false);

      fireEvent.click(startButton);

      await waitFor(() => {
        expect(startButton.disabled).toBe(true);
      });
    });

    it('should disable Stop button when demo is not active', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      const stopButton = screen.getByText('Stop Simulation') as HTMLButtonElement;
      expect(stopButton.disabled).toBe(true);
    });
  });

  describe('System Health Display - Requirement 8.4', () => {
    it('should display system health status when SystemHealthUpdate received', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      // Trigger WebSocket open
      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      // Send health update
      const healthUpdate: SystemHealthUpdate = {
        type: 'health_status',
        components: {
          simulation_engine: 'operational',
          impact_calculator: 'operational',
          portfolio_optimizer: 'operational',
          token_manager: 'operational',
          event_recorder: 'operational'
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(healthUpdate)
        } as MessageEvent);
      }

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeDefined();
        expect(screen.getByText('Simulation Engine')).toBeDefined();
        expect(screen.getByText('Impact Calculator')).toBeDefined();
        expect(screen.getByText('Portfolio Optimizer')).toBeDefined();
        expect(screen.getByText('Token Manager')).toBeDefined();
        expect(screen.getByText('Event Recorder')).toBeDefined();
      });
    });

    it('should display operational status as green', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      const healthUpdate: SystemHealthUpdate = {
        type: 'health_status',
        components: {
          simulation_engine: 'operational',
          impact_calculator: 'operational',
          portfolio_optimizer: 'operational',
          token_manager: 'operational',
          event_recorder: 'operational'
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(healthUpdate)
        } as MessageEvent);
      }

      await waitFor(() => {
        const operationalElements = screen.getAllByText('operational');
        expect(operationalElements.length).toBe(5);
        
        // Check that operational status has green styling
        operationalElements.forEach(element => {
          expect(element.className).toContain('bg-emerald-500/15');
          expect(element.className).toContain('text-emerald-200');
        });
      });
    });

    it('should display stopped status as yellow', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      const healthUpdate: SystemHealthUpdate = {
        type: 'health_status',
        components: {
          simulation_engine: 'stopped',
          impact_calculator: 'operational',
          portfolio_optimizer: 'operational',
          token_manager: 'operational',
          event_recorder: 'operational'
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(healthUpdate)
        } as MessageEvent);
      }

      await waitFor(() => {
        const stoppedElement = screen.getByText('stopped');
        expect(stoppedElement.className).toContain('bg-amber-500/15');
        expect(stoppedElement.className).toContain('text-amber-200');
      });
    });

    it('should display error status as red', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      const healthUpdate: SystemHealthUpdate = {
        type: 'health_status',
        components: {
          simulation_engine: 'operational',
          impact_calculator: 'error',
          portfolio_optimizer: 'operational',
          token_manager: 'operational',
          event_recorder: 'operational'
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(healthUpdate)
        } as MessageEvent);
      }

      await waitFor(() => {
        const errorElement = screen.getByText('error');
        expect(errorElement.className).toContain('bg-rose-500/15');
        expect(errorElement.className).toContain('text-rose-200');
      });
    });

    it('should update health status when new SystemHealthUpdate received', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      // First health update - all operational
      const healthUpdate1: SystemHealthUpdate = {
        type: 'health_status',
        components: {
          simulation_engine: 'operational',
          impact_calculator: 'operational',
          portfolio_optimizer: 'operational',
          token_manager: 'operational',
          event_recorder: 'operational'
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(healthUpdate1)
        } as MessageEvent);
      }

      await waitFor(() => {
        const operationalElements = screen.getAllByText('operational');
        expect(operationalElements.length).toBe(5);
      });

      // Second health update - one component in error
      const healthUpdate2: SystemHealthUpdate = {
        type: 'health_status',
        components: {
          simulation_engine: 'operational',
          impact_calculator: 'operational',
          portfolio_optimizer: 'error',
          token_manager: 'operational',
          event_recorder: 'operational'
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(healthUpdate2)
        } as MessageEvent);
      }

      await waitFor(() => {
        expect(screen.getByText('error')).toBeDefined();
        const operationalElements = screen.getAllByText('operational');
        expect(operationalElements.length).toBe(4);
      });
    });

    it('should display all five component statuses', async () => {
      render(<Dashboard wsUrl="ws://localhost:3000" />);

      await waitFor(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      const healthUpdate: SystemHealthUpdate = {
        type: 'health_status',
        components: {
          simulation_engine: 'operational',
          impact_calculator: 'operational',
          portfolio_optimizer: 'operational',
          token_manager: 'operational',
          event_recorder: 'operational'
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(healthUpdate)
        } as MessageEvent);
      }

      await waitFor(() => {
        // Verify all 5 components are displayed
        expect(screen.getByText('Simulation Engine')).toBeDefined();
        expect(screen.getByText('Impact Calculator')).toBeDefined();
        expect(screen.getByText('Portfolio Optimizer')).toBeDefined();
        expect(screen.getByText('Token Manager')).toBeDefined();
        expect(screen.getByText('Event Recorder')).toBeDefined();
      });
    });
  });
});
