import React, { useState, useMemo, useRef } from 'react';
import { AppUser, IncidentTicket, ZeroClickNLPTriageResult } from '../types/icrs';
import {
  User,
  LogOut,
  Send,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface CustomerComplaintPortalProps {
  currentUser: AppUser;
  onSignOut: () => void;
  tickets: IncidentTicket[];
  onTicketCreated: (newTicket: IncidentTicket) => void;
}

interface AttachedFile {
  name: string;
  size: string;
}

export const CustomerComplaintPortal: React.FC<CustomerComplaintPortalProps> = ({
  currentUser,
  onSignOut,
  tickets,
  onTicketCreated,
}) => {
  // Single large textarea for describing issue or request
  const [complaintText, setComplaintText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    ticketId: string;
    dept: string;
    category: string;
    priority: string;
  } | null>(null);

  // Auxiliary attachments: Documents & Voice Note
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNoteAttached, setVoiceNoteAttached] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Expanded ticket details in overview
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // ==================================================
  // NLP AUTO-TRIAGE & REAL-TIME PREDICTION ENGINE
  // ==================================================
  const nlpAnalysis = useMemo(() => {
    const raw = complaintText.trim().toLowerCase();

    // 1. Sentiment Detection
    const frustratedKeywords = [
      'urgent', 'broken', 'furious', 'unacceptable', 'down', 'fail', 'failure',
      'lost money', 'terrible', 'frustrated', 'critical', 'immediately', 'asap',
      'disaster', 'crash', 'freeze', 'error 500', 'charged twice', 'outage',
      'overcharged', 'breach', 'stuck', 'deadlock', 'severe', 'horrible', 'emergency',
    ];
    const positiveKeywords = [
      'thank', 'thanks', 'appreciate', 'great', 'good', 'excellent', 'helpful', 'resolved',
    ];

    let sentiment: 'FRUSTRATED' | 'POSITIVE' | 'NEUTRAL' = 'NEUTRAL';
    if (frustratedKeywords.some((kw) => raw.includes(kw))) {
      sentiment = 'FRUSTRATED';
    } else if (positiveKeywords.some((kw) => raw.includes(kw))) {
      sentiment = 'POSITIVE';
    }

    // 2. Department & Desk Routing
    // Criteria:
    // - Finance & Payroll: billing, invoice, charged, payment, refund, deduction, fee, transaction, payroll
    // - Technical Support: bug, error, 500, crash, api, timeout, database, connection, nullpointer, slow latency
    // - Logistics Desk: delivery, shipment, courier, dispatch, tracking, delayed, package, transit, address change
    // - Customer Care: account, general feedback, cancellation, service complaint, membership, consultation

    let predictedDept: 'Finance & Payroll' | 'Technical Support' | 'Logistics Desk' | 'Customer Care' = 'Customer Care';
    let category = 'General Inquiry';
    let priorityTier: 'P1 Critical' | 'P2 High' | 'P3 Medium' | 'P4 Low' = 'P3 Medium';

    const hasFinance = [
      'billing', 'invoice', 'charged', 'charged twice', 'payment', 'refund',
      'deduction', 'fee', 'transaction', 'payroll', 'salary', 'ledger', 'erp',
      'tax', 'overcharged', 'debit', 'discrepancy', 'credit card',
    ].some((kw) => raw.includes(kw));

    const hasTech = [
      'bug', 'error', '500', '502', '504', 'crash', 'api', 'timeout',
      'database', 'connection', 'nullpointer', 'slow latency', 'latency',
      'server', 'heap', 'outage', 'service down', 'cluster', 'exception',
    ].some((kw) => raw.includes(kw));

    const hasLogistics = [
      'delivery', 'shipment', 'courier', 'dispatch', 'tracking', 'delayed',
      'delayed package', 'package', 'transit', 'address change', 'hardware',
      'laptop', 'docking', 'warehouse', 'damaged casing',
    ].some((kw) => raw.includes(kw));

    if (hasFinance) {
      predictedDept = 'Finance & Payroll';
      category = raw.includes('payroll') || raw.includes('salary')
        ? 'Payroll & Compensation'
        : 'Billing Discrepancy';
    } else if (hasTech) {
      predictedDept = 'Technical Support';
      category = raw.includes('500') || raw.includes('crash') || raw.includes('outage') || raw.includes('service down')
        ? 'System Bug / Outage'
        : 'API / Infrastructure Failure';
    } else if (hasLogistics) {
      predictedDept = 'Logistics Desk';
      category = raw.includes('delay') || raw.includes('tracking')
        ? 'Shipment Issue'
        : 'Hardware Asset Dispatch';
    } else {
      predictedDept = 'Customer Care';
      category = raw.includes('account') || raw.includes('sso') || raw.includes('password')
        ? 'Account Management'
        : 'General Inquiry';
    }

    // 3. Priority Tier Determination
    // P1_CRITICAL (service down, major financial loss, 500, crash, outage)
    const isP1 = [
      'service down', 'major financial loss', 'outage', '500', 'crash',
      'charged twice', 'data loss', 'emergency', 'catastrophic', 'cluster down',
    ].some((kw) => raw.includes(kw));

    // P2_HIGH (high impact, impaired workflow, bug, error, timeout, delayed, refund, payroll)
    const isP2 = [
      'high impact', 'impaired', 'bug', 'error', '502', '504', 'timeout',
      'delayed', 'refund', 'payroll', 'deduction', 'stuck', 'broken',
    ].some((kw) => raw.includes(kw));

    // P4_LOW (minor, feedback, consultation, general feedback)
    const isP4 = [
      'feedback', 'consultation', 'minor', 'question', 'general feedback',
      'onboarding', 'suggestion', 'non-technical',
    ].some((kw) => raw.includes(kw));

    if (isP1) {
      priorityTier = 'P1 Critical';
    } else if (isP2) {
      priorityTier = 'P2 High';
    } else if (isP4) {
      priorityTier = 'P4 Low';
    } else {
      priorityTier = 'P3 Medium';
    }

    return {
      sentiment,
      predictedDept,
      category,
      priorityTier,
    };
  }, [complaintText]);

  // Customer's Tickets
  const customerTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (t.customerEmail && t.customerEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }
      if (t.customerName && currentUser.name) {
        const tName = t.customerName.toLowerCase().trim();
        const uName = currentUser.name.toLowerCase().trim();
        if (tName === uName || tName.includes(uName) || uName.includes(tName)) {
          return true;
        }
      }
      return false;
    });
  }, [tickets, currentUser]);

  // Metric counters
  const openCount = customerTickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'NEW' || t.status === 'TRIAGED'
  ).length;
  const inProgressCount = customerTickets.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
  ).length;
  const resolvedCount = customerTickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;

  // Handle Document Attachment
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: AttachedFile[] = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
      }));
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Voice Note Recording
  const handleToggleVoiceNote = () => {
    if (isRecording) {
      // Stop recording
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setVoiceNoteAttached(true);
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingSeconds(0);
      setVoiceNoteAttached(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    }
  };

  const handleRemoveVoiceNote = () => {
    if (isRecording && recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
    setVoiceNoteAttached(false);
    setRecordingSeconds(0);
  };

  // Submit Complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    const ticketId = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;

    const { predictedDept, category, priorityTier, sentiment } = nlpAnalysis;

    // Convert priorityTier string to ITIL priority
    const itilPriority =
      priorityTier === 'P1 Critical'
        ? 'P1 - CRITICAL'
        : priorityTier === 'P2 High'
        ? 'P2 - HIGH'
        : priorityTier === 'P4 Low'
        ? 'P4 - LOW'
        : 'P3 - MEDIUM';

    const slaHours =
      priorityTier === 'P1 Critical' ? 1.0 : priorityTier === 'P2 High' ? 4.0 : priorityTier === 'P4 Low' ? 24.0 : 8.0;

    let leadName = 'Sarah Jenkins';
    let agentId = '#AGT-CARE-01';
    if (predictedDept === 'Finance & Payroll') {
      leadName = 'Elena Vance';
      agentId = '#AGT-FIN-01';
    } else if (predictedDept === 'Technical Support') {
      leadName = 'Alex Rivera';
      agentId = '#AGT-TECH-01';
    } else if (predictedDept === 'Logistics Desk') {
      leadName = 'Marcus Vance';
      agentId = '#AGT-LOG-01';
    }

    try {
      // Try backend triage endpoint
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: complaintText.trim(),
          ticketId,
          metadata: {
            current_view: 'CUSTOMER_PORTAL',
            authenticated_role: 'CORPORATE_CLIENT',
            operator_identity: currentUser.email,
          },
        }),
      });

      const resData = await response.json();
      const triageResult: ZeroClickNLPTriageResult = resData.data;

      const finalQueue =
        triageResult?.incident_record?.assigned_queue || predictedDept;

      const newTicket: IncidentTicket = {
        id: ticketId,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        companyName: currentUser.company || 'Enterprise Client',
        tier: 'Enterprise Platinum',
        source: 'In-App Portal',
        subject:
          triageResult?.incident_record?.incident_summary ||
          complaintText.trim().slice(0, 60),
        category,
        complaintText: complaintText.trim(),
        createdAt: 'Just now',
        status: 'OPEN',
        assignedTeam: finalQueue,
        slaRemainingHours: slaHours,
        triageResult,
        auditLog: [
          {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actor: `${currentUser.name} (${currentUser.email})`,
            action: `Submitted complaint via Customer Portal. Target desk auto-routed to ${finalQueue} via NLP.`,
          },
        ],
      };

      onTicketCreated(newTicket);
      setSubmissionFeedback({
        ticketId,
        dept: finalQueue,
        category,
        priority: priorityTier,
      });
      setComplaintText('');
      setAttachedFiles([]);
      setVoiceNoteAttached(false);
    } catch {
      // Offline fallback
      const fallbackTicket: IncidentTicket = {
        id: ticketId,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        companyName: currentUser.company || 'Enterprise Client',
        tier: 'Enterprise Platinum',
        source: 'In-App Portal',
        subject: complaintText.trim().slice(0, 60),
        category,
        complaintText: complaintText.trim(),
        createdAt: 'Just now',
        status: 'OPEN',
        assignedTeam: predictedDept,
        slaRemainingHours: slaHours,
        triageResult: {
          incident_record: {
            assigned_queue: predictedDept as any,
            assigned_lead: leadName as any,
            assigned_agent_id: agentId as any,
            itil_priority: itilPriority,
            detected_sentiment: sentiment as any,
            incident_summary: complaintText.trim().slice(0, 90),
            recommended_smartsheet_action: `Auto-routed to ${leadName} (${agentId})`,
            dwp_user_notification: `Your request has been logged and assigned to ${predictedDept}.`,
          },
        },
        auditLog: [
          {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actor: `${currentUser.name} (${currentUser.email})`,
            action: `Ticket logged and auto-routed to ${predictedDept}.`,
          },
        ],
      };

      onTicketCreated(fallbackTicket);
      setSubmissionFeedback({
        ticketId,
        dept: predictedDept,
        category,
        priority: priorityTier,
      });
      setComplaintText('');
      setAttachedFiles([]);
      setVoiceNoteAttached(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    if (priority.includes('P1') || priority.includes('Critical')) {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    if (priority.includes('P2') || priority.includes('High')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (priority.includes('P4') || priority.includes('Low')) {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  };

  const getSentimentPillClass = (sentiment: string) => {
    if (sentiment === 'FRUSTRATED') {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse';
    }
    if (sentiment === 'POSITIVE') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* ==================================================
          1. HEADER
          "CompanyCMS [CUSTOMER PORTAL] - Intelligent Complaint Resolution System"
          with Customer Name, Avatar, and Sign Out
      ================================================== */}
      <header className="bg-[#112238] border border-[#1a3454] rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(79,209,197,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Customer Avatar */}
          <div className="w-12 h-12 rounded-xl bg-[#091424] border border-[#1a3454] flex items-center justify-center text-[#4fd1c5] shadow-[0_0_15px_rgba(79,209,197,0.15)] font-bold font-mono text-base shrink-0">
            {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4fd1c5] bg-[#4fd1c5]/10 px-2 py-0.5 rounded border border-[#4fd1c5]/30">
                CUSTOMER PORTAL
              </span>
              <span className="text-xs text-[#94a3b8] font-mono">Whitelisted Account</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
              CompanyCMS [CUSTOMER PORTAL] - Intelligent Complaint Resolution System
            </h1>
            <p className="text-xs text-[#94a3b8] font-mono mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-white font-medium">{currentUser.name}</span>
              <span>·</span>
              <span>{currentUser.email}</span>
              {currentUser.phone && (
                <>
                  <span>·</span>
                  <span>{currentUser.phone}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onSignOut}
          className="px-4 py-2.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 hover:border-rose-400 rounded-xl transition-all flex items-center gap-2 cursor-pointer self-end sm:self-auto shrink-0 shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Two-Card Streamlined Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ==================================================
            2. LEFT CARD: "Log a Service Request"
            with "AI Triage & Guardrails" badge
        ================================================== */}
        <div className="lg:col-span-6 bg-[#112238] border border-[#1a3454] rounded-2xl p-6 sm:p-7 shadow-[0_0_35px_rgba(79,209,197,0.06)] flex flex-col justify-between">
          <div className="space-y-5">
            {/* Card Header & Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1a3454]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#4fd1c5]" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Log a Service Request
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#4fd1c5]/10 text-[#4fd1c5] border border-[#4fd1c5]/30">
                <Sparkles className="w-3 h-3" />
                AI Triage & Guardrails
              </span>
            </div>

            {/* Submission Feedback Alert */}
            {submissionFeedback && (
              <div className="p-4 rounded-xl bg-[#4fd1c5]/10 border border-[#4fd1c5]/40 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4fd1c5]" />
                    <span className="text-xs font-bold text-[#4fd1c5]">
                      Request Registered: #{submissionFeedback.ticketId}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(submissionFeedback.priority)}`}>
                    {submissionFeedback.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-200">
                  Auto-routed to <strong>{submissionFeedback.dept}</strong> ({submissionFeedback.category}).
                </p>
              </div>
            )}

            {/* Complaint Form */}
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              {/* Textarea Header with Live Sentiment indicator pill */}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="complaint-textarea"
                  className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]"
                >
                  Describe the issue or request in detail
                </label>
                {/* Live Sentiment indicator pill */}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all ${getSentimentPillClass(
                    nlpAnalysis.sentiment
                  )}`}
                >
                  Sentiment: {nlpAnalysis.sentiment}
                </span>
              </div>

              {/* Single Large Textarea */}
              <div className="relative">
                <textarea
                  id="complaint-textarea"
                  rows={6}
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Describe the issue or request in detail (e.g. Critical 500 error on payment webhook, duplicate invoice charge, or delayed hardware shipment)..."
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-xs sm:text-sm text-white p-4 rounded-xl placeholder:text-slate-500 transition-colors leading-relaxed resize-y min-h-[140px]"
                />
              </div>

              {/* Auxiliary Buttons: Attach Documents & Record Voice Note */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  autoComplete="off"
                />

                <button
                  type="button"
                  onClick={handleAttachClick}
                  className="px-3 py-1.5 rounded-lg bg-[#091424] hover:bg-[#152a45] text-slate-300 hover:text-white border border-[#1a3454] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[#4fd1c5]" />
                  <span>Attach Documents</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleVoiceNote}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : voiceNoteAttached
                      ? 'bg-teal-500/10 text-[#4fd1c5] border-[#4fd1c5]/40'
                      : 'bg-[#091424] hover:bg-[#152a45] text-slate-300 hover:text-white border-[#1a3454]'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Recording... ({recordingSeconds}s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-[#4fd1c5]" />
                      <span>Record Voice Note</span>
                    </>
                  )}
                </button>

                {/* Show attached files pills */}
                {attachedFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#091424] border border-[#1a3454] text-[11px] text-slate-300 font-mono"
                  >
                    <Paperclip className="w-3 h-3 text-[#4fd1c5]" />
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Show voice note attached pill */}
                {voiceNoteAttached && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#091424] border border-[#4fd1c5]/30 text-[11px] text-[#4fd1c5] font-mono">
                    <Mic className="w-3 h-3 text-[#4fd1c5]" />
                    <span>Voice Note ({recordingSeconds > 0 ? `${recordingSeconds}s` : 'Attached'})</span>
                    <button
                      type="button"
                      onClick={handleRemoveVoiceNote}
                      className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {/* Live Triage Prediction Panel (Auto-updates dynamically via NLP) */}
              <div className="bg-[#091424] border border-[#1a3454] rounded-xl p-4 space-y-3 mt-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1a3454]/60">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#4fd1c5]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                      Live Triage Prediction Panel
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#4fd1c5] bg-[#4fd1c5]/10 px-2 py-0.5 rounded border border-[#4fd1c5]/30">
                    Real-time NLP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* PREDICTED DEPT */}
                  <div className="bg-[#112238] p-2.5 rounded-lg border border-[#1a3454]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block">
                      PREDICTED DEPT
                    </span>
                    <span className="text-xs font-bold text-white mt-1 block truncate">
                      {nlpAnalysis.predictedDept}
                    </span>
                  </div>

                  {/* CATEGORY */}
                  <div className="bg-[#112238] p-2.5 rounded-lg border border-[#1a3454]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block">
                      CATEGORY
                    </span>
                    <span className="text-xs font-bold text-slate-200 mt-1 block truncate">
                      {nlpAnalysis.category}
                    </span>
                  </div>

                  {/* PRIORITY TIER */}
                  <div className="bg-[#112238] p-2.5 rounded-lg border border-[#1a3454]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block">
                      PRIORITY TIER
                    </span>
                    <span
                      className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-md mt-1 border ${getPriorityBadgeClass(
                        nlpAnalysis.priorityTier
                      )}`}
                    >
                      {nlpAnalysis.priorityTier}
                    </span>
                  </div>
                </div>

                {/* Directive Note */}
                <p className="text-[11px] text-[#94a3b8] flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4fd1c5] shrink-0" />
                  <span>ITSM router assigns target SLA & dedicated agent desk.</span>
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !complaintText.trim()}
                  className="w-full py-3 px-6 rounded-xl bg-[#4fd1c5] hover:bg-[#38b2ac] text-[#091424] font-bold text-sm shadow-[0_0_20px_rgba(79,209,197,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Complaint...' : 'Submit Complaint'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ==================================================
            3. RIGHT CARD: "Your Ticket Overview"
            - Total ticket counter
            - Metric counter pills: Open (0), In Progress (0), Resolved (0)
            - Empty state or list of filed tickets
        ================================================== */}
        <div className="lg:col-span-6 bg-[#112238] border border-[#1a3454] rounded-2xl p-6 sm:p-7 shadow-[0_0_35px_rgba(79,209,197,0.06)] flex flex-col">
          {/* Card Header & Counters */}
          <div className="pb-4 border-b border-[#1a3454] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#4fd1c5]" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Your Ticket Overview
                </h2>
              </div>
              {/* Total ticket counter */}
              <span className="text-xs font-mono font-bold text-[#4fd1c5] bg-[#4fd1c5]/10 px-2.5 py-1 rounded-full border border-[#4fd1c5]/30">
                Total Tickets: {customerTickets.length}
              </span>
            </div>

            {/* Metric Counter Pills: Open (0), In Progress (0), Resolved (0) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                Open ({openCount})
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                In Progress ({inProgressCount})
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/10 text-[#4fd1c5] border border-[#4fd1c5]/30">
                Resolved ({resolvedCount})
              </span>
            </div>
          </div>

          {/* Ticket Body / Empty State */}
          <div className="flex-1 py-4 flex flex-col justify-center">
            {customerTickets.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#091424] border border-[#1a3454] flex items-center justify-center text-[#94a3b8] mx-auto shadow-xs">
                  <Inbox className="w-7 h-7 stroke-[1.5]" />
                </div>
                <p className="text-sm text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
                  No complaints filed yet. Submit your first complaint using the form on the left.
                </p>
                <p className="text-xs text-[#94a3b8]">
                  All submitted tickets are tracked in real-time under ITIL v4 SLA resolution protocols.
                </p>
              </div>
            ) : (
              /* Filed Tickets List */
              <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
                {customerTickets.map((ticket) => {
                  const isExpanded = expandedTicketId === ticket.id;
                  const prioText =
                    ticket.triageResult?.incident_record?.itil_priority ||
                    ticket.triageResult?.ticket_metadata?.priority ||
                    ticket.category ||
                    'P3 - MEDIUM';
                  const deskName =
                    ticket.triageResult?.incident_record?.assigned_queue ||
                    ticket.assignedTeam ||
                    'Support Operations';

                  return (
                    <div
                      key={ticket.id}
                      className="bg-[#091424] border border-[#1a3454] hover:border-[#4fd1c5]/40 rounded-xl p-4 transition-all space-y-3"
                    >
                      <div
                        onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                        className="flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-[#4fd1c5]">
                              {ticket.id}
                            </span>
                            <span className="text-[11px] font-medium text-slate-300">
                              {deskName}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                                prioText
                              )}`}
                            >
                              {prioText}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white line-clamp-1">
                            {ticket.subject || ticket.complaintText.slice(0, 50)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                                ? 'bg-teal-500/10 text-[#4fd1c5] border-[#4fd1c5]/30'
                                : ticket.status === 'IN_PROGRESS'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {ticket.status}
                          </span>
                          <button
                            type="button"
                            className="text-[#94a3b8] hover:text-[#4fd1c5] transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Ticket View */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-[#1a3454] space-y-2.5 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
                              Submitted Description:
                            </span>
                            <p className="text-slate-200 bg-[#112238] p-3 rounded-lg border border-[#1a3454] leading-relaxed whitespace-pre-wrap">
                              {ticket.complaintText}
                            </p>
                          </div>

                          {ticket.internalNotes && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4fd1c5] block mb-1">
                                Service Desk Update:
                              </span>
                              <p className="text-teal-200 bg-[#112238] p-3 rounded-lg border border-[#4fd1c5]/30 leading-relaxed whitespace-pre-wrap">
                                {ticket.internalNotes}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] pt-1">
                            <span>Logged: {ticket.createdAt}</span>
                            <span>Target SLA: {ticket.slaRemainingHours ?? 4.0}h</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
