import fs from 'fs/promises';
import path from 'path';

export interface AuditRecord {
  id: string;
  createdAt: string;
  teamSize: number;
  useCase: string;
  toolsInput: any;
  auditResults: any;
  llmSummary?: string;
  email?: string;
  companyName?: string;
  role?: string;
  submittedLead: boolean;
}

export interface DatabaseProvider {
  getAudit(id: string): Promise<AuditRecord | null>;
  createAudit(id: string, record: Omit<AuditRecord, 'id' | 'createdAt' | 'submittedLead'>): Promise<AuditRecord>;
  updateAuditLead(
    id: string,
    leadData: {
      email: string;
      companyName?: string;
      role?: string;
      submittedLead: boolean;
      llmSummary?: string;
    }
  ): Promise<AuditRecord>;
}

// ----------------------------------------------------
// LOCAL JSON FILE SYSTEM DATABASE PROVIDER
// ----------------------------------------------------
class LocalJsonDatabaseProvider implements DatabaseProvider {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'db', 'audits.json');
  }

  private async ensureInitialized(): Promise<void> {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // Ignore directory already exists
    }

    try {
      await fs.access(this.filePath);
    } catch {
      // File does not exist, initialize empty array
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private async readAll(): Promise<AuditRecord[]> {
    await this.ensureInitialized();
    const raw = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(raw) as AuditRecord[];
  }

  private async writeAll(records: AuditRecord[]): Promise<void> {
    await this.ensureInitialized();
    await fs.writeFile(this.filePath, JSON.stringify(records, null, 2), 'utf-8');
  }

  async getAudit(id: string): Promise<AuditRecord | null> {
    const records = await this.readAll();
    const record = records.find(r => r.id === id);
    return record || null;
  }

  async createAudit(
    id: string,
    recordData: Omit<AuditRecord, 'id' | 'createdAt' | 'submittedLead'>
  ): Promise<AuditRecord> {
    const records = await this.readAll();
    const newRecord: AuditRecord = {
      ...recordData,
      id,
      createdAt: new Date().toISOString(),
      submittedLead: false,
    };
    records.push(newRecord);
    await this.writeAll(records);
    return newRecord;
  }

  async updateAuditLead(
    id: string,
    leadData: {
      email: string;
      companyName?: string;
      role?: string;
      submittedLead: boolean;
      llmSummary?: string;
    }
  ): Promise<AuditRecord> {
    const records = await this.readAll();
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) {
      throw new Error(`Audit record with id ${id} not found.`);
    }

    const updatedRecord: AuditRecord = {
      ...records[idx],
      ...leadData,
    };
    records[idx] = updatedRecord;
    await this.writeAll(records);
    return updatedRecord;
  }
}

// ----------------------------------------------------
// REMOTE SUPABASE DATABASE PROVIDER
// ----------------------------------------------------
class SupabaseDatabaseProvider implements DatabaseProvider {
  private url: string;
  private key: string;

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  private async request(method: string, pathUrl: string, body?: any) {
    const headers: Record<string, string> = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };

    const res = await fetch(`${this.url}/rest/v1/${pathUrl}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Supabase DB Error (${res.status}): ${errorText}`);
    }

    return res.json();
  }

  async getAudit(id: string): Promise<AuditRecord | null> {
    const data = await this.request('GET', `audits?id=eq.${id}`);
    if (!data || data.length === 0) return null;
    
    // Map database snake_case to camelCase
    const row = data[0];
    return {
      id: row.id,
      createdAt: row.created_at,
      teamSize: row.team_size,
      useCase: row.use_case,
      toolsInput: row.tools_input,
      auditResults: row.audit_results,
      llmSummary: row.llm_summary,
      email: row.email,
      companyName: row.company_name,
      role: row.role,
      submittedLead: row.submitted_lead,
    };
  }

  async createAudit(
    id: string,
    recordData: Omit<AuditRecord, 'id' | 'createdAt' | 'submittedLead'>
  ): Promise<AuditRecord> {
    const body = {
      id,
      team_size: recordData.teamSize,
      use_case: recordData.useCase,
      tools_input: recordData.toolsInput,
      audit_results: recordData.auditResults,
      submitted_lead: false,
    };

    const data = await this.request('POST', 'audits', body);
    const row = data[0];

    return {
      id: row.id,
      createdAt: row.created_at,
      teamSize: row.team_size,
      useCase: row.use_case,
      toolsInput: row.tools_input,
      auditResults: row.audit_results,
      submittedLead: row.submitted_lead,
    };
  }

  async updateAuditLead(
    id: string,
    leadData: {
      email: string;
      companyName?: string;
      role?: string;
      submittedLead: boolean;
      llmSummary?: string;
    }
  ): Promise<AuditRecord> {
    const body: Record<string, any> = {
      email: leadData.email,
      company_name: leadData.companyName,
      role: leadData.role,
      submitted_lead: leadData.submittedLead,
    };
    if (leadData.llmSummary !== undefined) {
      body.llm_summary = leadData.llmSummary;
    }

    const data = await this.request('PATCH', `audits?id=eq.${id}`, body);
    if (!data || data.length === 0) {
      throw new Error(`Audit record with id ${id} not found in Supabase.`);
    }
    const row = data[0];

    return {
      id: row.id,
      createdAt: row.created_at,
      teamSize: row.team_size,
      useCase: row.use_case,
      toolsInput: row.tools_input,
      auditResults: row.audit_results,
      llmSummary: row.llm_summary,
      email: row.email,
      companyName: row.company_name,
      role: row.role,
      submittedLead: row.submitted_lead,
    };
  }
}

// ----------------------------------------------------
// DYNAMIC INITIALIZATION EXPORT
// ----------------------------------------------------
let dbProvider: DatabaseProvider;

const sbUrl = process.env.SUPABASE_URL;
const sbAnonKey = process.env.SUPABASE_ANON_KEY;

if (sbUrl && sbAnonKey) {
  console.log('Database Client initialized with SUPABASE mode.');
  dbProvider = new SupabaseDatabaseProvider(sbUrl, sbAnonKey);
} else {
  console.log('Database Client initialized with LOCAL FILE mode.');
  dbProvider = new LocalJsonDatabaseProvider();
}

export const db = dbProvider;
export type { DatabaseProvider as IDatabaseProvider };
export type { LocalJsonDatabaseProvider as ILocalJsonDatabaseProvider };
export type { SupabaseDatabaseProvider as ISupabaseDatabaseProvider };
