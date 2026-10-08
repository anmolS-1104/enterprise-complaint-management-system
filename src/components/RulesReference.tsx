import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  User,
  Shield,
  FileJson,
  Server,
  Building2,
  Cpu,
} from 'lucide-react';

export const RulesReference: React.FC = () => {
  const [copiedTaskA, setCopiedTaskA] = useState(false);
  const [copiedTaskB, setCopiedTaskB] = useState(false);
  const [copiedHelix, setCopiedHelix] = useState(false);

  const bmcHelixAitsmSchema = `{
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

  const taskASchema = `{
  "task": "AUTH_VALIDATION",
  "status": "APPROVED | REJECTED",
  "reason": "Detailed validation reason or 'Validation passed'",
  "normalized_email": "lowercase email",
  "sanitized_phone": "10-digit string or 'N/A' for agent",
  "error_field": "EMAIL | PHONE | PASSWORD | CONFIRM_PASSWORD | NONE"
}`;

  const handleCopyHelix = () => {
    navigator.clipboard.writeText(bmcHelixAitsmSchema);
    setCopiedHelix(true);
    setTimeout(() => setCopiedHelix(false), 2000);
  };

  const handleCopyTaskA = () => {
    navigator.clipboard.writeText(taskASchema);
    setCopiedTaskA(true);
    setTimeout(() => setCopiedTaskA(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Target GitHub Repository & BMC Architecture Header */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold tracking-wider">
                BMC Helix ITSM / DWP Platform Context & Controller Sync
              </span>
            </div>
            <h2 className="text-base font-semibold text-white mt-1 font-mono">
              anmolS-1104/enterprise-complaint-management-system
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Submodule Source</span>
            <div className="text-xs font-mono text-slate-200">
              anmolS-1104/JAVA-PROJECT (branch: rescue-backup/main)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Synchronized Tech Stack</span>
            <div className="text-slate-200 font-medium mt-0.5">
              JavaFX 17 (Desktop) · Spring Boot (REST API) · MySQL Database
            </div>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] text-slate-400 uppercase">Enterprise Branch Controllers</span>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                UnifiedLoginController.java
              </span>
              <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                AuthController.java
              </span>
              <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                UserDAOImpl.java
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          BMC Helix AITSM & Cognitive Resolution Architecture
        </h1>
        <p className="text-sm text-slate-500">
          ITIL v4 Incident Management, Role-Based Access Control (RBAC), and Shift-Left Cognitive Automation protocol.
        </p>
      </div>

      {/* Role Definitions */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          ITIL Role Gateway & Strict View Isolation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Corporate Client */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                1. DWP Corporate Client (End User Portal)
              </h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Mandatory Registration:</strong> Public customers must register prior to service access.
              </li>
              <li>
                <strong>Corporate Domain Restriction:</strong> Allowed domains must end in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">@client.com</code> or match explicit whitelist:
                <div className="mt-1 bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-700">
                  ["customer@client.com", "client@client.com", "anmol.client@gmail.com", "client.acme@gmail.com", "client.bmc@gmail.com", "client@acmecorp.com"]
                </div>
              </li>
              <li>
                <strong>10-Digit Numeric Phone:</strong> Mandatory exact 10 numeric digits.
              </li>
              <li>
                <strong>Password Policy:</strong> Minimum 6 characters long.
              </li>
              <li>
                <strong>Strict View Isolation:</strong> Displays "Report an Outage / Log IT Service Incident". Completely hides internal SLA metrics, technician assignment matrices, and operational desk logs.
              </li>
            </ul>
          </div>

          {/* Support Agent */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                2. BMC Helix Smart IT Support Console (Agents Only)
              </h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Pre-Provisioned Accounts:</strong> Pre-provisioned internally via administrative directory sync; <span className="text-rose-600 font-semibold">NO public registration permitted</span>.
              </li>
              <li>
                <strong>Direct Login Access Only:</strong> Authorized using pre-provisioned agent credentials.
              </li>
              <li>
                <strong>Restricted Role:</strong> Renders Smart IT Agent Console, Cognitive Dispatch Queue, and ITIL Root-Cause Analysis pane. Agents never see client registration prompts.
              </li>
              <li>
                <strong>Logout Enforcement:</strong> Purges auth tokens and resets interface to BMC Helix Service Gateway.
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                4 Pre-Provisioned ITIL Desk Leads:
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200/70">
                  <span className="font-semibold text-slate-900 block">Alex Rivera (#AGT-TECH-01)</span>
                  <span className="text-slate-500 text-[10px]">Cloud & Technical Infrastructure</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200/70">
                  <span className="font-semibold text-slate-900 block">Elena Vance (#AGT-FIN-01)</span>
                  <span className="text-slate-500 text-[10px]">Finance & ERP Operations</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200/70">
                  <span className="font-semibold text-slate-900 block">Sarah Jenkins (#AGT-CARE-01)</span>
                  <span className="text-slate-500 text-[10px]">Global Customer Care & DWP Support</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200/70">
                  <span className="font-semibold text-slate-900 block">Marcus Vance (#AGT-LOG-01)</span>
                  <span className="text-slate-500 text-[10px]">Hardware & Asset Logistics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Schemas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BMC Helix AITSM Schema */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Strict BMC Helix AITSM Schema
              </h3>
              <p className="text-[11px] text-slate-500">
                helix_session & incident_record pure JSON specification
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyHelix}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              {copiedHelix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedHelix ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
            {bmcHelixAitsmSchema}
          </pre>
        </div>

        {/* Task A Schema */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Task A: Auth & Registration Validation
              </h3>
              <p className="text-[11px] text-slate-500">
                Output for onboarding, registration, or login evaluation
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyTaskA}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              {copiedTaskA ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTaskA ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
            {taskASchema}
          </pre>
        </div>
      </div>

      {/* ITIL v4 Urgency & Impact Matrix */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          ITIL v4 Urgency & Impact Matrix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="font-semibold text-rose-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              P1 - CRITICAL
            </div>
            <p className="text-slate-600 leading-relaxed">
              Enterprise outage, complete ERP/database halt, widespread business disruption.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="font-semibold text-amber-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              P2 - HIGH
            </div>
            <p className="text-slate-600 leading-relaxed">
              Core business process impaired, financial transaction failure, blocked executive workflow.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="font-semibold text-blue-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              P3 - MEDIUM
            </div>
            <p className="text-slate-600 leading-relaxed">
              Isolated application bug with viable workaround, delayed non-critical asset dispatch.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              P4 - LOW
            </div>
            <p className="text-slate-600 leading-relaxed">
              Informational request, minor UI discrepancy, standard how-to question.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
