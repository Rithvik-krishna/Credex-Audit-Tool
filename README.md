# Credex AI Spend Audit Tool

An elegant, high-converting, no-login web application that allows startups to audit their AI subscription spending in 30 seconds. This tool acts as an automated lead-generation funnel for **[Credex](https://credex.ai)**, which sells discounted institutional AI credits in bulk.

---

## 🌟 Visual Theme & Premium Aesthetics

The application implements a custom-tailored dark-mode theme based on dynamic HSL variables and Tailwind. Key visual highlights include:
- **Glowing Radiants:** Beautiful top-radial purple and indigo background glows (`.glow-background`).
- **Glassmorphic Paneling:** Clean backdrop-filtered containers (`.glass-panel`) with responsive micro-hover transitions (`.glass-panel-hover`).
- **Dynamic Sizing Sliders:** Interactive range sliders showing exact seat metrics.
- **Micro-Animations:** Fade-in entrances and glow pulses when computing reports to feel premium and alive.

---

## 🚀 Key Features

1. **Spend Input Form:** Persistent form inputs (saving team sizes, use cases, and stacks in `localStorage` across reloads) with smart auto-populating pricing rules based on current May 2026 data.
2. **Defensible Spend Audit Engine:** Evaluates configurations for:
   - **Cross-Tool Redundancy:** E.g., Cursor Pro + GitHub Copilot (flags Copilot for cancellation).
   - **Plan Tier Overkill:** E.g., Cursor Business for team sizes under 2, ChatGPT Team for a single seat, Claude Max for simple writing use cases.
   - **Wholesale Routing:** Direct API spend (> $200/mo) is optimized for Credex institutional wholesale credits, capturing a **15% discount**.
3. **Unlocked AI Advisor Summary:** Captures lead emails, company roles, and names, then invokes Anthropic's Claude 3.5 Sonnet to output a highly personalized cost analysis under 100 words. Includes a robust 6-second abort fallback to deterministic summary generation in case of sluggish network performance.
4. **Email Integration:** Automatically fires beautiful HTML reports to the user using the **Resend API**, falling back to clear terminal-logged templates in development mode.
5. **Polymorphic Storage Layer:** Operates out-of-the-box using a local JSON database filesystem writing to `db/audits.json`. Seamlessly hot-swaps to an enterprise-grade **Supabase Postgres** database when credentials (`SUPABASE_URL` and `SUPABASE_ANON_KEY`) are present in `.env.local`.
6. **Privacy-Minded Share URLs:** Generates a secure, 12-character ID for public sharing. Sanitizes and strips all PII (email addresses, company names, and roles) on dynamic route views to protect user privacy.

---

## 🛠️ Environmental Settings & Local Execution

1. Clone the repository and navigate into the project workspace:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the root directory:
   ```env
   # Database Mode (If empty, operates in zero-configuration local JSON mode)
   SUPABASE_URL=
   SUPABASE_ANON_KEY=

   # AI Summary Service (If empty, operates in high-quality deterministic fallback mode)
   ANTHROPIC_API_KEY=

   # Transactional Email (If empty, prints beautiful HTML emails directly to server terminal)
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=noreply@your-vercel-domain.com

   # Dynamic Routing Root URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Build the application for production:
   ```bash
   npm run build
   ```

---

## 🧪 Testing and Quality Control

The project features a **Vitest** test suite verifying all core optimization scenarios:

```bash
# Run tests in non-interactive single-pass mode
npm run test
```

For more details on automated validation, please refer to [TESTS.md](file:///c:/Users/Hp/Desktop/AI%20Spend%20Audit%20Tool/TESTS.md).
