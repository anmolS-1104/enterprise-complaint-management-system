export type ICRSCategory = 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'SERVICE_OUTAGE' | 'GENERAL';

export type ICRSPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ICRSSentiment = 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED' | 'ANGRY';

// BMC Helix Queue Taxonomy
export type BMCQueue =
  | 'Cloud & Technical Infrastructure'
  | 'Finance & ERP Operations'
  | 'Global Customer Care & DWP Support'
  | 'Hardware & Asset Logistics'
  | 'Finance & Payroll'
  | 'Technical Support'
  | 'Customer Care'
  | 'Logistics Desk';

export type AssignedDepartment =
  | BMCQueue
  | 'Finance & Payroll'
  | 'Technical Support'
  | 'Customer Care'
  | 'Logistics Desk';

export type AssignedLead =
  | 'Elena Vance'
  | 'Alex Rivera'
  | 'Sarah Jenkins'
  | 'Marcus Vance';

export type AssignedAgentId =
  | '#AGT-FIN-01'
  | '#AGT-TECH-01'
  | '#AGT-CARE-01'
  | '#AGT-LOG-01';

export type ITILPriority =
  | 'P1 - CRITICAL'
  | 'P2 - HIGH'
  | 'P3 - MEDIUM'
  | 'P4 - LOW';

export type BMCSentiment =
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'FRUSTRATED'
  | 'CRITICAL_ESCALATION';

export interface RepositorySyncMetadata {
  target_repo: string;
  status: 'READY' | 'SYNCHRONIZED';
  branch?: string;
  submodule_source?: string;
  controllers?: string[];
}

export interface BMCHelixSession {
  current_view: 'BMC_GATEWAY' | 'DWP_CLIENT_SUBMISSION' | 'SMART_IT_AGENT_CONSOLE';
  authenticated_role: 'CORPORATE_CLIENT' | 'SUPPORT_AGENT' | 'UNAUTHORIZED';
  operator_identity: string;
  authorized: boolean;
}

export interface BMCIncidentRecord {
  assigned_queue: BMCQueue;
  assigned_lead: AssignedLead;
  assigned_agent_id: AssignedAgentId;
  itil_priority: ITILPriority;
  detected_sentiment: BMCSentiment;
  incident_summary: string;
  recommended_smartsheet_action: string;
  dwp_user_notification: string;
}

export interface BMCAITSMResponse {
  helix_session: BMCHelixSession;
  incident_record: BMCIncidentRecord;
}

export interface ZeroClickNLPTriageResult {
  // BMC Helix Primary Schema
  helix_session?: BMCHelixSession;
  incident_record?: BMCIncidentRecord;

  // ICRS / Repository Sync Schema
  repository_sync?: RepositorySyncMetadata;
  ticket_metadata?: {
    assigned_department: AssignedDepartment;
    assigned_lead: AssignedLead;
    assigned_agent_id: AssignedAgentId;
    priority: ICRSPriority | ITILPriority;
    sentiment: ICRSSentiment | BMCSentiment;
  };
  nlp_analysis?: {
    detected_intent: string;
    incident_summary: string;
    confidence_score: number | string;
  };
  resolution_plan?: {
    internal_agent_action: string;
    draft_customer_response: string;
  };
  // Compatibility aliases
  agent_action_plan?: {
    recommended_technical_action: string;
    draft_customer_response: string;
  };
  category?: ICRSCategory;
  priority?: ICRSPriority | ITILPriority;
  sentiment?: ICRSSentiment | BMCSentiment;
  summary?: string;
  recommended_action?: string;
  suggested_reply?: string;
  triage_summary?: string;
  recommended_agent_action?: string;
  draft_customer_response?: string;
}

export interface AuthValidationResult {
  task: 'AUTH_VALIDATION';
  status: 'APPROVED' | 'REJECTED';
  reason: string;
  normalized_email: string;
  sanitized_phone: string;
  error_field: 'EMAIL' | 'PHONE' | 'PASSWORD' | 'CONFIRM_PASSWORD' | 'NONE';
  auth_event?: 'CLIENT_LOGIN' | 'CLIENT_REGISTER' | 'AGENT_LOGIN';
  user_role?: 'CORPORATE_CLIENT' | 'SUPPORT_AGENT' | 'UNAUTHORIZED';
  desk_assignment?: {
    department: BMCQueue | AssignedDepartment | 'NONE';
    agent_id: AssignedAgentId | 'NONE';
    lead_name: AssignedLead | 'NONE';
  };
  target_controller_sync?: {
    controller: string;
    sync_status: string;
  };
}

export type ICRSResult = ZeroClickNLPTriageResult;

export type UserRole = 'CLIENT' | 'SUPPORT_AGENT';

export interface AppUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  department?: AssignedDepartment | string;
  agentId?: AssignedAgentId;
  deskLead?: AssignedLead;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'NEW' | 'TRIAGED' | 'ESCALATED';

export interface TicketAuditEntry {
  timestamp: string;
  actor: string;
  action: string;
}

export interface IncidentTicket {
  id: string;
  customerName: string;
  customerEmail?: string;
  companyName: string;
  tier: 'Enterprise Platinum' | 'Enterprise Growth' | 'Standard Business';
  source: 'BMC DWP Portal' | 'Smart IT Console' | 'Zendesk' | 'Salesforce Service' | 'Jira Service Desk' | 'In-App Portal' | 'Email VIP';
  complaintText: string;
  createdAt: string;
  status: TicketStatus;
  subject?: string;
  category?: string;
  internalNotes?: string;
  auditLog?: TicketAuditEntry[];
  slaBreached?: boolean;
  triageResult?: ZeroClickNLPTriageResult;
  rawJsonString?: string;
  latencyMs?: number;
  assignedTeam?: string;
  slaRemainingHours?: number;
}

export interface CompanyCMSState {
  ui_state: {
    active_portal: 'CUSTOMER_SIGN_IN' | 'AGENT_CONSOLE' | 'CUSTOMER_REGISTER';
    theme: 'COMPANY_CMS_TEAL_DARK';
    rendered_view: 'LANDING_PORTAL' | 'CLIENT_COMPLAINT_BOX' | 'AGENT_TRIAGE_INBOX';
    authenticated_user: string;
  };
  auth_validation: {
    status: 'APPROVED' | 'REJECTED';
    reason: string;
    role: 'CORPORATE_CLIENT' | 'SUPPORT_AGENT' | 'UNAUTHORIZED';
    assigned_desk: {
      desk_name: 'Finance & Payroll' | 'Technical Support' | 'Customer Care' | 'Logistics Desk' | 'NONE';
      desk_lead: 'Elena Vance' | 'Alex Rivera' | 'Sarah Jenkins' | 'Marcus Vance' | 'NONE';
      agent_id: '#AGT-FIN-01' | '#AGT-TECH-01' | '#AGT-CARE-01' | '#AGT-LOG-01' | 'NONE';
    };
  };
  triage_result: {
    nlp_detected_category: string;
    itil_priority: 'P1 - CRITICAL' | 'P2 - HIGH' | 'P3 - MEDIUM' | 'P4 - LOW' | 'NONE';
    recommended_action: string;
    customer_notification: string;
  };
}

export interface CompanyCMSAuditSchema {
  auth_audit: {
    status: 'APPROVED' | 'REJECTED';
    authenticated_user: string;
    user_role: 'CUSTOMER' | 'SUPPORT_AGENT' | 'UNAUTHORIZED';
    rejection_reason: string;
  };
  view_access: {
    rendered_screen: 'AUTH_PORTAL' | 'CLIENT_COMPLAINT_BOX' | 'AGENT_TRIAGE_INBOX';
    assigned_desk: 'Finance & Payroll' | 'Technical Support' | 'Customer Care' | 'Logistics Desk' | 'NONE';
  };
}
