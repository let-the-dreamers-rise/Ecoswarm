import type { Express, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { AgentCard, Message, Part } from '@a2a-js/sdk';
import { AGENT_CARD_PATH } from '@a2a-js/sdk';
import {
  type AgentExecutor,
  type ExecutionEventBus,
  DefaultRequestHandler,
  InMemoryTaskStore,
  type RequestContext
} from '@a2a-js/sdk/server';
import {
  jsonRpcHandler,
  restHandler,
  UserBuilder
} from '@a2a-js/sdk/server/express';
import type { EcoSwarmAgentService } from './EcoSwarmAgentService.js';

function isTextPart(part: Part): part is Extract<Part, { kind: 'text' }> {
  return part.kind === 'text' && 'text' in part && typeof part.text === 'string';
}

class EcoSwarmA2AExecutor implements AgentExecutor {
  constructor(private readonly agentService: EcoSwarmAgentService) {}

  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const prompt = this.extractPrompt(requestContext.userMessage.parts);
    const response = await this.agentService.handleChat({
      message: prompt
    });

    const message: Message = {
      kind: 'message',
      messageId: uuidv4(),
      role: 'agent',
      contextId: requestContext.contextId,
      parts: [
        {
          kind: 'text',
          text: response.message
        }
      ]
    };

    eventBus.publish(message);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => {};

  private extractPrompt(parts: Part[]): string {
    const textPart = parts.find(isTextPart);
    return textPart?.text ?? 'Summarize the current EcoSwarm case.';
  }
}

export interface MountedA2AAgent {
  agentCard: AgentCard;
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }

  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(trimmed)) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
}

function buildAgentCard(baseUrl: string): AgentCard {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    name: 'EcoSwarm Regen Operator',
    description:
      'A sustainability treasury operator agent that can summarize live payout cases, explain the deployment wedge, and advance verifier review, release authorization, or tranche settlement.',
    protocolVersion: '0.3.0',
    version: '0.1.0',
    url: `${normalizedBaseUrl}/a2a`,
    skills: [
      {
        id: 'ecoswarm-case-operations',
        name: 'EcoSwarm Case Operations',
        description:
          'Summarize the active climate payout case, explain why Hedera fits, and dispatch the next eligible case action.',
        tags: ['sustainability', 'climate-finance', 'hedera', 'treasury', 'agent-ops'],
        examples: [
          'Summarize the active case.',
          'Show me the deployment blueprint.',
          'Authorize the next release if eligible.',
          'Why is this a fit for Hedera?'
        ]
      }
    ],
    capabilities: {
      pushNotifications: false
    },
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
    additionalInterfaces: [
      {
        url: `${normalizedBaseUrl}/a2a`,
        transport: 'JSONRPC'
      },
      {
        url: `${normalizedBaseUrl}/a2a/rest`,
        transport: 'HTTP+JSON'
      }
    ]
  };
}

function resolvePublicBaseUrl(req: Request, configuredPublicBaseUrl: string | null): string {
  if (configuredPublicBaseUrl) {
    return normalizeBaseUrl(configuredPublicBaseUrl);
  }

  const forwardedProtoHeader = req.get('x-forwarded-proto');
  const forwardedHostHeader = req.get('x-forwarded-host');
  const protocol = forwardedProtoHeader?.split(',')[0]?.trim() || req.protocol || 'http';
  const host = forwardedHostHeader?.split(',')[0]?.trim() || req.get('host');

  if (!host) {
    throw new Error('Unable to resolve public host for agent card.');
  }

  return `${protocol}://${host}`;
}

export function mountEcoSwarmA2AService(
  app: Express,
  agentService: EcoSwarmAgentService,
  publicBaseUrl: string
): MountedA2AAgent {
  const configuredBaseUrl = publicBaseUrl.trim() ? normalizeBaseUrl(publicBaseUrl) : null;
  const agentCard = buildAgentCard(configuredBaseUrl || 'http://localhost:3000');

  const requestHandler = new DefaultRequestHandler(
    agentCard,
    new InMemoryTaskStore(),
    new EcoSwarmA2AExecutor(agentService)
  );

  app.get(`/${AGENT_CARD_PATH}`, (req, res) => {
    res.json(buildAgentCard(resolvePublicBaseUrl(req, configuredBaseUrl)));
  });
  app.get('/.well-known/agent.json', (req, res) => {
    res.json(buildAgentCard(resolvePublicBaseUrl(req, configuredBaseUrl)));
  });
  app.use('/a2a', jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }));
  app.use('/a2a/rest', restHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }));

  return {
    agentCard
  };
}
