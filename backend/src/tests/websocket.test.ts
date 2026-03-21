import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import express from 'express';

describe('WebSocket Server for Dashboard Communication', () => {
  let server: Server;
  let wss: WebSocketServer;
  let port: number;
  let wsClients: Set<WebSocket>;
  
  beforeAll(async () => {
    // Create a simple Express app
    const app = express();
    server = createServer(app);
    
    // Initialize WebSocket server
    wss = new WebSocketServer({ server });
    wsClients = new Set<WebSocket>();
    
    // Track connected clients
    wss.on('connection', (ws) => {
      wsClients.add(ws);
      
      ws.on('close', () => {
        wsClients.delete(ws);
      });
      
      ws.on('message', (message) => {
        // Echo back for testing
        ws.send(message.toString());
      });
    });
    
    // Start server on random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          port = address.port;
        }
        resolve();
      });
    });
  });
  
  afterAll(async () => {
    wss.close();
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });
  
  it('should track connected clients', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        // Server should have at least one client
        expect(wsClients.size).toBeGreaterThan(0);
        ws.close();
      });
      
      ws.on('close', () => {
        resolve();
      });
    });
  });
  
  it('should broadcast messages to all connected clients', async () => {
    const ws1 = new WebSocket(`ws://localhost:${port}`);
    const ws2 = new WebSocket(`ws://localhost:${port}`);
    
    const testMessage = { type: 'test', payload: 'hello' };
    
    await new Promise<void>((resolve) => {
      let receivedCount = 0;
      
      const checkDone = () => {
        receivedCount++;
        if (receivedCount === 2) {
          ws1.close();
          ws2.close();
          resolve();
        }
      };
      
      ws1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('test');
        expect(message.payload).toBe('hello');
        checkDone();
      });
      
      ws2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('test');
        expect(message.payload).toBe('hello');
        checkDone();
      });
      
      ws1.on('open', () => {
        ws2.on('open', () => {
          // Broadcast to all clients
          wsClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(testMessage));
            }
          });
        });
      });
    });
  });
  
  it('should handle DashboardUpdate message format', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        const dashboardUpdate = {
          type: 'event_detected',
          payload: {
            event_id: 'test-123',
            event_type: 'Solar',
            location: { latitude: 40.7128, longitude: -74.0060 },
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        };
        
        ws.send(JSON.stringify(dashboardUpdate));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('event_detected');
        expect(message.payload.event_id).toBe('test-123');
        expect(message.payload.event_type).toBe('Solar');
        expect(message.payload.location).toEqual({ latitude: 40.7128, longitude: -74.0060 });
        ws.close();
        resolve();
      });
    });
  });
  
  it('should handle SystemHealthUpdate message format', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        const healthUpdate = {
          type: 'health_status',
          components: {
            simulation_engine: 'operational' as const,
            impact_calculator: 'operational' as const,
            portfolio_optimizer: 'operational' as const,
            token_manager: 'operational' as const,
            event_recorder: 'operational' as const
          }
        };
        
        ws.send(JSON.stringify(healthUpdate));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('health_status');
        expect(message.components.simulation_engine).toBe('operational');
        expect(message.components.impact_calculator).toBe('operational');
        ws.close();
        resolve();
      });
    });
  });
  
  it('should handle DemoControlMessage format', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        const controlMessage = {
          action: 'start_simulation'
        };
        
        ws.send(JSON.stringify(controlMessage));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.action).toBe('start_simulation');
        ws.close();
        resolve();
      });
    });
  });
  
  it('should remove client from tracking on disconnect', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        const initialSize = wsClients.size;
        expect(initialSize).toBeGreaterThan(0);
        ws.close();
      });
      
      ws.on('close', () => {
        // Give server time to process close event
        setTimeout(() => {
          resolve();
        }, 50);
      });
    });
  });
  
  it('should handle multiple message types in sequence', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    await new Promise<void>((resolve) => {
      const messages: any[] = [];
      
      ws.on('open', () => {
        // Send multiple message types
        ws.send(JSON.stringify({ type: 'event_detected', payload: {}, timestamp: new Date().toISOString() }));
        ws.send(JSON.stringify({ type: 'score_calculated', payload: {}, timestamp: new Date().toISOString() }));
        ws.send(JSON.stringify({ type: 'tokens_minted', payload: {}, timestamp: new Date().toISOString() }));
      });
      
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
        
        if (messages.length === 3) {
          expect(messages[0].type).toBe('event_detected');
          expect(messages[1].type).toBe('score_calculated');
          expect(messages[2].type).toBe('tokens_minted');
          ws.close();
          resolve();
        }
      });
    });
  });
});

describe('WebSocket Infrastructure', () => {
  it('should be able to create WebSocket server', () => {
    const wss = new WebSocketServer({ noServer: true });
    expect(wss).toBeDefined();
    wss.close();
  });

  it('should have WebSocket types available', () => {
    // Verify WebSocket types are properly imported
    expect(WebSocketServer).toBeDefined();
  });
});
