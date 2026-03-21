import { describe, it, expect } from 'vitest';
import { AggregateMetrics } from '../models/AggregateMetrics.js';
import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import { SubmitEventRequest } from '../types/index.js';

describe('AggregateMetrics', () => {
  it('should initialize all metrics to 0', () => {
    const metrics = new AggregateMetrics();
    
    expect(metrics.total_co2_reduced_kg).toBe(0);
    expect(metrics.total_energy_generated_kwh).toBe(0);
    expect(metrics.total_projects_funded).toBe(0);
    expect(metrics.total_events_processed).toBe(0);
  });

  it('should update metrics from a single event', () => {
    const metrics = new AggregateMetrics();
    const eventData: SubmitEventRequest = {
      event_type: 'Solar',
      location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
      energy_kwh: 100,
      co2_reduction_kg: 50,
      ecosystem_restoration_units: 25,
      timestamp: new Date().toISOString()
    };
    const event = new EnvironmentalEvent(eventData);
    
    metrics.updateFromEvent(event);
    
    expect(metrics.total_co2_reduced_kg).toBe(50);
    expect(metrics.total_energy_generated_kwh).toBe(100);
    expect(metrics.total_projects_funded).toBe(1);
    expect(metrics.total_events_processed).toBe(1);
  });

  it('should accumulate metrics from multiple events', () => {
    const metrics = new AggregateMetrics();
    
    const event1Data: SubmitEventRequest = {
      event_type: 'Solar',
      location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
      energy_kwh: 100,
      co2_reduction_kg: 50,
      ecosystem_restoration_units: 25,
      timestamp: new Date().toISOString()
    };
    const event1 = new EnvironmentalEvent(event1Data);
    
    const event2Data: SubmitEventRequest = {
      event_type: 'River_Cleanup',
      location_coordinates: { latitude: 34.0522, longitude: -118.2437 },
      energy_kwh: 75,
      co2_reduction_kg: 30,
      ecosystem_restoration_units: 40,
      timestamp: new Date().toISOString()
    };
    const event2 = new EnvironmentalEvent(event2Data);
    
    metrics.updateFromEvent(event1);
    metrics.updateFromEvent(event2);
    
    expect(metrics.total_co2_reduced_kg).toBe(80);
    expect(metrics.total_energy_generated_kwh).toBe(175);
    expect(metrics.total_projects_funded).toBe(2);
    expect(metrics.total_events_processed).toBe(2);
  });

  it('should handle events with zero metrics', () => {
    const metrics = new AggregateMetrics();
    const eventData: SubmitEventRequest = {
      event_type: 'Carbon_Capture',
      location_coordinates: { latitude: 0, longitude: 0 },
      energy_kwh: 0,
      co2_reduction_kg: 0,
      ecosystem_restoration_units: 0,
      timestamp: new Date().toISOString()
    };
    const event = new EnvironmentalEvent(eventData);
    
    metrics.updateFromEvent(event);
    
    expect(metrics.total_co2_reduced_kg).toBe(0);
    expect(metrics.total_energy_generated_kwh).toBe(0);
    expect(metrics.total_projects_funded).toBe(1);
    expect(metrics.total_events_processed).toBe(1);
  });

  it('should serialize to JSON with correct structure', () => {
    const metrics = new AggregateMetrics();
    const eventData: SubmitEventRequest = {
      event_type: 'Reforestation',
      location_coordinates: { latitude: 51.5074, longitude: -0.1278 },
      energy_kwh: 200,
      co2_reduction_kg: 150,
      ecosystem_restoration_units: 80,
      timestamp: new Date().toISOString()
    };
    const event = new EnvironmentalEvent(eventData);
    
    metrics.updateFromEvent(event);
    const json = metrics.toJSON();
    
    expect(json).toMatchObject({
      total_co2_reduced_kg: 150,
      total_energy_generated_kwh: 200,
      total_projects_funded: 1,
      total_events_processed: 1
    });
    expect(json.total_households_supported).toBe(0);
    expect(json.total_capital_routed_usd).toBeGreaterThan(0);
    expect(json.average_verification_confidence).toBe(1);
  });

  it('should maintain accurate totals across many events', () => {
    const metrics = new AggregateMetrics();
    
    // Process 10 events
    for (let i = 0; i < 10; i++) {
      const eventData: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 0, longitude: 0 },
        energy_kwh: 10,
        co2_reduction_kg: 5,
        ecosystem_restoration_units: 2,
        timestamp: new Date().toISOString()
      };
      const event = new EnvironmentalEvent(eventData);
      metrics.updateFromEvent(event);
    }
    
    expect(metrics.total_co2_reduced_kg).toBe(50);
    expect(metrics.total_energy_generated_kwh).toBe(100);
    expect(metrics.total_projects_funded).toBe(10);
    expect(metrics.total_events_processed).toBe(10);
  });
});
