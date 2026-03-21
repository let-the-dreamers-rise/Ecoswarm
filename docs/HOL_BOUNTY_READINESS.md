# Hashgraph Online Bounty Readiness

## Current Verdict

`Hashgraph Online` is now the only bounty that fits this project honestly.

`OpenClaw` is still not honest to submit today.

Reason:

- EcoSwarm now has a real natural-language operator agent inside the product
- the backend exposes an A2A agent card and A2A endpoints
- the agent can summarize live cases, explain Hedera fit, show the deployment blueprint, and execute real case actions
- HOL ledger authentication and registration quoting work with the current Hedera testnet account
- OpenClaw still needs protocol-specific agent-commerce or UCP-level behavior, not just an agent-themed UI

## What Is Already Working

### Product surface

- `frontend/src/components/pages/AgentNetworkPage.tsx` now includes a real agent console
- the console talks to `POST /agent/chat`
- the chat is case-aware and synchronized with the same live state used by the rest of the app

### Machine-to-machine surface

- `backend/src/services/EcoSwarmA2AService.ts` exposes:
  - `/.well-known/agent-card.json`
  - `/.well-known/agent.json`
  - `/a2a`
  - `/a2a/rest`
- `backend/src/services/EcoSwarmAgentService.ts` handles:
  - case summary
  - queue review
  - deployment blueprint explanation
  - Hedera fit explanation
  - verifier / treasury / settlement actions

### Live workflow proof

- real Hedera-backed case flow is already active in the product
- a sample case was submitted locally and the agent successfully executed:
  - `sponsor_release_authorized`
- resulting Hedera transaction:
  - `0.0.8188944@1774108013.270156893`

### HOL registration prep

- `backend/scripts/register-hol-agent.mjs` now supports:
  - ledger-based HOL auth using the current Hedera account
  - quote-only mode
  - broker retry handling for temporary `400 fetch failed`, `503`, and `504` responses
  - normalized ECDSA private-key handling for HOL auth and credit-purchase flows
  - full registration attempts against an explicit public URL

### Verified on March 21, 2026

- HOL ledger authentication succeeded
- HOL registration quote succeeded
- public agent card now resolves correctly through a public Cloudflare quick tunnel
- quote result:
  - `requiredCredits: 0`
  - `shortfallCredits: 0`

## What Still Blocks Final HOL Submission

The code is ready. The remaining blocker is the HOL broker host.

When registration was attempted through a public Cloudflare quick tunnel URL, the broker returned:

- `504 Gateway Timeout`
- host error at `registry.hashgraphonline.com`

That means:

- local app logic is not the blocker
- the public agent card is not the blocker
- HOL auth is not the blocker
- quote generation is not the blocker
- the broker host is timing out during `registerAgent`

An earlier `INVALID_SIGNATURE` error during credit purchase was traced to raw `0x...` ECDSA key formatting and fixed by normalizing the key before sending it to the broker.

## Honest Submission Strategy

### Main track

- submit `Theme 3: Sustainability`

### Optional bounty

- submit `Hashgraph Online` only if both are true before deadline:
  - the backend is on a stable public URL
  - HOL registration succeeds when the broker host is healthy

### Do not submit

- `OpenClaw`, unless real OpenClaw-native protocol behavior is added

## Commands

### Quote only

```bash
$env:HOL_AGENT_PUBLIC_URL='https://<public-backend-url>'
npm run register:hol --prefix backend -- --quote-only
```

### Full registration attempt

```bash
$env:HOL_AGENT_PUBLIC_URL='https://<public-backend-url>'
npm run register:hol --prefix backend
```

### Recommended stable-host version

```bash
npm run register:hol --prefix backend
```

Use the stable-host version only after setting `HOL_AGENT_PUBLIC_URL` to a real public backend URL.

### Temporary public tunnel helper

```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/launch-cloudflared.ps1
```

Then read the generated hostname from:

```powershell
Get-Content .codex-runtime/cloudflared.log
```

## Recommendation

If a stable deployment is available before submission, include the `Hashgraph Online` bounty.

If the broker keeps returning `504`, submit only `Sustainability`.
