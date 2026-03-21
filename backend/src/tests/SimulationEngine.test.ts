import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimulationEngine } from '../services/SimulationEngine.js';
import { ImpactCategory } from '../types/index.js';

describe('SimulationEngine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine('http://localhost:3000');
    vi.useFakeTimers();
  });

  afterEach(() => {
    engine.stopSimulation();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('generateEnvironmentalEvent', () => {
    it('should generate event with all required fields', () => {
      const event = engine.generateEnvironmentalEvent();

      expect(event).toHaveProperty('event_type');
      expect(event).toHaveProperty('location_coordinates');
      expect(event).toHaveProperty('energy_kwh');
      expect(event).toHaveProperty('co2_reduction_kg');
      expect(event).toHaveProperty('ecosystem_restoration_units');
      expect(event).toHaveProperty('timestamp');
    });

    it('should generate event_type from valid Impact_Categories', () => {
      const validCategories: ImpactCategory[] = ['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'];
      const event = engine.generateEnvironmentalEvent();

      expect(validCategories).toContain(event.event_type);
    });

    it('should generate coordinates within geographic bounds', () => {
      const event = engine.generateEnvironmentalEvent();

      expect(event.location_coordinates.latitude).toBeGreaterThanOrEqual(-90);
      expect(event.location_coordinates.latitude).toBeLessThanOrEqual(90);
      expect(event.location_coordinates.longitude).toBeGreaterThanOrEqual(-180);
      expect(event.location_coordinates.longitude).toBeLessThanOrEqual(180);
    });

    it('should generate non-negative metrics', () => {
      const event = engine.generateEnvironmentalEvent();

      expect(event.energy_kwh).toBeGreaterThanOrEqual(0);
      expect(event.co2_reduction_kg).toBeGreaterThanOrEqual(0);
      expect(event.ecosystem_restoration_units).toBeGreaterThanOrEqual(0);
    });

    it('should generate valid ISO 8601 timestamp', () => {
      const event = engine.generateEnvironmentalEvent();
      const timestamp = new Date(event.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should generate different events on multiple calls', () => {
      const event1 = engine.generateEnvironmentalEvent();
      const event2 = engine.generateEnvironmentalEvent();

      // At least one field should be different (very high probability with random generation)
      const isDifferent = 
        event1.event_type !== event2.event_type ||
        event1.location_coordinates.latitude !== event2.location_coordinates.latitude ||
        event1.energy_kwh !== event2.energy_kwh;

      expect(isDifferent).toBe(true);
    });
  });

  describe('startSimulation', () => {
    it('should set isRunning to true when started', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, event_id: 'test-id', impact_score: 100 })
      });
      global.fetch = fetchMock;

      await engine.startSimulation();

      expect(engine.getStatus()).toBe(true);
    });

    it('should submit event to POST /events endpoint', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, event_id: 'test-id', impact_score: 100 })
      });
      global.fetch = fetchMock;

      await engine.startSimulation();
      await vi.advanceTimersByTimeAsync(100);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/events',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should not start if already running', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, event_id: 'test-id', impact_score: 100 })
      });
      global.fetch = fetchMock;

      await engine.startSimulation();
      const callCountAfterFirst = fetchMock.mock.calls.length;
      
      await engine.startSimulation(); // Try to start again
      
      expect(fetchMock.mock.calls.length).toBe(callCountAfterFirst);
    });

    it('should handle fetch errors gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = fetchMock;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await engine.startSimulation();
      await vi.advanceTimersByTimeAsync(100);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(engine.getStatus()).toBe(true); // Should still be running despite error
    });
  });

  describe('stopSimulation', () => {
    it('should set isRunning to false when stopped', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, event_id: 'test-id', impact_score: 100 })
      });
      global.fetch = fetchMock;

      await engine.startSimulation();
      engine.stopSimulation();

      expect(engine.getStatus()).toBe(false);
    });

    it('should stop within 1 second', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, event_id: 'test-id', impact_score: 100 })
      });
      global.fetch = fetchMock;

      await engine.startSimulation();
      const stopTime = Date.now();
      engine.stopSimulation();
      const elapsed = Date.now() - stopTime;

      expect(elapsed).toBeLessThan(1000);
      expect(engine.getStatus()).toBe(false);
    });

    it('should clear interval when stopped', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, event_id: 'test-id', impact_score: 100 })
      });
      global.fetch = fetchMock;

      await engine.startSimulation();
      await vi.advanceTimersByTimeAsync(100);
      const callCountBeforeStop = fetchMock.mock.calls.length;

      engine.stopSimulation();
      await vi.advanceTimersByTimeAsync(10000); // Advance time significantly

      // Should not have made additional calls after stopping
      expect(fetchMock.mock.calls.length).toBe(callCountBeforeStop);
    });

    it('should handle stop when not running', () => {
      expect(() => engine.stopSimulation()).not.toThrow();
      expect(engine.getStatus()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return false initially', () => {
      expect(engine.getStatus()).toBe(false);
    });

    it('should return true when running', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, event_id: 'test-id', impact_score: 100 })
      });
      global.fetch = fetchMock;

      await engine.startSimulation();

      expect(engine.getStatus()).toBe(true);
    });

    it('should return false after stopping', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, event_id: 'test-id', impact_score: 100 })
      });
      global.fetch = fetchMock;

      await engine.startSimulation();
      engine.stopSimulation();

      expect(engine.getStatus()).toBe(false);
    });
  });
});
