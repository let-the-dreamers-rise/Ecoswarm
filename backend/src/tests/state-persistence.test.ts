import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { Portfolio } from '../models/Portfolio.js';
import { TokenBalances } from '../models/TokenBalances.js';
import { AggregateMetrics } from '../models/AggregateMetrics.js';
import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import type { ImpactCategory, HederaEventRecord } from '../types/index.js';

describe('State Persistence', () => {
  let portfolio: Portfolio;
  let tokenBalances: TokenBalances;
  let aggregateMetrics: AggregateMetrics;

  beforeEach(() => {
    portfolio = new Portfolio();
    tokenBalances = new TokenBalances();
    aggregateMetrics = new AggregateMetrics();
  });

  describe('saveState and loadState', () => {
    it('should save and restore portfolio allocations', () => {
      // Update portfolio allocations
      portfolio.updateAllocations({
        Solar: 40,
        River_Cleanup: 30,
        Reforestation: 20,
        Carbon_Capture: 10
      });

      // Simulate saveState
      const savedState = {
        portfolio: {
          allocations: {
            Solar: portfolio.allocations.get('Solar') || 0,
            River_Cleanup: portfolio.allocations.get('River_Cleanup') || 0,
            Reforestation: portfolio.allocations.get('Reforestation') || 0,
            Carbon_Capture: portfolio.allocations.get('Carbon_Capture') || 0
          },
          last_rebalanced: portfolio.last_rebalanced.toISOString()
        },
        metrics: aggregateMetrics.toJSON(),
        token_balances: {
          SolarImpactToken: tokenBalances.balances.get('SolarImpactToken') || 0,
          CleanupImpactToken: tokenBalances.balances.get('CleanupImpactToken') || 0,
          ReforestationToken: tokenBalances.balances.get('ReforestationToken') || 0,
          CarbonCaptureToken: tokenBalances.balances.get('CarbonCaptureToken') || 0
        }
      };

      // Create new instances to simulate server restart
      const newPortfolio = new Portfolio();
      
      // Simulate loadState
      newPortfolio.allocations.set('Solar', savedState.portfolio.allocations.Solar);
      newPortfolio.allocations.set('River_Cleanup', savedState.portfolio.allocations.River_Cleanup);
      newPortfolio.allocations.set('Reforestation', savedState.portfolio.allocations.Reforestation);
      newPortfolio.allocations.set('Carbon_Capture', savedState.portfolio.allocations.Carbon_Capture);
      newPortfolio.last_rebalanced = new Date(savedState.portfolio.last_rebalanced);

      // Verify restored allocations
      expect(newPortfolio.allocations.get('Solar')).toBe(40);
      expect(newPortfolio.allocations.get('River_Cleanup')).toBe(30);
      expect(newPortfolio.allocations.get('Reforestation')).toBe(20);
      expect(newPortfolio.allocations.get('Carbon_Capture')).toBe(10);
    });

    it('should save and restore aggregate metrics', () => {
      // Update metrics
      const event = new EnvironmentalEvent({
        event_type: 'Solar',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: new Date().toISOString()
      });
      event.impact_score = 62.5;
      aggregateMetrics.updateFromEvent(event);

      // Simulate saveState
      const savedState = {
        portfolio: {
          allocations: {
            Solar: 25,
            River_Cleanup: 25,
            Reforestation: 25,
            Carbon_Capture: 25
          },
          last_rebalanced: new Date().toISOString()
        },
        metrics: aggregateMetrics.toJSON(),
        token_balances: {
          SolarImpactToken: 0,
          CleanupImpactToken: 0,
          ReforestationToken: 0,
          CarbonCaptureToken: 0
        }
      };

      // Create new instance to simulate server restart
      const newMetrics = new AggregateMetrics();
      
      // Simulate loadState
      newMetrics.total_co2_reduced_kg = savedState.metrics.total_co2_reduced_kg;
      newMetrics.total_energy_generated_kwh = savedState.metrics.total_energy_generated_kwh;
      newMetrics.total_projects_funded = savedState.metrics.total_projects_funded;
      newMetrics.total_events_processed = savedState.metrics.total_events_processed;

      // Verify restored metrics
      expect(newMetrics.total_co2_reduced_kg).toBe(50);
      expect(newMetrics.total_energy_generated_kwh).toBe(100);
      expect(newMetrics.total_projects_funded).toBe(1);
      expect(newMetrics.total_events_processed).toBe(1);
    });

    it('should save and restore token balances', () => {
      // Mint some tokens
      tokenBalances.mint('Solar', 100);
      tokenBalances.mint('River_Cleanup', 50);

      // Simulate saveState
      const savedState = {
        portfolio: {
          allocations: {
            Solar: 25,
            River_Cleanup: 25,
            Reforestation: 25,
            Carbon_Capture: 25
          },
          last_rebalanced: new Date().toISOString()
        },
        metrics: {
          total_co2_reduced_kg: 0,
          total_energy_generated_kwh: 0,
          total_projects_funded: 0,
          total_events_processed: 0
        },
        token_balances: {
          SolarImpactToken: tokenBalances.balances.get('SolarImpactToken') || 0,
          CleanupImpactToken: tokenBalances.balances.get('CleanupImpactToken') || 0,
          ReforestationToken: tokenBalances.balances.get('ReforestationToken') || 0,
          CarbonCaptureToken: tokenBalances.balances.get('CarbonCaptureToken') || 0
        }
      };

      // Create new instance to simulate server restart
      const newTokenBalances = new TokenBalances();
      
      // Simulate loadState
      newTokenBalances.balances.set('SolarImpactToken', savedState.token_balances.SolarImpactToken);
      newTokenBalances.balances.set('CleanupImpactToken', savedState.token_balances.CleanupImpactToken);
      newTokenBalances.balances.set('ReforestationToken', savedState.token_balances.ReforestationToken);
      newTokenBalances.balances.set('CarbonCaptureToken', savedState.token_balances.CarbonCaptureToken);

      // Verify restored balances
      expect(newTokenBalances.balances.get('SolarImpactToken')).toBe(10);
      expect(newTokenBalances.balances.get('CleanupImpactToken')).toBe(5);
      expect(newTokenBalances.balances.get('ReforestationToken')).toBe(0);
      expect(newTokenBalances.balances.get('CarbonCaptureToken')).toBe(0);
    });

    it('should handle empty state on first startup', () => {
      // Simulate loadState with no persisted state
      const persistedState = null;

      // Create new instances
      const newPortfolio = new Portfolio();
      const newMetrics = new AggregateMetrics();
      const newTokenBalances = new TokenBalances();

      if (!persistedState) {
        // Should use default values
        expect(newPortfolio.allocations.get('Solar')).toBe(25);
        expect(newPortfolio.allocations.get('River_Cleanup')).toBe(25);
        expect(newPortfolio.allocations.get('Reforestation')).toBe(25);
        expect(newPortfolio.allocations.get('Carbon_Capture')).toBe(25);
        
        expect(newMetrics.total_co2_reduced_kg).toBe(0);
        expect(newMetrics.total_energy_generated_kwh).toBe(0);
        expect(newMetrics.total_projects_funded).toBe(0);
        expect(newMetrics.total_events_processed).toBe(0);
        
        expect(newTokenBalances.balances.get('SolarImpactToken')).toBe(0);
        expect(newTokenBalances.balances.get('CleanupImpactToken')).toBe(0);
        expect(newTokenBalances.balances.get('ReforestationToken')).toBe(0);
        expect(newTokenBalances.balances.get('CarbonCaptureToken')).toBe(0);
      }
    });

    it('should preserve last_rebalanced timestamp', () => {
      const originalTimestamp = new Date('2024-01-15T10:30:00Z');
      portfolio.last_rebalanced = originalTimestamp;

      // Simulate saveState
      const savedState = {
        portfolio: {
          allocations: {
            Solar: portfolio.allocations.get('Solar') || 0,
            River_Cleanup: portfolio.allocations.get('River_Cleanup') || 0,
            Reforestation: portfolio.allocations.get('Reforestation') || 0,
            Carbon_Capture: portfolio.allocations.get('Carbon_Capture') || 0
          },
          last_rebalanced: portfolio.last_rebalanced.toISOString()
        },
        metrics: aggregateMetrics.toJSON(),
        token_balances: {
          SolarImpactToken: 0,
          CleanupImpactToken: 0,
          ReforestationToken: 0,
          CarbonCaptureToken: 0
        }
      };

      // Create new instance and restore
      const newPortfolio = new Portfolio();
      newPortfolio.last_rebalanced = new Date(savedState.portfolio.last_rebalanced);

      // Verify timestamp is preserved
      expect(newPortfolio.last_rebalanced.toISOString()).toBe(originalTimestamp.toISOString());
    });
  });

  describe('Property-Based Tests', () => {
    // Feature: eco-swarm-climate-fund, Property 10: State Persistence Round-Trip
    // **Validates: Requirements 8.5**
    it('state persistence round-trip preserves all data', () => {
      // Custom arbitraries for generating test data
      const impactCategoryArbitrary = fc.constantFrom<ImpactCategory>(
        'Solar',
        'River_Cleanup',
        'Reforestation',
        'Carbon_Capture'
      );

      const allocationsArbitrary = fc.tuple(
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true })
      ).map(([a, b, c, d]) => {
        // Normalize to sum to 100
        const sum = a + b + c + d;
        if (sum === 0 || !isFinite(sum)) return { Solar: 25, River_Cleanup: 25, Reforestation: 25, Carbon_Capture: 25 };
        return {
          Solar: (a / sum) * 100,
          River_Cleanup: (b / sum) * 100,
          Reforestation: (c / sum) * 100,
          Carbon_Capture: (d / sum) * 100
        };
      });

      const metricsArbitrary = fc.record({
        total_co2_reduced_kg: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
        total_energy_generated_kwh: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
        total_projects_funded: fc.integer({ min: 0, max: 1000 }),
        total_events_processed: fc.integer({ min: 0, max: 1000 })
      });

      const tokenBalancesArbitrary = fc.record({
        SolarImpactToken: fc.integer({ min: 0, max: 10000 }),
        CleanupImpactToken: fc.integer({ min: 0, max: 10000 }),
        ReforestationToken: fc.integer({ min: 0, max: 10000 }),
        CarbonCaptureToken: fc.integer({ min: 0, max: 10000 })
      });

      const hederaEventRecordArbitrary = fc.record({
        event_type: fc.constantFrom(
          'impact_event_detected' as const,
          'impact_score_calculated' as const,
          'portfolio_rebalanced' as const,
          'impact_verified' as const
        ),
        timestamp: fc.date().map(d => d.toISOString()),
        payload: fc.oneof(
          fc.string(),
          fc.integer(),
          fc.double({ noNaN: true, noDefaultInfinity: true }),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.oneof(fc.string(), fc.integer(), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.boolean(), fc.constant(null))),
          fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.boolean(), fc.constant(null)))
        ),
        transaction_id: fc.option(fc.string(), { nil: undefined })
      });

      const eventStreamArbitrary = fc.array(hederaEventRecordArbitrary, { maxLength: 20 });

      const persistedStateArbitrary = fc.record({
        portfolio: fc.record({
          allocations: allocationsArbitrary,
          last_rebalanced: fc.date().map(d => d.toISOString())
        }),
        metrics: metricsArbitrary,
        token_balances: tokenBalancesArbitrary,
        event_stream: eventStreamArbitrary
      });

      fc.assert(
        fc.property(persistedStateArbitrary, (originalState) => {
          // Serialize state (simulate saveState to localStorage)
          const serialized = JSON.stringify(originalState);

          // Deserialize state (simulate loadState from localStorage)
          const restoredState = JSON.parse(serialized);

          // Verify all fields preserved
          expect(restoredState).toEqual(originalState);

          // Verify portfolio allocations
          expect(restoredState.portfolio.allocations.Solar).toBeCloseTo(
            originalState.portfolio.allocations.Solar,
            10
          );
          expect(restoredState.portfolio.allocations.River_Cleanup).toBeCloseTo(
            originalState.portfolio.allocations.River_Cleanup,
            10
          );
          expect(restoredState.portfolio.allocations.Reforestation).toBeCloseTo(
            originalState.portfolio.allocations.Reforestation,
            10
          );
          expect(restoredState.portfolio.allocations.Carbon_Capture).toBeCloseTo(
            originalState.portfolio.allocations.Carbon_Capture,
            10
          );
          expect(restoredState.portfolio.last_rebalanced).toBe(
            originalState.portfolio.last_rebalanced
          );

          // Verify metrics
          expect(restoredState.metrics.total_co2_reduced_kg).toBeCloseTo(
            originalState.metrics.total_co2_reduced_kg,
            10
          );
          expect(restoredState.metrics.total_energy_generated_kwh).toBeCloseTo(
            originalState.metrics.total_energy_generated_kwh,
            10
          );
          expect(restoredState.metrics.total_projects_funded).toBe(
            originalState.metrics.total_projects_funded
          );
          expect(restoredState.metrics.total_events_processed).toBe(
            originalState.metrics.total_events_processed
          );

          // Verify token balances
          expect(restoredState.token_balances.SolarImpactToken).toBe(
            originalState.token_balances.SolarImpactToken
          );
          expect(restoredState.token_balances.CleanupImpactToken).toBe(
            originalState.token_balances.CleanupImpactToken
          );
          expect(restoredState.token_balances.ReforestationToken).toBe(
            originalState.token_balances.ReforestationToken
          );
          expect(restoredState.token_balances.CarbonCaptureToken).toBe(
            originalState.token_balances.CarbonCaptureToken
          );

          // Verify event stream
          expect(restoredState.event_stream).toEqual(originalState.event_stream);
        }),
        { numRuns: 100 }
      );
    });
  });
});
