import React, { useState } from 'react';
import { AppUser, CompanyCMSAuditSchema } from '../types/icrs';
import {
  Shield,
  User,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  KeyRound,
  Code,
  Copy,
  Check,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface CompanyCMSFrontPageProps {
  onLoginSuccess: (user: AppUser) => void;
  onAuditChange?: (audit: CompanyCMSAuditSchema) => void;
}

// 1. STRICT DATABASE WHITELIST (EXACT 6 CUSTOMER ACCOUNTS)
export const STRICT_AUTHORIZED_CUSTOMERS = [
  { name: 'Anmol', email: 'anmol.client@gmail.com', phone: '1234567891' },
  { name: 'Acme', email: 'client.acme@gmail.com', phone: '1234567891' },
  { name: 'BMC', email: 'client.bmc@gmail.com', phone: '1234567891' },
  { name: 'Sam', email: 'client@acmecorp.com', phone: '1234567891' },
  { name: 'Standard Customer', email: 'customer@client.com', phone: '9876543210' },
  { name: 'Enterprise Client', email: 'client@client.com', phone: '9876543211' },
];

// 2. PRE-PROVISIONED SUPPORT AGENT DESKS (NO REGISTRATION)
export const PRE_PROVISIONED_AGENTS = [
  {
    email: 'finance@agent.company.com',
    name: 'Elena Vance',
    department: 'Finance & Payroll' as const,
    agentId: '#AGT-FIN-01' as const,
  },
  {
    email: 'tech@agent.company.com',
    name: 'Alex Rivera',
    department: 'Technical Support' as const,
    agentId: '#AGT-TECH-01' as const,
  },
  {
    email: 'care@agent.company.com',
    name: 'Sarah Jenkins',
    department: 'Customer Care' as const,
    agentId: '#AGT-CARE-01' as const,
  },
  {
    email: 'logistics@agent.company.com',
    name: 'Marcus Vance',
    department: 'Logistics Desk' as const,
    agentId: '#AGT-LOG-01' as const,
  },
];

export const CompanyCMSFrontPage: React.FC<CompanyCMSFrontPageProps> = ({
  onLoginSuccess,
  onAuditChange,
}) => {
  // Pill switcher: [👤 Customer Portal] and [🏛 Support Agent]
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'AGENT'>('CUSTOMER');
  const [customerSubView, setCustomerSubView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Customer Form State — STRICT ZERO-AUTOFILL (All text fields initialize strictly empty "")
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientName, setClientName] = useState('');

  // Agent Form State — STRICT ZERO-AUTOFILL (All text fields initialize strictly empty "")
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPassword, setAgentPassword] = useState('');

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 4. JSON AUDIT & TRIAGE OUTPUT SCHEMA (Exact required schema)
  const [auditSchema, setAuditSchema] = useState<CompanyCMSAuditSchema>({
    auth_audit: {
      status: 'APPROVED',
      authenticated_user: 'NONE',
      user_role: 'UNAUTHORIZED',
      rejection_reason: 'NONE',
    },
    view_access: {
      rendered_screen: 'AUTH_PORTAL',
      assigned_desk: 'NONE',
    },
  });

  const updateAudit = (newAudit: CompanyCMSAuditSchema) => {
    setAuditSchema(newAudit);
    if (onAuditChange) {
      onAuditChange(newAudit);
    }
  };

  const handleSelectTab = (tab: 'CUSTOMER' | 'AGENT') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Customer Login / Registration validation & submission
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailNorm = clientEmail.trim().toLowerCase();

    // REGISTRATION FLOW
    if (customerSubView === 'REGISTER') {
      // 1. Support Agent Registration Ban
      if (
        emailNorm.includes('agent.company.com') ||
        PRE_PROVISIONED_AGENTS.some((a) => a.email.toLowerCase() === emailNorm)
      ) {
        const errorReason = 'Registration prohibited for Support Agent credentials.';
        setErrorMessage(errorReason);
        updateAudit({
          auth_audit: {
            status: 'REJECTED',
            authenticated_user: 'NONE',
            user_role: 'UNAUTHORIZED',
            rejection_reason: errorReason,
          },
          view_access: {
            rendered_screen: 'AUTH_PORTAL',
            assigned_desk: 'NONE',
          },
        });
        setIsLoading(false);
        return;
      }

      // 2. Compulsory Fields & Format Check (Full Name, Corporate Email, 10-Digit Phone, Password >= 6)
      const digits = clientPhone.replace(/\D/g, '');
      if (
        !clientName.trim() ||
        !clientEmail.trim() ||
        !clientPhone.trim() ||
        !clientPassword.trim() ||
        digits.length !== 10 ||
        clientPassword.length < 6
      ) {
        const errorReason =
          'Security Violation: All fields are compulsory. Phone must be 10 digits and password >= 6 characters.';
        setErrorMessage(errorReason);
        updateAudit({
          auth_audit: {
            status: 'REJECTED',
            authenticated_user: 'NONE',
            user_role: 'UNAUTHORIZED',
            rejection_reason: errorReason,
          },
          view_access: {
            rendered_screen: 'AUTH_PORTAL',
            assigned_desk: 'NONE',
          },
        });
        setIsLoading(false);
        return;
      }

      // 3. Strict Database Whitelist Enforcement (EXACT 6 CUSTOMER ACCOUNTS ONLY - No wildcards)
      const isWhitelisted = STRICT_AUTHORIZED_CUSTOMERS.some(
        (c) => c.email.toLowerCase() === emailNorm
      );
      if (!isWhitelisted) {
        const errorReason = 'ACCESS_DENIED: User not on the corporate authorized roster.';
        setErrorMessage(errorReason);
        updateAudit({
          auth_audit: {
            status: 'REJECTED',
            authenticated_user: 'NONE',
            user_role: 'UNAUTHORIZED',
            rejection_reason: errorReason,
          },
          view_access: {
            rendered_screen: 'AUTH_PORTAL',
            assigned_desk: 'NONE',
          },
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
            company: 'Corporate Client',
            role: 'CLIENT',
          }),
        });
        const regData = await regRes.json();
        if (regRes.ok && regData.success) {
          setSuccessMessage('Registration approved! Unlocking Customer Complaint Submission Box...');
          updateAudit({
            auth_audit: {
              status: 'APPROVED',
              authenticated_user: emailNorm,
              user_role: 'CUSTOMER',
              rejection_reason: 'NONE',
            },
            view_access: {
              rendered_screen: 'CLIENT_COMPLAINT_BOX',
              assigned_desk: 'NONE',
            },
          });
          setTimeout(() => {
            onLoginSuccess(regData.user);
          }, 500);
        } else {
          const failReason = regData.error || 'ACCESS_DENIED: User not on the corporate authorized roster.';
          setErrorMessage(failReason);
          updateAudit({
            auth_audit: {
              status: 'REJECTED',
              authenticated_user: 'NONE',
              user_role: 'UNAUTHORIZED',
              rejection_reason: failReason,
            },
            view_access: {
              rendered_screen: 'AUTH_PORTAL',
              assigned_desk: 'NONE',
            },
          });
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Network error during registration');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // CUSTOMER LOGIN FLOW
    // 1. Strict Database Whitelist Check
    const isWhitelisted = STRICT_AUTHORIZED_CUSTOMERS.some(
      (c) => c.email.toLowerCase() === emailNorm
    );
    if (!isWhitelisted) {
      const errorReason = 'ACCESS_DENIED: User not on the corporate authorized roster.';
      setErrorMessage(errorReason);
      updateAudit({
        auth_audit: {
          status: 'REJECTED',
          authenticated_user: 'NONE',
          user_role: 'UNAUTHORIZED',
          rejection_reason: errorReason,
        },
        view_access: {
          rendered_screen: 'AUTH_PORTAL',
          assigned_desk: 'NONE',
        },
      });
      setIsLoading(false);
      return;
    }

    // 2. Password minimum 6 characters
    if (clientPassword.length < 6) {
      const errorReason = 'Validation Error: Password must be at least 6 characters long.';
      setErrorMessage(errorReason);
      updateAudit({
        auth_audit: {
          status: 'REJECTED',
          authenticated_user: 'NONE',
          user_role: 'UNAUTHORIZED',
          rejection_reason: errorReason,
        },
        view_access: {
          rendered_screen: 'AUTH_PORTAL',
          assigned_desk: 'NONE',
        },
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
        setSuccessMessage('Authentication Approved. Unlocking Customer Complaint Submission Box...');
        updateAudit({
          auth_audit: {
            status: 'APPROVED',
            authenticated_user: emailNorm,
            user_role: 'CUSTOMER',
            rejection_reason: 'NONE',
          },
          view_access: {
            rendered_screen: 'CLIENT_COMPLAINT_BOX',
            assigned_desk: 'NONE',
          },
        });
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      } else {
        const failReason = data.error || 'ACCESS_DENIED: User not on the corporate authorized roster.';
        setErrorMessage(failReason);
        updateAudit({
          auth_audit: {
            status: 'REJECTED',
            authenticated_user: 'NONE',
            user_role: 'UNAUTHORIZED',
            rejection_reason: failReason,
          },
          view_access: {
            rendered_screen: 'AUTH_PORTAL',
            assigned_desk: 'NONE',
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network failure during login');
    } finally {
      setIsLoading(false);
    }
  };

  // Support Agent Login (PRE-PROVISIONED ONLY)
  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailNorm = agentEmail.trim().toLowerCase();
    const matchedAgent = PRE_PROVISIONED_AGENTS.find((a) => a.email.toLowerCase() === emailNorm);

    if (!matchedAgent) {
      const errorReason =
        'ACCESS_DENIED: Unrecognized support agent credentials. Only pre-provisioned desk leads may log in.';
      setErrorMessage(errorReason);
      updateAudit({
        auth_audit: {
          status: 'REJECTED',
          authenticated_user: 'NONE',
          user_role: 'UNAUTHORIZED',
          rejection_reason: errorReason,
        },
        view_access: {
          rendered_screen: 'AUTH_PORTAL',
          assigned_desk: 'NONE',
        },
      });
      setIsLoading(false);
      return;
    }

    if (agentPassword.length < 6) {
      const errorReason = 'Validation Error: Password must be at least 6 characters long.';
      setErrorMessage(errorReason);
      updateAudit({
        auth_audit: {
          status: 'REJECTED',
          authenticated_user: 'NONE',
          user_role: 'UNAUTHORIZED',
          rejection_reason: errorReason,
        },
        view_access: {
          rendered_screen: 'AUTH_PORTAL',
          assigned_desk: 'NONE',
        },
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
        setSuccessMessage(
          `Authenticated as ${matchedAgent.name} (${matchedAgent.department} · ${matchedAgent.agentId}). Unlocking Support Agent Triage Inbox...`
        );
        updateAudit({
          auth_audit: {
            status: 'APPROVED',
            authenticated_user: emailNorm,
            user_role: 'SUPPORT_AGENT',
            rejection_reason: 'NONE',
          },
          view_access: {
            rendered_screen: 'AGENT_TRIAGE_INBOX',
            assigned_desk: matchedAgent.department,
          },
        });
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      } else {
        const failReason = data.error || 'ACCESS_DENIED: Agent authentication failed.';
        setErrorMessage(failReason);
        updateAudit({
          auth_audit: {
            status: 'REJECTED',
            authenticated_user: 'NONE',
            user_role: 'UNAUTHORIZED',
            rejection_reason: failReason,
          },
          view_access: {
            rendered_screen: 'AUTH_PORTAL',
            assigned_desk: 'NONE',
          },
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
      {/* Center Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#112238] border border-[#1a3454] text-[#4fd1c5] shadow-[0_0_25px_rgba(79,209,197,0.2)] mb-5">
          <Shield className="w-8 h-8 fill-[#4fd1c5]/20 text-[#4fd1c5]" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Intelligent Complaint{' '}
          <span className="text-[#4fd1c5] drop-shadow-[0_0_25px_rgba(79,209,197,0.4)]">
            Resolution
          </span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-[#94a3b8] font-medium max-w-xl mx-auto">
          Zero-Trust Identity, Authentication, and ITIL Gatekeeper for CompanyCMS
        </p>

        {/* Interactive Role Selector (Pill Switcher) */}
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

      {/* Main Authentication Card */}
      <div className="w-full max-w-xl bg-[#112238] border border-[#1a3454] rounded-2xl p-6 sm:p-8 shadow-[0_0_35px_rgba(79,209,197,0.06)] relative backdrop-blur-sm">
        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Authentication / Security Violation</p>
              <p className="mt-0.5 text-rose-200/90 leading-relaxed font-mono text-xs">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Notice */}
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
                  {customerSubView === 'LOGIN' ? 'Customer Sign In' : 'Register Customer Account'}
                </h2>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {customerSubView === 'LOGIN'
                    ? 'Authenticate against the authorized 6-profile corporate database roster'
                    : 'All registration fields are strictly compulsory.'}
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
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-[10px] text-amber-400 font-mono">*Compulsory</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    required
                    className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                  <span>Corporate Email Address</span>
                  {customerSubView === 'REGISTER' && (
                    <span className="text-[10px] text-amber-400 font-mono">*Compulsory</span>
                  )}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    required
                    className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition-colors font-mono"
                  />
                </div>
              </div>

              {customerSubView === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                    <span>10-Digit Contact Phone</span>
                    <span className="text-[10px] text-amber-400 font-mono">*Compulsory (10 digits)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      required
                      className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-white pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition-colors font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-[#94a3b8] font-mono">
                    {customerSubView === 'REGISTER' ? '*Compulsory (Min 6 chars)' : 'Min 6 characters'}
                  </span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
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
                  {customerSubView === 'LOGIN'
                    ? 'Verify & Enter Customer Complaint Box →'
                    : 'Register & Access Customer Complaint Box →'}
                </span>
              </button>

              {customerSubView === 'LOGIN' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCustomerSubView('REGISTER')}
                    className="text-xs text-[#94a3b8] hover:text-[#4fd1c5] transition-colors cursor-pointer"
                  >
                    Need to complete registration?{' '}
                    <span className="text-[#4fd1c5] font-semibold underline underline-offset-2">
                      Register Account
                    </span>
                  </button>
                </div>
              )}
            </form>

            {/* Strict Whitelist Roster Information */}
            <div className="mt-6 pt-5 border-t border-[#1a3454]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Authorized Customer Roster
                </span>
                <span className="text-[10px] text-[#4fd1c5] font-mono">6 Verified Accounts</span>
              </div>
              <div className="p-3 rounded-lg bg-[#091424] border border-[#1a3454] text-xs text-[#94a3b8] space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#4fd1c5]" />
                  Zero-Trust Domain & Profile Enforcement:
                </p>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  Registration and login are strictly restricted to the 6 authorized corporate partner accounts (Anmol, Acme, BMC, Sam, Standard Customer, Enterprise Client). Manual entry required.
                </p>
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
                  Pre-provisioned desk leads only. Public self-registration is strictly prohibited.
                </p>
              </div>
              <span className="text-[10px] font-bold font-mono text-[#4fd1c5] bg-[#4fd1c5]/10 px-2.5 py-1 rounded-full border border-[#4fd1c5]/30">
                PRE-PROVISIONED
              </span>
            </div>

            {/* Prohibition Alert */}
            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Registration Prohibited:</strong> Support Agents are pre-provisioned. Registration attempts under an agent email will be rejected.
              </span>
            </div>

            <form onSubmit={handleAgentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                  Support Agent Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={agentEmail}
                    onChange={(e) => setAgentEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
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
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
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
                <span>Authenticate & Enter Support Agent Triage Inbox →</span>
              </button>
            </form>

            {/* Pre-provisioned Agent Desks Information */}
            <div className="mt-6 pt-5 border-t border-[#1a3454]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Operational Support Desks
                </span>
                <span className="text-[10px] text-[#4fd1c5] font-mono">4 Desks Active</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { department: 'Finance & Payroll', code: '#AGT-FIN-01', scope: 'Billing, Invoices & ERP Reconciliation' },
                  { department: 'Technical Support', code: '#AGT-TECH-01', scope: 'Cloud Infra, Gateway & API Services' },
                  { department: 'Customer Care', code: '#AGT-CARE-01', scope: 'User SLA, DWP Accounts & Portal Access' },
                  { department: 'Logistics Desk', code: '#AGT-LOG-01', scope: 'Hardware, Asset Dispatch & Fulfillment' },
                ].map((desk) => (
                  <div
                    key={desk.code}
                    className="p-2.5 rounded-lg bg-[#091424] border border-[#1a3454] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px]">{desk.department}</span>
                      <span className="font-mono text-[10px] text-[#4fd1c5]">{desk.code}</span>
                    </div>
                    <div className="text-[10px] text-[#94a3b8] mt-1">
                      {desk.scope}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
