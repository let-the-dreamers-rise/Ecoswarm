import { Client, TopicMessageSubmitTransaction, PrivateKey, AccountId, TopicId } from '@hashgraph/sdk';
import { HederaEventRecord } from '../types/index.js';
import { parseHederaPrivateKey } from '../utils/hederaKey.js';

/**
 * HederaEventRecorder integrates with Hedera Consensus Service to record system events
 * Handles event recording with retry logic and graceful degradation
 */
export class HederaEventRecorder {
  private client: Client | null = null;
  private mockMode: boolean = false;
  private topicId: string | null = null;
  private mockSequence: number = 0;

  constructor() {
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
    const topicId = process.env.HEDERA_TOPIC_ID;

    // Check if credentials are properly configured
    if (!accountId || !privateKey || 
        accountId === '0.0.YOUR_ACCOUNT_ID' || 
        privateKey === 'YOUR_PRIVATE_KEY_HERE') {
      console.warn('Hedera credentials not configured - Event Recorder operating in mock mode');
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

      // Load topic ID
      if (topicId && topicId !== 'YOUR_TOPIC_ID_HERE') {
        this.topicId = topicId;
      } else {
        console.warn('Hedera topic ID not configured - Event Recorder will operate in mock mode');
        this.mockMode = true;
      }

      console.log('Hedera Event Recorder initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Hedera client:', error);
      this.mockMode = true;
      this.client = null;
    }
  }

  /**
   * Record a system event to Hedera Consensus Service
   * @param eventType - Type of event to record
   * @param payload - Event data payload
   * @returns Transaction ID on success, null on failure
   */
  async recordEvent(
    eventType:
      | 'impact_event_detected'
      | 'impact_score_calculated'
      | 'payout_case_prepared'
      | 'portfolio_rebalanced'
      | 'impact_verified'
      | 'verifier_review_requested'
      | 'sponsor_release_authorized'
      | 'tranche_released',
    payload: any
  ): Promise<string | null> {
    const timestamp = new Date().toISOString();

    // Create event record
    const eventRecord: HederaEventRecord = {
      event_type: eventType,
      timestamp,
      payload,
      transaction_id: undefined
    };

    // Mock mode: simulate recording
    if (this.mockMode || !this.client || !this.topicId) {
      const mockTxId = this.createMockTransactionId();
      console.log(`[MOCK] Recording event: ${eventType} at ${timestamp}`);
      return mockTxId;
    }

    // Attempt recording with retry logic
    const transactionId = await this.recordWithRetry(eventRecord, 1);
    
    return transactionId;
  }

  /**
   * Record event with exponential backoff retry logic
   * Retries up to 3 times with delays: 1s, 2s, 4s
   */
  private async recordWithRetry(
    eventRecord: HederaEventRecord,
    attempt: number = 1
  ): Promise<string | null> {
    try {
      // Serialize event record to JSON
      const message = JSON.stringify({
        event_type: eventRecord.event_type,
        timestamp: eventRecord.timestamp,
        payload: eventRecord.payload
      });

      // Create topic message submit transaction
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(this.topicId!))
        .setMessage(message);

      // Execute transaction
      const txResponse = await transaction.execute(this.client!);
      
      // Get receipt to confirm success
      await txResponse.getReceipt(this.client!);

      const transactionId = txResponse.transactionId.toString();
      console.log(`Successfully recorded event ${eventRecord.event_type}, TX: ${transactionId}`);
      
      return transactionId;
    } catch (error) {
      console.error(`Event recording attempt ${attempt} failed:`, error);

      // Retry with exponential backoff
      if (attempt < 3) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${delayMs}ms...`);
        
        await this.sleep(delayMs);
        return this.recordWithRetry(eventRecord, attempt + 1);
      }

      // All retries failed - log error but don't throw (graceful degradation)
      console.error(`Event recording failed after 3 attempts for event type ${eventRecord.event_type}`);
      console.error('System will continue processing in offline mode');
      
      return null;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createMockTransactionId(): string {
    this.mockSequence += 1;
    return `mock-tx-id-${Date.now()}${String(this.mockSequence).padStart(3, '0')}`;
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
      console.log('Hedera Event Recorder client connection closed');
    }
  }
}
