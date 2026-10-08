import React, { useState } from 'react';
import { Header } from './components/Header';
import { CompanyCMSFrontPage } from './components/CompanyCMSFrontPage';
import { DWPClientPortal } from './components/DWPClientPortal';
import { SmartITConsole } from './components/SmartITConsole';
import { INITIAL_TICKETS } from './data/sampleComplaints';
import { IncidentTicket, TicketStatus, AppUser, CompanyCMSState, CompanyCMSAuditSchema } from './types/icrs';
import { Code, X, Copy, Check } from 'lucide-react';

export default function App() {
  const [tickets, setTickets] = useState<IncidentTicket[]>(INITIAL_TICKETS);

  // STRICT VIEW-ISOLATION & PERMISSION GATEWAY:
  // 1. Initial Landing Page State:
  //    - Render ONLY the CompanyCMS Front Page with the dual-role pill switchers.
  //    - The Customer Complaint Submission Box and the Agent Triage Console MUST REMAIN COMPLETELY HIDDEN until successful login.
  //    - No pre-authenticated session is assumed.
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [latestAudit, setLatestAudit] = useState<CompanyCMSAuditSchema | null>(null);

  // Modal / drawer state for Live State Schema Inspector
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'AUDIT' | 'FULL'>('AUDIT');

  const handleSignOut = () => {
    // LOGOUT ENFORCEMENT:
    // Session termination immediately purges active auth tokens, closes all active queue views,
    // and resets the interface back to the initial CompanyCMS Front Page.
    setCurrentUser(null);
    setLatestAudit({
      auth_audit: {
        status: 'APPROVED',
        authenticated_user: 'NONE',
        user_role: 'UNAUTHORIZED',
        rejection_reason: 'NONE',
      },
      view_access: {
        rendered_screen: 'AUTH_PORTAL',
        assigned_desk: 'NONE',
      },
    });
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
  };

  const handleTicketCreated = (newTicket: IncidentTicket) => {
    setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
  };

  const handleBatchCompleted = (batchTickets: IncidentTicket[]) => {
    setTickets((prev) => [...batchTickets, ...prev]);
  };

  // Compute 4. JSON AUDIT & TRIAGE OUTPUT SCHEMA
  const getAuditSchemaJson = (): CompanyCMSAuditSchema => {
    if (!currentUser) {
      if (latestAudit) {
        return latestAudit;
      }
      return {
        auth_audit: {
          status: 'APPROVED',
          authenticated_user: 'NONE',
          user_role: 'UNAUTHORIZED',
          rejection_reason: 'NONE',
        },
        view_access: {
          rendered_screen: 'AUTH_PORTAL',
          assigned_desk: 'NONE',
        },
      };
    }

    if (currentUser.role === 'CLIENT') {
      return {
        auth_audit: {
          status: 'APPROVED',
          authenticated_user: currentUser.email,
          user_role: 'CUSTOMER',
          rejection_reason: 'NONE',
        },
        view_access: {
          rendered_screen: 'CLIENT_COMPLAINT_BOX',
          assigned_desk: 'NONE',
        },
      };
    }

    // Support Agent
    const assignedDesk =
      currentUser.department?.includes('Finance')
        ? 'Finance & Payroll'
        : currentUser.department?.includes('Tech') || currentUser.department?.includes('Cloud')
        ? 'Technical Support'
        : currentUser.department?.includes('Care')
        ? 'Customer Care'
        : currentUser.department?.includes('Logistics') || currentUser.department?.includes('Hardware')
        ? 'Logistics Desk'
        : 'NONE';

    return {
      auth_audit: {
        status: 'APPROVED',
        authenticated_user: currentUser.email,
        user_role: 'SUPPORT_AGENT',
        rejection_reason: 'NONE',
      },
      view_access: {
        rendered_screen: 'AGENT_TRIAGE_INBOX',
        assigned_desk: assignedDesk as any,
      },
    };
  };

  // Compute live CompanyCMSState JSON matching the REQUIRED OUTPUT SCHEMA
  const getGlobalStateJson = (): CompanyCMSState => {
    if (!currentUser) {
      return {
        ui_state: {
          active_portal: 'CUSTOMER_SIGN_IN',
          theme: 'COMPANY_CMS_TEAL_DARK',
          rendered_view: 'LANDING_PORTAL',
          authenticated_user: 'NONE',
        },
        auth_validation: {
          status: 'APPROVED',
          reason: 'Initial CompanyCMS front-page state ready for credential verification',
          role: 'UNAUTHORIZED',
          assigned_desk: {
            desk_name: 'NONE',
            desk_lead: 'NONE',
            agent_id: 'NONE',
          },
        },
        triage_result: {
          nlp_detected_category: 'PENDING_SUBMISSION',
          itil_priority: 'NONE',
          recommended_action: 'Awaiting customer submission of raw incident complaint',
          customer_notification: 'Session not established. Please sign in to submit a complaint.',
        },
      };
    }

    if (currentUser.role === 'CLIENT') {
      const latestTicket = tickets.find((t) => t.source === 'BMC DWP Portal');
      return {
        ui_state: {
          active_portal: 'CUSTOMER_SIGN_IN',
          theme: 'COMPANY_CMS_TEAL_DARK',
          rendered_view: 'CLIENT_COMPLAINT_BOX',
          authenticated_user: currentUser.email,
        },
        auth_validation: {
          status: 'APPROVED',
          reason: 'Corporate client authentication verified. Access granted to Client Resolution Portal.',
          role: 'CORPORATE_CLIENT',
          assigned_desk: {
            desk_name: 'NONE',
            desk_lead: 'NONE',
            agent_id: 'NONE',
          },
        },
        triage_result: {
          nlp_detected_category:
            latestTicket?.triageResult?.incident_record?.assigned_queue ||
            latestTicket?.triageResult?.ticket_metadata?.assigned_department ||
            'PENDING_SUBMISSION',
          itil_priority:
            (latestTicket?.triageResult?.incident_record?.itil_priority as any) ||
            (latestTicket?.triageResult?.priority as any) ||
            'NONE',
          recommended_action:
            latestTicket?.triageResult?.incident_record?.recommended_smartsheet_action ||
            latestTicket?.triageResult?.resolution_plan?.internal_agent_action ||
            'Awaiting customer submission of raw incident complaint',
          customer_notification:
            latestTicket?.triageResult?.incident_record?.dwp_user_notification ||
            latestTicket?.triageResult?.resolution_plan?.draft_customer_response ||
            'Empathetic update for the end-user: Your incident is received and actively routed.',
        },
      };
    }

    // Support Agent
    const deskName =
      currentUser.department?.includes('Finance')
        ? 'Finance & Payroll'
        : currentUser.department?.includes('Tech') || currentUser.department?.includes('Cloud')
        ? 'Technical Support'
        : currentUser.department?.includes('Care')
        ? 'Customer Care'
        : currentUser.department?.includes('Logistics') || currentUser.department?.includes('Hardware')
        ? 'Logistics Desk'
        : 'Technical Support';

    const leadName =
      currentUser.name ||
      (deskName === 'Finance & Payroll'
        ? 'Elena Vance'
        : deskName === 'Customer Care'
        ? 'Sarah Jenkins'
        : deskName === 'Logistics Desk'
        ? 'Marcus Vance'
        : 'Alex Rivera');

    const agentId =
      currentUser.agentId ||
      (deskName === 'Finance & Payroll'
        ? '#AGT-FIN-01'
        : deskName === 'Customer Care'
        ? '#AGT-CARE-01'
        : deskName === 'Logistics Desk'
        ? '#AGT-LOG-01'
        : '#AGT-TECH-01');

    const firstTicket = tickets[0];

    return {
      ui_state: {
        active_portal: 'AGENT_CONSOLE',
        theme: 'COMPANY_CMS_TEAL_DARK',
        rendered_view: 'AGENT_TRIAGE_INBOX',
        authenticated_user: currentUser.email,
      },
      auth_validation: {
        status: 'APPROVED',
        reason: `Support Agent authenticated for ${deskName}. Operator: ${leadName}`,
        role: 'SUPPORT_AGENT',
        assigned_desk: {
          desk_name: deskName as any,
          desk_lead: leadName as any,
          agent_id: agentId as any,
        },
      },
      triage_result: {
        nlp_detected_category: deskName,
        itil_priority:
          (firstTicket?.triageResult?.incident_record?.itil_priority as any) ||
          (firstTicket?.triageResult?.priority as any) ||
          'P1 - CRITICAL',
        recommended_action:
          firstTicket?.triageResult?.incident_record?.recommended_smartsheet_action ||
          firstTicket?.triageResult?.resolution_plan?.internal_agent_action ||
          `Execute SOP diagnostic step for ${deskName} lead`,
        customer_notification:
          firstTicket?.triageResult?.incident_record?.dwp_user_notification ||
          firstTicket?.triageResult?.resolution_plan?.draft_customer_response ||
          'Empathetic update for the end-user: Your incident is currently being resolved by our specialized operations team.',
      },
    };
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(getGlobalStateJson(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#091424] text-[#94a3b8] flex flex-col font-sans antialiased selection:bg-[#4fd1c5] selection:text-[#091424]">
      {/* 2. Top Navigation Bar */}
      <Header
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenSignInModal={() => {
          // If on landing, scroll to card; if not, reset to front page
          if (currentUser) {
            handleSignOut();
          }
        }}
        onToggleStateInspector={() => setIsInspectorOpen(true)}
      />

      {/* Main Viewport Content governed by Strict View Isolation & Permission Gateway */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
        {/* 1. Initial Landing Page State:
            Render ONLY the CompanyCMS Front Page with the dual-role pill switchers.
            The Customer Complaint Submission Box and the Agent Triage Console MUST REMAIN COMPLETELY HIDDEN until successful login. */}
        {currentUser === null && (
          <CompanyCMSFrontPage
            onLoginSuccess={handleLoginSuccess}
            onAuditChange={setLatestAudit}
          />
        )}

        {/* 2. Persona A — Customer Portal:
            Post-Login Transition: Unlocks ONLY the raw Customer Complaint Box. */}
        {currentUser !== null && currentUser.role === 'CLIENT' && (
          <DWPClientPortal
            currentUser={currentUser}
            onSignOut={handleSignOut}
            onTicketCreated={handleTicketCreated}
            tickets={tickets}
          />
        )}

        {/* 3. Persona B — Support Agent Console:
            Post-Login Transition: Unlocks ONLY the Support Agent Triage Inbox and Desk Queues. */}
        {currentUser !== null && currentUser.role === 'SUPPORT_AGENT' && (
          <SmartITConsole
            currentUser={currentUser}
            onSignOut={handleSignOut}
            tickets={tickets}
            onTicketCreated={handleTicketCreated}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onBatchCompleted={handleBatchCompleted}
          />
        )}
      </main>

      {/* Floating Modal for Live State Controller & Schema Inspector */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#112238] border border-[#1a3454] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(79,209,197,0.15)]">
            <div className="flex items-center justify-between p-4 border-b border-[#1a3454]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-[#4fd1c5]" />
                  <h3 className="text-sm font-bold text-white font-mono">
                    Schema Controller Output
                  </h3>
                </div>
                <div className="inline-flex rounded-lg bg-[#091424] p-0.5 border border-[#1a3454]">
                  <button
                    type="button"
                    onClick={() => setInspectorTab('AUDIT')}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors cursor-pointer ${
                      inspectorTab === 'AUDIT'
                        ? 'bg-[#4fd1c5] text-[#091424] font-bold'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    Auth Audit Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab('FULL')}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors cursor-pointer ${
                      inspectorTab === 'FULL'
                        ? 'bg-[#4fd1c5] text-[#091424] font-bold'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    Full State JSON
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toCopy = inspectorTab === 'AUDIT' ? getAuditSchemaJson() : getGlobalStateJson();
                    navigator.clipboard.writeText(JSON.stringify(toCopy, null, 2));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 text-xs bg-[#091424] hover:bg-[#152a45] text-[#94a3b8] hover:text-[#4fd1c5] border border-[#1a3454] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#4fd1c5]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1 text-[#94a3b8] hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-[#091424]">
              <div className="text-[11px] text-[#94a3b8] mb-2 font-mono flex items-center justify-between">
                <span>
                  {inspectorTab === 'AUDIT'
                    ? 'Target Schema 4: auth_audit & view_access'
                    : 'Extended Schema: ui_state, auth_validation & triage_result'}
                </span>
                <span className="text-[#4fd1c5]">
                  Screen: {getAuditSchemaJson().view_access.rendered_screen}
                </span>
              </div>
              <pre className="text-xs font-mono text-teal-300 overflow-x-auto p-4 bg-[#060e1a] rounded-xl border border-[#1a3454] leading-relaxed">
                {JSON.stringify(
                  inspectorTab === 'AUDIT' ? getAuditSchemaJson() : getGlobalStateJson(),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Platform Footer: Dark Palette */}
      <footer className="border-t border-[#1a3454] bg-[#07101d] py-6 mt-12 text-xs text-[#94a3b8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">CompanyCMS</span>
            <span>·</span>
            <span>AI Powered Intelligent Complaint Resolution System</span>
            <span>·</span>
            <span className="text-[#4fd1c5] font-mono">ITIL v4 Shift-Left</span>
          </div>
          <div className="text-[#94a3b8] font-mono text-[11px]">
            Target Sync: anmolS-1104/enterprise-complaint-management-system
          </div>
        </div>
      </footer>
    </div>
  );
}
