import {
  AccountId,
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar
} from '@hashgraph/sdk';
import { parseHederaPrivateKey } from '../utils/hederaKey.js';
import { RoleAccountBinding } from '../types/index.js';

interface ContractExecutionResult {
  transactionId: string;
  success: boolean;
  status?: string;
  errorMessage?: string;
}

/**
 * HederaSmartContractService executes escrow actions using the correct
 * server-custodied role signer instead of a single backend operator.
 */
export class HederaSmartContractService {
  private contractId: string | null = null;
  private mockMode = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const contractId = process.env.ESCROW_CONTRACT_ID;
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!accountId || !privateKey || !contractId) {
      console.warn('[SmartContract] Missing Hedera credentials or ESCROW_CONTRACT_ID - mock mode');
      this.mockMode = true;
      return;
    }

    this.contractId = contractId;
  }

  private withSigner<T>(
    signer: Pick<RoleAccountBinding, 'account_id' | 'private_key'>,
    handler: (client: Client) => Promise<T>
  ): Promise<T> {
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(signer.account_id),
      parseHederaPrivateKey(signer.private_key)
    );

    return handler(client).finally(() => client.close());
  }

  private stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(str);
    bytes.set(encoded.slice(0, 32));
    return bytes;
  }

  private decodeRevertError(rawValue: unknown): string | undefined {
    if (typeof rawValue !== 'string' || !rawValue.startsWith('0x')) {
      return typeof rawValue === 'string' && rawValue.trim() ? rawValue : undefined;
    }

    // Solidity Error(string) selector.
    if (!rawValue.startsWith('0x08c379a0') || rawValue.length < 138) {
      return rawValue;
    }

    try {
      const lengthHex = rawValue.slice(74, 138);
      const length = Number.parseInt(lengthHex, 16);
      if (!Number.isFinite(length) || length <= 0) {
        return rawValue;
      }

      const messageHex = rawValue.slice(138, 138 + (length * 2));
      return Buffer.from(messageHex, 'hex').toString('utf8');
    } catch {
      return rawValue;
    }
  }

  private async buildExecutionResult(
    client: Client,
    response: Awaited<ReturnType<ContractExecuteTransaction['execute']>>
  ): Promise<ContractExecutionResult> {
    const receipt = await response.getReceipt(client);
    const status = receipt.status.toString();

    if (status === 'SUCCESS') {
      return {
        transactionId: response.transactionId.toString(),
        success: true,
        status
      };
    }

    let errorMessage = `Contract execution returned ${status}.`;

    try {
      const record = await response.getRecord(client);
      const rawError =
        (record as any)?.contractFunctionResult?.errorMessage ??
        (record as any)?.contractFunctionResult?.contractCallResult?.errorMessage;
      const decodedError = this.decodeRevertError(rawError);
      if (decodedError) {
        errorMessage = decodedError;
      }
    } catch (recordError) {
      console.warn('[SmartContract] Unable to fetch record for failed execution:', recordError);
    }

    return {
      transactionId: response.transactionId.toString(),
      success: false,
      status,
      errorMessage
    };
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  async createProject(
    signer: RoleAccountBinding,
    projectId: string,
    verifierAddress: string,
    operatorAddress: string,
    milestoneDescriptions: string[],
    milestoneAmountsTinybar: number[],
    milestoneDeadlinesEpochSeconds: number[]
  ): Promise<ContractExecutionResult> {
    if (this.mockMode || !this.contractId) {
      return {
        transactionId: `mock-contract-tx-${Date.now()}`,
        success: true
      };
    }

    return this.withSigner(signer, async (client) => {
      try {
        const params = new ContractFunctionParameters()
          .addBytes32(this.stringToBytes32(projectId))
          .addAddress(verifierAddress)
          .addAddress(operatorAddress)
          .addStringArray(milestoneDescriptions)
          .addUint256Array(milestoneAmountsTinybar)
          .addUint256Array(milestoneDeadlinesEpochSeconds);

        const tx = new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(this.contractId!))
          .setGas(1_200_000)
          .setFunction('createProject', params);

        const response = await tx.execute(client);
        return this.buildExecutionResult(client, response);
      } catch (error) {
        console.error('[SmartContract] createProject failed:', error);
        return {
          transactionId: '',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  async depositFunds(
    signer: RoleAccountBinding,
    projectId: string,
    amountHbar: number
  ): Promise<ContractExecutionResult> {
    if (this.mockMode || !this.contractId) {
      return {
        transactionId: `mock-deposit-tx-${Date.now()}`,
        success: true
      };
    }

    return this.withSigner(signer, async (client) => {
      try {
        const params = new ContractFunctionParameters()
          .addBytes32(this.stringToBytes32(projectId));

        const tx = new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(this.contractId!))
          .setGas(250_000)
          .setFunction('depositFunds', params)
          .setPayableAmount(new Hbar(amountHbar));

        const response = await tx.execute(client);
        return this.buildExecutionResult(client, response);
      } catch (error) {
        console.error('[SmartContract] depositFunds failed:', error);
        return {
          transactionId: '',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  async approveMilestone(
    signer: RoleAccountBinding,
    projectId: string,
    milestoneIndex: number
  ): Promise<ContractExecutionResult> {
    if (this.mockMode || !this.contractId) {
      return {
        transactionId: `mock-approve-tx-${Date.now()}`,
        success: true
      };
    }

    return this.withSigner(signer, async (client) => {
      try {
        const params = new ContractFunctionParameters()
          .addBytes32(this.stringToBytes32(projectId))
          .addUint256(milestoneIndex);

        const tx = new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(this.contractId!))
          .setGas(250_000)
          .setFunction('approveMilestone', params);

        const response = await tx.execute(client);
        return this.buildExecutionResult(client, response);
      } catch (error) {
        console.error('[SmartContract] approveMilestone failed:', error);
        return {
          transactionId: '',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  async releaseMilestone(
    signer: RoleAccountBinding,
    projectId: string,
    milestoneIndex: number
  ): Promise<ContractExecutionResult> {
    if (this.mockMode || !this.contractId) {
      return {
        transactionId: `mock-release-tx-${Date.now()}`,
        success: true
      };
    }

    return this.withSigner(signer, async (client) => {
      try {
        const params = new ContractFunctionParameters()
          .addBytes32(this.stringToBytes32(projectId))
          .addUint256(milestoneIndex);

        const tx = new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(this.contractId!))
          .setGas(350_000)
          .setFunction('releaseMilestone', params);

        const response = await tx.execute(client);
        return this.buildExecutionResult(client, response);
      } catch (error) {
        console.error('[SmartContract] releaseMilestone failed:', error);
        return {
          transactionId: '',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  async refundAfterDeadline(
    signer: RoleAccountBinding,
    projectId: string,
    milestoneIndex: number
  ): Promise<ContractExecutionResult> {
    if (this.mockMode || !this.contractId) {
      return {
        transactionId: `mock-refund-tx-${Date.now()}`,
        success: true
      };
    }

    return this.withSigner(signer, async (client) => {
      try {
        const params = new ContractFunctionParameters()
          .addBytes32(this.stringToBytes32(projectId))
          .addUint256(milestoneIndex);

        const tx = new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(this.contractId!))
          .setGas(300_000)
          .setFunction('refundAfterDeadline', params);

        const response = await tx.execute(client);
        return this.buildExecutionResult(client, response);
      } catch (error) {
        console.error('[SmartContract] refundAfterDeadline failed:', error);
        return {
          transactionId: '',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  async getProjectInfo(projectId: string): Promise<{
    sponsor: string;
    verifier: string;
    operator: string;
    totalAmount: number;
    depositedAmount: number;
    releasedAmount: number;
    status: number;
    milestoneCount: number;
  } | null> {
    if (this.mockMode || !this.contractId) {
      return {
        sponsor: '0x0000000000000000000000000000000000000001',
        verifier: '0x0000000000000000000000000000000000000002',
        operator: '0x0000000000000000000000000000000000000003',
        totalAmount: 500000000,
        depositedAmount: 500000000,
        releasedAmount: 0,
        status: 0,
        milestoneCount: 3
      };
    }

    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    if (!accountId || !privateKey) {
      return null;
    }

    return this.withSigner(
      { account_id: accountId, private_key: privateKey } as RoleAccountBinding,
      async (client) => {
        try {
          const params = new ContractFunctionParameters()
            .addBytes32(this.stringToBytes32(projectId));

          const query = new ContractCallQuery()
            .setContractId(ContractId.fromString(this.contractId!))
            .setGas(50_000)
            .setFunction('getProjectInfo', params);

          const result = await query.execute(client);
          return {
            sponsor: result.getAddress(0),
            verifier: result.getAddress(1),
            operator: result.getAddress(2),
            totalAmount: Number(result.getUint256(3)),
            depositedAmount: Number(result.getUint256(4)),
            releasedAmount: Number(result.getUint256(5)),
            status: Number(result.getUint256(6)),
            milestoneCount: Number(result.getUint256(7))
          };
        } catch (error) {
          console.error('[SmartContract] getProjectInfo failed:', error);
          return null;
        }
      }
    );
  }

  async getMilestone(
    projectId: string,
    milestoneIndex: number
  ): Promise<{
    description: string;
    amount: number;
    deadlineAt: number;
    status: number;
  } | null> {
    if (this.mockMode || !this.contractId) {
      return {
        description: `Milestone ${milestoneIndex + 1}`,
        amount: 166666666,
        deadlineAt: Math.floor(Date.now() / 1000) + ((milestoneIndex + 1) * 7 * 24 * 60 * 60),
        status: 0
      };
    }

    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    if (!accountId || !privateKey) {
      return null;
    }

    return this.withSigner(
      { account_id: accountId, private_key: privateKey } as RoleAccountBinding,
      async (client) => {
        try {
          const params = new ContractFunctionParameters()
            .addBytes32(this.stringToBytes32(projectId))
            .addUint256(milestoneIndex);

          const query = new ContractCallQuery()
            .setContractId(ContractId.fromString(this.contractId!))
            .setGas(60_000)
            .setFunction('getMilestone', params);

          const result = await query.execute(client);
          return {
            description: result.getString(0),
            amount: Number(result.getUint256(1)),
            deadlineAt: Number(result.getUint256(2)),
            status: Number(result.getUint8(3))
          };
        } catch (error) {
          console.error('[SmartContract] getMilestone failed:', error);
          return null;
        }
      }
    );
  }

  async canRefundAfterDeadline(
    projectId: string,
    milestoneIndex: number
  ): Promise<boolean | null> {
    if (this.mockMode || !this.contractId) {
      return false;
    }

    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    if (!accountId || !privateKey) {
      return null;
    }

    return this.withSigner(
      { account_id: accountId, private_key: privateKey } as RoleAccountBinding,
      async (client) => {
        try {
          const params = new ContractFunctionParameters()
            .addBytes32(this.stringToBytes32(projectId))
            .addUint256(milestoneIndex);

          const query = new ContractCallQuery()
            .setContractId(ContractId.fromString(this.contractId!))
            .setGas(60_000)
            .setFunction('canRefundAfterDeadline', params);

          const result = await query.execute(client);
          return result.getBool(0);
        } catch (error) {
          console.error('[SmartContract] canRefundAfterDeadline failed:', error);
          return null;
        }
      }
    );
  }

  async getContractBalance(): Promise<number> {
    if (this.mockMode || !this.contractId) {
      return 0;
    }

    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    if (!accountId || !privateKey) {
      return 0;
    }

    return this.withSigner(
      { account_id: accountId, private_key: privateKey } as RoleAccountBinding,
      async (client) => {
        try {
          const query = new ContractCallQuery()
            .setContractId(ContractId.fromString(this.contractId!))
            .setGas(30_000)
            .setFunction('getContractBalance');

          const result = await query.execute(client);
          return Number(result.getUint256(0));
        } catch (error) {
          console.error('[SmartContract] getContractBalance failed:', error);
          return 0;
        }
      }
    );
  }

  close(): void {
    // Clients are created per signer and closed after each call.
  }
}
