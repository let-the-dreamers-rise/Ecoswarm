import {
  AccountBalanceQuery,
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType,
  TopicCreateTransaction
} from '@hashgraph/sdk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(__dirname, '../../.env');
const backendEnvPath = resolve(__dirname, '../.env');
dotenv.config({ path: rootEnvPath });

function parsePrivateKey(rawKey) {
  if (!rawKey) {
    throw new Error('Missing HEDERA_PRIVATE_KEY');
  }

  if (rawKey.startsWith('0x')) {
    return PrivateKey.fromStringECDSA(rawKey);
  }

  return PrivateKey.fromString(rawKey);
}

function hasConfiguredValue(value) {
  return Boolean(
    value &&
    !['YOUR_TOPIC_ID_HERE', '0.0.YOUR_ACCOUNT_ID', 'YOUR_PRIVATE_KEY_HERE'].includes(value)
  );
}

function createClient(network, accountId, privateKey) {
  if (network !== 'testnet') {
    throw new Error(`Unsupported HEDERA_NETWORK "${network}". Use "testnet".`);
  }

  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(accountId), privateKey);
  return client;
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

async function createTopic(client, publicKey) {
  const response = await new TopicCreateTransaction()
    .setTopicMemo('EcoSwarm Regen proof-to-payout event stream')
    .setAdminKey(publicKey)
    .setSubmitKey(publicKey)
    .setMaxTransactionFee(new Hbar(2))
    .execute(client);

  const receipt = await response.getReceipt(client);

  return {
    topicId: receipt.topicId?.toString(),
    transactionId: response.transactionId.toString()
  };
}

async function createImpactToken(client, accountId, publicKey, { name, symbol, memo }) {
  const response = await new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTokenMemo(memo)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(accountId)
    .setInitialSupply(0)
    .setDecimals(0)
    .setAdminKey(publicKey)
    .setSupplyKey(publicKey)
    .setMaxTransactionFee(new Hbar(20))
    .execute(client);

  const receipt = await response.getReceipt(client);

  return {
    tokenId: receipt.tokenId?.toString(),
    transactionId: response.transactionId.toString()
  };
}

async function createImpactCertificateCollection(client, accountId, publicKey) {
  const response = await new TokenCreateTransaction()
    .setTokenName('EcoSwarm Impact Certificate')
    .setTokenSymbol('ECERT')
    .setTokenMemo('Shared NFT certificate collection for EcoSwarm verified releases')
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(accountId)
    .setInitialSupply(0)
    .setAdminKey(publicKey)
    .setSupplyKey(publicKey)
    .setMaxTransactionFee(new Hbar(20))
    .execute(client);

  const receipt = await response.getReceipt(client);

  return {
    tokenId: receipt.tokenId?.toString(),
    transactionId: response.transactionId.toString()
  };
}

async function ensureAsset({ currentValue, creator, label }) {
  if (hasConfiguredValue(currentValue)) {
    return {
      status: 'reused',
      value: currentValue,
      transactionId: null,
      label
    };
  }

  const created = await creator();
  return {
    status: 'created',
    value: created.topicId || created.tokenId,
    transactionId: created.transactionId,
    label
  };
}

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyRaw = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || 'testnet';

  if (!accountId || !privateKeyRaw) {
    throw new Error('Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY before running this script.');
  }

  const privateKey = parsePrivateKey(privateKeyRaw);
  const publicKey = privateKey.publicKey;
  const client = createClient(network, accountId, privateKey);

  try {
    const balance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(client);

    console.log(`Operator balance: ${balance.hbars.toString()}`);

    const topic = await ensureAsset({
      currentValue: process.env.HEDERA_TOPIC_ID,
      label: 'HCS topic',
      creator: () => createTopic(client, publicKey)
    });

    const tokenDefinitions = [
      {
        envKey: 'SOLAR_TOKEN_ID',
        label: 'Solar receipt token',
        name: 'EcoSwarm Solar Impact Receipt',
        symbol: 'ESOLAR',
        memo: 'EcoSwarm Regen solar intervention receipt'
      },
      {
        envKey: 'CLEANUP_TOKEN_ID',
        label: 'Cleanup receipt token',
        name: 'EcoSwarm Cleanup Impact Receipt',
        symbol: 'ECLEAN',
        memo: 'EcoSwarm Regen river cleanup receipt'
      },
      {
        envKey: 'REFORESTATION_TOKEN_ID',
        label: 'Reforestation receipt token',
        name: 'EcoSwarm Reforestation Impact Receipt',
        symbol: 'EREGEN',
        memo: 'EcoSwarm Regen reforestation receipt'
      },
      {
        envKey: 'CARBON_CAPTURE_TOKEN_ID',
        label: 'Carbon capture receipt token',
        name: 'EcoSwarm Carbon Capture Receipt',
        symbol: 'ECARB',
        memo: 'EcoSwarm Regen carbon capture receipt'
      }
    ];

    const ensuredTokens = {};
    for (const definition of tokenDefinitions) {
      ensuredTokens[definition.envKey] = await ensureAsset({
        currentValue: process.env[definition.envKey],
        label: definition.label,
        creator: () => createImpactToken(client, accountId, publicKey, definition)
      });
    }

    const impactCertificateCollection = await ensureAsset({
      currentValue: process.env.IMPACT_CERTIFICATE_TOKEN_ID,
      label: 'Impact certificate NFT collection',
      creator: () => createImpactCertificateCollection(client, accountId, publicKey)
    });

    const envUpdates = {
      HEDERA_ACCOUNT_ID: accountId,
      HEDERA_PRIVATE_KEY: privateKeyRaw,
      HEDERA_NETWORK: network,
      HEDERA_TOPIC_ID: topic.value,
      SOLAR_TOKEN_ID: ensuredTokens.SOLAR_TOKEN_ID.value,
      CLEANUP_TOKEN_ID: ensuredTokens.CLEANUP_TOKEN_ID.value,
      REFORESTATION_TOKEN_ID: ensuredTokens.REFORESTATION_TOKEN_ID.value,
      CARBON_CAPTURE_TOKEN_ID: ensuredTokens.CARBON_CAPTURE_TOKEN_ID.value,
      IMPACT_CERTIFICATE_TOKEN_ID: impactCertificateCollection.value
    };

    updateEnvFile(rootEnvPath, envUpdates);
    updateEnvFile(backendEnvPath, envUpdates);

    const summary = {
      topic,
      tokens: ensuredTokens,
      impactCertificateCollection,
      updatedEnvFiles: [rootEnvPath, backendEnvPath]
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
