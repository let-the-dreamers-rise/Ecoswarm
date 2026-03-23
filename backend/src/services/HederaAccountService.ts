import {
  AccountCreateTransaction,
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  ScheduleCreateTransaction,
  TokenAssociateTransaction,
  TokenId,
  TokenMintTransaction,
  TokenType,
  TopicMessageSubmitTransaction,
  TransferTransaction
} from '@hashgraph/sdk';
import { parseHederaPrivateKey } from '../utils/hederaKey.js';
import { RoleAccountBinding, RoleAccountType } from '../types/index.js';

interface CreatedRoleAccountResult {
  success: boolean;
  role: RoleAccountType;
  accountId: string;
  solidityAddress: string;
  privateKey: string;
  createdAt: string;
  transactionId: string;
}

interface SanitizedRoleAccount {
  role: RoleAccountType;
  accountId: string;
  solidityAddress: string;
  createdAt: string;
  transactionId?: string;
}

/**
 * HederaAccountService manages server-custodied testnet role accounts,
 * token associations/transfers, and shared NFT certificate minting.
 */
export class HederaAccountService {
  private client: Client | null = null;
  private mockMode = false;
  private operatorKey: PrivateKey | null = null;
  private operatorAccountId: string | null = null;
  private network: 'testnet' = 'testnet';
  private mockCounter = 0;
  private createdAccounts: Map<string, RoleAccountBinding> = new Map();

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (
      !accountId || !privateKey ||
      accountId === '0.0.YOUR_ACCOUNT_ID' ||
      privateKey === 'YOUR_PRIVATE_KEY_HERE'
    ) {
      console.warn('[AccountService] Credentials not configured - mock mode');
      this.mockMode = true;
      return;
    }

    try {
      this.client = Client.forTestnet();
      this.operatorAccountId = accountId;
      this.operatorKey = parseHederaPrivateKey(privateKey);
      this.client.setOperator(AccountId.fromString(accountId), this.operatorKey);
      console.log('[AccountService] Initialized successfully');
    } catch (error) {
      console.error('[AccountService] Init failed:', error);
      this.mockMode = true;
    }
  }

  private createClientForSigner(accountId: string, privateKey: string | PrivateKey): Client {
    const client = Client.forTestnet();
    const signerKey = typeof privateKey === 'string' ? parseHederaPrivateKey(privateKey) : privateKey;
    client.setOperator(AccountId.fromString(accountId), signerKey);
    return client;
  }

  private toSolidityAddress(accountId: string): string {
    const address = AccountId.fromString(accountId).toSolidityAddress();
    return address.startsWith('0x') ? address : `0x${address}`;
  }

  private truncateAscii(value: string, maxLength: number): string {
    return value.length <= maxLength ? value : value.slice(0, maxLength);
  }

  private buildImpactCertificateMetadata(certificatePayload: Record<string, unknown>): Buffer {
    const compactPayload = {
      e: String(certificatePayload.event_id ?? '').slice(0, 12),
      t: String(certificatePayload.event_type ?? '').slice(0, 4),
      m: Number(certificatePayload.milestone_index ?? 0),
      r: Math.round(Number(certificatePayload.release_amount_usd ?? 0)),
      s: Math.round(Number(certificatePayload.impact_score ?? 0)),
      o: String(certificatePayload.operator_account_id ?? '').replace(/^0\.0\./, ''),
      d: String(certificatePayload.release_recorded_at ?? '').slice(0, 10)
    };

    let metadata = Buffer.from(JSON.stringify(compactPayload));
    if (metadata.length <= 100) {
      return metadata;
    }

    metadata = Buffer.from(
      `e=${compactPayload.e};m=${compactPayload.m};r=${compactPayload.r};o=${compactPayload.o};d=${compactPayload.d}`
    );

    return metadata.length <= 100 ? metadata : metadata.subarray(0, 100);
  }

  restoreAccounts(bindings: RoleAccountBinding[]): void {
    this.createdAccounts.clear();
    bindings.forEach((binding) => {
      this.createdAccounts.set(binding.account_id, binding);
    });
  }

  getAccountBinding(accountId: string): RoleAccountBinding | undefined {
    return this.createdAccounts.get(accountId);
  }

  getCreatedAccountBindings(): RoleAccountBinding[] {
    return Array.from(this.createdAccounts.values());
  }

  getCreatedAccounts(): SanitizedRoleAccount[] {
    return Array.from(this.createdAccounts.values()).map((binding) => ({
      role: binding.role,
      accountId: binding.account_id,
      solidityAddress: binding.solidity_address,
      createdAt: binding.created_at,
      transactionId: binding.transaction_id
    }));
  }

  getAccountCount(): number {
    return this.createdAccounts.size;
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  async createRoleAccount(
    role: RoleAccountType,
    projectName: string,
    initialBalanceHbar = 1
  ): Promise<CreatedRoleAccountResult> {
    if (this.mockMode || !this.client) {
      this.mockCounter += 1;
      const mockAccountId = `0.0.${9000000 + this.mockCounter}`;
      const createdAt = new Date().toISOString();
      const mockTxId = `mock-account-tx-${Date.now()}-${this.mockCounter}`;
      const binding: RoleAccountBinding = {
        role,
        account_id: mockAccountId,
        solidity_address: this.toSolidityAddress(mockAccountId),
        created_at: createdAt,
        transaction_id: mockTxId,
        private_key: `mock-private-key-${this.mockCounter}`
      };
      this.createdAccounts.set(mockAccountId, binding);
      return {
        success: true,
        role,
        accountId: mockAccountId,
        solidityAddress: binding.solidity_address,
        privateKey: binding.private_key,
        createdAt,
        transactionId: mockTxId
      };
    }

    try {
      const roleKey = PrivateKey.generateECDSA();
      const createTx = new AccountCreateTransaction()
        .setKey(roleKey.publicKey)
        .setInitialBalance(new Hbar(initialBalanceHbar))
        .setAccountMemo(`EcoSwarm ${role} - ${projectName}`);

      const response = await createTx.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      const accountId = receipt.accountId!.toString();
      const createdAt = new Date().toISOString();

      const binding: RoleAccountBinding = {
        role,
        account_id: accountId,
        solidity_address: this.toSolidityAddress(accountId),
        created_at: createdAt,
        transaction_id: response.transactionId.toString(),
        private_key: roleKey.toString()
      };

      this.createdAccounts.set(accountId, binding);

      return {
        success: true,
        role,
        accountId: accountId,
        solidityAddress: binding.solidity_address,
        privateKey: binding.private_key,
        createdAt,
        transactionId: binding.transaction_id || ''
      };
    } catch (error) {
      console.error(`[AccountService] createRoleAccount failed for ${role}:`, error);
      return {
        success: false,
        role,
        accountId: '',
        solidityAddress: '',
        privateKey: '',
        createdAt: '',
        transactionId: ''
      };
    }
  }

  async transferHbar(
    toAccountId: string,
    amountHbar: number,
    sourceBinding?: RoleAccountBinding
  ): Promise<{ transactionId: string; success: boolean }> {
    if (this.mockMode) {
      this.mockCounter += 1;
      return {
        transactionId: `mock-hbar-tx-${Date.now()}-${this.mockCounter}`,
        success: true
      };
    }

    const signerAccountId = sourceBinding?.account_id || this.operatorAccountId;
    const signerKey = sourceBinding?.private_key || this.operatorKey;
    if (!signerAccountId || !signerKey) {
      return { transactionId: '', success: false };
    }

    const signerClient = this.createClientForSigner(signerAccountId, signerKey);
    try {
      const transferTx = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(signerAccountId), new Hbar(-amountHbar))
        .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amountHbar));

      const response = await transferTx.execute(signerClient);
      await response.getReceipt(signerClient);
      return {
        transactionId: response.transactionId.toString(),
        success: true
      };
    } catch (error) {
      console.error('[AccountService] transferHbar failed:', error);
      return { transactionId: '', success: false };
    } finally {
      signerClient.close();
    }
  }

  async ensureTokenAssociation(
    accountBinding: RoleAccountBinding,
    tokenId: string
  ): Promise<{ transactionId?: string; success: boolean; skipped?: boolean }> {
    if (this.mockMode) {
      return { transactionId: `mock-associate-${Date.now()}`, success: true, skipped: true };
    }

    const associationClient = this.createClientForSigner(
      accountBinding.account_id,
      accountBinding.private_key
    );

    try {
      const tx = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountBinding.account_id))
        .setTokenIds([TokenId.fromString(tokenId)]);

      const response = await tx.execute(associationClient);
      await response.getReceipt(associationClient);
      return { transactionId: response.transactionId.toString(), success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
        return { success: true, skipped: true };
      }
      console.error('[AccountService] ensureTokenAssociation failed:', error);
      return { success: false };
    } finally {
      associationClient.close();
    }
  }

  async transferTokens(
    tokenId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    receiverBinding?: RoleAccountBinding
  ): Promise<{ transactionId: string; success: boolean; associationTxId?: string }> {
    if (this.mockMode || !this.client) {
      this.mockCounter += 1;
      return {
        transactionId: `mock-transfer-tx-${Date.now()}-${this.mockCounter}`,
        success: true
      };
    }

    let associationTxId: string | undefined;
    if (receiverBinding) {
      const associationResult = await this.ensureTokenAssociation(receiverBinding, tokenId);
      if (!associationResult.success) {
        return { transactionId: '', success: false };
      }
      associationTxId = associationResult.transactionId;
    }

    try {
      const tx = new TransferTransaction()
        .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(fromAccountId), -amount)
        .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccountId), amount);

      const response = await tx.execute(this.client);
      await response.getReceipt(this.client);

      return {
        transactionId: response.transactionId.toString(),
        success: true,
        associationTxId
      };
    } catch (error) {
      console.error('[AccountService] transferTokens failed:', error);
      return { transactionId: '', success: false, associationTxId };
    }
  }

  async mintImpactCertificateNFT(
    sharedTokenId: string,
    certificatePayload: Record<string, unknown>
  ): Promise<{ tokenId: string; serialNumber: number; transactionId: string; success: boolean }> {
    if (this.mockMode || !this.client) {
      this.mockCounter += 1;
      return {
        tokenId: sharedTokenId || `0.0.${7000000 + this.mockCounter}`,
        serialNumber: this.mockCounter,
        transactionId: `mock-nft-tx-${Date.now()}-${this.mockCounter}`,
        success: true
      };
    }

    if (!sharedTokenId) {
      console.warn('[AccountService] IMPACT_CERTIFICATE_TOKEN_ID not configured');
      return { tokenId: '', serialNumber: 0, transactionId: '', success: false };
    }

    try {
      const metadata = this.buildImpactCertificateMetadata(certificatePayload);
      const mintTx = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(sharedTokenId))
        .addMetadata(metadata);

      const response = await mintTx.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      const serialNumber = receipt.serials[0].toNumber();

      return {
        tokenId: sharedTokenId,
        serialNumber,
        transactionId: response.transactionId.toString(),
        success: true
      };
    } catch (error) {
      console.error('[AccountService] mintImpactCertificateNFT failed:', error);
      return { tokenId: '', serialNumber: 0, transactionId: '', success: false };
    }
  }

  async createScheduledMilestoneDeadline(
    projectId: string,
    deadlineNote: string
  ): Promise<{ scheduleId: string; transactionId: string; success: boolean }> {
    if (this.mockMode || !this.client) {
      this.mockCounter += 1;
      return {
        scheduleId: `0.0.${8000000 + this.mockCounter}`,
        transactionId: `mock-schedule-tx-${Date.now()}-${this.mockCounter}`,
        success: true
      };
    }

    const topicId = process.env.HEDERA_TOPIC_ID;
    if (!topicId) {
      return { scheduleId: '', transactionId: '', success: false };
    }

    try {
      const reminderTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(
          JSON.stringify({
            type: 'deadline_reminder',
            project_id: projectId,
            note: deadlineNote,
            created_at: new Date().toISOString()
          })
        );

      const scheduleTx = new ScheduleCreateTransaction()
        .setScheduledTransaction(reminderTx)
        .setScheduleMemo(
          this.truncateAscii(`EcoSwarm deadline reminder: ${deadlineNote}`, 100)
        );

      const response = await scheduleTx.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return {
        scheduleId: receipt.scheduleId?.toString() || '',
        transactionId: response.transactionId.toString(),
        success: true
      };
    } catch (error) {
      console.error('[AccountService] createScheduledMilestoneDeadline failed:', error);
      return { scheduleId: '', transactionId: '', success: false };
    }
  }

  close(): void {
    if (this.client) {
      this.client.close();
    }
  }
}
