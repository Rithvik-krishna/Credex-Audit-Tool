# Technical Reflection — AI Spend Audit Tool

This document outlines the developer experience, tool performance ratings, major architectural decisions, and the resolution of tricky bugs encountered during the construction of the **AI Spend Audit Tool**.

---

## 1. Tool Experience & Rating Grid

Below is a detailed assessment of the technologies and developer tools utilized during this project:

| Technology / Tool | Efficiency Rating | Integration Ease | Reliability | Key Advantages / Disadvantages |
| :--- | :---: | :---: | :---: | :--- |
| **Next.js 14 (App Router)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Pro:** Extremely fast page transitions, Server Components for secure data loading, static dynamic metadata hooks. <br>**Con:** Stricter hydration parameters between client/server. |
| **Tailwind CSS & HSL** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Pro:** Enabled rich dark-mode aesthetics (glassmorphic containers, emerald highlights, violet radial glows) with zero ad-hoc stylesheets. |
| **Vitest** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Pro:** Blistering speed, minimal configuration, native TypeScript execution without compiler overhead. |
| **Polymorphic DB Adapter** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Pro:** Out-of-the-box local filesystem simulation that swaps seamlessly to cloud-based Supabase. Zero friction for onboarding. |
| **Anthropic Messages API** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Pro:** Claude 3.5 Sonnet generated high-quality, professional executive summaries under 100 words. |
| **Resend API** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Pro:** Superb HTML transactional mail template delivery with graceful console mock fallback in development. |

---

## 2. Critical Bugs Resolved

### Bug 1: JSX Unescaped Greater-Than Symbol (`>`)
- **Symptom:** The Next.js production build failed inside `AuditResultsClient.tsx` at line 296 with the error `Unexpected token. Did you mean {'>'} or &gt;?`.
- **Cause:** We had a badge label rendered directly as plain text: `High Savings Tier (>$500/mo)`. Inside Next.js JSX syntax, the `>` character is interpreted as an opening/closing tag boundary and triggers compiler parsing failures.
- **Resolution:** Modified the text block to use the safe HTML entity: `High Savings Tier (&gt;$500/mo)`. The build compiled perfectly immediately after.

### Bug 2: Serverless Function Hanging during LLM Generation
- **Symptom:** Claude API calls would occasionally hang when the network was sluggish, risking exceeding Vercel's standard 10-second serverless execution limits.
- **Cause:** No timeout boundaries were established on standard `fetch` requests inside our `/api/lead` API route.
- **Resolution:** Integrated a native JavaScript `AbortController` coupled with a `setTimeout` of 6 seconds. If the Anthropic API takes longer than 6 seconds, the request aborts gracefully, triggers a high-quality deterministic fallback summary template, and logs the warning to the console, guaranteeing instantaneous user responses.

### Bug 3: Rate Limiting & Bot Vulnerability
- **Symptom:** Public lead-capture pages are highly vulnerable to automated script attacks, which can drain Anthropic API tokens and trigger Resend email spam.
- **Cause:** Form endpoints were open to anonymous submissions with no validation barriers.
- **Resolution:** Implemented two security layers:
  1. An in-memory IP-based rate-limiting bucket capping submissions at 10 requests per 24 hours per IP.
  2. A hidden honeypot field (`website`). If a bot programmatically scrapes and populates this field, the server immediately drops the payload and returns `400 Bad Request`.

---

## 3. Core Architectural Trade-Offs

1. **Lightweight Polymorphic Storage:** We traded a heavy relational database requirement for a zero-configuration JSON file adapter during local development. This ensures 100% execution speed and 0-minute setup, yet can scale to robust production workloads with standard Supabase Postgres credentials.
2. **In-Memory Abuse Throttling:** For the scope of this project, we implemented an in-memory Map rate-limiting mechanism. In multi-instance serverless deployments, this should be swapped for an external Redis store (like Upstash) to guarantee uniform rate limits.
