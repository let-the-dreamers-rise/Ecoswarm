import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseEventFromJSON, formatEventToJSON } from '../utils/EventParser.js';
import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import { ImpactCategory, SubmitEventRequest } from '../types/index.js';

describe('EventParser', () => {
  describe('parseEventFromJSON', () => {
    it('should parse valid JSON string into EnvironmentalEvent', () => {
      const jsonString = JSON.stringify({
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      });

      const event = parseEventFromJSON(jsonString);

      expect(event).toBeInstanceOf(EnvironmentalEvent);
      expect(event.event_type).toBe('Solar');
      expect(event.location_coordinates.latitude).toBe(40.7128);
      expect(event.location_coordinates.longitude).toBe(-74.0060);
      expect(event.energy_kwh).toBe(100);
      expect(event.co2_reduction_kg).toBe(50);
      expect(event.ecosystem_restoration_units).toBe(25);
    });

    it('should parse valid object into EnvironmentalEvent', () => {
      const data = {
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 51.5074, longitude: -0.1278 },
        energy_kwh: 0,
        co2_reduction_kg: 75,
        ecosystem_restoration_units: 150,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = parseEventFromJSON(data);

      expect(event).toBeInstanceOf(EnvironmentalEvent);
      expect(event.event_type).toBe('River_Cleanup');
    });

    it('should accept all four valid Impact_Categories', () => {
      const categories: ImpactCategory[] = ['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'];

      categories.forEach(category => {
        const data = {
          event_type: category,
          location_coordinates: { latitude: 0, longitude: 0 },
          energy_kwh: 10,
          co2_reduction_kg: 10,
          ecosystem_restoration_units: 10,
          timestamp: '2024-01-15T10:30:00Z'
        };

        const event = parseEventFromJSON(data);
        expect(event.event_type).toBe(category);
      });
    });

    it('should throw error for malformed JSON string', () => {
      const malformedJSON = '{ "event_type": "Solar", invalid }';

      expect(() => parseEventFromJSON(malformedJSON)).toThrow(/Malformed JSON/);
    });

    it('should throw error for missing event_type', () => {
      const data = {
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 10,
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10,
        timestamp: '2024-01-15T10:30:00Z'
      };

      expect(() => parseEventFromJSON(data)).toThrow(/missing required fields: event_type/);
    });

    it('should throw error for missing location_coordinates', () => {
      const data = {
        event_type: 'Solar',
        energy_kwh: 10,
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10,
        timestamp: '2024-01-15T10:30:00Z'
      };

      expect(() => parseEventFromJSON(data)).toThrow(/missing required fields: location_coordinates/);
    });

    it('should throw error for missing timestamp', () => {
      const data = {
        event_type: 'Solar',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 10,
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10
      };

      expect(() => parseEventFromJSON(data)).toThrow(/missing required fields: timestamp/);
    });

    it('should throw error for multiple missing fields', () => {
      const data = {
        energy_kwh: 10
      };

      const error = () => parseEventFromJSON(data);
      expect(error).toThrow(/missing required fields/);
      expect(error).toThrow(/event_type/);
      expect(error).toThrow(/location_coordinates/);
      expect(error).toThrow(/timestamp/);
    });

    it('should throw error for invalid event_type', () => {
      const data = {
        event_type: 'InvalidType',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 10,
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10,
        timestamp: '2024-01-15T10:30:00Z'
      };

      expect(() => parseEventFromJSON(data)).toThrow(
        /event_type must be one of \[Solar, River_Cleanup, Reforestation, Carbon_Capture\]/
      );
    });

    it('should throw error for missing energy_kwh', () => {
      const data = {
        event_type: 'Solar',
        location_coordinates: { latitude: 0, longitude: 0 },
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10,
        timestamp: '2024-01-15T10:30:00Z'
      };

      expect(() => parseEventFromJSON(data)).toThrow(/missing required field: energy_kwh/);
    });

    it('should throw error for non-numeric energy_kwh', () => {
      const data = {
        event_type: 'Solar',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 'not a number',
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10,
        timestamp: '2024-01-15T10:30:00Z'
      };

      expect(() => parseEventFromJSON(data)).toThrow(/energy_kwh must be a number/);
    });

    it('should throw error for invalid location_coordinates structure', () => {
      const data = {
        event_type: 'Solar',
        location_coordinates: 'invalid',
        energy_kwh: 10,
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10,
        timestamp: '2024-01-15T10:30:00Z'
      };

      expect(() => parseEventFromJSON(data)).toThrow(
        /location_coordinates must be an object with numeric latitude and longitude/
      );
    });

    it('should throw error for missing latitude in location_coordinates', () => {
      const data = {
        event_type: 'Solar',
        location_coordinates: { longitude: 0 },
        energy_kwh: 10,
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10,
        timestamp: '2024-01-15T10:30:00Z'
      };

      expect(() => parseEventFromJSON(data)).toThrow(
        /location_coordinates must be an object with numeric latitude and longitude/
      );
    });
  });

  describe('formatEventToJSON', () => {
    it('should format EnvironmentalEvent to JSON object', () => {
      const eventData: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 25,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(eventData);
      event.impact_score = 65.5;

      const json = formatEventToJSON(event);

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('event_type', 'Solar');
      expect(json).toHaveProperty('location_coordinates');
      expect((json as any).location_coordinates.latitude).toBe(40.7128);
      expect((json as any).location_coordinates.longitude).toBe(-74.0060);
      expect(json).toHaveProperty('energy_kwh', 100);
      expect(json).toHaveProperty('co2_reduction_kg', 50);
      expect(json).toHaveProperty('ecosystem_restoration_units', 25);
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('impact_score', 65.5);
    });

    it('should format timestamp as ISO string', () => {
      const eventData: SubmitEventRequest = {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 0,
        co2_reduction_kg: 0,
        ecosystem_restoration_units: 0,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(eventData);
      const json = formatEventToJSON(event) as any;

      expect(typeof json.timestamp).toBe('string');
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include null impact_score if not set', () => {
      const eventData: SubmitEventRequest = {
        event_type: 'Carbon_Capture',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 10,
        co2_reduction_kg: 10,
        ecosystem_restoration_units: 10,
        timestamp: '2024-01-15T10:30:00Z'
      };

      const event = new EnvironmentalEvent(eventData);
      const json = formatEventToJSON(event);

      expect(json).toHaveProperty('impact_score', null);
    });
  });

  describe('Property-Based Tests', () => {
    // Custom arbitrary for valid event data
    const validEventArbitrary = fc.record({
      event_type: fc.constantFrom<ImpactCategory>('Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'),
      location_coordinates: fc.record({
        latitude: fc.float({ min: -90, max: 90, noNaN: true }),
        longitude: fc.float({ min: -180, max: 180, noNaN: true })
      }),
      energy_kwh: fc.float({ min: 0, max: 1000, noNaN: true }),
      co2_reduction_kg: fc.float({ min: 0, max: 1000, noNaN: true }),
      ecosystem_restoration_units: fc.float({ min: 0, max: 1000, noNaN: true }),
      timestamp: fc.date().map(d => d.toISOString())
    });

    // Feature: eco-swarm-climate-fund, Property 11: Event Parsing Round-Trip
    it('should preserve all fields through parse-format-parse round-trip', () => {
      fc.assert(
        fc.property(validEventArbitrary, (eventData) => {
          // Parse from data
          const event1 = parseEventFromJSON(eventData);
          
          // Format to JSON
          const json = formatEventToJSON(event1);
          
          // Parse again from JSON
          const event2 = parseEventFromJSON(json);
          
          // Verify all fields match (except id which is generated)
          expect(event2.event_type).toBe(event1.event_type);
          expect(event2.location_coordinates.latitude).toBeCloseTo(event1.location_coordinates.latitude, 5);
          expect(event2.location_coordinates.longitude).toBeCloseTo(event1.location_coordinates.longitude, 5);
          expect(event2.energy_kwh).toBeCloseTo(event1.energy_kwh, 5);
          expect(event2.co2_reduction_kg).toBeCloseTo(event1.co2_reduction_kg, 5);
          expect(event2.ecosystem_restoration_units).toBeCloseTo(event1.ecosystem_restoration_units, 5);
          expect(event2.timestamp.toISOString()).toBe(event1.timestamp.toISOString());
        }),
        { numRuns: 100 }
      );
    });

    // Feature: eco-swarm-climate-fund, Property 1: Valid Event Structure
    it('should parse any valid event data into EnvironmentalEvent with required fields', () => {
      fc.assert(
        fc.property(validEventArbitrary, (eventData) => {
          const event = parseEventFromJSON(eventData);
          
          // Verify all required fields exist
          expect(event).toHaveProperty('id');
          expect(event).toHaveProperty('event_type');
          expect(event).toHaveProperty('location_coordinates');
          expect(event).toHaveProperty('energy_kwh');
          expect(event).toHaveProperty('co2_reduction_kg');
          expect(event).toHaveProperty('ecosystem_restoration_units');
          expect(event).toHaveProperty('timestamp');
          
          // Verify event_type is one of four categories
          expect(['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture']).toContain(event.event_type);
          
          // Verify coordinates are within bounds
          expect(event.location_coordinates.latitude).toBeGreaterThanOrEqual(-90);
          expect(event.location_coordinates.latitude).toBeLessThanOrEqual(90);
          expect(event.location_coordinates.longitude).toBeGreaterThanOrEqual(-180);
          expect(event.location_coordinates.longitude).toBeLessThanOrEqual(180);
        }),
        { numRuns: 100 }
      );
    });

    it('should format any EnvironmentalEvent to JSON with all required fields', () => {
      fc.assert(
        fc.property(validEventArbitrary, (eventData) => {
          const event = parseEventFromJSON(eventData);
          const json = formatEventToJSON(event) as any;
          
          // Verify all fields are present in JSON
          expect(json).toHaveProperty('id');
          expect(json).toHaveProperty('event_type');
          expect(json).toHaveProperty('location_coordinates');
          expect(json.location_coordinates).toHaveProperty('latitude');
          expect(json.location_coordinates).toHaveProperty('longitude');
          expect(json).toHaveProperty('energy_kwh');
          expect(json).toHaveProperty('co2_reduction_kg');
          expect(json).toHaveProperty('ecosystem_restoration_units');
          expect(json).toHaveProperty('timestamp');
          expect(json).toHaveProperty('impact_score');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject events with invalid event_type', () => {
      fc.assert(
        fc.property(
          fc.record({
            event_type: fc.string({ minLength: 1 }).filter(s => !['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'].includes(s)),
            location_coordinates: fc.record({
              latitude: fc.float({ min: -90, max: 90, noNaN: true }),
              longitude: fc.float({ min: -180, max: 180, noNaN: true })
            }),
            energy_kwh: fc.float({ min: 0, max: 1000, noNaN: true }),
            co2_reduction_kg: fc.float({ min: 0, max: 1000, noNaN: true }),
            ecosystem_restoration_units: fc.float({ min: 0, max: 1000, noNaN: true }),
            timestamp: fc.date().map(d => d.toISOString())
          }),
          (invalidData) => {
            expect(() => parseEventFromJSON(invalidData)).toThrow(/event_type must be one of/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
