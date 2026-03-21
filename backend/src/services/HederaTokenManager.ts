import { Client, TokenMintTransaction, PrivateKey, AccountId, TokenId } from '@hashgraph/sdk';
import { ImpactCategory } from '../types/index.js';
import { TokenBalances } from '../models/TokenBalances.js';
import { parseHederaPrivateKey } from '../utils/hederaKey.js';

/**
 * HederaTokenManager integrates with Hedera Token Service to mint impact tokens
 * Handles token minting with retry logic and graceful degradation
 */
export class HederaTokenManager {
  private client: Client | null = null;
  private mockMode: boolean = false;
  private tokenBalances: TokenBalances;
  private tokenIds: Map<ImpactCategory, string>;

  constructor(tokenBalances: TokenBalances) {
    this.tokenBalances = tokenBalances;
    this.tokenIds = new Map();
    this.initializeClient();
  }

  /**
   * Initialize Hedera client with testnet configuration
   * Falls back to mock mode if credentials are missing
   */
  private initializeClient(): void {
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    const network = process.env.HEDERA_NETWORK || 'testnet';

    // Check if credentials are properly configured
    if (!accountId || !privateKey || 
        accountId === '0.0.YOUR_ACCOUNT_ID' || 
        privateKey === 'YOUR_PRIVATE_KEY_HERE') {
      console.warn('Hedera credentials not configured - operating in mock mode');
      this.mockMode = true;
      return;
    }

    try {
      // Initialize Hedera client for testnet
      if (network === 'testnet') {
        this.client = Client.forTestnet();
      } else {
        console.warn(`Unknown network: ${network}, falling back to mock mode`);
        this.mockMode = true;
        return;
      }

      // Set operator account
      this.client.setOperator(
        AccountId.fromString(accountId),
        parseHederaPrivateKey(privateKey)
      );

      // Load token IDs from environment variables
      this.loadTokenIds();

      console.log('Hedera Token Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Hedera client:', error);
      this.mockMode = true;
      this.client = null;
    }
  }

  /**
   * Load token IDs for each impact category from environment variables
   */
  private loadTokenIds(): void {
    const solarTokenId = process.env.SOLAR_TOKEN_ID;
    const cleanupTokenId = process.env.CLEANUP_TOKEN_ID;
    const reforestationTokenId = process.env.REFORESTATION_TOKEN_ID;
    const carbonCaptureTokenId = process.env.CARBON_CAPTURE_TOKEN_ID;

    if (solarTokenId) this.tokenIds.set('Solar', solarTokenId);
    if (cleanupTokenId) this.tokenIds.set('River_Cleanup', cleanupTokenId);
    if (reforestationTokenId) this.tokenIds.set('Reforestation', reforestationTokenId);
    if (carbonCaptureTokenId) this.tokenIds.set('Carbon_Capture', carbonCaptureTokenId);

    if (this.tokenIds.size === 0) {
      console.warn('No token IDs configured - token minting will be simulated');
    }
  }

  /**
   * Mint tokens proportional to impact score
   * @param category - The environmental impact category
   * @param impactScore - The calculated impact score
   * @returns Transaction ID on success, null on failure
   */
  async mintTokens(category: ImpactCategory, impactScore: number): Promise<string | null> {
    // Validate impact score is non-negative
    if (impactScore < 0) {
      console.error(`Invalid impact score: ${impactScore} (must be non-negative)`);
      return null;
    }

    // Calculate token amount (1 token per 10 impact score points)
    const tokenAmount = Math.floor(impactScore / 10);

    if (tokenAmount === 0) {
      console.log(`Impact score ${impactScore} too low to mint tokens (minimum 10 required)`);
      return null;
    }

    // Mock mode: simulate minting
    if (this.mockMode || !this.client) {
      console.log(`[MOCK] Minting ${tokenAmount} tokens for category ${category}`);
      this.tokenBalances.mint(category, impactScore);
      return `mock-tx-id-${Date.now()}`;
    }

    // Get token ID for category
    const tokenId = this.tokenIds.get(category);
    if (!tokenId) {
      console.error(`No token ID configured for category: ${category}`);
      // Still update local balance for demo purposes
      this.tokenBalances.mint(category, impactScore);
      return null;
    }

    // Attempt minting with retry logic
    const transactionId = await this.mintWithRetry(tokenId, tokenAmount, category, impactScore);
    
    return transactionId;
  }

  /**
   * Mint tokens with exponential backoff retry logic
   * Retries up to 3 times with delays: 1s, 2s, 4s
   */
  private async mintWithRetry(
    tokenId: string,
    tokenAmount: number,
    category: ImpactCategory,
    impactScore: number,
    attempt: number = 1
  ): Promise<string | null> {
    try {
      // Create token mint transaction
      const transaction = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(tokenId))
        .setAmount(tokenAmount);

      // Execute transaction
      const txResponse = await transaction.execute(this.client!);
      
      // Get receipt to confirm success
      const receipt = await txResponse.getReceipt(this.client!);
      
      // Update local token balance
      this.tokenBalances.mint(category, impactScore);

      const transactionId = txResponse.transactionId.toString();
      console.log(`Successfully minted ${tokenAmount} tokens for ${category}, TX: ${transactionId}`);
      
      return transactionId;
    } catch (error) {
      console.error(`Token minting attempt ${attempt} failed:`, error);

      // Retry with exponential backoff
      if (attempt < 3) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${delayMs}ms...`);
        
        await this.sleep(delayMs);
        return this.mintWithRetry(tokenId, tokenAmount, category, impactScore, attempt + 1);
      }

      // All retries failed - log error but don't throw
      console.error(`Token minting failed after 3 attempts for category ${category}`);
      
      // Still update local balance for demo purposes
      this.tokenBalances.mint(category, impactScore);
      
      return null;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if operating in mock mode
   */
  isMockMode(): boolean {
    return this.mockMode;
  }

  /**
   * Close Hedera client connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
      console.log('Hedera client connection closed');
    }
  }
}
