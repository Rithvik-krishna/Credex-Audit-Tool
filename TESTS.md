# Automated Testing Guide — AI Spend Audit Engine

This document outlines the design, scope, and execution details for the automated test suite written for the **AI Spend Audit Engine**.

The tests are implemented using **Vitest** for blistering speed and native ESModules support. They focus on verifying the correctness of our defensible financial and optimization logic.

---

## How to Execute the Test Suite

You can run the tests locally in single-run mode or active development watch mode:

```bash
# Run all tests once (ideal for CI pipelines)
npm run test

# Run tests in active watch mode
npx vitest
```

---

## Summary of the 6 Test Cases

Our Vitest test suite (`tests/auditEngine.test.ts`) validates the calculation rules specified in our architectural design.

### 1. Cursor Pro + GitHub Copilot Overlap (Redundancy check)
- **Goal:** Detect developer stack duplication where engineers are being billed for both Cursor Pro and GitHub Copilot.
- **Assertion:** Flag GitHub Copilot for complete cancellation (`action: 'cancel'`), reduce its recommended monthly spend to `$0`, and transfer the exact monthly rate into the savings bucket.

### 2. Cursor Business Seat Overkill (Tier optimization)
- **Goal:** Stop startups from over-purchasing enterprise-tier organizational features when a developer works alone or in a tiny team.
- **Assertion:** If team size is 1, recommend downgrading Cursor Business to Cursor Pro, saving `$20/mo` on that seat.

### 3. ChatGPT Team Seat Overkill (Plan rightsizing)
- **Goal:** Detect situations where a single user is billed for ChatGPT Team (meant for shared workspaces) instead of the standard individual Plus plan.
- **Assertion:** Downgrade ChatGPT Team (`$30/mo`) to ChatGPT Plus (`$20/mo`), netting a saving of `$10/mo`.

### 4. High-Volume API Credit Optimization (Wholesale routing)
- **Goal:** Surface wholesale discounts for high-volume Anthropic/OpenAI direct API spend (threshold `> $200/mo`).
- **Assertion:** Route the pay-as-you-go volume to Credex volume pools, saving exactly **15%** of direct monthly spend (e.g. reducing `$1,000/mo` to `$850/mo`).

### 5. Claude Team to Pro Downgrade (Plan rightsizing)
- **Goal:** Correct oversized subscription plans when a single seat doesn't require admin billing panels.
- **Assertion:** Downgrade Claude Team (`$25/mo`) to Claude Pro (`$20/mo`), recovering `$5/mo` in savings.

### 6. Dynamic Annualized Metrics Check (Global aggregator)
- **Goal:** Ensure global savings metrics aggregate correctly across multiple concurrent tool recommendations and calculate annual cost recovery precisely.
- **Assertion:** Validate that a combined stack with a Cursor downgrade (`$40/mo` savings) and a Copilot cancellation (`$20/mo` savings) sums up to exactly `$60/mo` in monthly savings and `$720/yr` in annual cost recovery.

---

## Test Implementation References

- **Test Suite Source Code:** [tests/auditEngine.test.ts](file:///c:/Users/Hp/Desktop/AI%20Spend%20Audit%20Tool/tests/auditEngine.test.ts)
- **Core Engine Logic:** [src/lib/auditEngine.ts](file:///c:/Users/Hp/Desktop/AI%20Spend%20Audit%20Tool/src/lib/auditEngine.ts)
