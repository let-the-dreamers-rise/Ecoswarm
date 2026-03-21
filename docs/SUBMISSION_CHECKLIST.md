# Submission Checklist

## Main Track

- `Challenge Theme`: `Theme 3: Sustainability`
- `Project Name`: `EcoSwarm Regen`
- `GitHub Repo`: `https://github.com/let-the-dreamers-rise/Ecoswarm`
- `Latest pushed commit`: `https://github.com/let-the-dreamers-rise/Ecoswarm/commit/57635a7ca48a3223a308587520ab5adb97fe3f17`
- `Team Hedera Testnet Account ID`: `0.0.8188944`

## Submission Artifacts

### Pitch Deck

- Editable source:
  - `submission/pitch-deck/generate_deck.js`
- Editable PowerPoint:
  - `submission/pitch-deck/EcoSwarm-Regen-Apex-Deck.pptx`
- Submission PDF:
  - `submission/pitch-deck/EcoSwarm-Regen-Apex-Deck.pdf`

### Narrative Docs

- Product brief:
  - `docs/APEX_SUSTAINABILITY_BRIEF.md`
- Form answers:
  - `docs/SUBMISSION_FORM_ANSWERS.md`
- Judge answers:
  - `docs/JUDGE_QA.md`
- Incubator position:
  - `docs/INCUBATOR_READINESS_BRIEF.md`

## Public Demo State

- Temporary public backend:
  - `https://olive-biol-interactions-combination.trycloudflare.com`
- Health:
  - `https://olive-biol-interactions-combination.trycloudflare.com/health`
- Agent card:
  - `https://olive-biol-interactions-combination.trycloudflare.com/.well-known/agent-card.json`

Important:

- This is a temporary Cloudflare quick tunnel, not a permanent deployment.
- Render Blueprint exists in `render.yaml`, but stable cloud deployment was not completed from this machine because no Render or Vercel credentials were available in the environment.

## HOL / Bounty Status

- `Hashgraph Online` is the only honest bounty fit.
- Current code status:
  - public A2A agent card works
  - public chat/A2A endpoints work
  - HOL ledger auth works
  - HOL registration quote works
- Current blocker:
  - broker credit-purchase and/or register path still fails externally
  - reproduced on:
    - the original ECDSA account `0.0.8188944`
    - a fresh ED25519 account created only for HOL retries
- Honest call:
  - submit `Hashgraph Online` only if a final retry succeeds before the deadline
  - otherwise submit only `Sustainability`

See `docs/HOL_BOUNTY_READINESS.md` for the detailed evidence trail.

## What Still Needs Manual Input

- public YouTube demo link
- optional stable public deployment URL, if available before submission
- team wallet addresses
- Discord handles
- LinkedIn profile URLs

## Recommended Final Submission Order

1. Upload `submission/pitch-deck/EcoSwarm-Regen-Apex-Deck.pdf`.
2. Paste the description from `docs/SUBMISSION_FORM_ANSWERS.md`.
3. Use the pushed GitHub commit URL above.
4. Use the public demo video link for both demo fields if no stable frontend deployment is ready.
5. Submit `Theme 3: Sustainability`.
6. Only add the `Hashgraph Online` bounty if the broker registration succeeds on a final retry.
