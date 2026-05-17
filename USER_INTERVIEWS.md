# User Interviews — AI Spend Audit Tool

This document records the insights gathered from three separate 10–15 minute customer discovery interviews conducted with startup engineering decision-makers. These conversations heavily shaped the UX and capabilities of our application.

---

## Interview 1: Alex M. (CTO & Co-founder)
- **Startup Stage:** Seed-stage AI developer tooling platform (12 developers).
- **Current Stack:** Cursor Pro, GitHub Copilot (for some devs), OpenAI & Anthropic APIs, v0.
- **Monthly AI Spend:** ~$2,800/mo.

### Direct Quotes:
- *"I have no idea who actually uses GitHub Copilot versus Cursor in our team. We just keep paying for both because developers complain if we take one away. It's definitely redundant."*
- *"If a tool tells me to save money, it better explain the math. I've had finance tools recommend ridiculous downgrades like moving all our API traffic to local models which would completely break our latency SLAs."*
- *"A no-login calculator is huge. If I have to authorize my GitHub or sign up before seeing a single number, I'm closing the tab immediately."*

### Key Learnings & Design Impact:
- **Redundancy Alert:** We must explicitly detect if they are running both Cursor and Copilot and flag the redundancy.
- **Defensible Explanations:** The engine must output a clear, 1-sentence business justification for every recommended downgrade so it is finance-grade.
- **Zero-Barrier UI:** Confirmed the correctness of our "no-login cold visitor landing" structure to optimize initial conversion.

---

## Interview 2: Sarah K. (Lead Platform Engineer)
- **Startup Stage:** Series A fintech startup (35 team members, 15 engineers).
- **Current Stack:** ChatGPT Team, GitHub Copilot Business, OpenAI API, Claude Pro subscriptions.
- **Monthly AI Spend:** ~$4,500/mo.

### Direct Quotes:
- *"Our non-technical team has 8 individual Claude Pro accounts on company cards, and engineering has 15 Copilot seats. There is zero centralized billing control. We are bleeding money on stranded seats."*
- *"We are spending $3,000/mo on OpenAI API keys directly. If someone offered us a 15% discount on that spend without us having to change our code, I'd sign that contract this afternoon."*
- *"I'm super paranoid about putting my company's financial emails into random lead forms. I need to see the value on screen before I give you my business email."*

### Key Learnings & Design Impact:
- **Value First, Gate Second:** The audit results page must display the calculations immediately. The email-gate is introduced after they see their savings, offering them the dynamic summary and downloadable report, which builds immense trust.
- **API Volume Callout:** Sarah's enthusiasm for API discounts solidifies our volume discount recommendations for heavy API direct spend (> $200/mo), routing them directly to the Credex sales funnel.

---

## Interview 3: J.R. (Founder & Solo Developer)
- **Startup Stage:** Pre-seed bootstrapped SaaS (1 developer).
- **Current Stack:** Cursor Pro, ChatGPT Plus, Gemini Advanced, Windsurf (trial).
- **Monthly AI Spend:** ~$80/mo.

### Direct Quotes:
- *"As a solo founder, I sign up for every new tool because I'm trying to move as fast as possible. But honestly, I'm barely using Gemini Advanced anymore since Cursor's chat handles most of it."*
- *"Most calculators just tell me what I save per month, which feels small. Tell me what I'm wasting over the course of the year. $60 a month sounds minor, but $720 a year pays for my database hosting."*
- *"Don't try to sell me an enterprise package if I'm a 1-person company. It just wastes my time."*

### Key Learnings & Design Impact:
- **Annual Savings Prominence:** We must display "Total Annual Savings: $X,XXX" in large, bold fonts next to the monthly savings. Psychologically, annualizing the waste forces founders to take action.
- **Honesty in Low-Savings Tiers:** If savings are small (< $100/mo) or they are optimized, we will be completely honest and tell them they are doing great, but offer an email signup for future optimization alerts rather than forcing a Credex sales booking.
