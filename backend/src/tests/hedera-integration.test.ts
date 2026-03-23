import { describe, it, expect, beforeEach } from 'vitest';
import { Portfolio } from '../models/Portfolio.js';
import { TokenBalances } from '../models/TokenBalances.js';
import { AggregateMetrics } from '../models/AggregateMetrics.js';
import { ImpactScoreCalculator } from '../services/ImpactScoreCalculator.js';
import { HederaTokenManager } from '../services/HederaTokenManager.js';
import { HederaEventRecorder } from '../services/HederaEventRecorder.js';
import { parseEventFromJSON } from '../utils/EventParser.js';
import { SubmitEventRequest } from '../types/index.js';

describe('Hedera Integration Tests', () => {
  let portfolio: Portfolio;
  let tokenBalances: TokenBalances;
  let aggregateMetrics: AggregateMetrics;
  let impactScoreCalculator: ImpactScoreCalculator;
  let hederaTokenManager: HederaTokenManager;
  let hederaEventRecorder: HederaEventRecorder;

  beforeEach(() => {
    process.env.HEDERA_ACCOUNT_ID = '0.0.YOUR_ACCOUNT_ID';
    process.env.HEDERA_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';
    process.env.HEDERA_TOPIC_ID = 'YOUR_TOPIC_ID_HERE';
    process.env.ESCROW_CONTRACT_ID = '';
    portfolio = new Portfolio();
    tokenBalances = new TokenBalances();
    aggregateMetrics = new AggregateMetrics();
    impactScoreCalculator = new ImpactScoreCalculator();
    hederaTokenManager = new HederaTokenManager(tokenBalances);
    hederaEventRecorder = new HederaEventRecorder();
  });

  describe('Complete pipeline with Hedera integration', () => {
    it('should process event through complete flow with Hedera recording', async () => {
      const eventRequest: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 30,
        timestamp: new Date().toISOString()
      };

      // Step 1: Parse event
      const event = parseEventFromJSON(eventRequest);
      
      // Step 2: Record impact_event_detected
      const eventDetectedTxId = await hederaEventRecorder.recordEvent('impact_event_detected', {
        event_id: event.id,
        event_type: event.event_type,
        location: event.location_coordinates,
        timestamp: event.timestamp.toISOString()
      });
      
      expect(eventDetectedTxId).toBeTruthy();
      expect(typeof eventDetectedTxId).toBe('string');
      
      // Step 3: Calculate impact score
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      event.impact_score = impactScore;
      
      // Step 4: Record impact_score_calculated
      const scoreCalculatedTxId = await hederaEventRecorder.recordEvent('impact_score_calculated', {
        event_id: event.id,
        impact_score: impactScore,
        event_type: event.event_type
      });
      
      expect(scoreCalculatedTxId).toBeTruthy();
      expect(typeof scoreCalculatedTxId).toBe('string');
      
      // Step 5: Update aggregate metrics
      aggregateMetrics.updateFromEvent(event);
      
      // Step 6: Add event to portfolio
      portfolio.addEvent(event);
      
      // Step 7: Mint tokens
      const tokenMintTxId = await hederaTokenManager.mintTokens(event.event_type, impactScore);
      
      expect(tokenMintTxId).toBeTruthy();
      expect(typeof tokenMintTxId).toBe('string');
      
      // Step 8: Record impact_verified
      const impactVerifiedTxId = await hederaEventRecorder.recordEvent('impact_verified', {
        event_id: event.id,
        event_type: event.event_type,
        impact_score: impactScore,
        tokens_minted: Math.floor(impactScore / 10),
        token_mint_tx_id: tokenMintTxId
      });
      
      expect(impactVerifiedTxId).toBeTruthy();
      expect(typeof impactVerifiedTxId).toBe('string');
      
      // Verify token balance updated
      expect(tokenBalances.balances.get('SolarImpactToken')).toBeGreaterThan(0);
    });

    it('should record portfolio_rebalanced event when optimization occurs', async () => {
      const currentAllocation = {
        Solar: 25,
        River_Cleanup: 25,
        Reforestation: 25,
        Carbon_Capture: 25
      };

      const newAllocation = {
        Solar: 35,
        River_Cleanup: 21.67,
        Reforestation: 21.67,
        Carbon_Capture: 21.66
      };

      const portfolioRebalancedTxId = await hederaEventRecorder.recordEvent('portfolio_rebalanced', {
        previous_allocation: currentAllocation,
        new_allocation: newAllocation,
        decision_logic: 'Solar shows superior performance',
        impact_ratios: {
          Solar: 100,
          River_Cleanup: 50,
          Reforestation: 50,
          Carbon_Capture: 50
        }
      });

      expect(portfolioRebalancedTxId).toBeTruthy();
      expect(typeof portfolioRebalancedTxId).toBe('string');
    });

    it('should handle Hedera errors gracefully and continue processing', async () => {
      const eventRequest: SubmitEventRequest = {
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 34.0522, longitude: -118.2437 },
        energy_kwh: 80,
        co2_reduction_kg: 120,
        ecosystem_restoration_units: 100,
        timestamp: new Date().toISOString()
      };

      // Parse and process event
      const event = parseEventFromJSON(eventRequest);
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      event.impact_score = impactScore;

      // Even if Hedera operations fail (return null), processing should continue
      const eventDetectedTxId = await hederaEventRecorder.recordEvent('impact_event_detected', {
        event_id: event.id,
        event_type: event.event_type
      });

      // Transaction ID may be null if Hedera is unavailable, but should not throw
      expect(eventDetectedTxId === null || typeof eventDetectedTxId === 'string').toBe(true);

      // Update metrics and portfolio regardless of Hedera status
      aggregateMetrics.updateFromEvent(event);
      portfolio.addEvent(event);

      expect(aggregateMetrics.total_events_processed).toBe(1);
      expect(portfolio.event_history.length).toBe(1);
    });

    it('should include hedera_transaction_id in response', async () => {
      const eventRequest: SubmitEventRequest = {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 51.5074, longitude: -0.1278 },
        energy_kwh: 80,
        co2_reduction_kg: 120,
        ecosystem_restoration_units: 150,
        timestamp: new Date().toISOString()
      };

      const event = parseEventFromJSON(eventRequest);
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      event.impact_score = impactScore;

      // Record impact_verified
      const impactVerifiedTxId = await hederaEventRecorder.recordEvent('impact_verified', {
        event_id: event.id,
        event_type: event.event_type,
        impact_score: impactScore
      });

      // Simulate response structure
      const response = {
        success: true,
        event_id: event.id,
        impact_score: impactScore,
        hedera_transaction_id: impactVerifiedTxId || undefined
      };

      expect(response.success).toBe(true);
      expect(response.event_id).toBe(event.id);
      expect(response.impact_score).toBe(impactScore);
      
      // hedera_transaction_id should be present (either string or undefined)
      if (impactVerifiedTxId) {
        expect(response.hedera_transaction_id).toBe(impactVerifiedTxId);
      }
    });

    it('should complete full pipeline within 3 seconds', async () => {
      const startTime = Date.now();

      const eventRequest: SubmitEventRequest = {
        event_type: 'Carbon_Capture',
        location_coordinates: { latitude: 48.8566, longitude: 2.3522 },
        energy_kwh: 60,
        co2_reduction_kg: 90,
        ecosystem_restoration_units: 70,
        timestamp: new Date().toISOString()
      };

      // Execute complete pipeline
      const event = parseEventFromJSON(eventRequest);
      
      await hederaEventRecorder.recordEvent('impact_event_detected', {
        event_id: event.id,
        event_type: event.event_type
      });
      
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      event.impact_score = impactScore;
      
      await hederaEventRecorder.recordEvent('impact_score_calculated', {
        event_id: event.id,
        impact_score: impactScore
      });
      
      aggregateMetrics.updateFromEvent(event);
      portfolio.addEvent(event);
      
      const tokenMintTxId = await hederaTokenManager.mintTokens(event.event_type, impactScore);
      
      await hederaEventRecorder.recordEvent('impact_verified', {
        event_id: event.id,
        impact_score: impactScore,
        token_mint_tx_id: tokenMintTxId
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Pipeline should complete within 3 seconds (3000ms)
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Event recording at correct pipeline stages', () => {
    it('should record all four event types in correct order', async () => {
      const eventRequest: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 100,
        co2_reduction_kg: 50,
        ecosystem_restoration_units: 30,
        timestamp: new Date().toISOString()
      };

      const event = parseEventFromJSON(eventRequest);
      const recordedEvents: string[] = [];

      // 1. impact_event_detected - when event received
      const tx1 = await hederaEventRecorder.recordEvent('impact_event_detected', {
        event_id: event.id
      });
      if (tx1) recordedEvents.push('impact_event_detected');

      // 2. impact_score_calculated - after score computed
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      event.impact_score = impactScore;
      
      const tx2 = await hederaEventRecorder.recordEvent('impact_score_calculated', {
        event_id: event.id,
        impact_score: impactScore
      });
      if (tx2) recordedEvents.push('impact_score_calculated');

      // 3. Mint tokens
      await hederaTokenManager.mintTokens(event.event_type, impactScore);

      // 4. impact_verified - after tokens minted
      const tx3 = await hederaEventRecorder.recordEvent('impact_verified', {
        event_id: event.id,
        impact_score: impactScore
      });
      if (tx3) recordedEvents.push('impact_verified');

      // Verify all events were recorded in order
      expect(recordedEvents).toContain('impact_event_detected');
      expect(recordedEvents).toContain('impact_score_calculated');
      expect(recordedEvents).toContain('impact_verified');
      
      // Verify order
      expect(recordedEvents.indexOf('impact_event_detected')).toBeLessThan(
        recordedEvents.indexOf('impact_score_calculated')
      );
      expect(recordedEvents.indexOf('impact_score_calculated')).toBeLessThan(
        recordedEvents.indexOf('impact_verified')
      );
    });
  });

  describe('Token minting integration', () => {
    it('should mint tokens after impact score calculation', async () => {
      const eventRequest: SubmitEventRequest = {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 51.5074, longitude: -0.1278 },
        energy_kwh: 80,
        co2_reduction_kg: 120,
        ecosystem_restoration_units: 150,
        timestamp: new Date().toISOString()
      };

      const event = parseEventFromJSON(eventRequest);
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      
      expect(impactScore).toBeGreaterThan(0);

      // Mint tokens
      const tokenMintTxId = await hederaTokenManager.mintTokens(event.event_type, impactScore);
      
      expect(tokenMintTxId).toBeTruthy();
      
      // Verify token balance updated
      const expectedTokens = Math.floor(impactScore / 10);
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(expectedTokens);
    });

    it('should not mint tokens for zero impact score', async () => {
      const eventRequest: SubmitEventRequest = {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 0,
        co2_reduction_kg: 0,
        ecosystem_restoration_units: 0,
        timestamp: new Date().toISOString()
      };

      const event = parseEventFromJSON(eventRequest);
      const impactScore = impactScoreCalculator.calculateImpactScore(event);
      
      expect(impactScore).toBe(0);

      // Attempt to mint tokens
      const tokenMintTxId = await hederaTokenManager.mintTokens(event.event_type, impactScore);
      
      // Should return null for zero impact score
      expect(tokenMintTxId).toBeNull();
      
      // Token balance should remain 0
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(0);
    });
  });
});
