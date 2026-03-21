import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import { SubmitEventRequest, ImpactCategory } from '../types/index.js';

describe('EnvironmentalEvent', () => {
  describe('constructor', () => {
    it('should create an event with all required fields', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);

      expect(event.id).toBeDefined();
      expect(event.event_type).toBe('Solar');
      expect(event.location_coordinates).toEqual({ latitude: 40.7128, longitude: -74.0060 });
      expect(event.energy_kwh).toBe(100);
      expect(event.co2_reduction_kg).toBe(50);
      expect(event.ecosystem_restoration_units).toBe(25);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.impact_score).toBeNull();
    });

    it('should generate unique IDs for different events', () => {
      const request: SubmitEventRequest = {
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 0,
        co2_reduction_kg: 0,
        ecosystem_restoration_units: 0,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event1 = new EnvironmentalEvent(request);
      const event2 = new EnvironmentalEvent(request);

      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe('validate', () => {
    it('should return true for valid event with positive metrics', () => {
      const request: SubmitEventRequest = {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 45.5, longitude: -122.6 },
        energy_kwh: 100,
        co2_reduction_kg: 200,
        ecosystem_restoration_units: 150,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(true);
    });

    it('should return true for valid event with zero metrics', () => {
      const request: SubmitEventRequest = {
        event_type: 'Carbon_Capture',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 0,
        co2_reduction_kg: 0,
        ecosystem_restoration_units: 0,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(true);
    });

    it('should return true for coordinates at boundary values', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 90, longitude: 180 },
        energy_kwh: 50,
        co2_reduction_kg: 30,
        ecosystem_restoration_units: 20,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(true);
    });

    it('should return false for negative energy_kwh', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: -10,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(false);
    });

    it('should return false for negative co2_reduction_kg', () => {
      const request: SubmitEventRequest = {
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: 100,
        co2_reduction_kg: -50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(false);
    });

    it('should return false for negative ecosystem_restoration_units', () => {
      const request: SubmitEventRequest = {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 40, longitude: -74 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: -25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(false);
    });

    it('should return false for latitude above 90', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 95, longitude: -74 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(false);
    });

    it('should return false for latitude below -90', () => {
      const request: SubmitEventRequest = {
        event_type: 'Carbon_Capture',
        location_coordinates: { latitude: -95, longitude: -74 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(false);
    });

    it('should return false for longitude above 180', () => {
      const request: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40, longitude: 185 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(false);
    });

    it('should return false for longitude below -180', () => {
      const request: SubmitEventRequest = {
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 40, longitude: -185 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(request);
      expect(event.validate()).toBe(false);
    });
  });

  // Feature: eco-swarm-climate-fund, Property 1: Valid Event Structure
  // **Validates: Requirements 1.1, 1.3, 1.5, 9.3, 11.4**
  describe('Property 1: Valid Event Structure', () => {
    it('should have valid structure for any generated event', () => {
      // Custom arbitrary for valid EnvironmentalEvent
      const validEventRequestArbitrary = fc.record({
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
        fc.property(validEventRequestArbitrary, (request: SubmitEventRequest) => {
          const event = new EnvironmentalEvent(request);

          // Verify all required fields exist
          expect(event).toHaveProperty('id');
          expect(event).toHaveProperty('event_type');
          expect(event).toHaveProperty('location_coordinates');
          expect(event).toHaveProperty('energy_kwh');
          expect(event).toHaveProperty('co2_reduction_kg');
          expect(event).toHaveProperty('ecosystem_restoration_units');
          expect(event).toHaveProperty('timestamp');
          expect(event).toHaveProperty('impact_score');

          // Verify event_type is one of the four Impact_Categories
          expect(['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture']).toContain(event.event_type);

          // Verify location coordinates are within geographic bounds
          expect(event.location_coordinates.latitude).toBeGreaterThanOrEqual(-90);
          expect(event.location_coordinates.latitude).toBeLessThanOrEqual(90);
          expect(event.location_coordinates.longitude).toBeGreaterThanOrEqual(-180);
          expect(event.location_coordinates.longitude).toBeLessThanOrEqual(180);

          // Verify all metrics are non-negative (valid types)
          expect(event.energy_kwh).toBeGreaterThanOrEqual(0);
          expect(event.co2_reduction_kg).toBeGreaterThanOrEqual(0);
          expect(event.ecosystem_restoration_units).toBeGreaterThanOrEqual(0);

          // Verify timestamp is a valid Date object
          expect(event.timestamp).toBeInstanceOf(Date);
          expect(isNaN(event.timestamp.getTime())).toBe(false);

          // Verify the event passes validation
          expect(event.validate()).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
