# EcoSwarm Regen

EcoSwarm Regen is a Hedera-native milestone payout treasury for community climate projects. It turns field-level project intake into sponsor-ready payout memos, ranked release queues, semi-autonomous agent operations, tokenized impact receipts, and auditable proof trails.

Instead of acting like a static climate dashboard, the project now behaves like a deployable climate finance workflow:

- local projects arrive with proof metadata, urgency, beneficiary reach, and named sponsor / verifier / operator roles
- a payout engine converts each intake into a milestone-backed treasury case with release readiness and risk flags
- an AI treasury model prioritizes capital using deployability, proof confidence, urgency, and cost efficiency
- a multi-agent operations layer compresses review, authorization, settlement, and trust-building across the same case
- HTS-style impact receipts and Hedera event records create an auditable proof-to-payout rail

## Why This Fits Apex Sustainability

The Track 3 Sustainability brief on the Hedera Hello Future Apex Hackathon 2026 event page focuses on financial systems for ecological and social impact, on-chain verification tools, community-driven models, and marketplaces that reward regeneration. EcoSwarm Regen is built directly around those four ideas.

As listed on the StackUp event page on March 20, 2026:

- Sustainability is a main track in the $200,000 main-track pool
- first place for each main track is $18,500
- the submission deadline is March 23, 2026 at 11:59 PM ET, shown on the page as March 24, 2026 at 12:59 AM EDT

## Product Thesis

Most sustainability demos stop at analytics. EcoSwarm Regen goes one layer deeper:

1. Community operators submit real-world climate projects with field-level proof context.
2. The payout engine turns each intake into a milestone-backed release memo with sponsor, verifier, and operator roles.
3. The AI treasury ranks and allocates capital toward the strongest release-ready cases.
4. Scout, verifier, treasury, settlement, and reputation agents move the workflow instead of leaving it as a manual queue.
5. Hedera-backed records make every important state change inspectable.

That gives the project a clearer answer to the judge question: "Why does this need Web3, and why Hedera?"

## Demo Story

In the current build, judges can walk through a finished multi-workspace product:

1. `Overview` frames EcoSwarm as a live sustainability treasury, not a dashboard.
2. `Case Room` locks the app onto one shared deployment case for sponsor, verifier, and operator review.
3. `Operations` shows intake, release queue, and treasury reasoning for the same focused case.
4. `Agent Network` shows how semi-autonomous agents triage proof, authorize releases, and dispatch settlement.
5. `Blueprint` shows the wedge, revenue path, Hedera moat, and 90-day pilot plan for the same case.
6. `Client Portal` shows synchronized commitments and approval-ready alerts for sponsors.
7. `Audit Trail` shows the filtered proof packets and Hedera records behind the case.

## Hedera Fit

EcoSwarm Regen is designed around the strengths of Hedera:

- Hedera Consensus Service style event recording for ordered proof and treasury checkpoints
- Hedera Token Service style impact receipts for sustainability-linked tokenized outcomes
- low-cost, high-throughput coordination for many small sustainability actions
- a future path toward Guardian-style policy workflows and broader sustainability methodology tooling

## Architecture

- `frontend/`: React + TypeScript multi-workspace product shell
- `backend/`: Express + WebSocket event pipeline
- `ai-service/`: FastAPI treasury optimizer
- `backend/src/services/SimulationEngine.ts`: curated intervention scenarios for demo mode

## Strongest Features In This Version

- Verified milestone payout framing instead of a generic climate simulator
- Curated project scenarios with proof hashes, verification sources, named sponsors, and local operators
- Multi-page product shell with `Overview`, `Case Room`, `Operations`, `Agent Network`, `Blueprint`, `Client Portal`, and `Audit Trail`
- Shared case synchronization across operator, client, and audit views
- Live case actions for verifier review, sponsor authorization, and tranche release
- Semi-autonomous agent workspace for scout, verifier, treasury, settlement, and reputation operations
- HOL-ready natural-language operator console backed by live case actions and A2A endpoints
- Deployment blueprint workspace with USP, buyer value, pricing, Hedera moat, and 90-day rollout plan
- Milestone release board showing payout sizing, upfront release, holdbacks, and proof gates
- Treasury committee queue showing ranked opportunities and suggested sponsor commitments
- Hedera event stream with readable payout-memo and proof stage labels

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+

### Install

```bash
npm run install:all
```

### Run Everything

```bash
npm run dev
```

This starts:

- backend on `http://localhost:3000`
- AI service on `http://localhost:8000`
- frontend on `http://localhost:5173`

### Individual Services

Backend:

```bash
cd backend
npm install
npm run dev
```

AI service:

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Tests

Run everything:

```bash
npm test
```

Run per service:

```bash
npm run test:backend
npm run test:frontend
```

Current verification status:

- frontend tests: passing
- frontend build: passing
- backend build: passing
- backend test suite: has older failing tests in concurrency / state-persistence areas that are not part of the new payout-flow upgrade

## Real Hedera Setup

To provision a fresh HCS topic and the four HTS impact receipt tokens:

```bash
npm run provision:hedera --prefix backend
```

Then place the generated IDs into the root `.env` file used by the backend runtime.

## HOL Agent Registration

EcoSwarm now includes a real HOL-targeted agent surface:

- natural-language operator chat at `POST /agent/chat`
- A2A agent card at `/.well-known/agent-card.json`
- A2A endpoints at `/a2a` and `/a2a/rest`

To generate a HOL quote using the current Hedera credentials and a temporary public tunnel:

```bash
$env:HOL_AGENT_PUBLIC_URL='https://<public-backend-url>'
npm run register:hol --prefix backend -- --quote-only
```

To attempt a full registration:

```bash
$env:HOL_AGENT_PUBLIC_URL='https://<public-backend-url>'
npm run register:hol --prefix backend
```

Current honest status:

- HOL auth works
- HOL quote works
- the public agent card works on a real public tunnel URL
- final registration is currently blocked by intermittent `504 Gateway Timeout` responses from `registry.hashgraphonline.com`

See `docs/HOL_BOUNTY_READINESS.md` for the exact go / no-go call on the bounty.

## Render Deployment

The repo now includes a multi-service Render Blueprint in `render.yaml` for:

- `ecoswarm-backend`
- `ecoswarm-ai`
- `ecoswarm-frontend`

The frontend no longer depends on hardcoded localhost URLs. In production it reads:

- `VITE_API_BASE_URL`
- `VITE_WS_URL`

If you deploy with Render Blueprints:

1. push this repo to GitHub
2. open the Blueprint from Render
3. set the Hedera secrets marked `sync: false`
4. deploy the stack

The backend requires these runtime secrets to be set in Render:

- `HEDERA_ACCOUNT_ID`
- `HEDERA_PRIVATE_KEY`
- `HEDERA_TOPIC_ID`
- `SOLAR_TOKEN_ID`
- `CLEANUP_TOKEN_ID`
- `REFORESTATION_TOKEN_ID`
- `CARBON_CAPTURE_TOKEN_ID`

## Submission Help

See `docs/APEX_SUSTAINABILITY_BRIEF.md` for:

- a 100-word project description
- a Track 3 framing
- a judging-criteria mapping
- a short demo script
- next-step roadmap ideas

See `docs/WINNER_PATTERN_RESEARCH.md` for:

- recent Hedera sustainability winner patterns
- what those winners have in common
- how EcoSwarm Regen has been reshaped to match those patterns

See `docs/AGENT_LAYER_RESEARCH.md` for:

- why agents belong in this product
- which operational bottlenecks they solve
- what we deliberately did not fake or overclaim

See `docs/HOL_BOUNTY_READINESS.md` for:

- the honest HOL bounty position
- the A2A / chat surface now in the product
- what still blocks a final stable registration
- why OpenClaw should still be avoided for now

See `docs/INCUBATOR_READINESS_BRIEF.md` for:

- the incubator-grade positioning
- the one-sentence pitch
- the strongest reviewer talking points

See `docs/PITCH_DECK_OUTLINE.md` and `docs/JUDGE_QA.md` for:

- a sharper deck structure
- direct answers for likely hackathon and incubator judge questions
