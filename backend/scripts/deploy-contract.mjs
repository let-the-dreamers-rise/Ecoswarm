import {
  AccountId,
  Client,
  ContractCreateFlow,
  PrivateKey
} from '@hashgraph/sdk';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(__dirname, '../../.env');
const backendEnvPath = resolve(__dirname, '../.env');
dotenv.config({ path: rootEnvPath });

const ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID;
const PRIVATE_KEY_RAW = process.env.HEDERA_PRIVATE_KEY;
const EXISTING_CONTRACT_ID = process.env.ESCROW_CONTRACT_ID;
const shouldForce = process.argv.includes('--force');

if (!ACCOUNT_ID || !PRIVATE_KEY_RAW) {
  console.error('ERROR: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env');
  process.exit(1);
}

function parseKey(raw) {
  const cleaned = raw.startsWith('0x') ? raw.slice(2) : raw;
  try { return PrivateKey.fromStringECDSA(cleaned); } catch {}
  try { return PrivateKey.fromStringED25519(cleaned); } catch {}
  try { return PrivateKey.fromStringDer(raw); } catch {}
  throw new Error('Could not parse HEDERA_PRIVATE_KEY');
}

function updateEnvFile(filePath, updates) {
  const existing = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  let content = existing;

  for (const [key, value] of Object.entries(updates)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const line = `${key}=${value ?? ''}`;
    const pattern = new RegExp(`^${escapedKey}=.*$`, 'm');

    if (pattern.test(content)) {
      content = content.replace(pattern, line);
    } else {
      content = `${content.trimEnd()}\n${line}\n`;
    }
  }

  writeFileSync(filePath, content.trimEnd() + '\n', 'utf8');
}

async function main() {
  if (EXISTING_CONTRACT_ID && !shouldForce) {
    updateEnvFile(rootEnvPath, { ESCROW_CONTRACT_ID: EXISTING_CONTRACT_ID });
    updateEnvFile(backendEnvPath, { ESCROW_CONTRACT_ID: EXISTING_CONTRACT_ID });
    console.log(
      JSON.stringify(
        {
          status: 'reused',
          contractId: EXISTING_CONTRACT_ID,
          updatedEnvFiles: [rootEnvPath, backendEnvPath]
        },
        null,
        2
      )
    );
    return;
  }

  console.log('Compiling EcoSwarmEscrow.sol...');
  const contractPath = resolve(__dirname, '../contracts/EcoSwarmEscrow.sol');
  const outDir = resolve(__dirname, '../contracts/compiled');
  mkdirSync(outDir, { recursive: true });
  rmSync(resolve(outDir, 'EcoSwarmEscrow.bin'), { force: true });
  rmSync(resolve(outDir, 'EcoSwarmEscrow.abi'), { force: true });

  execSync(
    `npx solc --bin --abi --optimize --output-dir "${outDir}" "${contractPath}"`,
    { stdio: 'inherit' }
  );

  const compiledFiles = readdirSync(outDir);
  const binFile = compiledFiles.find((file) => file.endsWith('EcoSwarmEscrow.bin'));
  const abiFile = compiledFiles.find((file) => file.endsWith('EcoSwarmEscrow.abi'));

  if (!binFile || !abiFile) {
    throw new Error('Compiled contract artifacts were not found in the output directory.');
  }

  const bytecode = readFileSync(resolve(outDir, binFile), 'utf8').trim();
  const abi = JSON.parse(readFileSync(resolve(outDir, abiFile), 'utf8'));

  if (!bytecode) {
    throw new Error('Empty bytecode. Contract compilation failed.');
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(ACCOUNT_ID),
    parseKey(PRIVATE_KEY_RAW)
  );

  try {
    const contractTx = new ContractCreateFlow()
      .setBytecode(bytecode)
      .setGas(2_000_000);

    const txResponse = await contractTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const contractId = receipt.contractId?.toString();

    if (!contractId) {
      throw new Error('Contract deployment succeeded without returning a contract ID.');
    }

    writeFileSync(resolve(outDir, 'deployed-contract-id.txt'), contractId, 'utf8');
    writeFileSync(
      resolve(outDir, 'EcoSwarmEscrow.json'),
      JSON.stringify({ abi, contractId }, null, 2),
      'utf8'
    );

    updateEnvFile(rootEnvPath, { ESCROW_CONTRACT_ID: contractId });
    updateEnvFile(backendEnvPath, { ESCROW_CONTRACT_ID: contractId });

    console.log(
      JSON.stringify(
        {
          status: 'deployed',
          contractId,
          transactionId: txResponse.transactionId.toString(),
          hashscanUrl: `https://hashscan.io/testnet/contract/${contractId}`,
          updatedEnvFiles: [rootEnvPath, backendEnvPath]
        },
        null,
        2
      )
    );
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
