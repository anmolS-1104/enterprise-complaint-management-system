import React, { useState } from 'react';
import {
  AppUser,
  IncidentTicket,
  TicketStatus,
  ZeroClickNLPTriageResult,
  CompanyCMSState,
} from '../types/icrs';
import { TriageStudio } from './TriageStudio';
import { IncidentQueue } from './IncidentQueue';
import { BatchProcessing } from './BatchProcessing';
import { RulesReference } from './RulesReference';
import { AuthStudio } from './AuthStudio';
import {
  Server,
  Inbox,
  Activity,
  Layers,
  BookOpen,
  Shield,
  LogOut,
  Code2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Code,
} from 'lucide-react';

interface SmartITConsoleProps {
  currentUser: AppUser;
  onSignOut: () => void;
  tickets: IncidentTicket[];
  onTicketCreated: (newTicket: IncidentTicket) => void;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onBatchCompleted: (batchTickets: IncidentTicket[]) => void;
}

export const SmartITConsole: React.FC<SmartITConsoleProps> = ({
  currentUser,
  onSignOut,
  tickets,
  onTicketCreated,
  onUpdateTicketStatus,
  onBatchCompleted,
}) => {
  const [subTab, setSubTab] = useState<'queue' | 'triage' | 'schema' | 'batch' | 'spec'>('queue');
  const [selectedTicketForStudio, setSelectedTicketForStudio] = useState<IncidentTicket | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [copied, setCopied] = useState(false);

  // Desk normalized name
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

  const criticalCount = tickets.filter(
    (t) =>
      (t.triageResult?.incident_record?.itil_priority === 'P1 - CRITICAL' ||
        t.triageResult?.priority === 'CRITICAL') &&
      t.status !== 'RESOLVED'
  ).length;

  const getLiveStateJson = (): CompanyCMSState => {
    const latestTicket = tickets[0];
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
          (latestTicket?.triageResult?.incident_record?.itil_priority as any) ||
          (latestTicket?.triageResult?.priority as any) ||
          'P2 - HIGH',
        recommended_action:
          latestTicket?.triageResult?.incident_record?.recommended_smartsheet_action ||
          latestTicket?.triageResult?.resolution_plan?.internal_agent_action ||
          `Execute SOP diagnostic step for ${deskName} lead`,
        customer_notification:
          latestTicket?.triageResult?.incident_record?.dwp_user_notification ||
          latestTicket?.triageResult?.resolution_plan?.draft_customer_response ||
          'Empathetic update for the end-user: Your incident is currently being resolved by our specialized operations team.',
      },
    };
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(getLiveStateJson(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Support Agent Header Banner: Dark Teal Palette */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-6 text-white shadow-[0_0_30px_rgba(79,209,197,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#091424] border border-[#1a3454] text-[#4fd1c5] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(79,209,197,0.15)]">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4fd1c5] bg-[#4fd1c5]/10 px-2.5 py-0.5 rounded-full border border-[#4fd1c5]/30">
                Support Agent Triage Console
              </span>
              <span className="text-xs text-[#94a3b8]">·</span>
              <span className="text-xs font-mono text-teal-300">
                Operator ID: <strong className="text-[#4fd1c5]">{agentId}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
              <span>{leadName}</span>
              <span className="text-sm font-normal text-teal-300">({deskName})</span>
            </h1>
            <div className="text-xs text-[#94a3b8] flex flex-wrap items-center gap-2 mt-0.5">
              <span className="font-mono text-white/90">{currentUser.email}</span>
              <span>·</span>
              <span>ITIL v4 Dispatch Active</span>
              <span>·</span>
              <span className="text-[#4fd1c5] font-mono text-[11px]">
                Target: anmolS-1104/enterprise-complaint-management-system
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            className="px-3 py-1.5 text-xs font-mono font-medium text-[#94a3b8] hover:text-[#4fd1c5] bg-[#091424] border border-[#1a3454] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-[#4fd1c5]" />
            <span>State JSON</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Session (Logout)</span>
          </button>
        </div>
      </div>

      {/* Real-time State Schema Inspector */}
      {showJsonInspector && (
        <div className="p-4 rounded-xl bg-[#091424] border border-[#1a3454] shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#4fd1c5] font-mono">
              COMPANY_CMS_TEAL_DARK · LIVE STATE OUTPUT:
            </span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-2.5 py-1 text-[11px] bg-[#112238] hover:bg-[#152a45] text-[#94a3b8] hover:text-[#4fd1c5] border border-[#1a3454] rounded flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-[#4fd1c5]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-teal-300/90 overflow-x-auto p-3 bg-[#060e1a] rounded-lg border border-[#1a3454]">
            {JSON.stringify(getLiveStateJson(), null, 2)}
          </pre>
        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1a3454] pb-3 gap-3">
        <nav className="flex flex-wrap items-center gap-1.5 bg-[#112238] p-1 rounded-xl border border-[#1a3454]">
          <button
            type="button"
            onClick={() => setSubTab('queue')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'queue'
                ? 'bg-[#4fd1c5] text-[#091424] shadow-[0_0_12px_rgba(79,209,197,0.3)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#152a45]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Support Agent Triage Inbox</span>
            <span className="text-[10px] bg-[#091424] text-teal-300 px-1.5 py-0.2 rounded font-mono font-medium border border-[#1a3454]">
              {tickets.length}
            </span>
            {criticalCount > 0 && (
              <span
                className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                title={`${criticalCount} P1 Critical`}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('triage')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'triage'
                ? 'bg-[#4fd1c5] text-[#091424] shadow-[0_0_12px_rgba(79,209,197,0.3)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#152a45]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Zero-Click Dispatch Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('schema')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'schema'
                ? 'bg-[#4fd1c5] text-[#091424] shadow-[0_0_12px_rgba(79,209,197,0.3)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#152a45]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>State Controller & Auth Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('batch')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'batch'
                ? 'bg-[#4fd1c5] text-[#091424] shadow-[0_0_12px_rgba(79,209,197,0.3)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#152a45]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Dispatch Suite</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('spec')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'spec'
                ? 'bg-[#4fd1c5] text-[#091424] shadow-[0_0_12px_rgba(79,209,197,0.3)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#152a45]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ITIL v4 Desk Architecture</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
          <span className="w-2 h-2 rounded-full bg-[#4fd1c5] animate-pulse" />
          <span className="font-medium text-white">{deskName}</span>
          <span className="text-[#1a3454]">·</span>
          <span className="font-mono text-[#4fd1c5] font-semibold">{agentId}</span>
        </div>
      </div>

      {/* Main Sub Tab Viewports */}
      {subTab === 'queue' && (
        <IncidentQueue
          tickets={tickets}
          onUpdateTicketStatus={onUpdateTicketStatus}
          onSelectTicketForStudio={(ticket) => {
            setSelectedTicketForStudio(ticket);
            setSubTab('triage');
          }}
        />
      )}

      {subTab === 'triage' && (
        <TriageStudio
          onTicketCreated={onTicketCreated}
          currentUser={currentUser}
        />
      )}

      {subTab === 'schema' && <AuthStudio />}

      {subTab === 'batch' && <BatchProcessing onBatchCompleted={onBatchCompleted} />}

      {subTab === 'spec' && <RulesReference />}
    </div>
  );
};
