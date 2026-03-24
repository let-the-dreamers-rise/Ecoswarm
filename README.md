# EcoSwarm Regen

**Capital should not move without proof.**

EcoSwarm Regen is a Hedera-native payout operating system for community climate projects. It turns fragmented project intake into a proof-to-payout workflow for sponsors, verifiers, and local operators, with smart-contract release gates, HCS audit checkpoints, HTS impact receipts, NFT impact certificates, and AI-assisted readiness analysis.

This project was built for **Theme 3: Sustainability** in the **Hedera Hello Future Apex Hackathon 2026**.

## Live App

- Frontend: [ecoswarm-regen-frontend.vercel.app](https://ecoswarm-regen-frontend.vercel.app)
- Backend API: [d15dx42vxcv7zo.cloudfront.net](https://d15dx42vxcv7zo.cloudfront.net/health)
- AI service: [ecoswarm-ai-live-dreamersrise.us-east-1.elasticbeanstalk.com](http://ecoswarm-ai-live-dreamersrise.us-east-1.elasticbeanstalk.com/health)

## Core Thesis

EcoSwarm Regen is not a sustainability dashboard.

It is a **payout operating system for climate programs**.

The core launch wedge is:

`Verified milestone payouts for community restoration and resilience projects.`

## What Problem It Solves

Climate funding often stalls between proof and payout:

- operators collect evidence in fragmented workflows
- verifiers review in separate systems
- sponsors hesitate to release capital without a shared, trusted state

EcoSwarm Regen solves that bottleneck by making release readiness explicit and auditable.

## How It Works

1. A local operator submits a climate project with proof metadata, urgency, and beneficiary context.
2. The backend converts that intake into a milestone-backed payout case.
3. Three distinct Hedera role accounts are provisioned for the sponsor, verifier, and operator.
4. A Hedera smart contract registers the project, role addresses, deadlines, and milestone economics.
5. Sponsor capital is deposited into escrow.
6. HCS records proof, scoring, authorization, and payout checkpoints as an immutable audit trail.
7. AI analysis explains risk, readiness, and payout reasoning.
8. The verifier approves milestones, the sponsor releases funds, and HTS receipts / NFT certificates are issued where applicable.

## Why EcoSwarm Is Different

- **Focused wedge:** one real climate-finance problem instead of a generic ESG dashboard
- **Deep Hedera fit:** seven real Hedera integrations are part of the operational flow
- **Real trust model:** role separation, contract-backed release gates, and public auditability
- **Deployable structure:** product, backend, AI service, and cloud deployment are all live

## Hedera Integration

EcoSwarm Regen uses seven Hedera service dimensions across the workflow:

| Service | What It Does |
| --- | --- |
| HCS | Immutable audit trail for proof and payout checkpoints |
| HTS fungible | Impact receipt minting and transfer |
| HTS NFT | Shared impact certificate collection, one new serial per verified release |
| Smart Contract Service | Milestone escrow, release gating, deadline-based refund eligibility |
| Account Service | Distinct Hedera accounts for sponsor, verifier, and operator |
| Mirror Node API | Independent verification of messages, balances, and transactions |
| Scheduled Transactions | Deadline reminders and recovery support |

## Live Technical Proof

These are real Hedera testnet actions executed by the app:

- Contract approve: `0.0.8348281@1774293837.643925095`
- Contract release: `0.0.8348279@1774293840.878538777`
- HCS checkpoint: `0.0.8188944@1774293848.134945783`
- HTS transfer: `0.0.8188944@1774293855.011776703`
- HTS NFT mint: `0.0.8188944@1774293855.382245882`

## Product Workspaces

- `Overview`: product framing, live treasury state, Hedera thesis
- `Case Room`: shared sponsor / verifier / operator workflow for a live case
- `Operations`: intake, release queue, payout reasoning
- `Client Portal`: sponsor-facing status, delivery, and feedback loop
- `Audit Trail`: HCS records, mirror data, contract-backed action history
- `Agent Network`: semi-autonomous triage and workflow assistance
- `Blueprint`: buyer value, pilot framing, deployment path, ROI
- `Business Model`: GTM, monetization, market framing, and lean canvas

## Honest Product Stage

Current status:

- MVP complete
- live cloud deployment
- Hedera testnet integration working
- pilot-ready
- awaiting first live pilot

Important honesty notes:

- role private keys are held server-side for this testnet MVP
- scheduled transactions are used for deadline reminders and recovery support, not fake unstoppable refunds
- the product is positioned as pilot-ready, not as already deployed commercial infrastructure

## Market Entry

EcoSwarm Regen is not trying to capture all climate finance.

The first beachhead is **milestone-based disbursement for community restoration and resilience programs**, especially where:

- sponsors need stronger payout controls
- verifiers need clearer review state
- operators need faster capital movement

Initial buyer profiles:

- CSR and ESG funding teams
- climate funds and intermediaries
- NGOs running distributed field programs
- municipal and resilience program operators

## Architecture

```text
frontend/            -> React + TypeScript + Tailwind + Vite
backend/             -> Express + WebSocket workflow engine
ai-service/          -> FastAPI + Gemini-backed analysis
backend/contracts/   -> Solidity escrow contract
backend/scripts/     -> Hedera provisioning and deployment scripts
```

## Solo Build Scope

EcoSwarm Regen was built solo, end to end, across:

- product strategy
- UX and frontend
- backend services
- AI orchestration
- Hedera integration
- smart contracts
- cloud deployment
- submission packaging

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+

### Install

```bash
npm run install:all
```

### Environment

Create `.env` with:

```env
HEDERA_ACCOUNT_ID=0.0.xxxx
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet
HEDERA_TOPIC_ID=0.0.xxxx
SOLAR_TOKEN_ID=0.0.xxxx
CLEANUP_TOKEN_ID=0.0.xxxx
REFORESTATION_TOKEN_ID=0.0.xxxx
CARBON_CAPTURE_TOKEN_ID=0.0.xxxx
IMPACT_CERTIFICATE_TOKEN_ID=0.0.xxxx
ESCROW_CONTRACT_ID=0.0.xxxx
GEMINI_API_KEY=your-gemini-key
```

Optional for isolated runtime state:

```env
BACKEND_STATE_PATH=C:\path\to\backend-state.json
```

### Provision Hedera Assets

```bash
npm run provision:hedera --prefix backend
```

### Deploy the Escrow Contract

```bash
node backend/scripts/deploy-contract.mjs
```

### Run the App

```bash
npm run dev
```

### Tests

```bash
npm test
npm run test:backend
npm run test:frontend
```

## Submission Docs

- [`docs/APEX_SUSTAINABILITY_BRIEF.md`](docs/APEX_SUSTAINABILITY_BRIEF.md)
- [`docs/JUDGE_QA.md`](docs/JUDGE_QA.md)
- [`docs/SUBMISSION_FORM_ANSWERS.md`](docs/SUBMISSION_FORM_ANSWERS.md)
- [`docs/INCUBATOR_READINESS_BRIEF.md`](docs/INCUBATOR_READINESS_BRIEF.md)
- [`docs/HOL_BOUNTY_READINESS.md`](docs/HOL_BOUNTY_READINESS.md)
- [`docs/DEMO_VIDEO_SCRIPT.md`](docs/DEMO_VIDEO_SCRIPT.md)

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).
