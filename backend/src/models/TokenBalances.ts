import { ImpactCategory } from '../types/index.js';

/**
 * TokenBalances model manages impact token balances for environmental categories
 * Tracks token counts and handles minting operations based on impact scores
 */
export class TokenBalances {
  balances: Map<string, number>;
  
  constructor() {
    this.balances = new Map([
      ['SolarImpactToken', 0],
      ['CleanupImpactToken', 0],
      ['ReforestationToken', 0],
      ['CarbonCaptureToken', 0]
    ]);
  }
  
  /**
   * Mint tokens for a given impact category based on impact score
   * Token amount is calculated as floor(impactScore / 10)
   * @param category - The environmental impact category
   * @param impactScore - The calculated impact score
   * @returns The number of tokens minted
   */
  mint(category: ImpactCategory, impactScore: number): number {
    const tokenAmount = Math.floor(impactScore / 10);
    const tokenName = this.getTokenName(category);
    const currentBalance = this.balances.get(tokenName) || 0;
    this.balances.set(tokenName, currentBalance + tokenAmount);
    return tokenAmount;
  }
  
  /**
   * Map impact category to corresponding token name
   * @param category - The environmental impact category
   * @returns The token name for the category
   */
  private getTokenName(category: ImpactCategory): string {
    const mapping: Record<ImpactCategory, string> = {
      'Solar': 'SolarImpactToken',
      'River_Cleanup': 'CleanupImpactToken',
      'Reforestation': 'ReforestationToken',
      'Carbon_Capture': 'CarbonCaptureToken'
    };
    return mapping[category];
  }
}
