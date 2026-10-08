import React, { useState } from 'react';
import { AppUser, AuthValidationResult, CompanyCMSState } from '../types/icrs';
import {
  Shield,
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Phone,
  Mail,
  KeyRound,
  Code,
  Copy,
  Check,
  Server,
  Layers,
} from 'lucide-react';

interface CompanyCMSFrontPageProps {
  onLoginSuccess: (user: AppUser) => void;
  onUpdateStateSchema?: (state: CompanyCMSState) => void;
}

const WHITELISTED_DOMAINS = [
  '@client.com domain',
  'customer@client.com',
  'client@client.com',
  'anmol.client@gmail.com',
  'client.acme@gmail.com',
  'client.bmc@gmail.com',
  'client@acmecorp.com',
];

const PRE_PROVISIONED_AGENTS = [
  {
    email: 'finance@agent.company.com',
    name: 'Elena Vance',
    department: 'Finance & Payroll' as const,
    agentId: '#AGT-FIN-01' as const,
    description: 'Corporate billing, ERP expense sync, payroll disputes',
  },
  {
    email: 'tech@agent.company.com',
    name: 'Alex Rivera',
    department: 'Technical Support' as const,
    agentId: '#AGT-TECH-01' as const,
    description: 'Cloud outage, database replication, 502/504 gateway failures',
  },
  {
    email: 'care@agent.company.com',
    name: 'Sarah Jenkins',
    department: 'Customer Care' as const,
    agentId: '#AGT-CARE-01' as const,
    description: 'DWP portal onboarding, executive escalations, SLA tracking',
  },
  {
    email: 'logistics@agent.company.com',
    name: 'Marcus Vance',
    department: 'Logistics Desk' as const,
    agentId: '#AGT-LOG-01' as const,
    description: 'Hardware asset dispatch, damaged transit, dock replacements',
  },
];

export const CompanyCMSFrontPage: React.FC<CompanyCMSFrontPageProps> = ({
  onLoginSuccess,
  onUpdateStateSchema,
}) => {
  // Pill switcher: [👤 Customer Portal] and [🏛 Support Agent]
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'AGENT'>('CUSTOMER');
  const [customerSubView, setCustomerSubView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Customer Form State
  const [clientEmail, setClientEmail] = useState('customer@client.com');
  const [clientPhone, setClientPhone] = useState('9876543210');
  const [clientPassword, setClientPassword] = useState('Enterprise2026!');
  const [clientName, setClientName] = useState('David K.');
  const [clientCompany, setClientCompany] = useState('FinGlobal Technologies');

  // Agent Form State
  const [agentEmail, setAgentEmail] = useState('tech@agent.company.com');
  const [agentPassword, setAgentPassword] = useState('LeadAlexRivera2026');

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [copied, setCopied] = useState(false);

  // Validation details for the JSON Schema
  const [currentValidation, setCurrentValidation] = useState<{
    status: 'APPROVED' | 'REJECTED';
    reason: string;
    role: 'CORPORATE_CLIENT' | 'SUPPORT_AGENT' | 'UNAUTHORIZED';
    assigned_desk: {
      desk_name: 'Finance & Payroll' | 'Technical Support' | 'Customer Care' | 'Logistics Desk' | 'NONE';
      desk_lead: 'Elena Vance' | 'Alex Rivera' | 'Sarah Jenkins' | 'Marcus Vance' | 'NONE';
      agent_id: '#AGT-FIN-01' | '#AGT-TECH-01' | '#AGT-CARE-01' | '#AGT-LOG-01' | 'NONE';
    };
  }>({
    status: 'APPROVED',
    reason: 'Initial front-page state ready for credential verification',
    role: 'UNAUTHORIZED',
    assigned_desk: {
      desk_name: 'NONE',
      desk_lead: 'NONE',
      agent_id: 'NONE',
    },
  });

  // Compute the current state schema adhering to the exact required schema
  const getCurrentStateJson = (): CompanyCMSState => {
    let activePortal: 'CUSTOMER_SIGN_IN' | 'AGENT_CONSOLE' | 'CUSTOMER_REGISTER' = 'CUSTOMER_SIGN_IN';
    if (activeTab === 'AGENT') {
      activePortal = 'AGENT_CONSOLE';
    } else if (customerSubView === 'REGISTER') {
      activePortal = 'CUSTOMER_REGISTER';
    }

    return {
      ui_state: {
        active_portal: activePortal,
        theme: 'COMPANY_CMS_TEAL_DARK',
        rendered_view: 'LANDING_PORTAL',
        authenticated_user: 'NONE',
      },
      auth_validation: currentValidation,
      triage_result: {
        nlp_detected_category: 'PENDING_SUBMISSION',
        itil_priority: 'NONE',
        recommended_action: 'Awaiting customer submission of raw incident complaint',
        customer_notification: 'Session not established. Please sign in to submit a complaint.',
      },
    };
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(getCurrentStateJson(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Switch pill selector
  const handleSelectTab = (tab: 'CUSTOMER' | 'AGENT') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Quick fill pre-provisioned agent
  const handleSelectAgent = (agent: (typeof PRE_PROVISIONED_AGENTS)[0]) => {
    setAgentEmail(agent.email);
    setAgentPassword(`Lead${agent.name.replace(/\s+/g, '')}2026`);
    setErrorMessage(null);
  };

  // Submit Customer Login or Registration
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailNorm = clientEmail.trim().toLowerCase();
    const isAllowedDomain =
      emailNorm.endsWith('@client.com') ||
      WHITELISTED_DOMAINS.map((w) => w.toLowerCase()).includes(emailNorm);

    // If client attempts to register
    if (customerSubView === 'REGISTER') {
      if (!isAllowedDomain) {
        const errorReason = `Corporate email restriction violation. Allowed domains must end in '@client.com' or match explicit whitelist: ${WHITELISTED_DOMAINS.join(', ')}.`;
        setErrorMessage(errorReason);
        setCurrentValidation({
          status: 'REJECTED',
          reason: errorReason,
          role: 'UNAUTHORIZED',
          assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
        });
        setIsLoading(false);
        return;
      }

      const digits = clientPhone.replace(/\D/g, '');
      if (digits.length !== 10) {
        const errorReason = 'Contact verification failed: Exactly 10 numeric digits required for corporate clients.';
        setErrorMessage(errorReason);
        setCurrentValidation({
          status: 'REJECTED',
          reason: errorReason,
          role: 'UNAUTHORIZED',
          assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
        });
        setIsLoading(false);
        return;
      }

      if (clientPassword.length < 6) {
        const errorReason = 'Password policy violation: Password must be at least 6 characters.';
        setErrorMessage(errorReason);
        setCurrentValidation({
          status: 'REJECTED',
          reason: errorReason,
          role: 'UNAUTHORIZED',
          assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
        });
        setIsLoading(false);
        return;
      }

      try {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
            password: clientPassword,
            company: clientCompany,
            role: 'CLIENT',
          }),
        });
        const regData = await regRes.json();
        if (regRes.ok && regData.success) {
          setSuccessMessage('Registration approved! Logging into Customer Complaint Box...');
          setCurrentValidation({
            status: 'APPROVED',
            reason: 'Corporate Client registration verified and approved.',
            role: 'CORPORATE_CLIENT',
            assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
          });
          setTimeout(() => {
            onLoginSuccess(regData.user);
          }, 600);
        } else {
          setErrorMessage(regData.error || 'Registration failed');
          setCurrentValidation({
            status: 'REJECTED',
            reason: regData.error || 'Registration rejected',
            role: 'UNAUTHORIZED',
            assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
          });
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Network error during registration');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Customer Login
    if (!isAllowedDomain) {
      const errorReason = `Corporate email restriction violation. Allowed domains must end in '@client.com' or match explicit whitelist: ${WHITELISTED_DOMAINS.join(', ')}.`;
      setErrorMessage(errorReason);
      setCurrentValidation({
        status: 'REJECTED',
        reason: errorReason,
        role: 'UNAUTHORIZED',
        assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
      });
      setIsLoading(false);
      return;
    }

    if (clientPassword.length < 6) {
      const errorReason = 'Password policy violation: Minimum 6 characters required.';
      setErrorMessage(errorReason);
      setCurrentValidation({
        status: 'REJECTED',
        reason: errorReason,
        role: 'UNAUTHORIZED',
        assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          password: clientPassword,
          role: 'CLIENT',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Authentication Approved. Redirecting to Customer Complaint Box...');
        setCurrentValidation({
          status: 'APPROVED',
          reason: 'Corporate client authentication verified. Access granted to Client Resolution Portal.',
          role: 'CORPORATE_CLIENT',
          assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
        });
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      } else {
        setErrorMessage(data.error || 'Authentication rejected: Registration required before login.');
        setCurrentValidation({
          status: 'REJECTED',
          reason: data.error || 'Client account not found. Please register first.',
          role: 'UNAUTHORIZED',
          assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network failure during login');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Agent Login (PRE-PROVISIONED ONLY)
  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailNorm = agentEmail.trim().toLowerCase();
    const matchedAgent = PRE_PROVISIONED_AGENTS.find((a) => a.email.toLowerCase() === emailNorm);

    if (!matchedAgent) {
      const errorReason = 'Access Denied: Support Agents are strictly pre-provisioned. Unauthorized operator credentials.';
      setErrorMessage(errorReason);
      setCurrentValidation({
        status: 'REJECTED',
        reason: errorReason,
        role: 'UNAUTHORIZED',
        assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
      });
      setIsLoading(false);
      return;
    }

    if (agentPassword.length < 6) {
      const errorReason = 'Password security violation: Minimum 6 characters required.';
      setErrorMessage(errorReason);
      setCurrentValidation({
        status: 'REJECTED',
        reason: errorReason,
        role: 'UNAUTHORIZED',
        assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agentEmail,
          password: agentPassword,
          role: 'SUPPORT_AGENT',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Authenticated as ${matchedAgent.name} (${matchedAgent.department} · ${matchedAgent.agentId}). Unlocking Triage Inbox...`);
        setCurrentValidation({
          status: 'APPROVED',
          reason: `Support Agent authenticated for ${matchedAgent.department}. Operator: ${matchedAgent.name}`,
          role: 'SUPPORT_AGENT',
          assigned_desk: {
            desk_name: matchedAgent.department,
            desk_lead: matchedAgent.name as any,
            agent_id: matchedAgent.agentId,
          },
        });
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      } else {
        setErrorMessage(data.error || 'Authentication denied for agent console.');
        setCurrentValidation({
          status: 'REJECTED',
          reason: data.error || 'Agent authentication failed.',
          role: 'UNAUTHORIZED',
          assigned_desk: { desk_name: 'NONE', desk_lead: 'NONE', agent_id: 'NONE' },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during agent login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-4">
      {/* 3. Center Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        {/* Central shield icon badge 🛡 */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#112238] border border-[#1a3454] text-[#4fd1c5] shadow-[0_0_25px_rgba(79,209,197,0.2)] mb-5">
          <Shield className="w-8 h-8 fill-[#4fd1c5]/20 text-[#4fd1c5]" />
        </div>

        {/* Large hero title: "Intelligent Complaint Resolution" with Resolution in Vibrant Teal #4fd1c5 */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Intelligent Complaint{' '}
          <span className="text-[#4fd1c5] drop-shadow-[0_0_25px_rgba(79,209,197,0.4)]">
            Resolution
          </span>
        </h1>

        {/* Subtitle: "Secure multi-department customer and agent service portal" */}
        <p className="mt-3 text-sm sm:text-base text-[#94a3b8] font-medium max-w-xl mx-auto">
          Secure multi-department customer and agent service portal
        </p>

        {/* 4. Interactive Role Selector (Pill Switcher) */}
        <div className="mt-7 inline-flex p-1 rounded-full bg-[#112238] border border-[#1a3454] shadow-[0_0_20px_rgba(0,0,0,0.4)]">
          <button
            type="button"
            onClick={() => handleSelectTab('CUSTOMER')}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activeTab === 'CUSTOMER'
                ? 'bg-[#4fd1c5] text-[#091424] shadow-[0_0_15px_rgba(79,209,197,0.4)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#152a45]'
            }`}
          >
            <span>👤 Customer Portal</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('AGENT')}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activeTab === 'AGENT'
                ? 'bg-[#4fd1c5] text-[#091424] shadow-[0_0_15px_rgba(79,209,197,0.4)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#152a45]'
            }`}
          >
            <span>🏛 Support Agent</span>
          </button>
        </div>
      </div>

      {/* Main Authentication Card: Slate navy (#112238) with 1px border (#1a3454) and subtle glow */}
      <div className="w-full max-w-xl bg-[#112238] border border-[#1a3454] rounded-2xl p-6 sm:p-8 shadow-[0_0_35px_rgba(79,209,197,0.06)] relative backdrop-blur-sm">
        {/* Error and Success Notices */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Access / Security Violation</p>
              <p className="mt-0.5 text-rose-200/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[#4fd1c5]/10 border border-[#4fd1c5]/40 text-[#4fd1c5] text-xs sm:text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4fd1c5] shrink-0" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Persona A: Customer Portal */}
        {activeTab === 'CUSTOMER' && (
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a3454]">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-[#4fd1c5]" />
                  {customerSubView === 'LOGIN' ? 'Customer Sign In' : 'Register New Account'}
                </h2>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {customerSubView === 'LOGIN'
                    ? 'Verify corporate credentials to access the Customer Complaint Box'
                    : 'Create corporate client profile with whitelisted domain & 10-digit phone'}
                </p>
              </div>

              {/* Sub-toggle link */}
              <button
                type="button"
                onClick={() => {
                  setCustomerSubView(customerSubView === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-[#4fd1c5] hover:text-[#38b2ac] hover:underline cursor-pointer"
              >
                {customerSubView === 'LOGIN' ? 'Register New Account' : 'Sign In as Customer'}
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              {customerSubView === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. David King"
                      required
                      className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                      Organization / Company
                    </label>
                    <input
                      type="text"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      required
                      className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                  <span>Corporate Email Address</span>
                  <span className="text-[10px] text-[#4fd1c5] lowercase font-mono">
                    @client.com or whitelisted
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="user@client.com"
                    required
                    className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition-colors"
                  />
                </div>
              </div>

              {customerSubView === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                    <span>Contact Phone</span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">Exact 10 digits</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                      className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition-colors font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-[#94a3b8] font-mono">Min 6 characters</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#4fd1c5] hover:bg-[#38b2ac] text-[#091424] font-bold py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,209,197,0.3)] disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {customerSubView === 'LOGIN' ? 'Sign In as Customer →' : 'Register & Access Portal →'}
                </span>
              </button>

              {customerSubView === 'LOGIN' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCustomerSubView('REGISTER')}
                    className="text-xs text-[#94a3b8] hover:text-[#4fd1c5] transition-colors cursor-pointer"
                  >
                    Don't have an account?{' '}
                    <span className="text-[#4fd1c5] font-semibold underline underline-offset-2">
                      Register New Account
                    </span>
                  </button>
                </div>
              )}
            </form>

            {/* Whitelist Domain Guide */}
            <div className="mt-6 pt-5 border-t border-[#1a3454]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Verified Corporate Email Policy
                </span>
                <span className="text-[10px] text-[#4fd1c5] font-mono">Domain Enforced</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {WHITELISTED_DOMAINS.map((domain, i) => (
                  <span
                    key={i}
                    onClick={() => {
                      if (!domain.includes('domain')) {
                        setClientEmail(domain);
                      }
                    }}
                    className="text-[10px] font-mono bg-[#091424] text-teal-300/80 px-2 py-0.5 rounded border border-[#1a3454] cursor-pointer hover:border-[#4fd1c5]/40 hover:text-[#4fd1c5] transition-colors"
                    title="Click to fill email"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Persona B: Support Agent Console */}
        {activeTab === 'AGENT' && (
          <div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1a3454]">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#4fd1c5]" />
                  Support Agent Console
                </h2>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Pre-provisioned triage operators only. Self-registration is strictly prohibited.
                </p>
              </div>
              <span className="text-[10px] font-bold font-mono text-[#4fd1c5] bg-[#4fd1c5]/10 px-2.5 py-1 rounded-full border border-[#4fd1c5]/30">
                PRE-PROVISIONED
              </span>
            </div>

            {/* Agent Registration Prohibition Alert */}
            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Directory Sync:</strong> Support Agents cannot register accounts. Select your desk lead below to authenticate.
              </span>
            </div>

            <form onSubmit={handleAgentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                  Agent Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={agentEmail}
                    onChange={(e) => setAgentEmail(e.target.value)}
                    placeholder="operator@agent.company.com"
                    required
                    className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                  <span>Console Password</span>
                  <span className="text-[10px] text-[#94a3b8] font-mono">Min 6 characters</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={agentPassword}
                    onChange={(e) => setAgentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#4fd1c5] hover:bg-[#38b2ac] text-[#091424] font-bold py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,209,197,0.3)] disabled:opacity-50 cursor-pointer"
              >
                <span>Authenticate Agent Console →</span>
              </button>
            </form>

            {/* Pre-provisioned Agent Desks Switcher */}
            <div className="mt-6 pt-5 border-t border-[#1a3454]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Select Pre-Provisioned Desk Lead
                </span>
                <span className="text-[10px] text-[#4fd1c5] font-mono">4 Active Desks</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRE_PROVISIONED_AGENTS.map((agent) => (
                  <button
                    key={agent.agentId}
                    type="button"
                    onClick={() => handleSelectAgent(agent)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      agentEmail === agent.email
                        ? 'bg-[#152a45] border-[#4fd1c5] shadow-[0_0_12px_rgba(79,209,197,0.2)]'
                        : 'bg-[#091424] border-[#1a3454] hover:border-[#4fd1c5]/40 hover:bg-[#0e1d32]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{agent.name}</span>
                      <span className="text-[10px] font-mono text-[#4fd1c5]">{agent.agentId}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-teal-300 mt-0.5">
                      {agent.department}
                    </div>
                    <div className="text-[10px] text-[#94a3b8] font-mono truncate mt-0.5">
                      {agent.email}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time State Schema Inspector Toggle */}
      <div className="w-full max-w-xl mt-6">
        <button
          type="button"
          onClick={() => setShowJsonInspector(!showJsonInspector)}
          className="w-full py-2.5 px-4 rounded-xl bg-[#112238] border border-[#1a3454] hover:border-[#4fd1c5]/40 text-[#94a3b8] hover:text-[#4fd1c5] text-xs font-mono font-medium flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Code className="w-4 h-4 text-[#4fd1c5]" />
            CompanyCMS Real-Time State Controller & Schema Inspector
          </span>
          <span className="text-[11px] text-[#4fd1c5]">
            {showJsonInspector ? '▲ Collapse Schema' : '▼ Expand Schema'}
          </span>
        </button>

        {showJsonInspector && (
          <div className="mt-3 p-4 rounded-xl bg-[#091424] border border-[#1a3454] shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#4fd1c5] font-mono">
                REQUIRED OUTPUT SCHEMA (LIVE JSON):
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
            <pre className="text-[11px] font-mono text-teal-300/90 overflow-x-auto p-3 bg-[#060e1a] rounded-lg border border-[#1a3454] leading-relaxed">
              {JSON.stringify(getCurrentStateJson(), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
