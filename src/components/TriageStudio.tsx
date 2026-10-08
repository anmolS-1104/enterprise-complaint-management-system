import React, { useState } from 'react';
import { PRESET_COMPLAINTS, PresetComplaint } from '../data/sampleComplaints';
import { ICRSResult, IncidentTicket, AppUser } from '../types/icrs';
import { ResolutionCard } from './ResolutionCard';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  FileText,
  Building,
  User,
  Shield,
  Send,
} from 'lucide-react';

interface TriageStudioProps {
  onTicketCreated: (ticket: IncidentTicket) => void;
  initialComplaintText?: string;
  currentUser?: AppUser | null;
}

export const TriageStudio: React.FC<TriageStudioProps> = ({
  onTicketCreated,
  initialComplaintText = '',
  currentUser,
}) => {
  const [complaintText, setComplaintText] = useState(initialComplaintText);
  const [ticketId, setTicketId] = useState(
    () => `INC-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [companyName, setCompanyName] = useState(
    currentUser?.company || 'Acme Global Enterprise'
  );
  const [customerName, setCustomerName] = useState(
    currentUser?.name || 'Alex Morgan, Director of IT'
  );

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setCustomerName(currentUser.name);
      if (currentUser.company) setCompanyName(currentUser.company);
    }
  }, [currentUser]);
  const [tier, setTier] = useState<'Enterprise Platinum' | 'Enterprise Growth' | 'Standard Business'>('Enterprise Platinum');
  const [source, setSource] = useState<
    | 'BMC DWP Portal'
    | 'Smart IT Console'
    | 'Zendesk'
    | 'Salesforce Service'
    | 'Jira Service Desk'
    | 'In-App Portal'
    | 'Email VIP'
  >('BMC DWP Portal');
  const [showMetadata, setShowMetadata] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<ICRSResult | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [sourceEngine, setSourceEngine] = useState<string>('gemini-3.8-flash');
  const [addedToQueue, setAddedToQueue] = useState(false);

  const handleSelectPreset = (preset: PresetComplaint) => {
    setComplaintText(preset.text);
    setCompanyName(preset.companyName);
    setCustomerName(preset.customerName);
    setTier(preset.tier);
    setSource(preset.source);
    setTicketId(`INC-${Math.floor(1000 + Math.random() * 9000)}`);
    setTriageResult(null);
    setAddedToQueue(false);
    setError(null);
  };

  const handleReset = () => {
    setComplaintText('');
    setTriageResult(null);
    setAddedToQueue(false);
    setError(null);
    setTicketId(`INC-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleRunTriage = async () => {
    if (!complaintText.trim()) {
      setError('Please enter or select a customer complaint text before running triage.');
      return;
    }

    setLoading(true);
    setError(null);
    setAddedToQueue(false);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaint: complaintText.trim(),
          ticketId,
          metadata: {
            companyName,
            customerName,
            tier,
            source,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to process triage request.`);
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setTriageResult(resData.data);
        setLatencyMs(resData.latencyMs);
        setSourceEngine(resData.source || 'gemini-3.8-flash');

        const priorityVal = resData.data.ticket_metadata?.priority || resData.data.priority;
        const deptVal = resData.data.ticket_metadata?.assigned_department || 'Core Support';
        const leadVal = resData.data.ticket_metadata?.assigned_lead || 'Sarah Jenkins';

        // Automatically create and pass ticket to queue
        const newTicket: IncidentTicket = {
          id: ticketId,
          companyName,
          customerName,
          tier,
          source,
          complaintText: complaintText.trim(),
          createdAt: 'Just now',
          status: 'TRIAGED',
          slaRemainingHours: priorityVal === 'CRITICAL' ? 1 : priorityVal === 'HIGH' ? 4 : 24,
          assignedTeam: `${deptVal} (Lead: ${leadVal})`,
          triageResult: resData.data,
          rawJsonString: resData.rawJsonString,
          latencyMs: resData.latencyMs,
        };
        onTicketCreated(newTicket);
        setAddedToQueue(true);
      } else {
        throw new Error('Unexpected server response format.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error occurred while contacting ICRS triage engine.');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut Cmd/Ctrl + Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunTriage();
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Intake & Triage Studio
        </h1>
        <p className="text-sm text-slate-500">
          Analyze customer complaints, classify root category, enforce priority SLA rules, and generate structured JSON resolution actions.
        </p>
      </div>

      {/* Preset Quick Selectors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Quick-Load Enterprise Scenarios
          </span>
          <span className="text-xs text-slate-400">
            Click scenario to load realistic complaint
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_COMPLAINTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors group space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-emerald-700">
                  {preset.departmentHint}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {preset.agentIdHint}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
                {preset.title}
              </div>
              <div className="text-[10px] text-slate-400">
                Desk Lead: {preset.leadHint}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Intake Box */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="complaintInput"
              className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Customer Complaint Payload
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                {complaintText.length} characters
              </span>
              {complaintText && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            id="complaintInput"
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste raw customer message, Zendesk ticket body, or executive escalation email here..."
            rows={5}
            className="w-full text-sm text-slate-900 bg-slate-50/50 border border-slate-200 rounded-lg p-4 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-sans leading-relaxed resize-y"
          />

          {/* Collapsible Ticket Metadata */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>{showMetadata ? 'Hide Ticket Context & SLA Options' : 'Configure Ticket Context & SLA Metadata'}</span>
              {showMetadata ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showMetadata && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Ticket ID</label>
                  <input
                    type="text"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-200 rounded-md bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Customer Name & Role</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-md bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Company & Org</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-md bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Account SLA Tier</label>
                  <select
                    value={tier}
                    onChange={(e: any) => setTier(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Enterprise Platinum">Enterprise Platinum (P1: 1h)</option>
                    <option value="Enterprise Growth">Enterprise Growth (P1: 2h)</option>
                    <option value="Standard Business">Standard Business (P1: 4h)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400">
              Shortcut: <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">Cmd / Ctrl + Enter</kbd> to triage
            </div>
            <button
              type="button"
              onClick={handleRunTriage}
              disabled={loading || !complaintText.trim()}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running ICRS Triage Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Run ICRS Triage Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Triage Output Section */}
      {triageResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Triage Assessment & Structured Resolution
            </h2>
            {addedToQueue && (
              <span className="text-xs text-slate-500">
                Ticket <span className="font-mono text-slate-700">{ticketId}</span> synchronized to Incident Queue
              </span>
            )}
          </div>

          <ResolutionCard
            data={triageResult}
            ticketId={ticketId}
            latencyMs={latencyMs}
            sourceEngine={sourceEngine}
          />
        </div>
      )}
    </div>
  );
};
