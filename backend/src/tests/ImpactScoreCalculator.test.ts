import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ImpactScoreCalculator } from '../services/ImpactScoreCalculator.js';
import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import { SubmitEventRequest, ImpactCategory } from '../types/index.js';

describe('ImpactScoreCalculator', () => {
  const calculator = new ImpactScoreCalculator();

  describe('calculateImpactScore', () => {
    it('should calculate impact score using the correct formula', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 200,
        ecosystem_restoration_units: 50,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      const score = calculator.calculateImpactScore(event);

      // Expected: (200 × 0.4) + (100 × 0.3) + (50 × 0.3) = 80 + 30 + 15 = 125
      expect(score).toBeCloseTo(125, 2);
    });

    it('should calculate impact score for zero metrics', () => {
      const request: SubmitEventRequest = {
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 0,
        co2_reduction_kg: 0,
        ecosystem_restoration_units: 0,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      const score = calculator.calculateImpactScore(event);

      expect(score).toBe(0);
    });

    it('should calculate impact score for large values', () => {
      const request: SubmitEventRequest = {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 45.5, longitude: -122.6 },
        energy_kwh: 10000,
        co2_reduction_kg: 5000,
        ecosystem_restoration_units: 8000,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      const score = calculator.calculateImpactScore(event);

      // Expected: (5000 × 0.4) + (10000 × 0.3) + (8000 × 0.3) = 2000 + 3000 + 2400 = 7400
      expect(score).toBeCloseTo(7400, 2);
    });

    it('should throw error for negative energy_kwh', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: -10,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);

      expect(() => calculator.calculateImpactScore(event)).toThrow('Invalid event metrics');
      expect(() => calculator.calculateImpactScore(event)).toThrow('energy_kwh must be a non-negative number');
    });

    it('should throw error for negative co2_reduction_kg', () => {
      const request: SubmitEventRequest = {
        event_type: 'Carbon_Capture',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: 100,
        co2_reduction_kg: -50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);

      expect(() => calculator.calculateImpactScore(event)).toThrow('Invalid event metrics');
      expect(() => calculator.calculateImpactScore(event)).toThrow('co2_reduction_kg must be a non-negative number');
    });

    it('should throw error for negative ecosystem_restoration_units', () => {
      const request: SubmitEventRequest = {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: -25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);

      expect(() => calculator.calculateImpactScore(event)).toThrow('Invalid event metrics');
      expect(() => calculator.calculateImpactScore(event)).toThrow('ecosystem_restoration_units must be a non-negative number');
    });

    it('should throw error for NaN energy_kwh', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: NaN,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);

      expect(() => calculator.calculateImpactScore(event)).toThrow('Invalid event metrics');
    });

    it('should throw error for multiple invalid metrics', () => {
      const request: SubmitEventRequest = {
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: -10,
        co2_reduction_kg: -50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);

      expect(() => calculator.calculateImpactScore(event)).toThrow('Invalid event metrics');
      expect(() => calculator.calculateImpactScore(event)).toThrow('energy_kwh');
      expect(() => calculator.calculateImpactScore(event)).toThrow('co2_reduction_kg');
    });

    it('should complete calculation within 100ms', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 200,
        ecosystem_restoration_units: 50,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      const startTime = performance.now();
      calculator.calculateImpactScore(event);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  // Feature: eco-swarm-climate-fund, Property 2: Impact Score Calculation Formula
  // **Validates: Requirements 2.1**
  describe('Property 2: Impact Score Calculation Formula', () => {
    it('should match formula for any valid event with non-negative metrics', () => {
      const validMetricsArbitrary = fc.record({
        event_type: fc.constantFrom<ImpactCategory>('Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'),
        location_coordinates: fc.record({
          latitude: fc.float({ min: -90, max: 90, noNaN: true }),
          longitude: fc.float({ min: -180, max: 180, noNaN: true })
        }),
        energy_kwh: fc.float({ min: 0, max: 10000, noNaN: true }),
        co2_reduction_kg: fc.float({ min: 0, max: 10000, noNaN: true }),
        ecosystem_restoration_units: fc.float({ min: 0, max: 10000, noNaN: true }),
        timestamp: fc.date().map(d => d.toISOString())
      });

      fc.assert(
        fc.property(validMetricsArbitrary, (request: SubmitEventRequest) => {
          const event = new EnvironmentalEvent(request);
          const score = calculator.calculateImpactScore(event);

          // Calculate expected score using the formula
          const expected = 
            (request.co2_reduction_kg * 0.4) +
            (request.energy_kwh * 0.3) +
            (request.ecosystem_restoration_units * 0.3);

          // Verify the calculated score matches the formula
          expect(score).toBeCloseTo(expected, 5);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: eco-swarm-climate-fund, Property 3: Invalid Input Rejection
  // **Validates: Requirements 2.4, 2.5**
  describe('Property 3: Invalid Input Rejection', () => {
    it('should reject any event with negative or non-numeric metrics', () => {
      // Generate events with at least one invalid metric
      const invalidMetricsArbitrary = fc.oneof(
        // Negative energy_kwh
        fc.record({
          event_type: fc.constantFrom<ImpactCategory>('Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'),
          location_coordinates: fc.record({
            latitude: fc.float({ min: -90, max: 90, noNaN: true }),
            longitude: fc.float({ min: -180, max: 180, noNaN: true })
          }),
          energy_kwh: fc.double({ min: -1000, max: -0.01, noNaN: true }),
          co2_reduction_kg: fc.double({ min: 0, max: 1000, noNaN: true }),
          ecosystem_restoration_units: fc.double({ min: 0, max: 1000, noNaN: true }),
          timestamp: fc.date().map(d => d.toISOString())
        }),
        // Negative co2_reduction_kg
        fc.record({
          event_type: fc.constantFrom<ImpactCategory>('Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'),
          location_coordinates: fc.record({
            latitude: fc.float({ min: -90, max: 90, noNaN: true }),
            longitude: fc.float({ min: -180, max: 180, noNaN: true })
          }),
          energy_kwh: fc.double({ min: 0, max: 1000, noNaN: true }),
          co2_reduction_kg: fc.double({ min: -1000, max: -0.01, noNaN: true }),
          ecosystem_restoration_units: fc.double({ min: 0, max: 1000, noNaN: true }),
          timestamp: fc.date().map(d => d.toISOString())
        }),
        // Negative ecosystem_restoration_units
        fc.record({
          event_type: fc.constantFrom<ImpactCategory>('Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'),
          location_coordinates: fc.record({
            latitude: fc.float({ min: -90, max: 90, noNaN: true }),
            longitude: fc.float({ min: -180, max: 180, noNaN: true })
          }),
          energy_kwh: fc.double({ min: 0, max: 1000, noNaN: true }),
          co2_reduction_kg: fc.double({ min: 0, max: 1000, noNaN: true }),
          ecosystem_restoration_units: fc.double({ min: -1000, max: -0.01, noNaN: true }),
          timestamp: fc.date().map(d => d.toISOString())
        })
      );

      fc.assert(
        fc.property(invalidMetricsArbitrary, (request: SubmitEventRequest) => {
          const event = new EnvironmentalEvent(request);

          // Verify that the calculator throws an error for invalid metrics
          expect(() => calculator.calculateImpactScore(event)).toThrow('Invalid event metrics');
        }),
        { numRuns: 100 }
      );
    });
  });
});
