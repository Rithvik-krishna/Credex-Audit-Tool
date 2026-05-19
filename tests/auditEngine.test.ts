import { describe, it, expect } from 'vitest';
import { runAuditEngine, ToolInput } from '../src/lib/auditEngine';

describe('AI Spend Audit Engine', () => {
  // Test 1: Cursor Pro + GitHub Copilot redundancy check
  it('should identify Cursor Pro + GitHub Copilot overlap and flag Copilot for full cancellation', () => {
    const inputs: ToolInput[] = [
      { toolId: 'cursor', planId: 'pro', seats: 2, monthlySpend: 40 },
      { toolId: 'copilot', planId: 'individual', seats: 2, monthlySpend: 20 },
    ];
    
    const result = runAuditEngine(inputs, 2, 'coding');
    
    // Find Copilot recommendation
    const copilotRec = result.recommendations.find(r => r.toolId === 'copilot');
    expect(copilotRec).toBeDefined();
    expect(copilotRec!.action).toBe('cancel');
    expect(copilotRec!.recommendedSpend).toBe(0);
    expect(copilotRec!.monthlySavings).toBe(20);
    expect(copilotRec!.recommendedPlan).toBe('Canceled');
  });

  // Test 2: Cursor Business overkill for small team size
  it('should flag Cursor Business as overkill for a team size of 1 and recommend Cursor Pro', () => {
    const inputs: ToolInput[] = [
      { toolId: 'cursor', planId: 'business', seats: 1, monthlySpend: 40 },
    ];

    const result = runAuditEngine(inputs, 1, 'coding');

    const cursorRec = result.recommendations.find(r => r.toolId === 'cursor');
    expect(cursorRec).toBeDefined();
    expect(cursorRec!.action).toBe('downgrade');
    expect(cursorRec!.recommendedPlan).toBe('Cursor Pro');
    expect(cursorRec!.recommendedSpend).toBe(20);
    expect(cursorRec!.monthlySavings).toBe(20);
  });

  // Test 3: ChatGPT Team plan overkill for a single user
  it('should suggest downgrading ChatGPT Team to ChatGPT Plus for a single user startup', () => {
    const inputs: ToolInput[] = [
      { toolId: 'chatgpt', planId: 'team', seats: 1, monthlySpend: 30 },
    ];

    const result = runAuditEngine(inputs, 1, 'writing');

    const chatgptRec = result.recommendations.find(r => r.toolId === 'chatgpt');
    expect(chatgptRec).toBeDefined();
    expect(chatgptRec!.action).toBe('downgrade');
    expect(chatgptRec!.recommendedPlan).toBe('ChatGPT Plus');
    expect(chatgptRec!.recommendedSpend).toBe(20);
    expect(chatgptRec!.monthlySavings).toBe(10);
  });

  // Test 4: API Direct volume optimization for high spend
  it('should optimize direct API spend greater than $200/mo by routing to Credex 15% discount pools', () => {
    const inputs: ToolInput[] = [
      { toolId: 'anthropic_api', planId: 'api_direct', seats: 1, monthlySpend: 1000 },
    ];

    const result = runAuditEngine(inputs, 5, 'coding');

    const apiRec = result.recommendations.find(r => r.toolId === 'anthropic_api');
    expect(apiRec).toBeDefined();
    expect(apiRec!.action).toBe('optimize');
    expect(apiRec!.recommendedPlan).toBe('Credex API Pool');
    expect(apiRec!.recommendedSpend).toBe(850); // 1000 * 0.85
    expect(apiRec!.monthlySavings).toBe(150); // 1000 - 850
  });

  // Test 5: Claude Team overkill for a single user
  it('should downgrade Claude Team to Claude Pro for a single seat workspace', () => {
    const inputs: ToolInput[] = [
      { toolId: 'claude', planId: 'team', seats: 1, monthlySpend: 25 },
    ];

    const result = runAuditEngine(inputs, 1, 'mixed');

    const claudeRec = result.recommendations.find(r => r.toolId === 'claude');
    expect(claudeRec).toBeDefined();
    expect(claudeRec!.action).toBe('downgrade');
    expect(claudeRec!.recommendedPlan).toBe('Claude Pro');
    expect(claudeRec!.recommendedSpend).toBe(20);
    expect(claudeRec!.monthlySavings).toBe(5);
  });

  // Test 6: Annualized savings calculation correctness
  it('should correctly calculate total monthly and annual savings dynamically', () => {
    const inputs: ToolInput[] = [
      { toolId: 'cursor', planId: 'business', seats: 2, monthlySpend: 80 }, // should downgrade to pro (40), saving 40
      { toolId: 'copilot', planId: 'individual', seats: 2, monthlySpend: 20 }, // should cancel Copilot (0), saving 20
    ];

    const result = runAuditEngine(inputs, 2, 'coding');

    expect(result.totalMonthlySavings).toBe(60); // 40 (cursor) + 20 (copilot)
    expect(result.totalAnnualSavings).toBe(720); // 60 * 12
    expect(result.isOptimized).toBe(false);
  });
});
