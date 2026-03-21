import type { Express } from 'express';
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
  agentCardHandler,
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

export function mountEcoSwarmA2AService(
  app: Express,
  agentService: EcoSwarmAgentService,
  publicBaseUrl: string
): MountedA2AAgent {
  const baseUrl = publicBaseUrl.replace(/\/+$/, '');
  const agentCard: AgentCard = {
    name: 'EcoSwarm Regen Operator',
    description:
      'A sustainability treasury operator agent that can summarize live payout cases, explain the deployment wedge, and advance verifier review, release authorization, or tranche settlement.',
    protocolVersion: '0.3.0',
    version: '0.1.0',
    url: `${baseUrl}/a2a`,
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
        url: `${baseUrl}/a2a`,
        transport: 'JSONRPC'
      },
      {
        url: `${baseUrl}/a2a/rest`,
        transport: 'HTTP+JSON'
      }
    ]
  };

  const requestHandler = new DefaultRequestHandler(
    agentCard,
    new InMemoryTaskStore(),
    new EcoSwarmA2AExecutor(agentService)
  );

  app.use(`/${AGENT_CARD_PATH}`, agentCardHandler({ agentCardProvider: requestHandler }));
  app.get('/.well-known/agent.json', (_req, res) => {
    res.json(agentCard);
  });
  app.use('/a2a', jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }));
  app.use('/a2a/rest', restHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }));

  return {
    agentCard
  };
}
