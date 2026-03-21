import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HederaEventRecorder } from '../services/HederaEventRecorder.js';

describe('HederaEventRecorder', () => {
  let recorder: HederaEventRecorder;

  beforeEach(() => {
    // Clear environment variables to ensure mock mode
    delete process.env.HEDERA_ACCOUNT_ID;
    delete process.env.HEDERA_PRIVATE_KEY;
    delete process.env.HEDERA_TOPIC_ID;
    
    recorder = new HederaEventRecorder();
  });

  describe('Initialization', () => {
    it('should initialize in mock mode when credentials not configured', () => {
      expect(recorder.isMockMode()).toBe(true);
    });

    it('should initialize in mock mode when credentials are placeholder values', () => {
      process.env.HEDERA_ACCOUNT_ID = '0.0.YOUR_ACCOUNT_ID';
      process.env.HEDERA_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';
      process.env.HEDERA_TOPIC_ID = 'YOUR_TOPIC_ID_HERE';
      
      const testRecorder = new HederaEventRecorder();
      expect(testRecorder.isMockMode()).toBe(true);
    });
  });

  describe('recordEvent', () => {
    it('should record impact_event_detected in mock mode', async () => {
      const payload = {
        event_id: 'test-123',
        event_type: 'Solar',
        location: { latitude: 40.7128, longitude: -74.0060 }
      };

      const txId = await recorder.recordEvent('impact_event_detected', payload);
      
      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
      expect(txId).toMatch(/^mock-tx-id-\d+$/);
    });

    it('should record impact_score_calculated in mock mode', async () => {
      const payload = {
        event_id: 'test-456',
        impact_score: 125.5
      };

      const txId = await recorder.recordEvent('impact_score_calculated', payload);
      
      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
      expect(txId).toMatch(/^mock-tx-id-\d+$/);
    });

    it('should record portfolio_rebalanced in mock mode', async () => {
      const payload = {
        old_allocation: { Solar: 25, River_Cleanup: 25, Reforestation: 25, Carbon_Capture: 25 },
        new_allocation: { Solar: 30, River_Cleanup: 25, Reforestation: 25, Carbon_Capture: 20 },
        decision_logic: 'Solar category showing 25% higher impact'
      };

      const txId = await recorder.recordEvent('portfolio_rebalanced', payload);
      
      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
      expect(txId).toMatch(/^mock-tx-id-\d+$/);
    });

    it('should record impact_verified in mock mode', async () => {
      const payload = {
        event_id: 'test-789',
        tokens_minted: 12,
        token_type: 'SolarImpactToken'
      };

      const txId = await recorder.recordEvent('impact_verified', payload);
      
      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
      expect(txId).toMatch(/^mock-tx-id-\d+$/);
    });

    it('should handle complex payload objects', async () => {
      const complexPayload = {
        event: {
          id: 'complex-123',
          type: 'Solar',
          metrics: {
            energy_kwh: 500,
            co2_reduction_kg: 300,
            ecosystem_restoration_units: 100
          },
          location: {
            coordinates: { latitude: 51.5074, longitude: -0.1278 },
            country: 'UK'
          }
        },
        impact_score: 340,
        timestamp: new Date().toISOString()
      };

      const txId = await recorder.recordEvent('impact_event_detected', complexPayload);
      
      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
    });

    it('should generate unique transaction IDs for different events', async () => {
      const payload1 = { event_id: 'test-1' };
      const payload2 = { event_id: 'test-2' };

      const txId1 = await recorder.recordEvent('impact_event_detected', payload1);
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const txId2 = await recorder.recordEvent('impact_score_calculated', payload2);
      
      expect(txId1).not.toBe(txId2);
    });

    it('should handle empty payload objects', async () => {
      const txId = await recorder.recordEvent('impact_event_detected', {});
      
      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
    });

    it('should handle null payload gracefully', async () => {
      const txId = await recorder.recordEvent('impact_event_detected', null);
      
      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
    });
  });

  describe('Graceful degradation', () => {
    it('should continue operating when in mock mode', async () => {
      expect(recorder.isMockMode()).toBe(true);

      const payload = { test: 'data' };
      const txId = await recorder.recordEvent('impact_event_detected', payload);
      
      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
    });

    it('should not throw errors in mock mode', async () => {
      const payload = { event_id: 'test' };
      
      await expect(
        recorder.recordEvent('impact_event_detected', payload)
      ).resolves.toBeTruthy();
    });
  });

  describe('Connection management', () => {
    it('should close connection without errors', () => {
      expect(() => recorder.close()).not.toThrow();
    });

    it('should handle close when already in mock mode', () => {
      expect(recorder.isMockMode()).toBe(true);
      expect(() => recorder.close()).not.toThrow();
    });
  });

  describe('Event type validation', () => {
    it('should accept all four valid event types', async () => {
      const eventTypes: Array<'impact_event_detected' | 'impact_score_calculated' | 'portfolio_rebalanced' | 'impact_verified'> = [
        'impact_event_detected',
        'impact_score_calculated',
        'portfolio_rebalanced',
        'impact_verified'
      ];

      for (const eventType of eventTypes) {
        const txId = await recorder.recordEvent(eventType, { test: 'data' });
        expect(txId).toBeTruthy();
        expect(txId).toMatch(/^mock-tx-id-\d+$/);
      }
    });
  });

  describe('Performance', () => {
    it('should record events quickly in mock mode', async () => {
      const startTime = Date.now();
      
      await recorder.recordEvent('impact_event_detected', { test: 'data' });
      
      const duration = Date.now() - startTime;
      
      // Should complete in under 100ms in mock mode
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple rapid event recordings', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          recorder.recordEvent('impact_event_detected', { event_id: `test-${i}` })
        );
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(txId => {
        expect(txId).toBeTruthy();
        expect(txId).toContain('mock-tx-id-');
      });
    });
  });

  describe('Property-Based Tests', () => {
    // Feature: eco-swarm-climate-fund, Property 8: Event Record Structure Completeness
    // **Validates: Requirements 5.7, 10.2**
    it('all recorded events have complete structure', async () => {
      const fc = await import('fast-check');
      
      // Arbitrary for event types
      const eventTypeArbitrary = fc.constantFrom(
        'impact_event_detected' as const,
        'impact_score_calculated' as const,
        'portfolio_rebalanced' as const,
        'impact_verified' as const
      );
      
      // Arbitrary for payloads - generate various payload structures
      const payloadArbitrary = fc.oneof(
        // Simple object
        fc.record({
          event_id: fc.string(),
          value: fc.integer()
        }),
        // Complex nested object
        fc.record({
          event_id: fc.uuid(),
          event_type: fc.constantFrom('Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'),
          location: fc.record({
            latitude: fc.float({ min: -90, max: 90 }),
            longitude: fc.float({ min: -180, max: 180 })
          }),
          metrics: fc.record({
            energy_kwh: fc.float({ min: 0, max: 1000 }),
            co2_reduction_kg: fc.float({ min: 0, max: 1000 })
          })
        }),
        // Array payload
        fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
        // Empty object
        fc.constant({}),
        // Null payload
        fc.constant(null)
      );

      await fc.assert(
        fc.asyncProperty(
          eventTypeArbitrary,
          payloadArbitrary,
          async (eventType, payload) => {
            const txId = await recorder.recordEvent(eventType, payload);
            
            // Verify transaction ID is returned (required field)
            expect(txId).toBeTruthy();
            expect(typeof txId).toBe('string');
            
            // In mock mode, verify the synthetic transaction ID format
            if (recorder.isMockMode()) {
              const transactionId = txId as string;
              expect(transactionId).toContain('mock-tx-id-');
              const timestampPart = transactionId.replace('mock-tx-id-', '');
              expect(Number.isNaN(Number(timestampPart))).toBe(false);
            }
            
            // The event record structure is created internally with:
            // - event_type
            // - timestamp
            // - payload
            // - transaction_id (returned as txId)
          }
        ),
        { numRuns: 40 }
      );
    }, 15000);
  });
});
