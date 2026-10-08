import React, { useState, useMemo } from 'react';
import { AppUser, IncidentTicket, ZeroClickNLPTriageResult } from '../types/icrs';
import {
  User,
  LogOut,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Building,
  FileText,
  AlertCircle,
  HelpCircle,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CustomerComplaintPortalProps {
  currentUser: AppUser;
  onSignOut: () => void;
  tickets: IncidentTicket[];
  onTicketCreated: (newTicket: IncidentTicket) => void;
}

export const CustomerComplaintPortal: React.FC<CustomerComplaintPortalProps> = ({
  currentUser,
  onSignOut,
  tickets,
  onTicketCreated,
}) => {
  // Form fields: Category, Subject, Detailed Description, Priority
  const [category, setCategory] = useState<string>('Billing & Payroll Discrepancy');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW'>('P3_MEDIUM');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    ticketId: string;
    desk: string;
    lead: string;
    priority: string;
    summary: string;
  } | null>(null);

  // Real-time NLP Text Classifier for auto-assigned target desk
  const realTimeTriage = useMemo(() => {
    const combined = `${subject} ${description}`.toLowerCase();
    if (!combined.trim()) {
      return {
        assignedDesk: 'Customer Care',
        lead: 'Sarah Jenkins',
        agentId: '#AGT-CARE-01',
        inferredPriority: priority,
        isDetected: false,
      };
    }

    // Rule 1: Finance & Payroll
    if (
      combined.includes('billing') ||
      combined.includes('invoice') ||
      combined.includes('charged') ||
      combined.includes('charged twice') ||
      combined.includes('payment') ||
      combined.includes('refund') ||
      combined.includes('deduction') ||
      combined.includes('fee') ||
      combined.includes('transaction') ||
      combined.includes('payroll') ||
      combined.includes('salary') ||
      combined.includes('erp') ||
      combined.includes('tax') ||
      combined.includes('expense')
    ) {
      return {
        assignedDesk: 'Finance & Payroll',
        lead: 'Elena Vance',
        agentId: '#AGT-FIN-01',
        inferredPriority: priority,
        isDetected: true,
      };
    }

    // Rule 2: Technical Support
    if (
      combined.includes('error 500') ||
      combined.includes('500') ||
      combined.includes('502') ||
      combined.includes('504') ||
      combined.includes('crash') ||
      combined.includes('bug') ||
      combined.includes('server') ||
      combined.includes('timeout') ||
      combined.includes('api') ||
      combined.includes('database') ||
      combined.includes('connection') ||
      combined.includes('nullpointer') ||
      combined.includes('slow latency') ||
      combined.includes('latency') ||
      combined.includes('downtime') ||
      combined.includes('outage')
    ) {
      return {
        assignedDesk: 'Technical Support',
        lead: 'Alex Rivera',
        agentId: '#AGT-TECH-01',
        inferredPriority: priority,
        isDetected: true,
      };
    }

    // Rule 3: Logistics Desk
    if (
      combined.includes('delivery') ||
      combined.includes('courier') ||
      combined.includes('shipment') ||
      combined.includes('shipping') ||
      combined.includes('tracking') ||
      combined.includes('delayed') ||
      combined.includes('delayed package') ||
      combined.includes('dispatch') ||
      combined.includes('package') ||
      combined.includes('transit') ||
      combined.includes('address change') ||
      combined.includes('hardware') ||
      combined.includes('laptop') ||
      combined.includes('monitor')
    ) {
      return {
        assignedDesk: 'Logistics Desk',
        lead: 'Marcus Vance',
        agentId: '#AGT-LOG-01',
        inferredPriority: priority,
        isDetected: true,
      };
    }

    // Rule 4: Customer Care (default)
    return {
      assignedDesk: 'Customer Care',
      lead: 'Sarah Jenkins',
      agentId: '#AGT-CARE-01',
      inferredPriority: priority,
      isDetected: true,
    };
  }, [subject, description, priority]);

  // Customer's Tickets
  const customerTickets = useMemo(() => {
    return tickets.filter(
      (t) =>
        t.customerName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        (t.companyName && currentUser.company && t.companyName === currentUser.company) ||
        t.source === 'In-App Portal' ||
        t.source === 'BMC DWP Portal'
    );
  }, [tickets, currentUser]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !subject.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionSuccess(null);

    const ticketId = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: `${subject}\n\n${description}`,
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

      const assignedQueue =
        triageResult?.incident_record?.assigned_queue ||
        realTimeTriage.assignedDesk;

      const newTicket: IncidentTicket = {
        id: ticketId,
        customerName: currentUser.name,
        companyName: currentUser.company || 'Enterprise Corporate Client',
        tier: 'Enterprise Platinum',
        source: 'In-App Portal',
        subject: subject.trim(),
        category,
        complaintText: description.trim(),
        createdAt: 'Just now',
        status: 'OPEN',
        assignedTeam: assignedQueue,
        slaRemainingHours: priority === 'P1_CRITICAL' ? 1.0 : priority === 'P2_HIGH' ? 4.0 : 8.0,
        triageResult,
        auditLog: [
          {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actor: `${currentUser.name} (${currentUser.email})`,
            action: `Submitted complaint via Customer Portal. Target desk auto-routed to ${assignedQueue}.`,
          },
        ],
      };

      onTicketCreated(newTicket);

      setSubmissionSuccess({
        ticketId,
        desk: assignedQueue,
        lead: triageResult?.incident_record?.assigned_lead || realTimeTriage.lead,
        priority: priority,
        summary:
          triageResult?.incident_record?.incident_summary ||
          `Ticket logged and auto-routed to ${assignedQueue}.`,
      });

      // Clear form
      setSubject('');
      setDescription('');
    } catch (err: any) {
      // Offline fallback
      const fallbackTicket: IncidentTicket = {
        id: ticketId,
        customerName: currentUser.name,
        companyName: currentUser.company || 'Enterprise Corporate Client',
        tier: 'Enterprise Platinum',
        source: 'In-App Portal',
        subject: subject.trim(),
        category,
        complaintText: description.trim(),
        createdAt: 'Just now',
        status: 'OPEN',
        assignedTeam: realTimeTriage.assignedDesk,
        slaRemainingHours: priority === 'P1_CRITICAL' ? 1.0 : 4.0,
        auditLog: [
          {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actor: `${currentUser.name} (${currentUser.email})`,
            action: `Ticket submitted and auto-routed to ${realTimeTriage.assignedDesk}.`,
          },
        ],
      };

      onTicketCreated(fallbackTicket);

      setSubmissionSuccess({
        ticketId,
        desk: realTimeTriage.assignedDesk,
        lead: realTimeTriage.lead,
        priority: priority,
        summary: `Incident logged under ITIL v4 and routed to ${realTimeTriage.assignedDesk}.`,
      });

      setSubject('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (prio: string) => {
    if (prio.includes('P1') || prio.includes('CRITICAL')) {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    if (prio.includes('P2') || prio.includes('HIGH')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (prio.includes('P4') || prio.includes('LOW')) {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* ==================================================
          1. TOP BAR WITH CUSTOMER NAME, EMAIL, AND SIGN OUT
      ================================================== */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(79,209,197,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#091424] border border-[#1a3454] flex items-center justify-center text-[#4fd1c5] shadow-[0_0_15px_rgba(79,209,197,0.15)] shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4fd1c5] bg-[#4fd1c5]/10 px-2 py-0.5 rounded border border-[#4fd1c5]/30">
                Corporate Customer Portal
              </span>
              <span className="text-[11px] text-[#94a3b8] font-mono">Whitelisted Account</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white mt-0.5 flex items-center gap-2">
              <span>{currentUser.name}</span>
            </h1>
            <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
              {currentUser.email} {currentUser.phone && `· ${currentUser.phone}`} · {currentUser.company || 'Enterprise Client'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 hover:border-rose-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* ==================================================
          2. SUBMIT NEW COMPLAINT FORM
      ================================================== */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-6 sm:p-8 shadow-[0_0_35px_rgba(79,209,197,0.06)] space-y-6">
        <div className="pb-4 border-b border-[#1a3454] flex items-start justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4fd1c5]" />
              Submit New Complaint
            </h2>
            <p className="text-xs text-[#94a3b8] mt-1">
              Provide incident details below. Natural Language Processing (NLP) automatically routes your complaint to the dedicated service desk.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#4fd1c5] bg-[#4fd1c5]/10 px-2 py-1 rounded border border-[#4fd1c5]/30 hidden sm:inline-block">
            Auto-Triage Active
          </span>
        </div>

        {/* Successful Submission Feedback Alert */}
        {submissionSuccess && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#4fd1c5]/10 border border-[#4fd1c5]/40 text-white space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#4fd1c5]" />
                <span className="text-sm font-bold text-[#4fd1c5]">
                  Complaint Registered: #{submissionSuccess.ticketId}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#091424] text-teal-300 border border-[#4fd1c5]/30">
                {submissionSuccess.priority}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-[#091424]/60 p-3 rounded-lg border border-[#1a3454]">
              {submissionSuccess.summary}
            </p>
            <div className="text-xs text-[#94a3b8] flex flex-wrap items-center gap-3 pt-1">
              <span>
                Target Desk: <strong className="text-white">{submissionSuccess.desk}</strong>
              </span>
              <span>·</span>
              <span>
                Assigned Lead: <strong className="text-white">{submissionSuccess.lead}</strong>
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitComplaint} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl font-medium cursor-pointer"
              >
                <option value="Billing & Payroll Discrepancy">Billing & Payroll Discrepancy</option>
                <option value="Technical & Infrastructure Outage">Technical & Infrastructure Outage</option>
                <option value="Hardware & Logistics Shipping">Hardware & Logistics Shipping</option>
                <option value="Account & General Customer Care">Account & General Customer Care</option>
              </select>
            </div>

            {/* Priority dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl font-medium cursor-pointer"
              >
                <option value="P1_CRITICAL">P1_CRITICAL (Service Down / Major Financial Loss)</option>
                <option value="P2_HIGH">P2_HIGH (High Impact / Impaired Workflow)</option>
                <option value="P3_MEDIUM">P3_MEDIUM (Standard Issue / Viable Workaround)</option>
                <option value="P4_LOW">P4_LOW (Minor Inquiry / General Feedback)</option>
              </select>
            </div>
          </div>

          {/* Issue Subject */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Issue Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Critical 504 gateway timeout on payment API or Duplicate ERP transaction deduction"
              required
              className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl placeholder:text-slate-500"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, impacted accounts or services, and any error codes or transaction IDs..."
              required
              className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-xs sm:text-sm text-white p-3.5 rounded-xl placeholder:text-slate-500"
            />
          </div>

          {/* Real-time NLP Triage Confirmation Indicator */}
          <div className="p-3.5 rounded-xl bg-[#091424] border border-[#1a3454] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#4fd1c5] shrink-0" />
              <div className="text-xs">
                <span className="text-[#94a3b8]">Real-time NLP Auto-Assigned Target Desk: </span>
                <strong className="text-white font-bold ml-1">{realTimeTriage.assignedDesk}</strong>
                <span className="text-[#94a3b8] text-[11px] ml-2">
                  (Desk Lead: {realTimeTriage.lead} · {realTimeTriage.agentId})
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono text-[#4fd1c5] bg-[#4fd1c5]/10 px-2 py-0.5 rounded border border-[#4fd1c5]/30 whitespace-nowrap">
              {realTimeTriage.isDetected ? 'Auto-Detected via NLP' : 'Default Assigned'}
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !description.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#4fd1c5] hover:bg-[#38b2ac] text-[#091424] font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(79,209,197,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting & Triaging...' : 'Submit Complaint for Auto-Resolution →'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ==================================================
          3. MY ACTIVE TICKETS HISTORY TABLE
      ================================================== */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl shadow-[0_0_35px_rgba(79,209,197,0.06)] overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-[#1a3454] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4fd1c5]" />
              My Active Tickets ({customerTickets.length})
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Live status tracking and audit updates for all incidents submitted under this account.
            </p>
          </div>
          <span className="text-xs text-[#94a3b8] font-mono">Live Tracking</span>
        </div>

        {customerTickets.length === 0 ? (
          <div className="p-8 text-center text-[#94a3b8] text-xs">
            No complaints submitted yet. Use the form above to log an incident.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#091424] text-[#94a3b8] font-bold uppercase tracking-wider text-[10px] border-b border-[#1a3454]">
                <tr>
                  <th className="py-3 px-4">TICKET ID</th>
                  <th className="py-3 px-4 min-w-[200px]">ISSUE SUBJECT</th>
                  <th className="py-3 px-4">TARGET DESK</th>
                  <th className="py-3 px-4">PRIORITY</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">SUBMITTED</th>
                  <th className="py-3 px-4 text-right">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a3454]/60">
                {customerTickets.map((t) => {
                  const isExpanded = expandedTicketId === t.id;
                  const prioStr =
                    t.triageResult?.incident_record?.itil_priority ||
                    t.triageResult?.priority ||
                    'P3 - MEDIUM';
                  const deskName =
                    t.triageResult?.incident_record?.assigned_queue ||
                    t.assignedTeam ||
                    'Support Operations';

                  return (
                    <React.Fragment key={t.id}>
                      <tr
                        onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-[#152a45]' : 'hover:bg-[#132742]/70 bg-[#112238]/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#4fd1c5] whitespace-nowrap">
                          {t.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white line-clamp-1">
                            {t.subject ||
                              t.triageResult?.incident_record?.incident_summary ||
                              t.complaintText.slice(0, 50)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200 whitespace-nowrap">
                          {deskName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getPriorityBadge(
                              prioStr
                            )}`}
                          >
                            {prioStr}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#94a3b8] whitespace-nowrap">
                          {t.createdAt}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="text-[#4fd1c5] hover:text-white transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 ml-auto" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-auto" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-[#091424]">
                          <td colSpan={7} className="p-4 border-b border-[#1a3454]">
                            <div className="space-y-3">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
                                  Full Complaint Description:
                                </span>
                                <p className="text-xs text-slate-200 bg-[#112238] p-3 rounded-lg border border-[#1a3454] leading-relaxed">
                                  {t.complaintText}
                                </p>
                              </div>

                              {t.internalNotes && (
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4fd1c5] block mb-1">
                                    Resolution Update from Assigned Desk:
                                  </span>
                                  <p className="text-xs text-teal-200/90 bg-[#112238] p-3 rounded-lg border border-[#4fd1c5]/30 leading-relaxed">
                                    {t.internalNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
