import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runAuditEngine } from '@/lib/auditEngine';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tools, teamSize, useCase } = body;

    // Server-side validation
    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return NextResponse.json(
        { error: 'Spend stack cannot be empty.' },
        { status: 400 }
      );
    }

    const parsedTeamSize = parseInt(teamSize, 10);
    if (isNaN(parsedTeamSize) || parsedTeamSize <= 0) {
      return NextResponse.json(
        { error: 'Valid team size is required.' },
        { status: 400 }
      );
    }

    if (!useCase) {
      return NextResponse.json(
        { error: 'Primary use case is required.' },
        { status: 400 }
      );
    }

    // Run the financial engine calculations
    const auditResults = runAuditEngine(tools, parsedTeamSize, useCase);

    // Generate a secure, unique 12-character ID (short, readable for social share)
    const uniqueId = crypto.randomBytes(6).toString('hex');

    // Store in the polymorphic database
    const savedRecord = await db.createAudit(uniqueId, {
      teamSize: parsedTeamSize,
      useCase,
      toolsInput: tools,
      auditResults,
    });

    return NextResponse.json({ id: savedRecord.id });
  } catch (err: any) {
    console.error('API Error in /api/audit:', err);
    return NextResponse.json(
      { error: 'Internal server error while compiling audit.' },
      { status: 500 }
    );
  }
}
