import React, { useState } from 'react';
import { ZeroClickNLPTriageResult } from '../types/icrs';
import {
  Check,
  Copy,
  Send,
  AlertTriangle,
  Clock,
  Sparkles,
  Code2,
  FileText,
  ShieldCheck,
  UserCheck,
  Compass,
  CornerDownRight,
  ShieldAlert,
  Edit3,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface ResolutionCardProps {
  data: ZeroClickNLPTriageResult;
  ticketId?: string;
  latencyMs?: number;
  sourceEngine?: string;
  onSendReply?: (reply: string) => void;
  onActionExecute?: (action: string) => void;
}

export const ResolutionCard: React.FC<ResolutionCardProps> = ({
  data,
  ticketId,
  latencyMs,
  sourceEngine = 'gemini-3.8-flash',
  onSendReply,
  onActionExecute,
}) => {
  // Extract fields safely with fallbacks
  const repoSync = data.repository_sync || {
    target_repo: 'anmolS-1104/enterprise-complaint-management-system',
    status: 'READY' as const,
  };

  const metadata = data.ticket_metadata || {
    assigned_department: 'Customer Care',
    assigned_lead: 'Sarah Jenkins',
    assigned_agent_id: '#AGT-CARE-01',
    priority: data.priority || 'MEDIUM',
    sentiment: data.sentiment || 'NEUTRAL',
  };

  const nlp = data.nlp_analysis || {
    detected_intent: 'General inquiry or support issue',
    incident_summary: data.summary || data.triage_summary || 'Customer incident submitted.',
    confidence_score: 0.95,
  };

  const internalActionStr =
    data.resolution_plan?.internal_agent_action ||
    data.agent_action_plan?.recommended_technical_action ||
    data.recommended_action ||
    data.recommended_agent_action ||
    'Review and respond.';

  const draftCustomerReplyStr =
    data.resolution_plan?.draft_customer_response ||
    data.agent_action_plan?.draft_customer_response ||
    data.suggested_reply ||
    data.draft_customer_response ||
    'We are investigating your request.';

  const [activeTab, setActiveTab] = useState<'resolution' | 'json'>('resolution');
  const [jsonSchemaMode, setJsonSchemaMode] = useState<'helix' | 'repo'>('helix');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [customReply, setCustomReply] = useState(draftCustomerReplyStr);
  const [replySent, setReplySent] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  React.useEffect(() => {
    setCustomReply(draftCustomerReplyStr);
    setReplySent(false);
    setActionDone(false);
  }, [data, draftCustomerReplyStr]);

  // STRICT BMC HELIX AITSM PRIMARY SCHEMA OUTPUT
  const bmcHelixSchemaOutput = {
    helix_session: data.helix_session || {
      current_view: 'SMART_IT_AGENT_CONSOLE',
      authenticated_role: 'SUPPORT_AGENT',
      operator_identity: metadata.assigned_lead || 'Alex Rivera',
      authorized: true,
    },
    incident_record: {
      assigned_queue: (data.incident_record?.assigned_queue || metadata.assigned_department) as any,
      assigned_lead: data.incident_record?.assigned_lead || metadata.assigned_lead,
      assigned_agent_id: data.incident_record?.assigned_agent_id || metadata.assigned_agent_id,
      itil_priority: (data.incident_record?.itil_priority ||
        (metadata.priority === 'CRITICAL'
          ? 'P1 - CRITICAL'
          : metadata.priority === 'HIGH'
          ? 'P2 - HIGH'
          : metadata.priority === 'MEDIUM'
          ? 'P3 - MEDIUM'
          : 'P4 - LOW')) as any,
      detected_sentiment: (data.incident_record?.detected_sentiment ||
        (metadata.sentiment === 'ANGRY'
          ? 'CRITICAL_ESCALATION'
          : metadata.sentiment)) as any,
      incident_summary: data.incident_record?.incident_summary || nlp.incident_summary,
      recommended_smartsheet_action:
        data.incident_record?.recommended_smartsheet_action || internalActionStr,
      dwp_user_notification: data.incident_record?.dwp_user_notification || customReply,
    },
  };

  const targetSchemaOutput = {
    repository_sync: {
      target_repo: repoSync.target_repo || 'anmolS-1104/enterprise-complaint-management-system',
      status: repoSync.status || 'READY',
    },
    ticket_metadata: {
      assigned_department: metadata.assigned_department,
      assigned_lead: metadata.assigned_lead,
      assigned_agent_id: metadata.assigned_agent_id,
      priority: metadata.priority,
      sentiment: metadata.sentiment,
    },
    nlp_analysis: {
      detected_intent: nlp.detected_intent,
      incident_summary: nlp.incident_summary,
      confidence_score: nlp.confidence_score,
    },
    resolution_plan: {
      internal_agent_action: internalActionStr,
      draft_customer_response: customReply,
    },
  };

  const handleCopyJson = () => {
    const raw = JSON.stringify(
      jsonSchemaMode === 'helix' ? bmcHelixSchemaOutput : targetSchemaOutput,
      null,
      2
    );
    navigator.clipboard.writeText(raw);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyReply = () => {
    navigator.clipboard.writeText(customReply);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 2000);
  };

  const handleSendReply = () => {
    setReplySent(true);
    if (onSendReply) onSendReply(customReply);
  };

  const handleExecuteAction = () => {
    setActionDone(true);
    if (onActionExecute) onActionExecute(internalActionStr);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          indicator: 'bg-rose-600',
          textColor: 'text-rose-700',
          bgLight: 'bg-rose-50 border-rose-200',
          label: 'CRITICAL PRIORITY',
          sla: '< 1 Hour SLA Target',
        };
      case 'HIGH':
        return {
          indicator: 'bg-amber-600',
          textColor: 'text-amber-700',
          bgLight: 'bg-amber-50 border-amber-200',
          label: 'HIGH PRIORITY',
          sla: '< 4 Hours SLA Target',
        };
      case 'MEDIUM':
        return {
          indicator: 'bg-blue-600',
          textColor: 'text-blue-700',
          bgLight: 'bg-blue-50 border-blue-200',
          label: 'MEDIUM PRIORITY',
          sla: '< 24 Hours SLA Target',
        };
      default:
        return {
          indicator: 'bg-emerald-600',
          textColor: 'text-emerald-700',
          bgLight: 'bg-emerald-50 border-emerald-200',
          label: 'LOW PRIORITY',
          sla: '< 72 Hours SLA Target',
        };
    }
  };

  const priorityStyle = getPriorityStyle(metadata.priority);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Top Bar with Ticket ID & View Toggle */}
      <div className="border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
            {ticketId || 'ZERO-CLICK-ROUTED'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500">
            Autonomous NLP Engine: <span className="font-medium text-slate-700">{sourceEngine}</span>
          </span>
          {latencyMs !== undefined && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {latencyMs}ms
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('resolution')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'resolution'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Zero-Click Desk Routing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Target JSON Output
          </button>
        </div>
      </div>

      {activeTab === 'resolution' ? (
        <div className="p-6 space-y-6">
          {/* Zero-Click Department Routing Matrix */}
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Automated Desk Assignment
                </span>
                <div className="text-base font-semibold text-white flex items-center gap-2 mt-0.5">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  {metadata.assigned_department}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-300">
                    Desk Lead: <span className="text-white font-semibold">{metadata.assigned_lead}</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    {metadata.assigned_agent_id}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Priority</span>
                <div className="flex items-center gap-1.5 font-semibold text-white mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${priorityStyle.indicator}`} />
                  {metadata.priority}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Sentiment</span>
                <div className="font-semibold text-white mt-0.5 capitalize">
                  {metadata.sentiment.toLowerCase()}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Confidence</span>
                <div className="font-mono text-emerald-400 mt-0.5 font-semibold">
                  {typeof nlp.confidence_score === 'number'
                    ? `${Math.round(nlp.confidence_score * 100)}%`
                    : nlp.confidence_score}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Target SLA</span>
                <div className="text-slate-300 mt-0.5">{priorityStyle.sla}</div>
              </div>
            </div>
          </div>

          {/* Extracted NLP Intent & Incident Summary */}
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Extracted Customer Intent
              </span>
              <div className="text-xs font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-mono">
                {nlp.detected_intent}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Executive Incident Summary
              </span>
              <p className="text-sm text-slate-800 leading-relaxed font-medium bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80">
                {nlp.incident_summary}
              </p>
            </div>
          </div>

          {/* Desk Lead Technical Action Plan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                Technical Action for {metadata.assigned_lead} ({metadata.assigned_agent_id})
              </h3>
              {actionDone && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Action Logged to Desk Audit Trail
                </span>
              )}
            </div>
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-900 leading-normal">
                {internalActionStr}
              </div>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionDone}
                className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  actionDone
                    ? 'bg-emerald-100 text-emerald-800 cursor-default'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {actionDone ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Executed
                  </>
                ) : (
                  <>
                    <CornerDownRight className="w-3.5 h-3.5" />
                    Execute Desk Action
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Draft Customer Response */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                Draft Customer Response (Dispatched by {metadata.assigned_department})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingReply(!isEditingReply)}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditingReply ? 'Done Editing' : 'Edit Draft'}
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleCopyReply}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedReply ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Draft
                    </>
                  )}
                </button>
              </div>
            </div>

            {isEditingReply ? (
              <textarea
                value={customReply}
                onChange={(e) => setCustomReply(e.target.value)}
                rows={4}
                className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg p-3.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors"
              />
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 text-sm text-slate-800 leading-relaxed italic">
                "{customReply}"
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-500">
                Empathetic, business-appropriate resolution message draft from {metadata.assigned_lead}.
              </p>
              <button
                type="button"
                onClick={handleSendReply}
                disabled={replySent}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  replySent
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                }`}
              >
                {replySent ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Sent to Customer
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Response & Update Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Pure Target JSON Output View */
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setJsonSchemaMode('helix')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    jsonSchemaMode === 'helix'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Strict BMC Helix AITSM Schema
                </button>
                <button
                  type="button"
                  onClick={() => setJsonSchemaMode('repo')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    jsonSchemaMode === 'repo'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Repository Sync Schema
                </button>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {jsonSchemaMode === 'helix' ? 'helix_session + incident_record' : '4 enterprise blocks'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied JSON
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Pure JSON
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
              <code>
                {JSON.stringify(
                  jsonSchemaMode === 'helix' ? bmcHelixSchemaOutput : targetSchemaOutput,
                  null,
                  2
                )}
              </code>
            </pre>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
            <span>RFC 8259 Pure JSON Output (Strictly zero markdown preamble)</span>
            <span className="font-mono text-[11px]">BMC Helix Cognitive Engine</span>
          </div>
        </div>
      )}
    </div>
  );
};
