import React, { useState } from 'react';
import { AppUser, AuthValidationResult } from '../types/icrs';
import {
  Shield,
  ShieldAlert,
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Server,
  Layers,
  Sparkles,
  Phone,
  Mail,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface BMCHelixGatewayProps {
  onLoginSuccess: (user: AppUser) => void;
}

const WHITELISTED_DOMAINS_DESC = [
  '@client.com domain',
  'customer@client.com',
  'client@client.com',
  'anmol.client@gmail.com',
  'client.acme@gmail.com',
  'client.bmc@gmail.com',
  'client@acmecorp.com',
];

const PRE_PROVISIONED_AGENTS: {
  email: string;
  name: string;
  department: string;
  agentId: string;
}[] = [
  {
    email: 'tech@agent.company.com',
    name: 'Alex Rivera',
    department: 'Cloud & Technical Infrastructure',
    agentId: '#AGT-TECH-01',
  },
  {
    email: 'finance@agent.company.com',
    name: 'Elena Vance',
    department: 'Finance & ERP Operations',
    agentId: '#AGT-FIN-01',
  },
  {
    email: 'care@agent.company.com',
    name: 'Sarah Jenkins',
    department: 'Global Customer Care & DWP Support',
    agentId: '#AGT-CARE-01',
  },
  {
    email: 'logistics@agent.company.com',
    name: 'Marcus Vance',
    department: 'Hardware & Asset Logistics',
    agentId: '#AGT-LOG-01',
  },
];

export const BMCHelixGateway: React.FC<BMCHelixGatewayProps> = ({ onLoginSuccess }) => {
  const [activePersona, setActivePersona] = useState<'CLIENT' | 'AGENT'>('CLIENT');
  const [clientSubTab, setClientSubTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Client form states
  const [clientEmail, setClientEmail] = useState('customer@client.com');
  const [clientPhone, setClientPhone] = useState('9876543210');
  const [clientPassword, setClientPassword] = useState('Enterprise2026!');
  const [clientName, setClientName] = useState('David K.');
  const [clientCompany, setClientCompany] = useState('FinGlobal Technologies');

  // Agent form states
  const [agentEmail, setAgentEmail] = useState('tech@agent.company.com');
  const [agentPassword, setAgentPassword] = useState('LeadAlexRivera2026');

  // Status & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authValidationResult, setAuthValidationResult] = useState<AuthValidationResult | null>(null);

  // Quick fill client
  const handleQuickFillClient = (email: string, name: string, phone: string, company: string) => {
    setClientEmail(email);
    setClientName(name);
    setClientPhone(phone);
    setClientCompany(company);
    setErrorMessage(null);
  };

  // Quick fill agent
  const handleQuickFillAgent = (agent: (typeof PRE_PROVISIONED_AGENTS)[0]) => {
    setAgentEmail(agent.email);
    setAgentPassword(`Lead${agent.name.replace(/\s+/g, '')}2026`);
    setErrorMessage(null);
  };

  // Handle Client Login / Register
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (clientSubTab === 'REGISTER') {
        // Validate Task A
        const valRes = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: clientEmail,
            phone: clientPhone,
            password: clientPassword,
            role: 'CLIENT',
            action: 'register',
          }),
        });
        const valData = await valRes.json();
        setAuthValidationResult(valData.data);

        if (!valData.success) {
          setErrorMessage(valData.data?.reason || 'Registration validation failed.');
          setIsLoading(false);
          return;
        }

        // Register
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
            password: clientPassword,
            company: clientCompany,
          }),
        });
        const regData = await regRes.json();
        if (!regData.success) {
          setErrorMessage(regData.error || 'Registration failed.');
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Registration successful! Launching BMC Helix Digital Workplace...');
        setTimeout(() => {
          onLoginSuccess(regData.user);
        }, 600);
      } else {
        // Client Login
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: clientEmail,
            password: clientPassword,
            role: 'CLIENT',
          }),
        });
        const loginData = await loginRes.json();
        if (!loginData.success) {
          setErrorMessage(loginData.error || 'Authentication failed. Please verify credentials.');
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Corporate identity verified! Launching Digital Workplace portal...');
        setTimeout(() => {
          onLoginSuccess(loginData.user);
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network communication error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Agent Direct Login
  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agentEmail,
          password: agentPassword,
          role: 'SUPPORT_AGENT',
        }),
      });
      const loginData = await loginRes.json();
      if (!loginData.success) {
        setErrorMessage(
          loginData.error ||
            'Access Denied: Unrecognized support agent credentials. Only pre-provisioned desk leads may log in.'
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage(`Access Granted: ${loginData.user.name} (${loginData.user.department})`);
      setTimeout(() => {
        onLoginSuccess(loginData.user);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentRegisterAttempt = () => {
    setErrorMessage(
      'Registration prohibited. Support Agents are pre-provisioned via administrative directory sync.'
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Platform & Architecture Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-emerald-400 rounded-full text-xs font-mono font-medium shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span>BMC Helix ITSM / Digital Workplace (DWP) Cognitive Resolution Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          BMC Helix Service Gateway
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          ITIL v4 Incident Management, Role-Based Access Control (RBAC), and Shift-Left Cognitive Automation.
          Select your persona to verify identity and enter the isolated resolution environment.
        </p>

        {/* Repository Synchronization Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-1">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-500">Repository:</span>
            <span className="font-mono font-semibold text-slate-900">
              anmolS-1104/enterprise-complaint-management-system
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-700 shadow-2xs">
            <span className="font-medium text-slate-500">Submodule:</span>
            <span className="font-mono text-emerald-700 font-semibold">
              anmolS-1104/JAVA-PROJECT (rescue-backup/main)
            </span>
          </div>
        </div>
      </div>

      {/* Strict Persona Gateway Selection Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
          {/* Tab 1: DWP Corporate Client */}
          <button
            type="button"
            onClick={() => {
              setActivePersona('CLIENT');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all cursor-pointer ${
              activePersona === 'CLIENT'
                ? 'bg-white shadow-xs border border-blue-200 text-blue-900'
                : 'hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activePersona === 'CLIENT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-blue-600">
                Persona View 1
              </div>
              <div className="text-sm font-bold text-slate-900">
                BMC Helix Digital Workplace
              </div>
              <div className="text-[11px] text-slate-500">
                Corporate Client & End-User Submission Portal
              </div>
            </div>
          </button>

          {/* Tab 2: Smart IT Agent Desk */}
          <button
            type="button"
            onClick={() => {
              setActivePersona('AGENT');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all cursor-pointer ${
              activePersona === 'AGENT'
                ? 'bg-white shadow-xs border border-emerald-200 text-slate-900'
                : 'hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activePersona === 'AGENT'
                  ? 'bg-slate-900 text-emerald-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-emerald-600">
                Persona View 2
              </div>
              <div className="text-sm font-bold text-slate-900">
                BMC Helix ITSM Support Console
              </div>
              <div className="text-[11px] text-slate-500">
                Smart IT Resolution Desk (Pre-Provisioned Agents Only)
              </div>
            </div>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-900">Security / Validation Error</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-900">Authentication Confirmed</div>
              <div>{successMessage}</div>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* ======================================================== */}
          {/* PERSONA 1: DWP CORPORATE CLIENT */}
          {/* ======================================================== */}
          {activePersona === 'CLIENT' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Digital Workplace (DWP) Identity Verification
                  </h2>
                  <p className="text-xs text-slate-500">
                    Corporate clients must register prior to service access. Domain and phone restrictions strictly enforced.
                  </p>
                </div>

                {/* Sub Tab: Login vs Register */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setClientSubTab('LOGIN');
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      clientSubTab === 'LOGIN'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Client Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClientSubTab('REGISTER');
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      clientSubTab === 'REGISTER'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    New Client Registration
                  </button>
                </div>
              </div>

              {/* Policy Enforcement Alert */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-blue-950">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Task A Security Protocol Governance:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-blue-800 pt-1">
                  <div>
                    <strong>Allowed Domains:</strong> <span className="font-mono">@client.com</span> or whitelist
                  </div>
                  <div>
                    <strong>Contact:</strong> Exact 10-digit numeric phone
                  </div>
                  <div>
                    <strong>Password:</strong> Minimum 6 characters
                  </div>
                </div>
              </div>

              <form onSubmit={handleClientSubmit} className="space-y-4">
                {clientSubTab === 'REGISTER' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-sans"
                        placeholder="David K."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Corporate Organization
                      </label>
                      <input
                        type="text"
                        value={clientCompany}
                        onChange={(e) => setClientCompany(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-sans"
                        placeholder="FinGlobal Technologies"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Corporate Email Address
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="customer@client.com"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Must end in @client.com or match verified whitelist.
                    </span>
                  </div>

                  {clientSubTab === 'REGISTER' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        10-Digit Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                        maxLength={10}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="9876543210"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Strictly numeric, exactly 10 digits.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        Password
                      </label>
                      <input
                        type="password"
                        value={clientPassword}
                        onChange={(e) => setClientPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="••••••••"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Minimum 6 characters.
                      </span>
                    </div>
                  )}
                </div>

                {clientSubTab === 'REGISTER' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      Set Corporate Password (Min 6 chars)
                    </label>
                    <input
                      type="password"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {clientSubTab === 'REGISTER' ? (
                      <span>Already registered? <button type="button" onClick={() => setClientSubTab('LOGIN')} className="text-blue-600 underline font-medium cursor-pointer">Sign in</button></span>
                    ) : (
                      <span>Need a new account? <button type="button" onClick={() => setClientSubTab('REGISTER')} className="text-blue-600 underline font-medium cursor-pointer">Register now</button></span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <span>{clientSubTab === 'REGISTER' ? 'Register & Enter DWP Portal' : 'Authenticate & Enter DWP Portal'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Preset Buttons for Corporate Clients */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Quick-Verify Verified Corporate Clients (Demo):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFillClient(
                        'customer@client.com',
                        'Marcus Vance',
                        '9876543210',
                        'FinGlobal Technologies'
                      )
                    }
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono transition-colors cursor-pointer"
                  >
                    customer@client.com (FinGlobal)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFillClient(
                        'client@client.com',
                        'Elena Rostova',
                        '9123456780',
                        'Apex Logistics Inc.'
                      )
                    }
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono transition-colors cursor-pointer"
                  >
                    client@client.com (Apex Logistics)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFillClient(
                        'anmol.client@gmail.com',
                        'Anmol Shinde',
                        '9988776655',
                        'Client Partner Group'
                      )
                    }
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono transition-colors cursor-pointer"
                  >
                    anmol.client@gmail.com (Whitelist)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFillClient(
                        'client.bmc@gmail.com',
                        'Enterprise Admin',
                        '9871234560',
                        'BMC Enterprise Solutions'
                      )
                    }
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono transition-colors cursor-pointer"
                  >
                    client.bmc@gmail.com (BMC Whitelist)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PERSONA 2: BMC HELIX SMART IT RESOLUTION DESK */}
          {/* ======================================================== */}
          {activePersona === 'AGENT' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-600" />
                    BMC Helix Smart IT Resolution Desk (Support Agents Only)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Direct login only. Support Agents are pre-provisioned via administrative directory sync; public self-registration is strictly forbidden.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Public Registration Prohibited</span>
                </div>
              </div>

              {/* Roster of 4 Pre-provisioned Desk Leads */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Click a Pre-Provisioned ITIL Desk Lead to Auto-Fill Credentials:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PRE_PROVISIONED_AGENTS.map((agent) => (
                    <button
                      key={agent.agentId}
                      type="button"
                      onClick={() => handleQuickFillAgent(agent)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        agentEmail === agent.email
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-400'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                          {agent.agentId}
                        </span>
                        <span className="text-[10px] text-slate-400">Desk Lead</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">{agent.name}</div>
                      <div className="text-[10px] text-slate-600 font-medium truncate">
                        {agent.department}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                        {agent.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAgentSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Support Agent Corporate Email
                    </label>
                    <input
                      type="email"
                      value={agentEmail}
                      onChange={(e) => setAgentEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      placeholder="tech@agent.company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      Agent Security Credentials
                    </label>
                    <input
                      type="password"
                      value={agentPassword}
                      onChange={(e) => setAgentPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAgentRegisterAttempt}
                    className="text-xs text-rose-600 hover:text-rose-700 underline font-medium cursor-pointer"
                  >
                    Attempt Agent Self-Registration (Policy Test)
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Verifying Directory...</span>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        <span>Launch Smart IT Console</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ITIL v4 Governance Footer Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500">
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs space-y-1">
          <span className="font-semibold text-slate-800 block">ITIL v4 Incident Management</span>
          <p className="text-[11px] leading-relaxed">
            Strict separation between end-user incident logging and internal technical runbook execution.
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs space-y-1">
          <span className="font-semibold text-slate-800 block">Zero-Click Cognitive Triage</span>
          <p className="text-[11px] leading-relaxed">
            Automatic intent extraction, queue dispatch, priority calculation (P1 to P4), and sentiment tagging.
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs space-y-1">
          <span className="font-semibold text-slate-800 block">Controller & DAO Alignment</span>
          <p className="text-[11px] leading-relaxed font-mono text-[10px]">
            UnifiedLoginController.java · AuthController.java · UserDAOImpl.java
          </p>
        </div>
      </div>
    </div>
  );
};
