# Metrics Framework — AI Spend Audit Tool

This document defines the quantitative tracking framework, analytic systems, input-output KPIs, and critical pivot thresholds for the AI Spend Audit Tool.

---

## 1. The North Star Metric
Our single North Star metric is **Total Annualized Savings Identified for Captured Leads**.

### Why:
As a lead-generation tool for Credex, we have a dual objective: providing high value to the visitor and surfacing high-value leads for sales.
- If we track only *leads captured*, we might attract low-intent solo users who spend $10/mo (low-value leads).
- If we track only *visitors*, we ignore lead capture.
- **Total Annualized Savings Identified for Captured Leads** aligns visitor value (reclaimed startup capital) directly with Credex business value (the larger the identified waste, the higher their potential API bill, making them prime targets for Credex's institutional discount credits).

---

## 2. The 3 Key Input Metrics
To grow our North Star Metric, we optimize three core input metrics:

### Input Metric A: Tool Stack Submission Rate
- *Definition:* The percentage of landing page visitors who select at least one tool and click "Run Free Audit".
- *Target:* **≥ 40%**.
- *Optimization Strategy:* Keep the form friction extremely low, use high-speed interactive UI states, and avoid sign-up walls.

### Input Metric B: Lead Capture Rate (Gate Conversion)
- *Definition:* The percentage of audited users who submit the lead form (email, company, role) to unlock their personalized summary.
- *Target:* **≥ 25%**.
- *Optimization Strategy:* Position the email-gate immediately after the big financial savings reveal. Show them the huge number, and promise a detailed dynamic AI summary + shareable PDF report upon entering their email.

### Input Metric C: Credex CTA Click-through Rate
- *Definition:* The percentage of high-savings users (savings > $500/mo) who click the "Book a Consultation" CTA button.
- *Target:* **≥ 15%**.
- *Optimization Strategy:* Implement high-prominence emerald glow styling, clear value-focused copywriting ("Credex can capture these savings for you today"), and seamless Calendly integration.

---

## 3. Product Analytics & Instrumentation (Week 1 Setup)
For initial launch instrumentation, we prioritize lightweight, privacy-friendly analytics tools like **PostHog** or **Plausible**:

### Event Tracking Schema:
1. `visitor_landed`: Triggered on root page load. Tracks referral source.
2. `audit_calculated`: Triggered when recommendations are computed. Captures:
   - `team_size`, `primary_use_case`
   - `total_monthly_spend`, `total_monthly_savings`
   - `tool_count`
3. `lead_submitted`: Triggered when email is captured. Captures `role` and `has_high_savings` (boolean).
4. `consultation_clicked`: Triggered when the Credex booking button is clicked.
5. `share_clicked`: Triggered when the unique public URL is copied or shared.

---

## 4. Quantitative Pivot Triggers
We establish strict conversion boundaries during the first 30 days to trigger a product pivot:

- **Trigger A: Submission Rate < 20%:** If less than 20% of visitors fill the form, the input fields represent too much friction. 
  - *Action:* Redesign the form from a dense grid into a step-by-step interactive wizard (e.g. asking 1 question at a time) or pre-fill standard developer configurations.
- **Trigger B: Lead Capture Rate < 10%:** If audited users refuse to submit their email, the incentive value is insufficient.
  - *Action:* Change the email-gate strategy. Instead of gating the summary, provide the summary instantly but gate a high-value bonus feature, such as a "1-click downloadable PDF report for your CFO" or a "team Slack integration alert".
- **Trigger C: Sales Close Rate < 10% on Consultations:** If founders book calls but refuse to buy Credex credits.
  - *Action:* Audit the sales pitch or lower the consultation eligibility threshold to catch mid-market startups where credit purchases have simpler purchasing cycles.
#
