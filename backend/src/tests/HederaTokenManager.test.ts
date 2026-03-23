import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HederaTokenManager } from '../services/HederaTokenManager.js';
import { TokenBalances } from '../models/TokenBalances.js';
import { ImpactCategory } from '../types/index.js';

describe('HederaTokenManager', () => {
  let tokenBalances: TokenBalances;
  let tokenManager: HederaTokenManager;

  beforeEach(() => {
    process.env.HEDERA_ACCOUNT_ID = '0.0.YOUR_ACCOUNT_ID';
    process.env.HEDERA_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';
    process.env.HEDERA_NETWORK = 'testnet';
    tokenBalances = new TokenBalances();
    tokenManager = new HederaTokenManager(tokenBalances);
  });

  describe('Mock Mode Operation', () => {
    it('should operate in mock mode when credentials are not configured', () => {
      expect(tokenManager.isMockMode()).toBe(true);
    });

    it('should mint tokens in mock mode and update TokenBalances', async () => {
      const category: ImpactCategory = 'Solar';
      const impactScore = 150;

      const txId = await tokenManager.mintTokens(category, impactScore);

      expect(txId).toBeTruthy();
      expect(txId).toContain('mock-tx-id-');
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(15);
    });

    it('should return null for impact scores below 10', async () => {
      const category: ImpactCategory = 'River_Cleanup';
      const impactScore = 5;

      const txId = await tokenManager.mintTokens(category, impactScore);

      expect(txId).toBeNull();
      expect(tokenBalances.balances.get('CleanupImpactToken')).toBe(0);
    });
  });

  describe('Token Amount Calculation', () => {
    it('should calculate token amount as floor(impactScore / 10)', async () => {
      const testCases = [
        { impactScore: 100, expectedTokens: 10 },
        { impactScore: 155, expectedTokens: 15 },
        { impactScore: 99, expectedTokens: 9 },
        { impactScore: 10, expectedTokens: 1 },
        { impactScore: 9, expectedTokens: 0 },
      ];

      for (const { impactScore, expectedTokens } of testCases) {
        const balances = new TokenBalances();
        const manager = new HederaTokenManager(balances);
        
        await manager.mintTokens('Solar', impactScore);
        
        expect(balances.balances.get('SolarImpactToken')).toBe(expectedTokens);
      }
    });
  });

  describe('Category to Token Mapping', () => {
    it('should map Solar to SolarImpactToken', async () => {
      await tokenManager.mintTokens('Solar', 100);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(10);
    });

    it('should map River_Cleanup to CleanupImpactToken', async () => {
      await tokenManager.mintTokens('River_Cleanup', 100);
      expect(tokenBalances.balances.get('CleanupImpactToken')).toBe(10);
    });

    it('should map Reforestation to ReforestationToken', async () => {
      await tokenManager.mintTokens('Reforestation', 100);
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(10);
    });

    it('should map Carbon_Capture to CarbonCaptureToken', async () => {
      await tokenManager.mintTokens('Carbon_Capture', 100);
      expect(tokenBalances.balances.get('CarbonCaptureToken')).toBe(10);
    });
  });

  describe('TokenBalances Integration', () => {
    it('should update TokenBalances after successful minting', async () => {
      const initialBalance = tokenBalances.balances.get('SolarImpactToken');
      
      await tokenManager.mintTokens('Solar', 250);
      
      const newBalance = tokenBalances.balances.get('SolarImpactToken');
      expect(newBalance).toBe((initialBalance || 0) + 25);
    });

    it('should accumulate tokens across multiple minting operations', async () => {
      await tokenManager.mintTokens('Solar', 100);
      await tokenManager.mintTokens('Solar', 150);
      await tokenManager.mintTokens('Solar', 75);

      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(10 + 15 + 7);
    });

    it('should track tokens independently for each category', async () => {
      await tokenManager.mintTokens('Solar', 100);
      await tokenManager.mintTokens('River_Cleanup', 200);
      await tokenManager.mintTokens('Reforestation', 150);
      await tokenManager.mintTokens('Carbon_Capture', 80);

      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(10);
      expect(tokenBalances.balances.get('CleanupImpactToken')).toBe(20);
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(15);
      expect(tokenBalances.balances.get('CarbonCaptureToken')).toBe(8);
    });
  });

  describe('Error Handling', () => {
    it('should handle zero impact score gracefully', async () => {
      const txId = await tokenManager.mintTokens('Solar', 0);
      
      expect(txId).toBeNull();
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(0);
    });

    it('should handle negative impact score gracefully', async () => {
      const txId = await tokenManager.mintTokens('Solar', -50);
      
      expect(txId).toBeNull();
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(0);
    });

    it('should not throw errors on minting failure', async () => {
      // In mock mode, this should always succeed
      // But the function should never throw even in real mode
      await expect(
        tokenManager.mintTokens('Solar', 100)
      ).resolves.toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle impact score exactly at threshold (10)', async () => {
      await tokenManager.mintTokens('Solar', 10);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(1);
    });

    it('should handle impact score just below threshold (9.99)', async () => {
      await tokenManager.mintTokens('Solar', 9.99);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(0);
    });

    it('should handle very large impact scores', async () => {
      await tokenManager.mintTokens('Solar', 10000);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(1000);
    });

    it('should handle decimal impact scores correctly', async () => {
      await tokenManager.mintTokens('Solar', 155.7);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(15);
    });
  });

  describe('Cleanup', () => {
    it('should close client connection without errors', () => {
      expect(() => tokenManager.close()).not.toThrow();
    });
  });
});
