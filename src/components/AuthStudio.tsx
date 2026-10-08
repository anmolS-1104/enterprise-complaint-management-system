import React, { useState } from 'react';
import { AuthValidationResult, ZeroClickNLPTriageResult } from '../types/icrs';
import {
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  KeyRound,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  Sparkles,
  Compass,
  Box,
  Truck,
  Cpu,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

export const AuthStudio: React.FC = () => {
  const [activeTask, setActiveTask] = useState<'TASK_A' | 'TASK_B'>('TASK_B');

  // Task A Inputs
  const [authEmail, setAuthEmail] = useState('finance@agent.company.com');
  const [authPhone, setAuthPhone] = useState('9876543210');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authRole, setAuthRole] = useState<'CLIENT' | 'SUPPORT_AGENT'>('SUPPORT_AGENT');
  const [authAction, setAuthAction] = useState<'register' | 'login'>('login');

  // Task A Result
  const [taskAResult, setTaskAResult] = useState<AuthValidationResult | null>(null);
  const [taskALoading, setTaskALoading] = useState(false);
  const [copiedTaskA, setCopiedTaskA] = useState(false);

  // Task B Inputs
  const [incidentText, setIncidentText] = useState(
    'Our replacement developer MacBook Pros have been stuck in transit for 5 days with invalid tracking ID #TRK-9810, and two engineering workstations arrived with cracked displays. We need urgent dispatch replacement from the warehouse.'
  );
  const [taskBResult, setTaskBResult] = useState<ZeroClickNLPTriageResult | null>(null);
  const [taskBLoading, setTaskBLoading] = useState(false);
  const [copiedTaskB, setCopiedTaskB] = useState(false);

  // Run Task A Validation
  const handleRunTaskA = async () => {
    setTaskALoading(true);
    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          phone: authPhone,
          password: authPassword,
          role: authRole,
          action: authAction,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setTaskAResult(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskALoading(false);
    }
  };

  // Run Task B Triage
  const handleRunTaskB = async () => {
    setTaskBLoading(true);
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: incidentText,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setTaskBResult(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskBLoading(false);
    }
  };

  const applyTaskAPreset = (config: {
    email: string;
    phone: string;
    password: string;
    role: 'CLIENT' | 'SUPPORT_AGENT';
    action: 'register' | 'login';
  }) => {
    setAuthEmail(config.email);
    setAuthPhone(config.phone);
    setAuthPassword(config.password);
    setAuthRole(config.role);
    setAuthAction(config.action);
    setTaskAResult(null);
  };

  const handleCopyTaskAJson = () => {
    if (!taskAResult) return;
    navigator.clipboard.writeText(JSON.stringify(taskAResult, null, 2));
    setCopiedTaskA(true);
    setTimeout(() => setCopiedTaskA(false), 2000);
  };

  const [taskBSchemaView, setTaskBSchemaView] = useState<'helix' | 'repo'>('helix');

  const handleCopyTaskBJson = () => {
    if (!taskBResult) return;
    const helixOutput = {
      helix_session: taskBResult.helix_session || {
        current_view: 'SMART_IT_AGENT_CONSOLE',
        authenticated_role: 'SUPPORT_AGENT',
        operator_identity:
          taskBResult.ticket_metadata?.assigned_lead ||
          taskBResult.incident_record?.assigned_lead ||
          'Alex Rivera',
        authorized: true,
      },
      incident_record: {
        assigned_queue:
          taskBResult.incident_record?.assigned_queue ||
          taskBResult.ticket_metadata?.assigned_department ||
          'Cloud & Technical Infrastructure',
        assigned_lead:
          taskBResult.incident_record?.assigned_lead ||
          taskBResult.ticket_metadata?.assigned_lead ||
          'Alex Rivera',
        assigned_agent_id:
          taskBResult.incident_record?.assigned_agent_id ||
          taskBResult.ticket_metadata?.assigned_agent_id ||
          '#AGT-TECH-01',
        itil_priority:
          taskBResult.incident_record?.itil_priority ||
          (taskBResult.priority === 'CRITICAL'
            ? 'P1 - CRITICAL'
            : taskBResult.priority === 'HIGH'
            ? 'P2 - HIGH'
            : taskBResult.priority === 'MEDIUM'
            ? 'P3 - MEDIUM'
            : 'P4 - LOW'),
        detected_sentiment:
          taskBResult.incident_record?.detected_sentiment ||
          (taskBResult.sentiment === 'ANGRY'
            ? 'CRITICAL_ESCALATION'
            : taskBResult.sentiment || 'NEUTRAL'),
        incident_summary:
          taskBResult.incident_record?.incident_summary ||
          taskBResult.nlp_analysis?.incident_summary ||
          taskBResult.summary ||
          '',
        recommended_smartsheet_action:
          taskBResult.incident_record?.recommended_smartsheet_action ||
          taskBResult.resolution_plan?.internal_agent_action ||
          taskBResult.agent_action_plan?.recommended_technical_action ||
          '',
        dwp_user_notification:
          taskBResult.incident_record?.dwp_user_notification ||
          taskBResult.resolution_plan?.draft_customer_response ||
          taskBResult.agent_action_plan?.draft_customer_response ||
          '',
      },
    };

    const cleanRepoOutput = {
      repository_sync: taskBResult.repository_sync || {
        target_repo: 'anmolS-1104/enterprise-complaint-management-system',
        status: 'READY',
      },
      ticket_metadata: taskBResult.ticket_metadata,
      nlp_analysis: taskBResult.nlp_analysis,
      resolution_plan: {
        internal_agent_action:
          taskBResult.resolution_plan?.internal_agent_action ||
          taskBResult.agent_action_plan?.recommended_technical_action ||
          taskBResult.recommended_action ||
          '',
        draft_customer_response:
          taskBResult.resolution_plan?.draft_customer_response ||
          taskBResult.agent_action_plan?.draft_customer_response ||
          taskBResult.suggested_reply ||
          '',
      },
    };

    const toCopy = taskBSchemaView === 'helix' ? helixOutput : cleanRepoOutput;
    navigator.clipboard.writeText(JSON.stringify(toCopy, null, 2));
    setCopiedTaskB(true);
    setTimeout(() => setCopiedTaskB(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Target Repository Sync Status Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-emerald-400 font-semibold tracking-wider uppercase">
              Connected Repository Sync
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-300 font-mono">
              branch: <span className="text-white font-medium">rescue-backup/main</span>
            </span>
          </div>
          <div className="text-sm font-semibold text-white font-mono flex items-center gap-2">
            anmolS-1104/enterprise-complaint-management-system
            <span className="text-xs text-slate-400 font-sans font-normal hidden lg:inline">
              (Source submodule: anmolS-1104/JAVA-PROJECT)
            </span>
          </div>
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-slate-300 font-medium">Synchronized Controllers:</span>
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-200 font-mono">UnifiedLoginController.java</code>
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-200 font-mono">AuthController.java</code>
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-200 font-mono">UserDAOImpl.java</code>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-lg text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Enterprise Tech Stack</div>
            <div className="text-slate-200 font-medium">JavaFX 17 · Spring Boot · MySQL</div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Autonomous Routing, Triage & Security Studio
        </h1>
        <p className="text-sm text-slate-500">
          Zero-click NLP department routing, internal agent roster access, and strict enterprise validation engine.
        </p>
      </div>

      {/* Task Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTask('TASK_B')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTask === 'TASK_B'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          Zero-Click NLP Routing & Triage (Part 2)
        </button>
        <button
          type="button"
          onClick={() => setActiveTask('TASK_A')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTask === 'TASK_A'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Internal Agent Roster & Auth Checks (Part 1)
        </button>
      </div>

      {/* PART 2: ZERO-CLICK NLP ROUTING & TRIAGE */}
      {activeTask === 'TASK_B' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls & Inputs */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                Zero-Click Department Routing Harness
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically extracts intent, routes to exactly 1 of the 4 desk leads, scores urgency, and generates action plans.
              </p>
            </div>

            {/* Department Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Test Raw Customer Scenarios
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Logistics */}
                <button
                  type="button"
                  onClick={() =>
                    setIncidentText(
                      'Our replacement developer MacBook Pros have been stuck in transit for 5 days with invalid tracking ID #TRK-9810, and two engineering workstations arrived with cracked displays. We need urgent dispatch replacement from the warehouse.'
                    )
                  }
                  className="p-2.5 border border-slate-200 rounded-lg text-left hover:bg-slate-50 font-medium text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-0.5">
                    <Truck className="w-3.5 h-3.5" />
                    Logistics Desk
                  </div>
                  <div className="text-[11px] text-slate-500">Hardware & delivery transit</div>
                </button>

                {/* Finance */}
                <button
                  type="button"
                  onClick={() =>
                    setIncidentText(
                      'We have an unauthorized double charge of $19,400 on invoice #INV-4921 that has been unresolved for over 72 hours, and our monthly payroll tax deduction schedule is blocked.'
                    )
                  }
                  className="p-2.5 border border-slate-200 rounded-lg text-left hover:bg-slate-50 font-medium text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-0.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Finance & Payroll
                  </div>
                  <div className="text-[11px] text-slate-500">Overcharge & payroll blockers</div>
                </button>

                {/* Tech Support */}
                <button
                  type="button"
                  onClick={() =>
                    setIncidentText(
                      'Our US-East database connection cluster crashed returning 502 Bad Gateway across all checkout endpoints, affecting 12,000 active customer transactions.'
                    )
                  }
                  className="p-2.5 border border-slate-200 rounded-lg text-left hover:bg-slate-50 font-medium text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-rose-700 font-semibold mb-0.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Technical Support
                  </div>
                  <div className="text-[11px] text-slate-500">502 outage & database crash</div>
                </button>

                {/* Customer Care */}
                <button
                  type="button"
                  onClick={() =>
                    setIncidentText(
                      'We are rolling out the enterprise portal to 40 new team members and need onboarding guidance on role access delegation and SLA escalation workflows.'
                    )
                  }
                  className="p-2.5 border border-slate-200 rounded-lg text-left hover:bg-slate-50 font-medium text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-blue-700 font-semibold mb-0.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Customer Care
                  </div>
                  <div className="text-[11px] text-slate-500">Onboarding & portal guidance</div>
                </button>
              </div>
            </div>

            {/* Incident Text Area */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-600 font-medium flex items-center justify-between">
                <span>Raw Uncategorized Customer Complaint</span>
                <span className="text-[10px] text-slate-400">Zero customer categorization needed</span>
              </label>
              <textarea
                rows={5}
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 leading-relaxed font-sans focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
              />

              <button
                type="button"
                onClick={handleRunTaskB}
                disabled={taskBLoading || !incidentText.trim()}
                className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {taskBLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    Execute Zero-Click NLP Routing & Triage
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Task B Output Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-slate-600" />
                    Cognitive Engine Target JSON Output
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setTaskBSchemaView('helix')}
                      className={`text-xs px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        taskBSchemaView === 'helix'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      BMC Helix AITSM Schema
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskBSchemaView('repo')}
                      className={`text-xs px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        taskBSchemaView === 'repo'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Repo Sync 4-Blocks
                    </button>
                  </div>
                </div>
                {taskBResult && (
                  <button
                    type="button"
                    onClick={handleCopyTaskBJson}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedTaskB ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Pure JSON
                      </>
                    )}
                  </button>
                )}
              </div>

              {taskBResult ? (
                <div className="space-y-3">
                  {/* Routing Pill Highlight */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Assigned ITIL Desk</div>
                      <div className="font-semibold text-emerald-400 text-sm">
                        {taskBResult.incident_record?.assigned_queue ||
                          taskBResult.ticket_metadata?.assigned_department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {taskBResult.incident_record?.assigned_lead ||
                          taskBResult.ticket_metadata?.assigned_lead}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {taskBResult.incident_record?.assigned_agent_id ||
                          taskBResult.ticket_metadata?.assigned_agent_id}
                      </div>
                    </div>
                  </div>

                  {/* Pure JSON Code Block */}
                  <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                    <code>
                      {taskBSchemaView === 'helix'
                        ? JSON.stringify(
                            {
                              helix_session: taskBResult.helix_session || {
                                current_view: 'SMART_IT_AGENT_CONSOLE',
                                authenticated_role: 'SUPPORT_AGENT',
                                operator_identity:
                                  taskBResult.ticket_metadata?.assigned_lead ||
                                  taskBResult.incident_record?.assigned_lead ||
                                  'Alex Rivera',
                                authorized: true,
                              },
                              incident_record: {
                                assigned_queue:
                                  taskBResult.incident_record?.assigned_queue ||
                                  taskBResult.ticket_metadata?.assigned_department ||
                                  'Cloud & Technical Infrastructure',
                                assigned_lead:
                                  taskBResult.incident_record?.assigned_lead ||
                                  taskBResult.ticket_metadata?.assigned_lead ||
                                  'Alex Rivera',
                                assigned_agent_id:
                                  taskBResult.incident_record?.assigned_agent_id ||
                                  taskBResult.ticket_metadata?.assigned_agent_id ||
                                  '#AGT-TECH-01',
                                itil_priority:
                                  taskBResult.incident_record?.itil_priority ||
                                  (taskBResult.priority === 'CRITICAL'
                                    ? 'P1 - CRITICAL'
                                    : taskBResult.priority === 'HIGH'
                                    ? 'P2 - HIGH'
                                    : taskBResult.priority === 'MEDIUM'
                                    ? 'P3 - MEDIUM'
                                    : 'P4 - LOW'),
                                detected_sentiment:
                                  taskBResult.incident_record?.detected_sentiment ||
                                  (taskBResult.sentiment === 'ANGRY'
                                    ? 'CRITICAL_ESCALATION'
                                    : taskBResult.sentiment || 'NEUTRAL'),
                                incident_summary:
                                  taskBResult.incident_record?.incident_summary ||
                                  taskBResult.nlp_analysis?.incident_summary ||
                                  taskBResult.summary ||
                                  '',
                                recommended_smartsheet_action:
                                  taskBResult.incident_record?.recommended_smartsheet_action ||
                                  taskBResult.resolution_plan?.internal_agent_action ||
                                  taskBResult.agent_action_plan?.recommended_technical_action ||
                                  '',
                                dwp_user_notification:
                                  taskBResult.incident_record?.dwp_user_notification ||
                                  taskBResult.resolution_plan?.draft_customer_response ||
                                  taskBResult.agent_action_plan?.draft_customer_response ||
                                  '',
                              },
                            },
                            null,
                            2
                          )
                        : JSON.stringify(
                            {
                              repository_sync: taskBResult.repository_sync || {
                                target_repo: 'anmolS-1104/enterprise-complaint-management-system',
                                status: 'READY',
                              },
                              ticket_metadata: taskBResult.ticket_metadata,
                              nlp_analysis: taskBResult.nlp_analysis,
                              resolution_plan: {
                                internal_agent_action:
                                  taskBResult.resolution_plan?.internal_agent_action ||
                                  taskBResult.agent_action_plan?.recommended_technical_action ||
                                  taskBResult.recommended_action ||
                                  '',
                                draft_customer_response:
                                  taskBResult.resolution_plan?.draft_customer_response ||
                                  taskBResult.agent_action_plan?.draft_customer_response ||
                                  taskBResult.suggested_reply ||
                                  '',
                              },
                            },
                            null,
                            2
                          )}
                    </code>
                  </pre>
                </div>
              ) : (
                <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  Select a test scenario and click "Execute Zero-Click NLP Routing & Triage" to view structured routing.
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              Output Schema: repository_sync, ticket_metadata, nlp_analysis, resolution_plan
            </div>
          </div>
        </div>
      )}

      {/* PART 1: INTERNAL AGENT ROSTER & AUTHENTICATION CHECKS */}
      {activeTask === 'TASK_A' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls & Inputs */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                Internal Support Agent Roster (Direct Login Only)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The 4 pre-provisioned desk leads have direct login access. Public registration is strictly prohibited.
              </p>
            </div>

            {/* 4 Pre-provisioned Leads */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Internal Support Desk Leads
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    applyTaskAPreset({
                      email: 'finance@agent.company.com',
                      phone: '9876543210',
                      password: 'password123',
                      role: 'SUPPORT_AGENT',
                      action: 'login',
                    })
                  }
                  className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 font-medium text-slate-800"
                >
                  <div className="font-semibold text-slate-900">Elena Vance</div>
                  <div className="text-[10px] text-slate-500 font-mono">finance@agent.company.com</div>
                  <div className="text-[10px] text-emerald-600 font-mono">#AGT-FIN-01 (Finance)</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTaskAPreset({
                      email: 'tech@agent.company.com',
                      phone: '9876543210',
                      password: 'password123',
                      role: 'SUPPORT_AGENT',
                      action: 'login',
                    })
                  }
                  className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 font-medium text-slate-800"
                >
                  <div className="font-semibold text-slate-900">Alex Rivera</div>
                  <div className="text-[10px] text-slate-500 font-mono">tech@agent.company.com</div>
                  <div className="text-[10px] text-emerald-600 font-mono">#AGT-TECH-01 (Tech)</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTaskAPreset({
                      email: 'care@agent.company.com',
                      phone: '9876543210',
                      password: 'password123',
                      role: 'SUPPORT_AGENT',
                      action: 'login',
                    })
                  }
                  className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 font-medium text-slate-800"
                >
                  <div className="font-semibold text-slate-900">Sarah Jenkins</div>
                  <div className="text-[10px] text-slate-500 font-mono">care@agent.company.com</div>
                  <div className="text-[10px] text-emerald-600 font-mono">#AGT-CARE-01 (Care)</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTaskAPreset({
                      email: 'logistics@agent.company.com',
                      phone: '9876543210',
                      password: 'password123',
                      role: 'SUPPORT_AGENT',
                      action: 'login',
                    })
                  }
                  className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 font-medium text-slate-800"
                >
                  <div className="font-semibold text-slate-900">Marcus Vance</div>
                  <div className="text-[10px] text-slate-500 font-mono">logistics@agent.company.com</div>
                  <div className="text-[10px] text-emerald-600 font-mono">#AGT-LOG-01 (Logistics)</div>
                </button>
              </div>
            </div>

            {/* Policy Enforcement Scenarios */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Security Policy Enforcement Checks
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    applyTaskAPreset({
                      email: 'tech@agent.company.com',
                      phone: '9876543210',
                      password: 'password123',
                      role: 'SUPPORT_AGENT',
                      action: 'register',
                    })
                  }
                  className="p-2 border border-rose-200 bg-rose-50/50 rounded-lg text-left hover:bg-rose-50 font-medium text-rose-900"
                >
                  <span className="text-rose-700 font-semibold">Test Policy:</span> Agent Public Register Ban
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTaskAPreset({
                      email: 'intruder@yahoo.com',
                      phone: '9876543210',
                      password: 'password123',
                      role: 'CLIENT',
                      action: 'register',
                    })
                  }
                  className="p-2 border border-rose-200 bg-rose-50/50 rounded-lg text-left hover:bg-rose-50 font-medium text-rose-900"
                >
                  <span className="text-rose-700 font-semibold">Test Policy:</span> Client Domain Rejection
                </button>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3 text-xs pt-2">
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Email Address</label>
                <input
                  type="text"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Role</label>
                  <select
                    value={authRole}
                    onChange={(e: any) => setAuthRole(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="SUPPORT_AGENT">Internal Support Agent</option>
                    <option value="CLIENT">Corporate Client</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Action</label>
                  <select
                    value={authAction}
                    onChange={(e: any) => setAuthAction(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="login">Direct Login</option>
                    <option value="register">Registration</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleRunTaskA}
                disabled={taskALoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {taskALoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                    Verify Authentication Payload
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Task A Output Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-slate-600" />
                    Authentication Output Schema
                  </h2>
                  <p className="text-xs text-slate-500">
                    Strict pure JSON validation response
                  </p>
                </div>
                {taskAResult && (
                  <button
                    type="button"
                    onClick={handleCopyTaskAJson}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {copiedTaskA ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedTaskA ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              {taskAResult ? (
                <div className="space-y-3">
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                      taskAResult.status === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {taskAResult.status === 'APPROVED' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      )}
                      <div>
                        <span className="font-bold tracking-wider">
                          STATUS: {taskAResult.status}
                        </span>
                        <div className="text-[11px] opacity-90">{taskAResult.reason}</div>
                      </div>
                    </div>
                  </div>

                  <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                    <code>{JSON.stringify(taskAResult, null, 2)}</code>
                  </pre>
                </div>
              ) : (
                <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  Select credentials and click "Verify Authentication Payload" to test.
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              Task A Properties: task, status, reason, normalized_email, sanitized_phone, error_field
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
