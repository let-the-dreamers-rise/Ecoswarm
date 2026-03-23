# Judge Q&A - EcoSwarm Regen

## Why does this need Web3? Why not Web2?

Because the trust model is the product.

In EcoSwarm, escrow release cannot happen without verifier approval. That rule is enforced by smart-contract state, not by an admin panel or editable database log. Sponsors, verifiers, and operators read the same audit trail, and no single party can rewrite the release history after the fact.

## Why Hedera specifically?

- Low-cost repeated transactions make milestone-heavy workflows economically realistic
- Energy-efficient infrastructure aligns with the sustainability mission
- Hedera is well suited to ordered audit trails, tokenized receipts, and multi-party coordination
- The workflow is compatible with future Guardian-style MRV integration

## What Hedera services do you actually use?

Seven service dimensions:

| Service | How it is used |
| --- | --- |
| Smart Contract Service | Escrow registration, sponsor deposits, verifier approval, sponsor release, refund eligibility |
| Account provisioning | Distinct Hedera accounts for sponsor, verifier, and operator |
| HCS | Event, payout, and release checkpoints |
| HTS fungible | Impact receipt minting and transfer |
| HTS NFT | Shared impact certificate collection with one serial per verified release |
| Mirror Node API | On-chain verification in the audit workspace |
| Scheduled Transactions | Deadline reminders and recovery support only |

## What is the real AI here?

There are two AI layers:

1. `Optimize` uses weighted impact-per-dollar logic to rank where capital should move.
2. `Analyze` uses Gemini to explain risk, readiness, and funding recommendations in natural language.

The AI is not the trust layer. It supports the payout workflow and makes its reasoning visible.

## Who is the real customer?

The first buyer is a CSR manager, climate fund manager, or resilience program lead who needs proof-backed milestone payouts instead of email-based grant administration.

The users are:

- local operators who submit proof and manage delivery
- verifiers who review and approve milestones
- sponsors who authorize capital release

## What validation do you have?

We are explicit about the stage:

- MVP complete
- pilot-ready
- awaiting first live pilot

What we do have is strong problem validation and a specific deployment wedge. We are targeting proof-to-payout friction in climate funding, with concrete pilot wedges in India solar, India reforestation, and East Africa cleanup.

## How does this drive Hedera success?

Each project can create:

- 3 Hedera accounts
- multiple HCS checkpoints
- smart-contract escrow activity
- HTS receipt minting and transfer
- an HTS NFT certificate serial

At pilot scale, that becomes repeatable multi-party activity rather than one-off blockchain usage.

## Do you have a business model?

Yes. The product includes a Lean Canvas / Business Model workspace with:

- target buyer
- GTM phases
- pricing logic
- pilot wedge
- commercial expansion path

## What would you do with incubation support?

1. Secure one live pilot sponsor
2. Onboard one verifier partner
3. Move the escrow workflow from testnet MVP into the first production deployment
4. Integrate more formal MRV policy logic
5. Execute the first live proof-to-payout cycle

## Short Closing Line

`EcoSwarm Regen is not a sustainability dashboard. It is a payout operating system for climate programs, built so capital cannot move without proof.`
