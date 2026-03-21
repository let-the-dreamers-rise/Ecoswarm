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

function parsePrivateKey(rawKey) {
  if (!rawKey) {
    throw new Error('Missing HEDERA_PRIVATE_KEY');
  }

  if (rawKey.startsWith('0x')) {
    return PrivateKey.fromStringECDSA(rawKey);
  }

  return PrivateKey.fromString(rawKey);
}

function createClient(network, accountId, privateKey) {
  if (network !== 'testnet') {
    throw new Error(`Unsupported HEDERA_NETWORK "${network}". Use "testnet".`);
  }

  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(accountId), privateKey);
  return client;
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

    const topic = await createTopic(client, publicKey);

    const tokenDefinitions = [
      {
        envKey: 'SOLAR_TOKEN_ID',
        name: 'EcoSwarm Solar Impact Receipt',
        symbol: 'ESOLAR',
        memo: 'EcoSwarm Regen solar intervention receipt'
      },
      {
        envKey: 'CLEANUP_TOKEN_ID',
        name: 'EcoSwarm Cleanup Impact Receipt',
        symbol: 'ECLEAN',
        memo: 'EcoSwarm Regen river cleanup receipt'
      },
      {
        envKey: 'REFORESTATION_TOKEN_ID',
        name: 'EcoSwarm Reforestation Impact Receipt',
        symbol: 'EREGEN',
        memo: 'EcoSwarm Regen reforestation receipt'
      },
      {
        envKey: 'CARBON_CAPTURE_TOKEN_ID',
        name: 'EcoSwarm Carbon Capture Receipt',
        symbol: 'ECARB',
        memo: 'EcoSwarm Regen carbon capture receipt'
      }
    ];

    const createdTokens = {};
    for (const definition of tokenDefinitions) {
      const created = await createImpactToken(client, accountId, publicKey, definition);
      createdTokens[definition.envKey] = created;
    }

    const envBlock = [
      `HEDERA_ACCOUNT_ID=${accountId}`,
      `HEDERA_PRIVATE_KEY=${privateKeyRaw}`,
      `HEDERA_NETWORK=${network}`,
      `HEDERA_TOPIC_ID=${topic.topicId}`,
      '',
      `SOLAR_TOKEN_ID=${createdTokens.SOLAR_TOKEN_ID.tokenId}`,
      `CLEANUP_TOKEN_ID=${createdTokens.CLEANUP_TOKEN_ID.tokenId}`,
      `REFORESTATION_TOKEN_ID=${createdTokens.REFORESTATION_TOKEN_ID.tokenId}`,
      `CARBON_CAPTURE_TOKEN_ID=${createdTokens.CARBON_CAPTURE_TOKEN_ID.tokenId}`
    ].join('\n');

    console.log(
      JSON.stringify(
        {
          topic,
          tokens: createdTokens,
          envBlock
        },
        null,
        2
      )
    );
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
