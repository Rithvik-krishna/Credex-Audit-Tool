# Prompt Engineering — AI Spend Audit Tool

This document outlines the design and prompt structure for generating personalized summaries using the Anthropic API (or fallback OpenAI API), explaining the prompt architecture, constraint-forcing systems, and graceful fallbacks.

---

## 1. The Production Prompt Structure
The personalized summary is triggered dynamically inside the lead processing route `/api/lead` and sent to the LLM. 

```markdown
[System Instruction]
You are a elite AI infrastructure finance consultant. Your job is to analyze a startup's AI spend and write a personalized, highly encouraging, and objective financial audit summary.
Keep your response strictly under 100 words (aim for 85-90 words). Focus on actionable savings and highlight the single biggest "quick win" opportunity. Write as a professional human advisor.

[Context Data]
- Startup Team Size: {{teamSize}}
- Primary Startup Use Case: {{useCase}}
- Current Monthly Spend: ${{currentSpend}}
- Recommended Monthly Spend: ${{recommendedSpend}}
- Total Monthly Savings: ${{monthlySavings}}
- Total Annual Savings: ${{annualSavings}}
- Stack Configuration Details:
{{toolsStackJson}}

[Response Constraint]
Write exactly one paragraph. Do not start with generic pleasantries like "Based on our analysis...". Dive straight into the core findings. Mention the specific tool stack, the biggest win, and encourage them to implement these optimizations or book a consultation with Credex to optimize API pipelines.
```

---

## 2. Rationale behind the Structure

- **Context Grounding First:** Providing structured, high-signal data fields first (`teamSize`, `useCase`, exact cost deltas) ensures the model doesn't hallucinate numbers that differ from the on-screen calculations.
- **Strict Paragraph & Length Constraints:** Startups want high-signal, snackable summaries. Specifying a "single paragraph under 100 words" prevents multi-heading essays and maintains the design layout integrity of the card container.
- **Action-Oriented Hook:** Forcing the LLM to end with a clear transition into the next action (either implementing the downgrade or booking a Credex credits call) maximizes lead conversion for the Credex business funnel.

---

## 3. What Didn't Work (Iterative Learning)

During prompt engineering, we tested several configurations:
1. **Unbounded Lengths:** Allowing the model to write unchecked led to long, rambling responses that broke the card layout.
2. **Formatting instructions (Mermaid/Bullet lists):** When prompting the LLM to return list formats, the HTML rendering became highly unpredictable, occasionally breaking card padding or throwing React formatting runtime errors. A single plain-text paragraph is robust, visually uniform, and loads instantly.
3. **No Tone constraints:** Without instructing the LLM to write like an "elite AI infrastructure finance consultant", the tone was occasionally overly dramatic (e.g. "Alert! You are hemorrhaging cash!") or excessively clinical. The professional human tone establishes high business trust.

---

## 4. Graceful Fallback System
If the API key is not configured, is rate-limited, or fails, the application automatically bypasses the network call and returns a mathematically precise, dynamically generated template paragraph:

```typescript
function getFallbackSummary(data: AuditData): string {
  const biggestSavingsTool = data.recommendations.reduce((prev, current) => 
    (current.monthlySavings > prev.monthlySavings) ? current : prev
  , data.recommendations[0]);

  let winText = "";
  if (biggestSavingsTool && biggestSavingsTool.monthlySavings > 0) {
    winText = `The most substantial opportunity lies in your ${biggestSavingsTool.tool} stack, where transitioning to the recommended ${biggestSavingsTool.recommendedPlan} will recover $${biggestSavingsTool.monthlySavings}/mo.`;
  } else {
    winText = "Your AI tool configurations are already highly streamlined across all layers.";
  }

  return `Your startup is spending $${data.currentMonthlySpend}/mo on AI across team tools and APIs for a ${data.teamSize}-person team. By actioning our recommendations, you can reduce this to $${data.recommendedMonthlySpend}/mo, unlocking $${data.monthlySavings}/mo in recurring savings ($${data.annualSavings}/year). ${winText} For high-volume API configurations, routing through Credex's customized institutional credit pools will capture additional deep discounts.`;
}
```
This guarantees a screenshot-ready, highly personal, and zero-error experience at all times.
