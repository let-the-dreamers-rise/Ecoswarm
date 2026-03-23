# EcoSwarm Regen

Hedera-native milestone payout treasury for community climate projects.

EcoSwarm Regen is a full-stack sustainability product that turns project intake into a proof-to-payout workflow for sponsors, verifiers, and local operators. Each project becomes a milestone-backed escrow case with contract-backed release gates, HCS audit checkpoints, HTS impact receipts, shared NFT impact certificates, and AI-assisted risk analysis. The product is built for Theme 3: Sustainability in the Hedera Hello Future Apex Hackathon 2026.

## Core Thesis

This is not a sustainability dashboard. It is a payout operating system for community climate programs.

The core launch wedge is:

`Verified milestone payouts for community restoration and resilience projects.`

## Selected Track

`Theme 3: Sustainability`

## Core Workflow

1. Local operators submit climate projects with proof metadata, urgency, and beneficiary context.
2. The backend converts each intake into a milestone-backed payout case.
3. Three distinct Hedera role accounts are provisioned for the sponsor, verifier, and operator.
4. A Hedera smart contract registers the project, deadlines, and milestone economics.
5. Sponsor capital is deposited into escrow.
6. HCS records event, scoring, and payout checkpoints as an immutable audit trail.
7. AI analysis explains risk, readiness, and payout reasoning.
8. The verifier approves milestones, the sponsor releases funds, and optional HTS receipts/NFT certificates are issued.

## Hedera Integration

EcoSwarm uses seven Hedera service dimensions across the workflow:

| Service | What It Does |
| --- | --- |
| HCS | Immutable audit trail for event and payout checkpoints |
| HTS fungible | Impact receipt minting and transfer |
| HTS NFT | Shared impact certificate collection, one new serial per verified release |
| Smart Contract Service | Milestone escrow, release gating, deadline-based refund eligibility |
| Account Service | Distinct Hedera accounts for sponsor, verifier, and operator |
| Mirror Node API | Independent verification of messages, balances, and transactions |
| Scheduled Transactions | Deadline reminders and recovery support, not fake unstoppable refunds |

## Trust Model

Why Hedera instead of Web2:

- Fund release is gated by smart-contract state, not admin discretion.
- Sponsors, verifiers, and operators share an immutable HCS-backed audit trail.
- Role separation is real: each project provisions distinct Hedera accounts.
- Repeated low-cost transactions make milestone-heavy sustainability workflows economically viable.

Important MVP honesty note:

- Role private keys are held server-side for this testnet MVP.
- Scheduled transactions are used for deadline reminders, not as proof of unstoppable automatic refunds.
- The product is pilot-ready and awaiting its first live deployment.

## Product Workspaces

- `Overview`: product framing, Hedera integration thesis, market framing
- `Case Room`: shared sponsor/verifier/operator workflow for a live case
- `Operations`: intake, payout queue, treasury reasoning
- `Agent Network`: semi-autonomous triage and workflow assistance
- `Blueprint`: launch wedge, buyer value, deployment path, ROI
- `Client Portal`: sponsor-facing state and feedback loop
- `Audit Trail`: HCS records, mirror data, contract-backed status
- `Business Model / Lean Canvas`: GTM, commercial model, and market framing

## Honest Stage

Current status:

- MVP complete
- Hedera testnet integration working
- Pilot-ready
- Awaiting first live pilot

Validation framing:

- strong problem validation
- clear buyer / verifier / operator workflow
- explicit pilot wedges
- no fake live traction claims

## Hedera Impact Framing

Each project can create:

- 3 Hedera role accounts
- repeated HCS checkpoints
- smart-contract escrow actions
- HTS receipt mint / transfer activity
- an HTS NFT impact certificate serial

Pilot scenario framing:

- 50 projects could create 150+ accounts and repeated on-chain activity across escrow, receipts, and audit checkpoints

## Architecture

```text
frontend/            -> React + TypeScript + Tailwind
backend/             -> Express + WebSocket event pipeline
ai-service/          -> FastAPI + Gemini-backed analysis
backend/contracts/   -> Solidity escrow contract
backend/scripts/     -> Hedera provisioning and deployment scripts
```

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

Optional for isolated test/runtime state:

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

- `docs/APEX_SUSTAINABILITY_BRIEF.md`
- `docs/JUDGE_QA.md`
- `docs/SUBMISSION_FORM_ANSWERS.md`
- `docs/INCUBATOR_READINESS_BRIEF.md`
- `docs/HOL_BOUNTY_READINESS.md`
