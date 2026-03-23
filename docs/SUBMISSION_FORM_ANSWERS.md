# Submission Form Answers

## Main Decision

- `Challenge Theme`: `Theme 3: Sustainability`
- `Bounty`: `Submit Hashgraph Online only if broker registration succeeds cleanly. Otherwise submit Sustainability only.`

## Challenge Selection

### Challenge Theme

`Theme 3: Sustainability`

### Challenge Description

Use the official Sustainability track description from the event page.

## Project Details

### Project Name

`EcoSwarm Regen`

### Project Description

`EcoSwarm Regen is a Hedera-native milestone payout treasury for community climate projects. Local operators submit proof-backed projects, the platform converts them into milestone-locked escrow cases, and AI generates risk assessments and funding recommendations. Smart contracts enforce milestone-gated fund release, so capital cannot move without verifier approval. The workflow uses Hedera for role-specific accounts, HCS audit trails, HTS impact receipts, shared NFT certificates, escrow actions, and mirror-node verification. Each project can provision 3 role accounts and generate repeated on-chain actions across proof, release, and audit steps.`

### Tech Stack

`React 18, TypeScript, Tailwind CSS, Vite, Node.js, Express, WebSocket, Python FastAPI, Google Gemini (gemini-2.0-flash), NumPy, Solidity, Hedera SDK (@hashgraph/sdk), HCS, HTS, Hedera Smart Contract Service, Hedera account provisioning, Hedera Mirror Node REST API`

### Project's GitHub Repo Link

Use the public repo URL with the latest commit before the deadline.

### Pitch Deck (PDF)

Use the final submission PDF deck.

### Project Demo Video Link

Use the public YouTube demo link.

### Project Demo Link

Use the public deployment URL. If needed, use the public demo video as fallback.

## Feedback Answers

### Confidence After Reading Docs

`9`

### Ease of Getting Help

`8`

### API / SDK Intuitiveness

`8`

### Ease of Debugging

`7`

### Likelihood of Building on Hedera Again

`10`

### Main Goals or Objectives

`Our goal was to build a deployable sustainability infrastructure product, not a concept dashboard. We wanted to use Hedera for the parts that matter most in a climate payout workflow: role separation, escrow enforcement, audit trails, tokenized receipts, certificate issuance, and independent verification. We combined that with AI reasoning to create a proof-to-payout system for sponsors, verifiers, and local operators. Beyond prizes, our goal is incubation support to move from a pilot-ready testnet MVP to a first real deployment.`

### Biggest Friction or Blocker

`The biggest friction was architectural rather than conceptual. Hedera services are strong individually, but designing how escrow, HCS checkpoints, role-specific accounts, and HTS receipts should work together in a multi-party milestone release flow took the most effort. More production-style reference architectures for multi-service sustainability products would make the experience even better.`

### What Worked Especially Well

`What worked especially well was the ability to compose repeated, low-cost, auditable actions into one workflow. EcoSwarm depends on many ordered steps across proof recording, account provisioning, release checkpoints, and token operations. Hedera makes that kind of workflow economically realistic, which is exactly what sustainability coordination products need. The SDK consistency, testnet reliability, and sustainability ecosystem fit were all strong.`

## Identity / Team Fields

### Hedera Testnet Account ID of the Team

`0.0.8188944`

### Mainnet Wallet Addresses, Discord Handles, LinkedIn URLs

Fill manually.

## Final Feedback

`Building on Hedera was strongest where coordination mattered most. Combining escrow, HCS audit trails, HTS receipts, NFT certificates, account provisioning, and mirror-node verification into one composable product was feasible because the SDK is consistent across services and repeated actions stay economical. The main challenge was deciding how those services should interact in a truthful multi-party workflow. More end-to-end examples for sustainability applications would make the experience even better. Overall, Hedera felt like a credible foundation for products that need transparent, repeatable coordination rather than one-off blockchain transactions.`

## Strategic Notes

- Lead with `verified milestone payouts for community climate projects`
- Show one flagship case only
- Emphasize that release cannot happen without verifier approval
- Use the Audit Trail to prove claims, not just the Overview page
- Be explicit that the product is pilot-ready and awaiting the first live pilot
