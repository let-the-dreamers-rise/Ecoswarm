import { describe, it, expect, beforeEach } from 'vitest';
import { TokenBalances } from '../models/TokenBalances.js';
import { ImpactCategory } from '../types/index.js';
import fc from 'fast-check';

describe('TokenBalances', () => {
  let tokenBalances: TokenBalances;

  beforeEach(() => {
    tokenBalances = new TokenBalances();
  });

  describe('constructor', () => {
    it('should initialize with zero balance for all four token types', () => {
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(0);
      expect(tokenBalances.balances.get('CleanupImpactToken')).toBe(0);
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(0);
      expect(tokenBalances.balances.get('CarbonCaptureToken')).toBe(0);
    });

    it('should have exactly four token types', () => {
      expect(tokenBalances.balances.size).toBe(4);
    });
  });

  describe('mint', () => {
    it('should mint tokens with amount floor(impactScore / 10) for Solar category', () => {
      const minted = tokenBalances.mint('Solar', 45);
      expect(minted).toBe(4);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(4);
    });

    it('should mint tokens with amount floor(impactScore / 10) for River_Cleanup category', () => {
      const minted = tokenBalances.mint('River_Cleanup', 78);
      expect(minted).toBe(7);
      expect(tokenBalances.balances.get('CleanupImpactToken')).toBe(7);
    });

    it('should mint tokens with amount floor(impactScore / 10) for Reforestation category', () => {
      const minted = tokenBalances.mint('Reforestation', 123);
      expect(minted).toBe(12);
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(12);
    });

    it('should mint tokens with amount floor(impactScore / 10) for Carbon_Capture category', () => {
      const minted = tokenBalances.mint('Carbon_Capture', 99);
      expect(minted).toBe(9);
      expect(tokenBalances.balances.get('CarbonCaptureToken')).toBe(9);
    });

    it('should accumulate tokens across multiple mints for same category', () => {
      tokenBalances.mint('Solar', 25);
      tokenBalances.mint('Solar', 35);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(5); // 2 + 3
    });

    it('should handle impact score of exactly 10', () => {
      const minted = tokenBalances.mint('Solar', 10);
      expect(minted).toBe(1);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(1);
    });

    it('should handle impact score less than 10 (mints 0 tokens)', () => {
      const minted = tokenBalances.mint('Solar', 9);
      expect(minted).toBe(0);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(0);
    });

    it('should handle impact score of 0', () => {
      const minted = tokenBalances.mint('Solar', 0);
      expect(minted).toBe(0);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(0);
    });

    it('should floor fractional token amounts', () => {
      const minted = tokenBalances.mint('Solar', 19.9);
      expect(minted).toBe(1);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(1);
    });

    it('should return the number of tokens minted', () => {
      const minted = tokenBalances.mint('Solar', 100);
      expect(minted).toBe(10);
    });

    it('should mint tokens independently for different categories', () => {
      tokenBalances.mint('Solar', 50);
      tokenBalances.mint('River_Cleanup', 30);
      tokenBalances.mint('Reforestation', 70);
      tokenBalances.mint('Carbon_Capture', 40);

      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(5);
      expect(tokenBalances.balances.get('CleanupImpactToken')).toBe(3);
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(7);
      expect(tokenBalances.balances.get('CarbonCaptureToken')).toBe(4);
    });
  });

  describe('category to token name mapping', () => {
    it('should map Solar to SolarImpactToken', () => {
      tokenBalances.mint('Solar', 10);
      expect(tokenBalances.balances.get('SolarImpactToken')).toBe(1);
    });

    it('should map River_Cleanup to CleanupImpactToken', () => {
      tokenBalances.mint('River_Cleanup', 10);
      expect(tokenBalances.balances.get('CleanupImpactToken')).toBe(1);
    });

    it('should map Reforestation to ReforestationToken', () => {
      tokenBalances.mint('Reforestation', 10);
      expect(tokenBalances.balances.get('ReforestationToken')).toBe(1);
    });

    it('should map Carbon_Capture to CarbonCaptureToken', () => {
      tokenBalances.mint('Carbon_Capture', 10);
      expect(tokenBalances.balances.get('CarbonCaptureToken')).toBe(1);
    });
  });
});

  // Property-Based Tests
  describe('Property-Based Tests', () => {
    // Feature: eco-swarm-climate-fund, Property 6: Token Minting Category Correspondence
    // **Validates: Requirements 4.2**
    it('Property 6: For any Environmental_Event with positive Impact_Score, minted tokens must correspond to event Impact_Category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ImpactCategory>('Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'),
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000) }), // Positive impact scores
          (category, impactScore) => {
            const tokenBalances = new TokenBalances();
            const initialBalances = new Map(tokenBalances.balances);
            
            tokenBalances.mint(category, impactScore);
            
            // Define the expected token name for each category
            const expectedTokenMapping: Record<ImpactCategory, string> = {
              'Solar': 'SolarImpactToken',
              'River_Cleanup': 'CleanupImpactToken',
              'Reforestation': 'ReforestationToken',
              'Carbon_Capture': 'CarbonCaptureToken'
            };
            
            const expectedTokenName = expectedTokenMapping[category];
            const expectedTokenAmount = Math.floor(impactScore / 10);
            
            // Verify the correct token type was minted
            expect(tokenBalances.balances.get(expectedTokenName)).toBe(expectedTokenAmount);
            
            // Verify other token types were not affected
            for (const [tokenName, initialBalance] of initialBalances.entries()) {
              if (tokenName !== expectedTokenName) {
                expect(tokenBalances.balances.get(tokenName)).toBe(initialBalance);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: eco-swarm-climate-fund, Property 7: Token Quantity Calculation
    // **Validates: Requirements 4.3**
    it('Property 7: For any Environmental_Event with Impact_Score above 0, minted tokens must equal floor(Impact_Score / 10)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ImpactCategory>('Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'),
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000) }), // Positive impact scores
          (category, impactScore) => {
            const tokenBalances = new TokenBalances();
            
            const mintedAmount = tokenBalances.mint(category, impactScore);
            const expectedAmount = Math.floor(impactScore / 10);
            
            // Verify the minted amount matches the formula
            expect(mintedAmount).toBe(expectedAmount);
            
            // Verify the balance was updated correctly
            const tokenMapping: Record<ImpactCategory, string> = {
              'Solar': 'SolarImpactToken',
              'River_Cleanup': 'CleanupImpactToken',
              'Reforestation': 'ReforestationToken',
              'Carbon_Capture': 'CarbonCaptureToken'
            };
            
            const tokenName = tokenMapping[category];
            expect(tokenBalances.balances.get(tokenName)).toBe(expectedAmount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
