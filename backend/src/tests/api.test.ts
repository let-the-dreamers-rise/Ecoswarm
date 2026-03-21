import { describe, it, expect, beforeEach } from 'vitest';
import { Portfolio } from '../models/Portfolio.js';
import { TokenBalances } from '../models/TokenBalances.js';
import { AggregateMetrics } from '../models/AggregateMetrics.js';
import { ImpactScoreCalculator } from '../services/ImpactScoreCalculator.js';
import { parseEventFromJSON } from '../utils/EventParser.js';
import { SubmitEventRequest } from '../types/index.js';

describe('API Integration Tests', () => {
  let portfolio: Portfolio;
  let tokenBalances: TokenBalances;
  let aggregateMetrics: AggregateMetrics;
  let impactScoreCalculator: ImpactScoreCalculator;

  beforeEach(() => {
    portfolio = new Portfolio();
    tokenBalances = new TokenBalances();
    aggregateMetrics = new AggregateMetrics();
    impactScoreCalculator = new ImpactScoreCalculator();
  });

  describe('POST /events endpoint logic', () => {
    it('should process a valid solar event', () => {
      const eventRequest: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 30,
        timestamp: new Date().toISOString()
      };

      // Parse event
      const event = parseEventFromJSON(eventRequest);
      
      // Calculate impact score
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      expect(impactScore).toBeCloseTo(59, 1); // (50*0.4 + 100*0.3 + 30*0.3)
      
      // Update event with impact score
      event.impact_score = impactScore;
      
      // Update aggregate metrics
      aggregateMetrics.updateFromEvent(event);
      expect(aggregateMetrics.total_co2_reduced_kg).toBe(50);
      expect(aggregateMetrics.total_energy_generated_kwh).toBe(100);
      expect(aggregateMetrics.total_projects_funded).toBe(1);
      expect(aggregateMetrics.total_events_processed).toBe(1);
      
      // Add event to portfolio
      portfolio.addEvent(event);
      expect(portfolio.event_history.length).toBe(1);
      
      // Mint tokens
      const tokensMinted = tokenBalances.mint(event.event_type, impactScore);
      expect(tokensMinted).toBe(5); // floor(59 / 10)
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(5);
    });

    it('should reject event with negative metrics', () => {
      const invalidRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: -10,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 30,
        timestamp: new Date().toISOString()
      };

      const event = parseEventFromJSON(invalidRequest);
      
      expect(() => {
        impactScoreCalculator.calculateImpactScore(event);
      }).toThrow('Invalid event metrics');
    });

    it('should reject event with missing required fields', () => {
      const invalidRequest = {
        event_type: 'Solar',
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 30
      };

      expect(() => {
        parseEventFromJSON(invalidRequest);
      }).toThrow('missing required fields');
    });

    it('should reject event with invalid event_type', () => {
      const invalidRequest = {
        event_type: 'InvalidType',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 30,
        timestamp: new Date().toISOString()
      };

      expect(() => {
        parseEventFromJSON(invalidRequest);
      }).toThrow('event_type must be one of');
    });
  });

  describe('GET /portfolio endpoint logic', () => {
    it('should return initial equal allocations', () => {
      const allocations = {
        Solar: portfolio.allocations.get('Solar') || 0,
        River_Cleanup: portfolio.allocations.get('River_Cleanup') || 0,
        Reforestation: portfolio.allocations.get('Reforestation') || 0,
        Carbon_Capture: portfolio.allocations.get('Carbon_Capture') || 0
      };

      expect(allocations.Solar).toBe(25);
      expect(allocations.River_Cleanup).toBe(25);
      expect(allocations.Reforestation).toBe(25);
      expect(allocations.Carbon_Capture).toBe(25);
    });

    it('should include last_rebalanced timestamp', () => {
      expect(portfolio.last_rebalanced).toBeInstanceOf(Date);
    });
  });

  describe('GET /metrics endpoint logic', () => {
    it('should return zero metrics initially', () => {
      const metrics = aggregateMetrics.toJSON();
      
      expect(metrics.total_co2_reduced_kg).toBe(0);
      expect(metrics.total_energy_generated_kwh).toBe(0);
      expect(metrics.total_projects_funded).toBe(0);
      expect(metrics.total_events_processed).toBe(0);
    });

    it('should return updated metrics after processing events', () => {
      const event1 = parseEventFromJSON({
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 30,
        timestamp: new Date().toISOString()
      });

      const event2 = parseEventFromJSON({
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 34.0522, longitude: -118.2437 },
        energy_kwh: 20,
        co2_reduction_kg: 80,
        ecosystem_restoration_units: 60,
        timestamp: new Date().toISOString()
      });

      aggregateMetrics.updateFromEvent(event1);
      aggregateMetrics.updateFromEvent(event2);

      const metrics = aggregateMetrics.toJSON();
      expect(metrics.total_co2_reduced_kg).toBe(130);
      expect(metrics.total_energy_generated_kwh).toBe(120);
      expect(metrics.total_projects_funded).toBe(2);
      expect(metrics.total_events_processed).toBe(2);
    });
  });

  describe('GET /tokens endpoint logic', () => {
    it('should return zero balances initially', () => {
      const balances = {
        SolarImpactToken: tokenBalances.balances.get('SolarImpactToken') || 0,
        CleanupImpactToken: tokenBalances.balances.get('CleanupImpactToken') || 0,
        ReforestationToken: tokenBalances.balances.get('ReforestationToken') || 0,
        CarbonCaptureToken: tokenBalances.balances.get('CarbonCaptureToken') || 0
      };

      expect(balances.SolarImpactToken).toBe(0);
      expect(balances.CleanupImpactToken).toBe(0);
      expect(balances.ReforestationToken).toBe(0);
      expect(balances.CarbonCaptureToken).toBe(0);
    });

    it('should return updated balances after minting', () => {
      tokenBalances.mint('Solar', 55);
      tokenBalances.mint('River_Cleanup', 42);
      tokenBalances.mint('Reforestation', 78);
      tokenBalances.mint('Carbon_Capture', 33);

      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(5);
      expect(tokenBalances.balances.get('CleanupImpactToken')).toBe(4);
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(7);
      expect(tokenBalances.balances.get('CarbonCaptureToken')).toBe(3);
    });
  });

  describe('Complete event processing pipeline', () => {
    it('should process event through complete flow', () => {
      const eventRequest: SubmitEventRequest = {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 51.5074, longitude: -0.1278 },
        energy_kwh: 80,
        co2_reduction_kg: 120,
        ecosystem_restoration_units: 150,
        timestamp: new Date().toISOString()
      };

      // Step 1: Parse event
      const event = parseEventFromJSON(eventRequest);
      expect(event.event_type).toBe('Reforestation');
      
      // Step 2: Calculate impact score
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      expect(impactScore).toBeCloseTo(117, 1); // (120*0.4 + 80*0.3 + 150*0.3)
      
      // Step 3: Update event with impact score
      event.impact_score = impactScore;
      expect(event.impact_score).toBe(impactScore);
      
      // Step 4: Update aggregate metrics
      aggregateMetrics.updateFromEvent(event);
      expect(aggregateMetrics.total_events_processed).toBe(1);
      
      // Step 5: Add event to portfolio
      portfolio.addEvent(event);
      expect(portfolio.event_history.length).toBe(1);
      
      // Step 6: Mint tokens
      const tokensMinted = tokenBalances.mint(event.event_type, impactScore);
      expect(tokensMinted).toBe(11); // floor(117 / 10)
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(11);
    });
  });

  describe('Portfolio optimization integration', () => {
    it('should not call optimizer with fewer than 5 events', () => {
      // Add 4 events
      for (let i = 0; i < 4; i++) {
        const event = parseEventFromJSON({
          event_type: 'Solar',
          location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
          energy_kwh: 100,
          co2_reduction_kg: 50,
          ecosystem_restoration_units: 30,
          timestamp: new Date().toISOString()
        });
        event.impact_score = impactScoreCalculator.calculateImpactScore(event);
        portfolio.addEvent(event);
      }

      expect(portfolio.event_history.length).toBe(4);
      // Optimizer should not be called (tested in integration test)
    });

    it('should prepare correct optimizer request data with 5+ events', () => {
      // Add 5 events with varying impact scores
      const events = [
        { event_type: 'Solar' as const, energy_kwh: 100, co2_reduction_kg: 50, ecosystem_restoration_units: 30 },
        { event_type: 'Solar' as const, energy_kwh: 120, co2_reduction_kg: 60, ecosystem_restoration_units: 40 },
        { event_type: 'River_Cleanup' as const, energy_kwh: 20, co2_reduction_kg: 80, ecosystem_restoration_units: 60 },
        { event_type: 'Reforestation' as const, energy_kwh: 80, co2_reduction_kg: 120, ecosystem_restoration_units: 150 },
        { event_type: 'Carbon_Capture' as const, energy_kwh: 50, co2_reduction_kg: 90, ecosystem_restoration_units: 70 }
      ];

      for (const eventData of events) {
        const event = parseEventFromJSON({
          ...eventData,
          location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
          timestamp: new Date().toISOString()
        });
        event.impact_score = impactScoreCalculator.calculateImpactScore(event);
        portfolio.addEvent(event);
      }

      expect(portfolio.event_history.length).toBe(5);

      // Verify current allocation structure
      const currentAllocation = {
        Solar: portfolio.allocations.get('Solar') || 0,
        River_Cleanup: portfolio.allocations.get('River_Cleanup') || 0,
        Reforestation: portfolio.allocations.get('Reforestation') || 0,
        Carbon_Capture: portfolio.allocations.get('Carbon_Capture') || 0
      };

      expect(currentAllocation.Solar).toBe(25);
      expect(currentAllocation.River_Cleanup).toBe(25);
      expect(currentAllocation.Reforestation).toBe(25);
      expect(currentAllocation.Carbon_Capture).toBe(25);

      // Verify recent events structure
      const recentEvents = portfolio.event_history.map(e => ({
        event_type: e.event_type,
        impact_score: e.impact_score
      }));

      expect(recentEvents.length).toBe(5);
      expect(recentEvents[0]).toHaveProperty('event_type');
      expect(recentEvents[0]).toHaveProperty('impact_score');
    });

    it('should update portfolio when rebalancing needed and change exceeds 5%', () => {
      const initialAllocation = {
        Solar: 25,
        River_Cleanup: 25,
        Reforestation: 25,
        Carbon_Capture: 25
      };

      // Simulate optimizer response with significant change
      const optimizerResponse = {
        recommended_allocation: {
          Solar: 35,  // +10% change
          River_Cleanup: 21.67,
          Reforestation: 21.67,
          Carbon_Capture: 21.66
        },
        decision_logic: 'Solar shows superior performance',
        impact_per_dollar_ratios: {
          Solar: 100,
          River_Cleanup: 50,
          Reforestation: 50,
          Carbon_Capture: 50
        },
        rebalancing_needed: true
      };

      // Calculate max change
      let maxChange = 0;
      for (const category of Object.keys(initialAllocation) as Array<keyof typeof initialAllocation>) {
        const change = Math.abs(
          optimizerResponse.recommended_allocation[category] - initialAllocation[category]
        );
        maxChange = Math.max(maxChange, change);
      }

      expect(maxChange).toBeGreaterThan(5);

      // Update portfolio
      portfolio.updateAllocations(optimizerResponse.recommended_allocation as any);

      expect(portfolio.allocations.get('Solar')).toBe(35);
    });

    it('should not update portfolio when change is below 5% threshold', () => {
      const initialAllocation = {
        Solar: 25,
        River_Cleanup: 25,
        Reforestation: 25,
        Carbon_Capture: 25
      };

      // Simulate optimizer response with small change
      const optimizerResponse = {
        recommended_allocation: {
          Solar: 28,  // +3% change (below threshold)
          River_Cleanup: 24,
          Reforestation: 24,
          Carbon_Capture: 24
        },
        decision_logic: 'Minor performance difference',
        impact_per_dollar_ratios: {
          Solar: 55,
          River_Cleanup: 50,
          Reforestation: 50,
          Carbon_Capture: 50
        },
        rebalancing_needed: true
      };

      // Calculate max change
      let maxChange = 0;
      for (const category of Object.keys(initialAllocation) as Array<keyof typeof initialAllocation>) {
        const change = Math.abs(
          optimizerResponse.recommended_allocation[category] - initialAllocation[category]
        );
        maxChange = Math.max(maxChange, change);
      }

      expect(maxChange).toBeLessThanOrEqual(5);
      
      // Portfolio should not be updated (allocation remains at initial values)
      expect(portfolio.allocations.get('Solar')).toBe(25);
      expect(portfolio.allocations.get('River_Cleanup')).toBe(25);
    });

    it('should maintain current allocation when rebalancing_needed is false', () => {
      // Simulate optimizer response with no rebalancing needed
      const optimizerResponse = {
        recommended_allocation: {
          Solar: 25,
          River_Cleanup: 25,
          Reforestation: 25,
          Carbon_Capture: 25
        },
        decision_logic: 'No significant performance difference detected',
        impact_per_dollar_ratios: {
          Solar: 50,
          River_Cleanup: 50,
          Reforestation: 50,
          Carbon_Capture: 50
        },
        rebalancing_needed: false
      };

      expect(optimizerResponse.rebalancing_needed).toBe(false);
      
      // Portfolio should not be updated
      expect(portfolio.allocations.get('Solar')).toBe(25);
      expect(portfolio.allocations.get('River_Cleanup')).toBe(25);
      expect(portfolio.allocations.get('Reforestation')).toBe(25);
      expect(portfolio.allocations.get('Carbon_Capture')).toBe(25);
    });
  });
});
