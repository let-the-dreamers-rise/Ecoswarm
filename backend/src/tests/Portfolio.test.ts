import { describe, it, expect, beforeEach } from 'vitest';
import { Portfolio } from '../models/Portfolio.js';
import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import { ImpactCategory } from '../types/index.js';
import fc from 'fast-check';

describe('Portfolio', () => {
  let portfolio: Portfolio;

  beforeEach(() => {
    portfolio = new Portfolio();
  });

  describe('constructor', () => {
    it('should initialize with equal 25% allocation for each category', () => {
      expect(portfolio.allocations.get('Solar')).toBe(25);
      expect(portfolio.allocations.get('River_Cleanup')).toBe(25);
      expect(portfolio.allocations.get('Reforestation')).toBe(25);
      expect(portfolio.allocations.get('Carbon_Capture')).toBe(25);
    });

    it('should initialize with current timestamp for last_rebalanced', () => {
      const now = new Date();
      expect(portfolio.last_rebalanced.getTime()).toBeCloseTo(now.getTime(), -2);
    });

    it('should initialize with empty event_history', () => {
      expect(portfolio.event_history).toEqual([]);
    });
  });

  describe('addEvent', () => {
    it('should add event to history', () => {
      const event = new EnvironmentalEvent({
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7, longitude: -74.0 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 10,
        timestamp: new Date().toISOString()
      });

      portfolio.addEvent(event);
      expect(portfolio.event_history.length).toBe(1);
      expect(portfolio.event_history[0]).toBe(event);
    });

    it('should maintain only last 10 events', () => {
      // Add 15 events
      for (let i = 0; i < 15; i++) {
        const event = new EnvironmentalEvent({
          event_type: 'Solar',
          location_coordinates: { latitude: 40.7, longitude: -74.0 },
          energy_kwh: i,
          co2_reduction_kg: i,
          ecosystem_restoration_units: i,
          timestamp: new Date().toISOString()
        });
        portfolio.addEvent(event);
      }

      expect(portfolio.event_history.length).toBe(10);
      // First event should have energy_kwh = 5 (events 0-4 were removed)
      expect(portfolio.event_history[0].energy_kwh).toBe(5);
      // Last event should have energy_kwh = 14
      expect(portfolio.event_history[9].energy_kwh).toBe(14);
    });

    it('should shift oldest event when exceeding 10', () => {
      const events: EnvironmentalEvent[] = [];
      
      // Add 11 events
      for (let i = 0; i < 11; i++) {
        const event = new EnvironmentalEvent({
          event_type: 'Solar',
          location_coordinates: { latitude: 40.7, longitude: -74.0 },
          energy_kwh: i,
          co2_reduction_kg: i,
          ecosystem_restoration_units: i,
          timestamp: new Date().toISOString()
        });
        events.push(event);
        portfolio.addEvent(event);
      }

      expect(portfolio.event_history.length).toBe(10);
      expect(portfolio.event_history[0]).toBe(events[1]); // First event was shifted
      expect(portfolio.event_history[9]).toBe(events[10]);
    });
  });

  describe('updateAllocations', () => {
    it('should update allocations when sum equals 100%', () => {
      const newAllocations: Record<ImpactCategory, number> = {
        Solar: 40,
        River_Cleanup: 30,
        Reforestation: 20,
        Carbon_Capture: 10
      };

      portfolio.updateAllocations(newAllocations);

      expect(portfolio.allocations.get('Solar')).toBe(40);
      expect(portfolio.allocations.get('River_Cleanup')).toBe(30);
      expect(portfolio.allocations.get('Reforestation')).toBe(20);
      expect(portfolio.allocations.get('Carbon_Capture')).toBe(10);
    });

    it('should update last_rebalanced timestamp', () => {
      const beforeUpdate = new Date();
      
      const newAllocations: Record<ImpactCategory, number> = {
        Solar: 40,
        River_Cleanup: 30,
        Reforestation: 20,
        Carbon_Capture: 10
      };

      portfolio.updateAllocations(newAllocations);

      expect(portfolio.last_rebalanced.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it('should accept allocations within 0.01% tolerance', () => {
      const newAllocations: Record<ImpactCategory, number> = {
        Solar: 25.005,
        River_Cleanup: 25.005,
        Reforestation: 25.005,
        Carbon_Capture: 24.985
      };

      expect(() => portfolio.updateAllocations(newAllocations)).not.toThrow();
    });

    it('should throw error when allocations sum to less than 100%', () => {
      const newAllocations: Record<ImpactCategory, number> = {
        Solar: 20,
        River_Cleanup: 20,
        Reforestation: 20,
        Carbon_Capture: 20
      };

      expect(() => portfolio.updateAllocations(newAllocations)).toThrow('Allocations must sum to 100%');
    });

    it('should throw error when allocations sum to more than 100%', () => {
      const newAllocations: Record<ImpactCategory, number> = {
        Solar: 30,
        River_Cleanup: 30,
        Reforestation: 30,
        Carbon_Capture: 30
      };

      expect(() => portfolio.updateAllocations(newAllocations)).toThrow('Allocations must sum to 100%');
    });

    it('should throw error when allocations exceed 0.01% tolerance', () => {
      const newAllocations: Record<ImpactCategory, number> = {
        Solar: 25.1,
        River_Cleanup: 25.1,
        Reforestation: 25.1,
        Carbon_Capture: 24.6
      };

      expect(() => portfolio.updateAllocations(newAllocations)).toThrow('Allocations must sum to 100%');
    });

    it('should not modify allocations if validation fails', () => {
      const invalidAllocations: Record<ImpactCategory, number> = {
        Solar: 30,
        River_Cleanup: 30,
        Reforestation: 30,
        Carbon_Capture: 30
      };

      try {
        portfolio.updateAllocations(invalidAllocations);
      } catch (e) {
        // Expected error
      }

      // Original allocations should remain
      expect(portfolio.allocations.get('Solar')).toBe(25);
      expect(portfolio.allocations.get('River_Cleanup')).toBe(25);
      expect(portfolio.allocations.get('Reforestation')).toBe(25);
      expect(portfolio.allocations.get('Carbon_Capture')).toBe(25);
    });
  });

  describe('getRecentEventsByCategory', () => {
    it('should return empty map when no events', () => {
      const byCategory = portfolio.getRecentEventsByCategory();
      expect(byCategory.size).toBe(0);
    });

    it('should group events by category', () => {
      const solarEvent = new EnvironmentalEvent({
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7, longitude: -74.0 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 10,
        timestamp: new Date().toISOString()
      });

      const cleanupEvent = new EnvironmentalEvent({
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 35.0, longitude: -80.0 },
        energy_kwh: 0,
        co2_reduction_kg: 30,
        ecosystem_restoration_units: 50,
        timestamp: new Date().toISOString()
      });

      portfolio.addEvent(solarEvent);
      portfolio.addEvent(cleanupEvent);

      const byCategory = portfolio.getRecentEventsByCategory();

      expect(byCategory.size).toBe(2);
      expect(byCategory.get('Solar')).toEqual([solarEvent]);
      expect(byCategory.get('River_Cleanup')).toEqual([cleanupEvent]);
    });

    it('should group multiple events of same category', () => {
      const solar1 = new EnvironmentalEvent({
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7, longitude: -74.0 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 10,
        timestamp: new Date().toISOString()
      });

      const solar2 = new EnvironmentalEvent({
        event_type: 'Solar',
        location_coordinates: { latitude: 41.0, longitude: -75.0 },
        energy_kwh: 150,
        co2_reduction_kg: 75,
        ecosystem_restoration_units: 15,
        timestamp: new Date().toISOString()
      });

      portfolio.addEvent(solar1);
      portfolio.addEvent(solar2);

      const byCategory = portfolio.getRecentEventsByCategory();

      expect(byCategory.size).toBe(1);
      expect(byCategory.get('Solar')).toEqual([solar1, solar2]);
    });

    it('should handle all four categories', () => {
      const categories: ImpactCategory[] = ['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'];
      
      categories.forEach(category => {
        const event = new EnvironmentalEvent({
          event_type: category,
          location_coordinates: { latitude: 40.7, longitude: -74.0 },
          energy_kwh: 100,
          co2_reduction_kg: 50,
          ecosystem_restoration_units: 10,
          timestamp: new Date().toISOString()
        });
        portfolio.addEvent(event);
      });

      const byCategory = portfolio.getRecentEventsByCategory();

      expect(byCategory.size).toBe(4);
      categories.forEach(category => {
        expect(byCategory.has(category)).toBe(true);
        expect(byCategory.get(category)?.length).toBe(1);
      });
    });
  });

  // Feature: eco-swarm-climate-fund, Property 4: Portfolio Allocation Invariant
  describe('Property-Based Tests', () => {
    it('portfolio allocation invariant - sum always equals 100% after any update', () => {
      // **Validates: Requirements 3.1**
      fc.assert(
        fc.property(
          // Generate valid portfolio allocations that sum to 100%
          fc.array(fc.float({ min: 0, max: 100, noNaN: true }), { minLength: 4, maxLength: 4 })
            .map(values => {
              // Normalize to sum to 100
              const sum = values.reduce((acc, val) => acc + val, 0);
              const normalized = sum === 0 
                ? [25, 25, 25, 25]
                : values.map(v => (v / sum) * 100);
              
              // Create allocation object
              const allocation: Record<ImpactCategory, number> = {
                Solar: normalized[0],
                River_Cleanup: normalized[1],
                Reforestation: normalized[2],
                Carbon_Capture: normalized[3]
              };
              
              return allocation;
            }),
          (allocation) => {
            const portfolio = new Portfolio();
            
            // Update portfolio with generated allocation
            portfolio.updateAllocations(allocation);
            
            // Verify the invariant: sum of allocations equals 100% (within 0.01% tolerance)
            const sum = Array.from(portfolio.allocations.values()).reduce((acc, val) => acc + val, 0);
            
            expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
