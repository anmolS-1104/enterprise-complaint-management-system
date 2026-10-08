import React, { useState } from 'react';
import { AppUser, IncidentTicket, ZeroClickNLPTriageResult, CompanyCMSState } from '../types/icrs';
import { PRESET_COMPLAINTS, PresetComplaint } from '../data/sampleComplaints';
import {
  Building2,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  LogOut,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  Info,
  Code,
  Copy,
  Check,
} from 'lucide-react';

interface DWPClientPortalProps {
  currentUser: AppUser;
  onSignOut: () => void;
  onTicketCreated: (newTicket: IncidentTicket) => void;
  tickets: IncidentTicket[];
}

export const DWPClientPortal: React.FC<DWPClientPortalProps> = ({
  currentUser,
  onSignOut,
  onTicketCreated,
  tickets,
}) => {
  const [incidentText, setIncidentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    ticketId: string;
    notification: string;
    priority: string;
    summary: string;
    desk: string;
  } | null>(null);

  const [lastTriageResult, setLastTriageResult] = useState<ZeroClickNLPTriageResult | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter tickets to those relevant to this client
  const myTickets = tickets.filter(
    (t) =>
      t.companyName === currentUser.company ||
      t.customerName.includes(currentUser.name) ||
      t.source === 'BMC DWP Portal' ||
      t.source === 'In-App Portal'
  );

  const handleSelectPreset = (preset: PresetComplaint) => {
    setIncidentText(preset.text);
    setSubmissionFeedback(null);
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    const ticketId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: incidentText,
          ticketId,
          metadata: {
            current_view: 'CLIENT_COMPLAINT_BOX',
            authenticated_role: 'CORPORATE_CLIENT',
            operator_identity: currentUser.email,
          },
        }),
      });

      const resData = await response.json();
      const triageResult: ZeroClickNLPTriageResult = resData.data;
      setLastTriageResult(triageResult);

      const newTicket: IncidentTicket = {
        id: ticketId,
        customerName: currentUser.name,
        companyName: currentUser.company || 'Enterprise Corporate Client',
        tier: 'Enterprise Platinum',
        source: 'BMC DWP Portal',
        complaintText: incidentText,
        createdAt: 'Just now',
        status: 'TRIAGED',
        triageResult,
        rawJsonString: resData.rawJsonString,
        latencyMs: resData.latencyMs,
      };

      onTicketCreated(newTicket);

      const notification =
        triageResult.incident_record?.dwp_user_notification ||
        triageResult.resolution_plan?.draft_customer_response ||
        triageResult.draft_customer_response ||
        'Your incident has been registered in the CompanyCMS Cognitive Resolution Engine. An assigned desk specialist is reviewing your request.';

      const priority =
        triageResult.incident_record?.itil_priority ||
        triageResult.ticket_metadata?.priority ||
        triageResult.priority ||
        'P3 - MEDIUM';

      const summary =
        triageResult.incident_record?.incident_summary ||
        triageResult.nlp_analysis?.incident_summary ||
        triageResult.summary ||
        'Incident logged successfully.';

      const desk =
        triageResult.incident_record?.assigned_queue ||
        triageResult.ticket_metadata?.assigned_department ||
        'Support Operations';

      setSubmissionFeedback({
        ticketId,
        notification,
        priority: String(priority),
        summary,
        desk,
      });

      setIncidentText('');
    } catch (err: any) {
      // Offline fallback
      const fallbackTicket: IncidentTicket = {
        id: ticketId,
        customerName: currentUser.name,
        companyName: currentUser.company || 'Enterprise Corporate Client',
        tier: 'Enterprise Platinum',
        source: 'BMC DWP Portal',
        complaintText: incidentText,
        createdAt: 'Just now',
        status: 'NEW',
      };
      onTicketCreated(fallbackTicket);
      setSubmissionFeedback({
        ticketId,
        notification:
          'Your incident has been received and registered under standard ITIL protocol. A confirmation will be sent shortly.',
        priority: 'P3 - MEDIUM',
        summary: 'Incident queued for cognitive dispatch.',
        desk: 'General Operations',
      });
      setIncidentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLiveStateJson = (): CompanyCMSState => {
    return {
      ui_state: {
        active_portal: 'CUSTOMER_SIGN_IN',
        theme: 'COMPANY_CMS_TEAL_DARK',
        rendered_view: 'CLIENT_COMPLAINT_BOX',
        authenticated_user: currentUser.email,
      },
      auth_validation: {
        status: 'APPROVED',
        reason: 'Authenticated corporate client verified. Access granted to Client Resolution Portal.',
        role: 'CORPORATE_CLIENT',
        assigned_desk: {
          desk_name: 'NONE',
          desk_lead: 'NONE',
          agent_id: 'NONE',
        },
      },
      triage_result: {
        nlp_detected_category:
          lastTriageResult?.incident_record?.assigned_queue ||
          lastTriageResult?.category ||
          'PENDING_SUBMISSION',
        itil_priority:
          (lastTriageResult?.incident_record?.itil_priority as any) ||
          (lastTriageResult?.priority as any) ||
          'NONE',
        recommended_action:
          lastTriageResult?.incident_record?.recommended_smartsheet_action ||
          lastTriageResult?.resolution_plan?.internal_agent_action ||
          'Awaiting customer submission',
        customer_notification:
          submissionFeedback?.notification ||
          'Please describe your outage or service incident below to trigger cognitive triage.',
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
      {/* Top Banner: Authenticated Corporate Client */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-5 sm:p-6 shadow-[0_0_25px_rgba(79,209,197,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#091424] border border-[#1a3454] flex items-center justify-center text-[#4fd1c5] shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#4fd1c5] tracking-wider uppercase bg-[#4fd1c5]/10 px-2 py-0.5 rounded border border-[#4fd1c5]/30">
                Customer Resolution Portal
              </span>
              <span className="text-xs font-mono text-[#94a3b8]">Verified Account</span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-1">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-[#94a3b8]">
              {currentUser.company || 'Enterprise Corporate Client'} · {currentUser.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Real-time State Schema Inspector (Optional collapsible) */}
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

      {/* Main Customer Complaint Submission Box */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-6 sm:p-8 shadow-[0_0_35px_rgba(79,209,197,0.06)]">
        <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-[#1a3454]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4fd1c5]" />
                Customer Complaint Submission Box
              </h2>
              <span className="text-[10px] font-bold bg-[#4fd1c5]/10 text-[#4fd1c5] border border-[#4fd1c5]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Zero-Click NLP
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Describe your issue naturally. Our AI cognitive triage engine routes, prioritizes, and assigns your incident with zero manual classification required.
            </p>
          </div>
        </div>

        {/* Successful Submission Feedback Alert */}
        {submissionFeedback && (
          <div className="mb-6 p-5 rounded-xl bg-[#4fd1c5]/10 border border-[#4fd1c5]/40 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#4fd1c5]" />
                <span className="text-sm font-bold text-[#4fd1c5]">
                  Incident Registered: {submissionFeedback.ticketId}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#091424] text-teal-300 border border-[#4fd1c5]/40">
                {submissionFeedback.priority}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-[#091424]/60 p-3 rounded-lg border border-[#1a3454]">
              {submissionFeedback.notification}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#94a3b8] pt-1">
              <span>
                <strong>Triage Summary:</strong> {submissionFeedback.summary}
              </span>
            </div>
          </div>
        )}

        {/* Incident Submission Form: Strict zero-click! No category selector dropdown. */}
        <form onSubmit={handleSubmitIncident} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2 flex items-center justify-between">
              <span>Report an Outage / Log IT Service Incident</span>
              <span className="text-[11px] text-[#4fd1c5] font-mono lowercase">
                Zero-click NLP auto-routing
              </span>
            </label>
            <textarea
              rows={4}
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="e.g. Critical production outage! The payment gateway API is throwing 504 gateway timeout errors on checkout. Hundreds of corporate client transactions are failing immediately..."
              required
              className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white p-4 rounded-xl text-sm leading-relaxed placeholder:text-slate-500 transition-colors shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="text-xs text-[#94a3b8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4fd1c5]" />
              <span>Automated classification into ITIL v4 Desk Queues</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !incidentText.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#4fd1c5] hover:bg-[#38b2ac] text-[#091424] font-bold text-sm shadow-[0_0_20px_rgba(79,209,197,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Triage...' : 'Submit Complaint for AI Triage →'}</span>
            </button>
          </div>
        </form>

        {/* Quick Outage Scenario Presets for instant testing */}
        <div className="mt-8 pt-6 border-t border-[#1a3454]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
              Test Incident Scenarios (Zero-Click NLP Presets)
            </span>
            <span className="text-[11px] text-[#4fd1c5] font-mono">Click to test auto-routing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_COMPLAINTS.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="p-3 rounded-xl bg-[#091424] border border-[#1a3454] hover:border-[#4fd1c5]/40 hover:bg-[#122237] text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-[#4fd1c5] transition-colors">
                    {preset.title}
                  </span>
                  <span className="text-[10px] font-mono text-teal-300 bg-[#112238] px-2 py-0.5 rounded border border-[#1a3454]">
                    {preset.priorityHint}
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8] line-clamp-2 mt-1 leading-snug">
                  {preset.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Client's Submitted Incidents List */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-6 shadow-[0_0_25px_rgba(79,209,197,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#4fd1c5]" />
            Your Submitted Incidents ({myTickets.length})
          </h3>
          <span className="text-xs text-[#94a3b8]">Live Updates</span>
        </div>

        {myTickets.length === 0 ? (
          <p className="text-xs text-[#94a3b8] py-4 text-center">
            No incidents reported yet. Submit your first ticket above.
          </p>
        ) : (
          <div className="space-y-3">
            {myTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 rounded-xl bg-[#091424] border border-[#1a3454] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-[#4fd1c5]">{ticket.id}</span>
                    <span className="text-xs font-semibold text-white truncate max-w-[280px]">
                      {ticket.triageResult?.incident_record?.incident_summary ||
                        ticket.complaintText.slice(0, 60)}
                      ...
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8]">
                    {ticket.triageResult?.incident_record?.dwp_user_notification ||
                      ticket.complaintText}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-[#4fd1c5] border border-[#4fd1c5]/30">
                    {ticket.triageResult?.incident_record?.itil_priority || 'P3 - MEDIUM'}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
