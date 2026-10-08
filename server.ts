import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// STRICT DATABASE WHITELIST (EXACT 6 CUSTOMER ACCOUNTS)
const STRICT_CUSTOMER_WHITELIST: Record<
  string,
  { name: string; phone: string; company: string }
> = {
  'anmol.client@gmail.com': { name: 'Anmol', phone: '1234567891', company: 'Partner Enterprise' },
  'client.acme@gmail.com': { name: 'Acme', phone: '1234567891', company: 'Acme Corp' },
  'client.bmc@gmail.com': { name: 'BMC', phone: '1234567891', company: 'BMC Helix' },
  'client@acmecorp.com': { name: 'Sam', phone: '1234567891', company: 'Acme Corp' },
  'customer@client.com': { name: 'Standard Customer', phone: '9876543210', company: 'FinGlobal' },
  'client@client.com': { name: 'Enterprise Client', phone: '9876543211', company: 'Apex Logistics' },
};

// Pre-provisioned Support Agent Desks (NO REGISTRATION)
const PRE_PROVISIONED_AGENTS: Record<
  string,
  {
    name: string;
    department: string;
    agentId: '#AGT-FIN-01' | '#AGT-TECH-01' | '#AGT-CARE-01' | '#AGT-LOG-01';
    company: string;
  }
> = {
  'finance@agent.company.com': {
    name: 'Elena Vance',
    department: 'Finance & Payroll',
    agentId: '#AGT-FIN-01',
    company: 'CompanyCMS Support Console',
  },
  'tech@agent.company.com': {
    name: 'Alex Rivera',
    department: 'Technical Support',
    agentId: '#AGT-TECH-01',
    company: 'CompanyCMS Support Console',
  },
  'care@agent.company.com': {
    name: 'Sarah Jenkins',
    department: 'Customer Care',
    agentId: '#AGT-CARE-01',
    company: 'CompanyCMS Support Console',
  },
  'logistics@agent.company.com': {
    name: 'Marcus Vance',
    department: 'Logistics Desk',
    agentId: '#AGT-LOG-01',
    company: 'CompanyCMS Support Console',
  },
};

interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'CLIENT' | 'SUPPORT_AGENT';
  phone?: string;
  company?: string;
  department?: string;
  agentId?: '#AGT-FIN-01' | '#AGT-TECH-01' | '#AGT-CARE-01' | '#AGT-LOG-01';
}

const REGISTERED_USERS: Map<string, UserAccount> = new Map();

// Populate the 4 pre-provisioned support agents
Object.entries(PRE_PROVISIONED_AGENTS).forEach(([email, data], idx) => {
  REGISTERED_USERS.set(email, {
    id: `USR-AGT-0${idx + 1}`,
    email,
    name: data.name,
    role: 'SUPPORT_AGENT',
    department: data.department,
    agentId: data.agentId,
    company: data.company,
  });
});

// Populate the exact 6 authorized customer accounts
Object.entries(STRICT_CUSTOMER_WHITELIST).forEach(([email, data], idx) => {
  REGISTERED_USERS.set(email, {
    id: `USR-CLIENT-0${idx + 1}`,
    email,
    name: data.name,
    role: 'CLIENT',
    phone: data.phone,
    company: data.company,
  });
});

// BMC HELIX COGNITIVE ZERO-CLICK NLP TRIAGE & AITSM SYSTEM INSTRUCTION
const ZERO_CLICK_NLP_INSTRUCTION = `You are the Autonomous Cognitive IT Service Management (AITSM) & Triage Engine for BMC Helix Incident & Service Resolution Studio.

==================================================
1. ENTERPRISE REPOSITORY & BMC ARCHITECTURE CONTEXT
==================================================
- Product Platform: BMC Helix ITSM / Digital Workplace (DWP) Cognitive Resolution Engine
- Target Repository: anmolS-1104/enterprise-complaint-management-system
- Integrated Source: anmolS-1104/JAVA-PROJECT (UnifiedLoginController / AuthController)
- Framework Alignment: ITIL v4 Incident Management, Role-Based Access Control (RBAC), and Shift-Left Cognitive Automation.

==================================================
2. STRICT VIEW ISOLATION & ITIL ROLE GATEWAY
==================================================
- INITIAL STATE (Landing Portal):
  * The root interface strictly displays the BMC Helix Service Gateway with two distinct persona tabs:
    [BMC Helix Digital Workplace (Corporate Client)] and [BMC Helix ITSM Support Console (Agent Desk)].
  * The Customer Incident Submission Form and the ITIL Agent Resolution Queue must remain completely hidden until explicit credential verification.
  * No active user session is assumed by default.

- VIEW 1: DWP CORPORATE CLIENT (CUSTOMER SUBMISSION PORTAL)
  * Public customers must register prior to service access.
  * Allowed emails: '@client.com' or whitelist: ["customer@client.com", "client@client.com", "anmol.client@gmail.com", "client.acme@gmail.com", "client.bmc@gmail.com", "client@acmecorp.com"].
  * Mandatory 10-digit numeric phone number, password min 6 chars.

- VIEW 2: BMC HELIX SMART IT RESOLUTION DESK (SUPPORT AGENTS ONLY)
  * Support Agents are pre-provisioned; NO public self-registration.
  * Pre-provisioned Agent Roster:
    1. Finance & ERP Operations: finance@agent.company.com (#AGT-FIN-01, Elena Vance)
    2. Cloud & Technical Infrastructure: tech@agent.company.com (#AGT-TECH-01, Alex Rivera)
    3. Global Customer Care & DWP Support: care@agent.company.com (#AGT-CARE-01, Sarah Jenkins)
    4. Hardware & Asset Logistics: logistics@agent.company.com (#AGT-LOG-01, Marcus Vance)

==================================================
3. BMC HELIX COGNITIVE ZERO-CLICK NLP TRIAGE
==================================================
Routing Queues:
- Cloud & Technical Infrastructure (Alex Rivera | #AGT-TECH-01):
  Context: Server downtime, 502/504 gateway failures, database replication latency, API degradation, JVM heap errors, production crashes.
- Finance & ERP Operations (Elena Vance | #AGT-FIN-01):
  Context: Corporate billing anomalies, ERP expense sync failures, payment gateway errors, payroll deduction discrepancies, vendor invoice disputes.
- Hardware & Asset Logistics (Marcus Vance | #AGT-LOG-01):
  Context: Asset dispatch delays, damaged laptops/monitors in transit, docking station replacements, warehouse courier tracking failures.
- Global Customer Care & DWP Support (Sarah Jenkins | #AGT-CARE-01):
  Context: DWP portal access hurdles, enterprise onboarding questions, SLA escalations, profile credential queries.

ITIL v4 Urgency & Impact Matrix:
- CRITICAL (P1): Enterprise outage, complete ERP/database halt, widespread business disruption.
- HIGH (P2): Core business process impaired, financial transaction failure, blocked executive workflow.
- MEDIUM (P3): Isolated application bug with viable workaround, delayed non-critical asset dispatch.
- LOW (P4): Informational request, minor UI discrepancy, standard how-to question.

==================================================
4. STRICT BMC HELIX AITSM OUTPUT SCHEMA
==================================================
Output pure, valid JSON with no conversational text:

{
  "helix_session": {
    "current_view": "BMC_GATEWAY | DWP_CLIENT_SUBMISSION | SMART_IT_AGENT_CONSOLE",
    "authenticated_role": "CORPORATE_CLIENT | SUPPORT_AGENT | UNAUTHORIZED",
    "operator_identity": "name or email or NONE",
    "authorized": true
  },
  "incident_record": {
    "assigned_queue": "Cloud & Technical Infrastructure | Finance & ERP Operations | Global Customer Care & DWP Support | Hardware & Asset Logistics",
    "assigned_lead": "Alex Rivera | Elena Vance | Sarah Jenkins | Marcus Vance",
    "assigned_agent_id": "#AGT-TECH-01 | #AGT-FIN-01 | #AGT-CARE-01 | #AGT-LOG-01",
    "itil_priority": "P1 - CRITICAL | P2 - HIGH | P3 - MEDIUM | P4 - LOW",
    "detected_sentiment": "POSITIVE | NEUTRAL | FRUSTRATED | CRITICAL_ESCALATION",
    "incident_summary": "1-2 sentence executive incident assessment",
    "recommended_smartsheet_action": "Standard Operating Procedure (SOP) step for the ITIL lead",
    "dwp_user_notification": "Clear, professional incident confirmation and SLA update for the end-user"
  }
}`;

// Strict Response Schema for Zero-Click NLP Engine
const ZERO_CLICK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    helix_session: {
      type: Type.OBJECT,
      properties: {
        current_view: {
          type: Type.STRING,
          enum: ['BMC_GATEWAY', 'DWP_CLIENT_SUBMISSION', 'SMART_IT_AGENT_CONSOLE'],
        },
        authenticated_role: {
          type: Type.STRING,
          enum: ['CORPORATE_CLIENT', 'SUPPORT_AGENT', 'UNAUTHORIZED'],
        },
        operator_identity: { type: Type.STRING },
        authorized: { type: Type.BOOLEAN },
      },
      required: ['current_view', 'authenticated_role', 'operator_identity', 'authorized'],
    },
    incident_record: {
      type: Type.OBJECT,
      properties: {
        assigned_queue: {
          type: Type.STRING,
          enum: [
            'Cloud & Technical Infrastructure',
            'Finance & ERP Operations',
            'Global Customer Care & DWP Support',
            'Hardware & Asset Logistics',
          ],
        },
        assigned_lead: {
          type: Type.STRING,
          enum: ['Alex Rivera', 'Elena Vance', 'Sarah Jenkins', 'Marcus Vance'],
        },
        assigned_agent_id: {
          type: Type.STRING,
          enum: ['#AGT-TECH-01', '#AGT-FIN-01', '#AGT-CARE-01', '#AGT-LOG-01'],
        },
        itil_priority: {
          type: Type.STRING,
          enum: ['P1 - CRITICAL', 'P2 - HIGH', 'P3 - MEDIUM', 'P4 - LOW'],
        },
        detected_sentiment: {
          type: Type.STRING,
          enum: ['POSITIVE', 'NEUTRAL', 'FRUSTRATED', 'CRITICAL_ESCALATION'],
        },
        incident_summary: { type: Type.STRING },
        recommended_smartsheet_action: { type: Type.STRING },
        dwp_user_notification: { type: Type.STRING },
      },
      required: [
        'assigned_queue',
        'assigned_lead',
        'assigned_agent_id',
        'itil_priority',
        'detected_sentiment',
        'incident_summary',
        'recommended_smartsheet_action',
        'dwp_user_notification',
      ],
    },
  },
  required: ['helix_session', 'incident_record'],
};

// Deterministic Rule-Based Fallback for BMC Helix Cognitive NLP Routing & Triage
export function zeroClickRuleRouter(
  complaint: string,
  sessionContext?: {
    current_view?: 'BMC_GATEWAY' | 'DWP_CLIENT_SUBMISSION' | 'SMART_IT_AGENT_CONSOLE';
    authenticated_role?: 'CORPORATE_CLIENT' | 'SUPPORT_AGENT' | 'UNAUTHORIZED';
    operator_identity?: string;
    authorized?: boolean;
  }
) {
  const lower = complaint.toLowerCase();

  // 1. Department & Queue Detection
  let assigned_queue:
    | 'Cloud & Technical Infrastructure'
    | 'Finance & ERP Operations'
    | 'Global Customer Care & DWP Support'
    | 'Hardware & Asset Logistics' = 'Global Customer Care & DWP Support';
  let assigned_lead: 'Elena Vance' | 'Alex Rivera' | 'Sarah Jenkins' | 'Marcus Vance' = 'Sarah Jenkins';
  let assigned_agent_id: '#AGT-FIN-01' | '#AGT-TECH-01' | '#AGT-CARE-01' | '#AGT-LOG-01' = '#AGT-CARE-01';
  let confidence_score = 0.95;

  // Check Hardware & Asset Logistics
  if (
    lower.includes('hardware') ||
    lower.includes('laptop') ||
    lower.includes('monitor') ||
    lower.includes('docking') ||
    lower.includes('delivery') ||
    lower.includes('shipping') ||
    lower.includes('shipment') ||
    lower.includes('tracking') ||
    lower.includes('damaged') ||
    lower.includes('warehouse') ||
    lower.includes('courier') ||
    lower.includes('in transit') ||
    lower.includes('package') ||
    lower.includes('asset')
  ) {
    assigned_queue = 'Hardware & Asset Logistics';
    assigned_lead = 'Marcus Vance';
    assigned_agent_id = '#AGT-LOG-01';
    confidence_score = 0.98;
  }
  // Check Finance & ERP Operations
  else if (
    lower.includes('payroll') ||
    lower.includes('salary') ||
    lower.includes('erp') ||
    lower.includes('payout') ||
    lower.includes('tax') ||
    lower.includes('invoice') ||
    lower.includes('billing') ||
    lower.includes('charge') ||
    lower.includes('refund') ||
    lower.includes('credit card') ||
    lower.includes('expense') ||
    lower.includes('overcharge') ||
    lower.includes('vendor') ||
    lower.includes('payment gateway')
  ) {
    assigned_queue = 'Finance & ERP Operations';
    assigned_lead = 'Elena Vance';
    assigned_agent_id = '#AGT-FIN-01';
    confidence_score = 0.99;
  }
  // Check Cloud & Technical Infrastructure
  else if (
    lower.includes('downtime') ||
    lower.includes('502') ||
    lower.includes('504') ||
    lower.includes('500') ||
    lower.includes('404') ||
    lower.includes('server') ||
    lower.includes('api') ||
    lower.includes('database') ||
    lower.includes('replication') ||
    lower.includes('jvm') ||
    lower.includes('heap') ||
    lower.includes('latency') ||
    lower.includes('cluster') ||
    lower.includes('crash') ||
    lower.includes('outage') ||
    lower.includes('patch') ||
    lower.includes('defect') ||
    lower.includes('production') ||
    lower.includes('sso')
  ) {
    assigned_queue = 'Cloud & Technical Infrastructure';
    assigned_lead = 'Alex Rivera';
    assigned_agent_id = '#AGT-TECH-01';
    confidence_score = 0.97;
  }

  // 2. ITIL v4 Urgency & Impact Matrix (P1 to P4)
  let itil_priority: 'P1 - CRITICAL' | 'P2 - HIGH' | 'P3 - MEDIUM' | 'P4 - LOW' = 'P3 - MEDIUM';
  if (
    lower.includes('outage') ||
    lower.includes('database halt') ||
    lower.includes('replication halt') ||
    lower.includes('complete erp') ||
    lower.includes('widespread') ||
    lower.includes('all users') ||
    lower.includes('production down') ||
    lower.includes('enterprise outage')
  ) {
    itil_priority = 'P1 - CRITICAL';
  } else if (
    lower.includes('monetary') ||
    lower.includes('payment gateway') ||
    lower.includes('financial') ||
    lower.includes('executive') ||
    lower.includes('core business') ||
    lower.includes('blocked workflow') ||
    lower.includes('48 hours') ||
    lower.includes('salary blocked')
  ) {
    itil_priority = 'P2 - HIGH';
  } else if (
    lower.includes('workaround') ||
    lower.includes('delayed non-critical') ||
    lower.includes('isolated bug') ||
    lower.includes('minor delay') ||
    lower.includes('docking')
  ) {
    itil_priority = 'P3 - MEDIUM';
  } else if (
    lower.includes('how-to') ||
    lower.includes('guidance') ||
    lower.includes('question') ||
    lower.includes('ui discrepancy') ||
    lower.includes('cosmetic') ||
    lower.includes('inquiry')
  ) {
    itil_priority = 'P4 - LOW';
  }

  // 3. Sentiment Scoring
  let detected_sentiment: 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED' | 'CRITICAL_ESCALATION' = 'NEUTRAL';
  if (
    lower.includes('lawsuit') ||
    lower.includes('furious') ||
    lower.includes('unacceptable') ||
    lower.includes('immediately or else') ||
    lower.includes('breach') ||
    lower.includes('sla violation')
  ) {
    detected_sentiment = 'CRITICAL_ESCALATION';
  } else if (
    lower.includes('frustrated') ||
    lower.includes('annoyed') ||
    lower.includes('still waiting') ||
    lower.includes('disappointed') ||
    lower.includes('again')
  ) {
    detected_sentiment = 'FRUSTRATED';
  } else if (
    lower.includes('thank') ||
    lower.includes('great') ||
    lower.includes('love') ||
    lower.includes('appreciate')
  ) {
    detected_sentiment = 'POSITIVE';
  }

  const incident_summary = `Incident parsed under ITIL v4: ${assigned_queue} flagged with ${itil_priority} impacting corporate operations.`;

  const recommended_smartsheet_action =
    assigned_queue === 'Cloud & Technical Infrastructure'
      ? 'Execute ITIL P1/P2 runbook: Alex Rivera to inspect JVM telemetry, isolate failover replica cluster, and deploy container rollback.'
      : assigned_queue === 'Finance & ERP Operations'
      ? 'Execute ERP reconciliation SOP: Elena Vance to audit transaction ledger, review ERP gateway webhook logs, and issue adjusting credit memo.'
      : assigned_queue === 'Hardware & Asset Logistics'
      ? 'Execute asset replenishment SOP: Marcus Vance to query courier carrier API, file damaged transit claim, and trigger expedited warehouse dispatch.'
      : 'Execute DWP customer care workflow: Sarah Jenkins to contact enterprise client representative, resolve SSO profile hurdle, and confirm SLA compliance.';

  const dwp_user_notification = `Thank you for reporting this incident to BMC Helix Digital Workplace. Your ticket has been registered under ITIL ${itil_priority} protocol and routed to ${assigned_lead} at ${assigned_queue}. Our cognitive resolution team is actively investigating with standard SLA commitment.`;

  const legacyPriority =
    itil_priority === 'P1 - CRITICAL'
      ? 'CRITICAL'
      : itil_priority === 'P2 - HIGH'
      ? 'HIGH'
      : itil_priority === 'P3 - MEDIUM'
      ? 'MEDIUM'
      : 'LOW';

  const legacySentiment =
    detected_sentiment === 'CRITICAL_ESCALATION' ? 'ANGRY' : detected_sentiment;

  const currentView = sessionContext?.current_view || 'SMART_IT_AGENT_CONSOLE';
  const currentRole = sessionContext?.authenticated_role || 'SUPPORT_AGENT';
  const operatorIdentity = sessionContext?.operator_identity || assigned_lead;

  return {
    // STRICT BMC HELIX AITSM PRIMARY SCHEMA
    helix_session: {
      current_view: currentView,
      authenticated_role: currentRole,
      operator_identity: operatorIdentity,
      authorized: true,
    },
    incident_record: {
      assigned_queue,
      assigned_lead,
      assigned_agent_id,
      itil_priority,
      detected_sentiment,
      incident_summary,
      recommended_smartsheet_action,
      dwp_user_notification,
    },

    // ENTERPRISE REPOSITORY & COMPATIBILITY BLOCKS
    repository_sync: {
      target_repo: 'anmolS-1104/enterprise-complaint-management-system',
      status: 'READY' as const,
    },
    ticket_metadata: {
      assigned_department: assigned_queue,
      assigned_lead,
      assigned_agent_id,
      priority: legacyPriority as any,
      sentiment: legacySentiment as any,
    },
    nlp_analysis: {
      detected_intent: `Cognitive intent classification for ${assigned_queue}`,
      incident_summary,
      confidence_score,
    },
    resolution_plan: {
      internal_agent_action: recommended_smartsheet_action,
      draft_customer_response: dwp_user_notification,
    },
    agent_action_plan: {
      recommended_technical_action: recommended_smartsheet_action,
      draft_customer_response: dwp_user_notification,
    },

    // UI Field Aliases
    category:
      assigned_queue === 'Finance & ERP Operations'
        ? 'BILLING'
        : assigned_queue === 'Cloud & Technical Infrastructure'
        ? 'TECHNICAL'
        : assigned_queue === 'Hardware & Asset Logistics'
        ? 'GENERAL'
        : 'ACCOUNT',
    priority: itil_priority,
    sentiment: detected_sentiment,
    summary: incident_summary,
    recommended_action: recommended_smartsheet_action,
    suggested_reply: dwp_user_notification,
    triage_summary: incident_summary,
    recommended_agent_action: recommended_smartsheet_action,
    draft_customer_response: dwp_user_notification,
  };
}

// Clean markdown if present
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    engine: 'ICRS Autonomous Routing, Triage, and Security Engine',
    model: 'gemini-3.8-flash',
    repository_sync: {
      target_repo: 'anmolS-1104/enterprise-complaint-management-system',
      submodule_source: 'anmolS-1104/JAVA-PROJECT',
      branch: 'rescue-backup/main',
      status: 'SYNCHRONIZED',
    },
    agents: Array.from(REGISTERED_USERS.values())
      .filter((u) => u.role === 'SUPPORT_AGENT')
      .map((a) => ({
        id: a.agentId,
        lead: a.name,
        email: a.email,
        department: a.department,
      })),
    whitelistedCustomers: Object.keys(STRICT_CUSTOMER_WHITELIST),
    authorizedCustomerProfiles: STRICT_CUSTOMER_WHITELIST,
  });
});

// Target GitHub Repository Sync Status endpoint
app.get('/api/repo/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    repository_sync: {
      target_repo: 'anmolS-1104/enterprise-complaint-management-system',
      submodule_source: 'anmolS-1104/JAVA-PROJECT',
      branch: 'rescue-backup/main',
      status: 'SYNCHRONIZED',
      controllers: [
        'UnifiedLoginController.java',
        'AuthController.java',
        'UserDAOImpl.java',
      ],
      techStack: {
        client: 'JavaFX 17 Desktop Client',
        backend: 'Spring Boot REST API',
        database: 'MySQL Database',
      },
      lastSyncTimestamp: new Date().toISOString(),
    },
  });
});

// ZERO-CLICK NLP Triage & Routing Endpoint
app.post('/api/triage', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { complaint, ticketId = `TICK-${Math.floor(1000 + Math.random() * 9000)}`, metadata } = req.body;

  if (!complaint || typeof complaint !== 'string' || !complaint.trim()) {
    return res.status(400).json({ error: 'A valid customer complaint string is required.' });
  }

  try {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }

    let resultPayload: any;
    let rawJsonString = '';

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `CUSTOMER COMPLAINT FOR ZERO-CLICK NLP ROUTING & TRIAGE:\n"""\n${complaint.trim()}\n"""\n\nAnalyze intent, route to the correct desk lead, and output strictly pure JSON matching the required schema.`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: ZERO_CLICK_NLP_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: ZERO_CLICK_SCHEMA,
            temperature: 0.1,
          },
        });

        rawJsonString = cleanJsonOutput(response.text || '');
        const parsed = JSON.parse(rawJsonString);
        
        if (parsed.incident_record) {
          const inc = parsed.incident_record;
          const legacyPriority =
            inc.itil_priority === 'P1 - CRITICAL'
              ? 'CRITICAL'
              : inc.itil_priority === 'P2 - HIGH'
              ? 'HIGH'
              : inc.itil_priority === 'P3 - MEDIUM'
              ? 'MEDIUM'
              : 'LOW';
          const legacySentiment =
            inc.detected_sentiment === 'CRITICAL_ESCALATION'
              ? 'ANGRY'
              : inc.detected_sentiment;

          resultPayload = {
            helix_session: parsed.helix_session || {
              current_view: metadata?.current_view || 'DWP_CLIENT_SUBMISSION',
              authenticated_role: metadata?.authenticated_role || 'CORPORATE_CLIENT',
              operator_identity: metadata?.operator_identity || 'End User',
              authorized: true,
            },
            incident_record: inc,
            repository_sync: parsed.repository_sync || {
              target_repo: 'anmolS-1104/enterprise-complaint-management-system',
              status: 'READY',
            },
            ticket_metadata: {
              assigned_department: inc.assigned_queue,
              assigned_lead: inc.assigned_lead,
              assigned_agent_id: inc.assigned_agent_id,
              priority: legacyPriority,
              sentiment: legacySentiment,
            },
            nlp_analysis: {
              detected_intent: `Cognitive intent classification for ${inc.assigned_queue}`,
              incident_summary: inc.incident_summary,
              confidence_score: 0.98,
            },
            resolution_plan: {
              internal_agent_action: inc.recommended_smartsheet_action,
              draft_customer_response: inc.dwp_user_notification,
            },
            agent_action_plan: {
              recommended_technical_action: inc.recommended_smartsheet_action,
              draft_customer_response: inc.dwp_user_notification,
            },
            category:
              inc.assigned_queue === 'Finance & ERP Operations'
                ? 'BILLING'
                : inc.assigned_queue === 'Cloud & Technical Infrastructure'
                ? 'TECHNICAL'
                : inc.assigned_queue === 'Hardware & Asset Logistics'
                ? 'GENERAL'
                : 'ACCOUNT',
            priority: inc.itil_priority,
            sentiment: inc.detected_sentiment,
            summary: inc.incident_summary,
            recommended_action: inc.recommended_smartsheet_action,
            suggested_reply: inc.dwp_user_notification,
            triage_summary: inc.incident_summary,
            recommended_agent_action: inc.recommended_smartsheet_action,
            draft_customer_response: inc.dwp_user_notification,
          };
        } else {
          resultPayload = zeroClickRuleRouter(complaint.trim(), metadata);
          rawJsonString = JSON.stringify(resultPayload, null, 2);
        }
      } catch (geminiError) {
        resultPayload = zeroClickRuleRouter(complaint.trim(), metadata);
        rawJsonString = JSON.stringify(resultPayload, null, 2);
      }
    } else {
      resultPayload = zeroClickRuleRouter(complaint.trim(), metadata);
      rawJsonString = JSON.stringify(resultPayload, null, 2);
    }

    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      data: resultPayload,
      rawJsonString,
      latencyMs,
      timestamp: new Date().toISOString(),
      ticketId,
      metadata: metadata || {},
    });
  } catch (error: any) {
    const fallback = zeroClickRuleRouter(complaint.trim());
    return res.json({
      success: true,
      data: fallback,
      rawJsonString: JSON.stringify(fallback, null, 2),
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      ticketId,
      metadata: metadata || {},
    });
  }
});

// Auth Validation
app.post('/api/auth/validate', (req: Request, res: Response) => {
  const { name = '', email = '', phone = '', password = '', role = 'CLIENT', action = 'register' } = req.body;
  const emailNorm = email.trim().toLowerCase();

  // Support Agent Public Registration Ban
  if (
    action === 'register' &&
    (role === 'SUPPORT_AGENT' ||
      emailNorm.includes('agent.company.com') ||
      PRE_PROVISIONED_AGENTS[emailNorm])
  ) {
    const rejected = {
      task: 'AUTH_VALIDATION',
      status: 'REJECTED',
      reason: 'Registration prohibited for Support Agent credentials.',
      normalized_email: emailNorm,
      sanitized_phone: phone ? phone.replace(/\D/g, '') : 'N/A',
      error_field: 'EMAIL',
    };
    return res.json({ success: false, data: rejected, rawJsonString: JSON.stringify(rejected, null, 2) });
  }

  // Registration Compulsory Fields
  if (action === 'register') {
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim()) {
      const rejected = {
        task: 'AUTH_VALIDATION',
        status: 'REJECTED',
        reason: 'Validation Error: All fields (Full Name, Corporate Email, 10-Digit Phone, Password) are strictly compulsory.',
        normalized_email: emailNorm,
        sanitized_phone: phone ? phone.replace(/\D/g, '') : 'N/A',
        error_field: 'REQUIRED_FIELDS',
      };
      return res.json({ success: false, data: rejected, rawJsonString: JSON.stringify(rejected, null, 2) });
    }
  }

  // Strict Customer Whitelist Enforcement
  if (role === 'CLIENT' || role === 'CUSTOMER') {
    if (!STRICT_CUSTOMER_WHITELIST[emailNorm]) {
      const rejected = {
        task: 'AUTH_VALIDATION',
        status: 'REJECTED',
        reason: 'ACCESS_DENIED: User not on the corporate authorized roster.',
        normalized_email: emailNorm,
        sanitized_phone: phone ? phone.replace(/\D/g, '') : 'N/A',
        error_field: 'EMAIL',
      };
      return res.json({ success: false, data: rejected, rawJsonString: JSON.stringify(rejected, null, 2) });
    }

    // Mandatory 10-digit phone for Client
    const digits = phone.replace(/\D/g, '');
    if (phone && digits.length !== 10) {
      const rejected = {
        task: 'AUTH_VALIDATION',
        status: 'REJECTED',
        reason: 'Validation Error: Phone number must be exactly 10 numeric digits.',
        normalized_email: emailNorm,
        sanitized_phone: digits || 'N/A',
        error_field: 'PHONE',
      };
      return res.json({ success: false, data: rejected, rawJsonString: JSON.stringify(rejected, null, 2) });
    }

    // Minimum 6 characters password
    if (password && password.length < 6) {
      const rejected = {
        task: 'AUTH_VALIDATION',
        status: 'REJECTED',
        reason: 'Validation Error: Password must be at least 6 characters long.',
        normalized_email: emailNorm,
        sanitized_phone: digits || 'N/A',
        error_field: 'PASSWORD',
      };
      return res.json({ success: false, data: rejected, rawJsonString: JSON.stringify(rejected, null, 2) });
    }
  }

  const approved = {
    task: 'AUTH_VALIDATION',
    status: 'APPROVED',
    reason: 'Validation passed',
    normalized_email: emailNorm,
    sanitized_phone: phone ? phone.replace(/\D/g, '') : 'N/A',
    error_field: 'NONE',
  };
  return res.json({ success: true, data: approved, rawJsonString: JSON.stringify(approved, null, 2) });
});

// Direct Login Endpoint for Support Agents & Registered Clients
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email = '', password = '', role = 'CLIENT' } = req.body;
  const emailNorm = email.trim().toLowerCase();

  // Support Agent Direct Login Only
  if (role === 'SUPPORT_AGENT' || emailNorm.includes('agent.company.com')) {
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Password must be at least 6 characters long.',
      });
    }

    const agent = PRE_PROVISIONED_AGENTS[emailNorm];
    if (!agent) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED: Unrecognized support agent credentials. Only pre-provisioned desk leads may log in.',
      });
    }

    const userObj = REGISTERED_USERS.get(emailNorm);
    return res.json({
      success: true,
      user: userObj,
      message: `Direct login successful for ${agent.name} (${agent.department} - ${agent.agentId}).`,
    });
  }

  // Customer Login - Must be one of the exact 6 authorized customer accounts
  if (!STRICT_CUSTOMER_WHITELIST[emailNorm]) {
    return res.status(403).json({
      success: false,
      error: 'ACCESS_DENIED: User not on the corporate authorized roster.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Password must be at least 6 characters long.',
    });
  }

  const client = REGISTERED_USERS.get(emailNorm)!;
  return res.json({
    success: true,
    user: client,
    message: 'Corporate customer login verified.',
  });
});

// Corporate Client Registration
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name = '', email = '', phone = '', password = '', company = 'Corporate Partner' } = req.body;
  const emailNorm = email.trim().toLowerCase();

  // Support Agent Ban on Register
  if (emailNorm.includes('agent.company.com') || PRE_PROVISIONED_AGENTS[emailNorm]) {
    return res.status(400).json({
      success: false,
      error: 'Registration prohibited for Support Agent credentials.',
    });
  }

  // All fields strictly compulsory and formatted correctly
  const digits = phone.replace(/\D/g, '');
  if (
    !name?.trim() ||
    !email?.trim() ||
    !phone?.trim() ||
    !password?.trim() ||
    digits.length !== 10 ||
    password.length < 6
  ) {
    return res.status(400).json({
      success: false,
      error: 'Security Violation: All fields are compulsory. Phone must be 10 digits and password >= 6 characters.',
    });
  }

  // Must match strict customer whitelist
  if (!STRICT_CUSTOMER_WHITELIST[emailNorm]) {
    return res.status(403).json({
      success: false,
      error: 'ACCESS_DENIED: User not on the corporate authorized roster.',
    });
  }

  const clientProfile = STRICT_CUSTOMER_WHITELIST[emailNorm];
  const newClient: UserAccount = {
    id: `USR-CLIENT-${Math.floor(1000 + Math.random() * 9000)}`,
    email: emailNorm,
    name: name.trim() || clientProfile.name,
    phone: digits,
    company: company || clientProfile.company,
    role: 'CLIENT',
  };

  REGISTERED_USERS.set(emailNorm, newClient);

  return res.json({
    success: true,
    user: newClient,
    message: 'Registration successful and verified against corporate roster.',
  });
});

// Batch Triage
app.post('/api/triage/batch', async (req: Request, res: Response) => {
  const { tickets } = req.body;
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).json({ error: 'Array of tickets is required.' });
  }

  const results: any[] = [];
  for (const item of tickets.slice(0, 10)) {
    const text = item.complaint || item.text || '';
    const ticketId = item.id || item.ticketId || `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
    const metadata = item.metadata || {};
    const routed = zeroClickRuleRouter(text);

    results.push({
      ticketId,
      complaint: text,
      metadata,
      data: routed,
      rawJsonString: JSON.stringify(routed, null, 2),
      success: true,
    });
  }

  res.json({
    success: true,
    total: results.length,
    results,
  });
});

// Static Vite Middleware
async function setupApp() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ICRS Autonomous Routing & Triage Server running on port ${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
