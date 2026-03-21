import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import localtunnel from 'localtunnel';
import {
  AIAgentCapability,
  AIAgentType,
  ProfileType,
  RegistryBrokerClient,
  isPartialRegisterAgentResponse,
  isPendingRegisterAgentResponse,
  isSuccessRegisterAgentResponse
} from '@hashgraphonline/standards-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.resolve(__dirname, '../../.env') });
loadEnv({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_BROKER_BASE_URL = 'https://hol.org/registry/api/v1';
const DEFAULT_AGENT_DISPLAY_NAME = 'EcoSwarm Regen Operator';

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function normalizePublicBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

function getCanonicalNetwork(network) {
  const raw = (network || 'testnet').trim().toLowerCase();

  if (raw.startsWith('hedera:')) {
    return raw;
  }

  if (raw === 'testnet' || raw === 'mainnet' || raw === 'previewnet') {
    return `hedera:${raw}`;
  }

  throw new Error(`Unsupported HEDERA_NETWORK "${network}". Use testnet, mainnet, previewnet, or a canonical hedera:* value.`);
}

async function maybeCreateTunnel(port) {
  const requested =
    hasFlag('--open-tunnel') || process.env.HOL_OPEN_TUNNEL === 'true';

  if (!requested) {
    return null;
  }

  const tunnel = await localtunnel({
    port,
    subdomain: process.env.HOL_AGENT_TUNNEL_SUBDOMAIN || undefined
  });

  return tunnel;
}

async function assertAgentCardReachable(publicBaseUrl) {
  const agentCardUrl = `${publicBaseUrl}/.well-known/agent-card.json`;
  const response = await fetch(agentCardUrl);

  if (!response.ok) {
    throw new Error(`Agent card check failed at ${agentCardUrl} with status ${response.status}. Start the backend before registering.`);
  }

  const agentCard = await response.json();

  if (!agentCard?.name || !agentCard?.url) {
    throw new Error(`Agent card response at ${agentCardUrl} is missing required fields.`);
  }

  return {
    agentCardUrl,
    agentCard
  };
}

function buildRegistrationPayload(publicBaseUrl) {
  const repoUrl = process.env.PUBLIC_GITHUB_URL || process.env.GITHUB_REPO_URL;
  const endpoint = `${publicBaseUrl}/a2a`;

  const profile = {
    version: '1.0.0',
    type: ProfileType.AI_AGENT,
    display_name: process.env.HOL_AGENT_DISPLAY_NAME || DEFAULT_AGENT_DISPLAY_NAME,
    bio:
      'Semi-autonomous sustainability treasury operator for verified milestone payouts, verifier review, sponsor authorization, and tranche settlement on Hedera.',
    aiAgent: {
      type: AIAgentType.AUTONOMOUS,
      model: 'ecoswarm-live-operator',
      capabilities: [
        AIAgentCapability.WORKFLOW_AUTOMATION,
        AIAgentCapability.MULTI_AGENT_COORDINATION,
        AIAgentCapability.DATA_INTEGRATION
      ]
    },
    socials: repoUrl
      ? [
          {
            platform: 'github',
            handle: repoUrl
          }
        ]
      : undefined
  };

  return {
    profile,
    registry: 'hashgraph-online',
    protocol: 'a2a',
    communicationProtocol: 'a2a',
    endpoint,
    metadata: {
      provider: 'ecoswarm-regen',
      category: 'sustainability',
      publicUrl: publicBaseUrl,
      nativeId: `ecoswarm-regen-${(process.env.HEDERA_ACCOUNT_ID || 'demo').replace(/\./g, '-')}`,
      customFields: {
        dapp: 'ecoswarm-regen',
        wedge: 'verified milestone payouts',
        track: 'sustainability',
        hederaFit: 'hcs-hts-repeatable-checkpoints'
      }
    }
  };
}

function buildClient() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  return new RegistryBrokerClient({
    baseUrl: process.env.REGISTRY_BROKER_BASE_URL || DEFAULT_BROKER_BASE_URL,
    apiKey: process.env.REGISTRY_BROKER_API_KEY || undefined,
    registrationAutoTopUp:
      accountId && privateKey
        ? {
            accountId,
            privateKey,
            memo: 'ecoswarm-hol-auto-topup'
          }
        : undefined
  });
}

async function authenticateClient(client) {
  if (process.env.REGISTRY_BROKER_API_KEY) {
    return 'api-key';
  }

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error('Set REGISTRY_BROKER_API_KEY or provide HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY for ledger authentication.');
  }

  await client.authenticateWithLedgerCredentials({
    accountId,
    network: getCanonicalNetwork(process.env.HEDERA_NETWORK || 'testnet'),
    hederaPrivateKey: privateKey,
    expiresInMinutes: 10,
    setAccountHeader: true,
    label: 'ecoswarm-hol-registration',
    logger: {
      info: (message) => console.log(`[HOL auth] ${message}`),
      warn: (message) => console.warn(`[HOL auth] ${message}`)
    }
  });

  return 'ledger-auth';
}

function printQuoteSummary(quote) {
  console.log(JSON.stringify({
    requiredCredits: quote.requiredCredits,
    shortfallCredits: quote.shortfallCredits ?? 0,
    totalPriceUsd: quote.totalPriceUsd ?? null
  }, null, 2));
}

function extractCreditShortfall(error) {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const body = error.body;

  if (!body || typeof body !== 'object') {
    return null;
  }

  if (error.status !== 402 || body.error !== 'insufficient_credits') {
    return null;
  }

  return {
    requiredCredits: Number(body.requiredCredits || 0),
    shortfallCredits: Number(body.shortfallCredits || 0),
    estimatedHbar: Number(body.estimatedHbar || 0),
    creditsPerHbar: Number(body.creditsPerHbar || 0)
  };
}

async function registerWithAutoTopUp(client, payload) {
  try {
    return await client.registerAgent(payload);
  } catch (error) {
    const shortfall = extractCreditShortfall(error);
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!shortfall || !accountId || !privateKey) {
      throw error;
    }

    const hbarAmount = Number(
      Math.max(shortfall.estimatedHbar || 0, shortfall.shortfallCredits / Math.max(shortfall.creditsPerHbar || 1, 1)) + 0.1
    .toFixed(8));

    console.log(
      `Insufficient HOL credits detected. Purchasing ${shortfall.shortfallCredits} credits with ${hbarAmount} HBAR.`
    );

    const purchase = await client.purchaseCreditsWithHbar({
      accountId,
      privateKey,
      hbarAmount,
      memo: 'ecoswarm-hol-registration',
      metadata: {
        reason: 'hol-agent-registration',
        requiredCredits: shortfall.requiredCredits,
        shortfallCredits: shortfall.shortfallCredits
      }
    });

    console.log(
      JSON.stringify(
        {
          purchasedCredits: purchase.purchasedCredits,
          balance: purchase.balance
        },
        null,
        2
      )
    );

    return client.registerAgent(payload);
  }
}

async function main() {
  const publicUrlFromEnv =
    process.env.HOL_AGENT_PUBLIC_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    process.env.AGENT_ENDPOINT;
  const backendPort = Number(process.env.BACKEND_PORT || process.env.PORT || 3000);
  const quoteOnly = hasFlag('--quote-only');
  const keepTunnelOpen = hasFlag('--keep-tunnel-open') || process.env.HOL_KEEP_TUNNEL_OPEN === 'true';

  const tunnel = publicUrlFromEnv ? null : await maybeCreateTunnel(backendPort);
  const publicBaseUrl = normalizePublicBaseUrl(
    publicUrlFromEnv || tunnel?.url || ''
  );

  if (!publicBaseUrl) {
    throw new Error(
      'Set HOL_AGENT_PUBLIC_URL or BACKEND_PUBLIC_URL, or run this script with --open-tunnel for a temporary public endpoint.'
    );
  }

  const { agentCardUrl, agentCard } = await assertAgentCardReachable(publicBaseUrl);
  const payload = buildRegistrationPayload(publicBaseUrl);
  const client = buildClient();
  let shouldKeepTunnelAlive = false;

  try {
    const authMode = await authenticateClient(client);
    console.log(`Authenticated with HOL via ${authMode}.`);
    console.log(`Agent card reachable at ${agentCardUrl}.`);
    console.log(`Agent card name: ${agentCard.name}`);

    const quote = await client.getRegistrationQuote(payload);
    console.log('Registration quote:');
    printQuoteSummary(quote);

    if (quoteOnly) {
      shouldKeepTunnelAlive = Boolean(tunnel && keepTunnelOpen);
    } else {
      const registration = await registerWithAutoTopUp(client, payload);

      if (isSuccessRegisterAgentResponse(registration)) {
        console.log(JSON.stringify({
          status: registration.status,
          uaid: registration.uaid,
          endpoint: payload.endpoint,
          publicBaseUrl
        }, null, 2));
        shouldKeepTunnelAlive = Boolean(tunnel && keepTunnelOpen);
      } else if (
        (isPendingRegisterAgentResponse(registration) || isPartialRegisterAgentResponse(registration)) &&
        registration.attemptId
      ) {
        console.log(`Registration is ${registration.status}. Waiting for completion...`);

        const final = await client.waitForRegistrationCompletion(registration.attemptId, {
          intervalMs: 2000,
          timeoutMs: 5 * 60 * 1000,
          throwOnFailure: true,
          onProgress: (progress) => {
            console.log(
              `[HOL registration] ${progress.status} ${progress.progressPercent ?? 0}% ${progress.message || ''}`.trim()
            );
          }
        });

        if (!final.uaid) {
          throw new Error(`Registration finished without a UAID. Final status: ${final.status}`);
        }

        const resolved = await client.resolveUaid(final.uaid);

        console.log(
          JSON.stringify(
            {
              status: final.status,
              uaid: final.uaid,
              endpoint: payload.endpoint,
              publicBaseUrl,
              resolvedDisplayName: resolved.agent?.profile?.display_name ?? null
            },
            null,
            2
          )
        );
        shouldKeepTunnelAlive = Boolean(tunnel && keepTunnelOpen);
      } else {
        throw new Error(`Unexpected registration response: ${JSON.stringify(registration, null, 2)}`);
      }
    }
  } finally {
    if (tunnel && !shouldKeepTunnelAlive) {
      tunnel.close();
    }
  }

  if (tunnel && shouldKeepTunnelAlive) {
    console.log(`Tunnel left open at ${publicBaseUrl}. Press Ctrl+C to close it.`);
    await new Promise(() => {});
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(error);
  }

  if (error && typeof error === 'object') {
    const details = {};
    for (const key of Object.getOwnPropertyNames(error)) {
      if (key === 'stack') {
        continue;
      }
      details[key] = error[key];
    }
    if (Object.keys(details).length > 0) {
      console.error(JSON.stringify(details, null, 2));
    }
  }

  process.exit(1);
});
