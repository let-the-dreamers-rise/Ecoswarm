# Submission Form Answers

## Main Decision

- `Challenge Theme`: `Theme 3: Sustainability`
- `Do not choose Theme 1: AI & Agents`
- `Bounty`: `Hashgraph Online only if a stable public backend URL is live and HOL registration succeeds before the deadline`

Reason:

EcoSwarm Regen is strongest as a Sustainability main-track submission. The only honest bounty fit is now `Hashgraph Online`, because the product has a real natural-language operator agent, A2A endpoints, and HOL registration tooling. `OpenClaw` is still not ready to claim honestly because the app does not yet implement OpenClaw-native protocol behavior or UCP commerce.

Official event page confirms teams may submit `1 main track + 1 bounty`, but a bounty is optional. Source: [StackUp Apex event page](https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026?tab=detail#overview).

## Challenge Selection

### Challenge Theme

`Theme 3: Sustainability`

### Optional Bounty Decision

Use this rule:

- if the backend is deployed on a stable public URL and the HOL registration succeeds, submit `Hashgraph Online`
- if not, skip the bounty and submit only `Sustainability`

### Challenge Description

Use the official Sustainability track description from the event page if the form requires it.

## Project Details

### Project Name

`EcoSwarm Regen`

### Project Description

Paste this:

`EcoSwarm Regen is a Hedera-native milestone payout treasury for community climate projects. Local operators submit proof-backed projects, the platform converts them into sponsor-ready release cases, and a semi-autonomous agent network triages review, authorization, settlement, and reputation updates. AI ranks funding opportunities, while Hedera records the audit line through HCS-backed checkpoints and HTS-linked impact receipts. The product also includes a live deployment blueprint covering the wedge, buyer, pricing, and rollout path. The result is a deployable coordination layer for restoration and resilience funding: faster trust, clearer proof, repeatable releases, and a real workflow for sponsors, verifiers, and local operators.

Tech stack: React, TypeScript, Tailwind CSS, Vite, Node.js, Express, WebSocket, Python FastAPI, NumPy, Hedera SDK, Hedera Consensus Service (HCS), Hedera Token Service (HTS).

If judges prefer not to run locally, use the demo video link for both Demo fields. If run locally: start backend, AI service, and frontend as documented in the README.`

### Project's GitHub Repo Link

Use:

- the public repo URL
- ideally the exact latest commit URL before submission deadline, because the form explicitly asks for the latest commit page

Recommended format:

`https://github.com/<org-or-user>/<repo>/commit/<latest_commit_hash>`

If you only have the repo URL, use:

`https://github.com/<org-or-user>/<repo>`

But the commit URL is better for this form.

### Pitch Deck (PDF)

Use a PDF deck built from:

- [PITCH_DECK_OUTLINE.md](C:/Users/ASHWIN%20GOYAL/OneDrive/Desktop/HEDER/docs/PITCH_DECK_OUTLINE.md)
- [JUDGE_QA.md](C:/Users/ASHWIN%20GOYAL/OneDrive/Desktop/HEDER/docs/JUDGE_QA.md)
- [APEX_SUSTAINABILITY_BRIEF.md](C:/Users/ASHWIN%20GOYAL/OneDrive/Desktop/HEDER/docs/APEX_SUSTAINABILITY_BRIEF.md)

### Project Demo Video Link

Use your public YouTube demo link.

### Project Demo Link

Best option:

- use a real public deployed URL

Fallback allowed by the form note:

- use the same public YouTube demo link again

## Feedback Questions

### On a scale of 1-10, how confident did you feel after reading the docs that you could build successfully?

`8`

### On a scale of 1-10, how easy was it to get help when you were blocked?

`8`

### On a scale of 1-10, how intuitive were the APIs / SDKs to use?

`7`

### On a scale of 1-10, how easy was it to debug issues?

`6`

### On a scale of 1-10, how likely are you to build again on Hedera after the hackathon?

`10`

### What are your main goals or objectives for participating in this hackathon?

Paste this:

`Our main goal was to build a real, deployable product instead of a concept dashboard. We wanted to explore how Hedera can support repeatable sustainability workflows where proof, verification, and capital movement all need to be visible across multiple parties. We also wanted to test whether a climate-finance coordination product could be made more operational by combining HCS-backed auditability, HTS-linked receipts, and a product experience that sponsors, verifiers, and local operators can all understand. Beyond prizes, we wanted to build something credible enough to keep developing after the hackathon.`

### What was the biggest friction or blocker you faced? (Docs, tooling, support, unclear concepts, bugs, etc.) What’s one thing we could improve to make this hackathon experience better?

Paste this:

`The biggest friction was moving from understanding Hedera primitives individually to deciding how to structure them into a production-style workflow. It was clear how to submit transactions and use the SDK, but turning that into a multi-step product flow with auditability, repeated actions, and good UX required more design interpretation. A helpful improvement would be more end-to-end reference architectures for specific use cases such as multi-party approvals, recurring HCS workflows, or tokenized operational receipts, so teams can spend less time guessing the best structure and more time building.`

### What worked especially well that we should not change?

Paste this:

`What worked especially well was the breadth of tracks, the clarity of the main judging criteria, and the fact that Hedera’s infrastructure is lightweight enough to support many repeated state changes without the workflow feeling financially unrealistic. The event framing also encouraged building real products rather than purely speculative ideas. That combination of practical infrastructure, clear prize structure, and ecosystem support is strong and should not change.`

## Identity / Team Fields

### Hedera Testnet Account ID of the team

`0.0.8188944`

### Mainnet wallet addresses of all members

Fill manually with real member wallet addresses separated by commas.

### Discord Handles of all members

Fill manually with real Discord handles separated by commas.

### LinkedIn Profile URLs of all members

Fill manually with real LinkedIn URLs separated by commas.

## Final Feedback Field

### Please share your thoughts on building on Hedera, including what worked well, any challenges you faced, and suggestions for improving the experience.

Paste this:

`Building on Hedera was strong where it mattered most for this project: low-cost transactions, straightforward SDK usage, and a good fit for repeated, auditable workflow steps. That was especially useful because our product depends on multiple proof and payout actions rather than one isolated transaction. The main challenge was less about raw infrastructure and more about deciding the best product architecture for multi-party coordination. More production-style examples for sustainability, treasury approvals, recurring HCS event flows, and token-linked operational workflows would make the developer experience even better. Overall, Hedera felt like a credible foundation for products that need transparent, repeatable coordination rather than one-off blockchain demos.`

## Strategic Notes

- The strongest submission position is `verified milestone payouts for community climate projects`
- Do not pitch this as a generic AI dashboard
- Do not pitch this as a marketplace for everything
- If HOL is submitted, describe it as an `operator agent for the sustainability workflow`, not as a separate product
- Use the new `Blueprint` page to make the incubator story explicit
- Use one flagship case in the demo
- Show real Hedera transaction IDs
- If no public deployment is available in time, use the public demo video URL in both demo fields
