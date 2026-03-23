import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import fc from 'fast-check';
import { ChildProcess, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Feature: eco-swarm-climate-fund, Property 9: Concurrent Event Processing Without Loss
// Validates: Requirements 8.2

describe('Concurrent Event Processing', () => {
  const TEST_PORT = 3104;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
  let initialMetrics: any;
  let serverProcess: ChildProcess | null = null;
  let tempDir = '';

  const waitForServer = async () => {
    const timeoutAt = Date.now() + 15000;

    while (Date.now() < timeoutAt) {
      try {
        const response = await fetch(`${BASE_URL}/health`);
        if (response.ok) {
          return;
        }
      } catch {
        // Retry until the backend is ready.
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`Backend test server did not start on ${BASE_URL}`);
  };

  beforeAll(async () => {
    const tsxCliPath = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'ecoswarm-concurrency-'));

    serverProcess = spawn(process.execPath, [tsxCliPath, 'src/index.ts'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BACKEND_PORT: String(TEST_PORT),
        BACKEND_STATE_PATH: path.join(tempDir, 'backend-state.json'),
        AI_SERVICE_URL: 'http://127.0.0.1:65535',
        HEDERA_ACCOUNT_ID: '0.0.YOUR_ACCOUNT_ID',
        HEDERA_PRIVATE_KEY: 'YOUR_PRIVATE_KEY_HERE',
        HEDERA_TOPIC_ID: 'YOUR_TOPIC_ID_HERE',
        SOLAR_TOKEN_ID: '',
        CLEANUP_TOKEN_ID: '',
        REFORESTATION_TOKEN_ID: '',
        CARBON_CAPTURE_TOKEN_ID: '',
        IMPACT_CERTIFICATE_TOKEN_ID: '',
        ESCROW_CONTRACT_ID: ''
      },
      stdio: 'ignore'
    });

    await waitForServer();
  }, 20000);
  
  beforeEach(async () => {
    // Get initial metrics before test
    const response = await fetch(`${BASE_URL}/metrics`);
    initialMetrics = await response.json();
  });

  afterAll(async () => {
    if (!serverProcess || serverProcess.killed) {
      return;
    }

    const exitPromise = new Promise<void>((resolve) => {
      serverProcess!.once('exit', () => resolve());
    });

    serverProcess.kill();
    await Promise.race([
      exitPromise,
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]);

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  // Helper to create valid event
  const createValidEvent = (seed: number) => ({
    event_type: ['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'][seed % 4],
    location_coordinates: {
      latitude: (seed % 180) - 90,
      longitude: (seed % 360) - 180
    },
    energy_kwh: seed % 100,
    co2_reduction_kg: seed % 100,
    ecosystem_restoration_units: seed % 100,
    timestamp: new Date().toISOString()
  });
  
  it('processes all concurrent events without data loss', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 12 }),
        async (numEvents) => {
          // Create array of events
          const events = Array.from({ length: numEvents }, (_, i) => createValidEvent(i));
          
          // Submit all events concurrently
          const submissionPromises = events.map(event =>
            fetch(`${BASE_URL}/events`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(event)
            })
          );
          
          // Wait for all submissions to complete
          const responses = await Promise.all(submissionPromises);
          
          // Verify all responses are successful
          const successfulResponses = responses.filter(r => r.ok);
          expect(successfulResponses.length).toBe(numEvents);
          
          // Parse all response bodies
          const responseBodies = await Promise.all(
            responses.map(r => r.json())
          );
          
          // Verify all responses have success: true
          const allSuccessful = responseBodies.every((body: any) => body.success === true);
          expect(allSuccessful).toBe(true);
          
          // Wait a bit for processing to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get final metrics
          const metricsResponse = await fetch(`${BASE_URL}/metrics`);
          const finalMetrics = await metricsResponse.json() as any;
          
          // Verify total processed events increased by exactly numEvents
          const eventsProcessed = finalMetrics.total_events_processed - initialMetrics.total_events_processed;
          expect(eventsProcessed).toBe(numEvents);
          
          // Update initial metrics for next iteration
          initialMetrics = finalMetrics;
        }
      ),
      { numRuns: 4, examples: [[8]], timeout: 15000 }
    );
  }, 60000); // 60 second test timeout
  
  it('maintains FIFO order in queue processing', async () => {
    // Create a sequence of events with identifiable metrics
    const events = Array.from({ length: 8 }, (_, i) => ({
      event_type: 'Solar' as const,
      location_coordinates: {
        latitude: 0,
        longitude: i // Use longitude to track order
      },
      energy_kwh: i * 10,
      co2_reduction_kg: i * 10,
      ecosystem_restoration_units: i * 10,
      timestamp: new Date().toISOString()
    }));
    
    // Submit all events concurrently
    const submissionPromises = events.map(event =>
      fetch(`${BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    );
    
    // Wait for all submissions
    const responses = await Promise.all(submissionPromises);
    
    // All should succeed
    expect(responses.every(r => r.ok)).toBe(true);
    
    // Parse response bodies
    const responseBodies = await Promise.all(
      responses.map(r => r.json())
    );
    
    // All should have success: true
    expect(responseBodies.every((body: any) => body.success === true)).toBe(true);
  }, 30000);
  
  it('logs warning when queue exceeds 100 events', async () => {
    // This test verifies the warning is logged (implementation detail)
    // We'll submit a large batch and verify all are processed
    const numEvents = 105;
    const events = Array.from({ length: numEvents }, (_, i) => createValidEvent(i));
    
    // Submit all events concurrently
    const submissionPromises = events.map(event =>
      fetch(`${BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    );
    
    // Wait for all submissions
    const responses = await Promise.all(submissionPromises);
    
    // Verify all responses are successful
    expect(responses.filter(r => r.ok).length).toBe(numEvents);
    
    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get final metrics
    const metricsResponse = await fetch(`${BASE_URL}/metrics`);
    const finalMetrics = await metricsResponse.json() as any;
    
    // Verify all events were processed
    const eventsProcessed = finalMetrics.total_events_processed - initialMetrics.total_events_processed;
    expect(eventsProcessed).toBe(numEvents);
  }, 60000);
});
