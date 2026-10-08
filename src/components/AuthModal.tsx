import React, { useState } from 'react';
import { AppUser, AuthValidationResult, UserRole } from '../types/icrs';
import {
  Shield,
  User,
  KeyRound,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Code2,
  Lock,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  initialMode?: 'CLIENT_LOGIN' | 'CLIENT_REGISTER' | 'AGENT_LOGIN';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'CLIENT_LOGIN',
}) => {
  const [mode, setMode] = useState<'CLIENT_LOGIN' | 'CLIENT_REGISTER' | 'AGENT_LOGIN'>(initialMode);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');

  // Validation & Server feedback
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<AuthValidationResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showJsonView, setShowJsonView] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setErrorText(null);
    setValidationResult(null);
    setShowJsonView(false);
  };

  const handleQuickFill = (preset: {
    email: string;
    role: UserRole;
    phone?: string;
    company?: string;
    name?: string;
  }) => {
    setEmail(preset.email);
    setPassword('password123');
    setConfirmPassword('password123');
    if (preset.phone) setPhone(preset.phone);
    if (preset.company) setCompany(preset.company);
    if (preset.name) setName(preset.name);
    if (preset.role === 'SUPPORT_AGENT') {
      setMode('AGENT_LOGIN');
    } else {
      setMode('CLIENT_LOGIN');
    }
    resetState();
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorText(null);
    setValidationResult(null);

    const isRegistration = mode === 'CLIENT_REGISTER';
    const endpoint = isRegistration ? '/api/auth/register' : '/api/auth/login';
    const role: UserRole = mode === 'AGENT_LOGIN' ? 'SUPPORT_AGENT' : 'CLIENT';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || (role === 'CLIENT' ? 'Corporate Client' : 'Internal Agent'),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirmPassword: isRegistration ? confirmPassword : undefined,
          company: company || (role === 'CLIENT' ? 'Client Corp' : 'ICRS Support'),
          role,
        }),
      });

      const resData = await response.json();
      if (resData.validation) {
        setValidationResult(resData.validation);
      }

      if (response.ok && resData.success && resData.user) {
        onLoginSuccess(resData.user);
        onClose();
      } else {
        setErrorText(resData.error || resData.validation?.reason || 'Authentication failed.');
      }
    } catch (err: any) {
      setErrorText(err.message || 'Network error communicating with authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Enterprise Authentication
              </h2>
              <p className="text-xs text-slate-500">
                ICRS Access Control & Role Enforcement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-100/80 gap-1 text-xs font-medium border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('CLIENT_LOGIN');
              resetState();
            }}
            className={`py-2 px-2 rounded-lg transition-colors ${
              mode === 'CLIENT_LOGIN'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Client Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('CLIENT_REGISTER');
              resetState();
            }}
            className={`py-2 px-2 rounded-lg transition-colors ${
              mode === 'CLIENT_REGISTER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Client Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('AGENT_LOGIN');
              resetState();
            }}
            className={`py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'AGENT_LOGIN'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            Support Agent
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Support Agent Policy Banner */}
          {mode === 'AGENT_LOGIN' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <Lock className="w-3.5 h-3.5" />
                Internal Access Only: Support Agents
              </div>
              <p className="text-[11px] leading-relaxed">
                Support Agents are pre-provisioned internally by administrators; <strong>NO public registration permitted</strong>. Direct login access only.
              </p>
            </div>
          )}

          {/* Corporate Client Policy Banner */}
          {mode === 'CLIENT_REGISTER' && (
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Corporate Email & Phone Requirements
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Allowed domains must end in <code className="bg-white/80 px-1 py-0.5 rounded text-blue-950">@client.com</code> or match explicit whitelist (e.g. <code className="bg-white/80 px-1 py-0.5 rounded text-blue-950">anmol.client@gmail.com</code>). 10-digit numeric phone mandatory.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'CLIENT_REGISTER' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Company Name</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="FinGlobal Technologies"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-slate-600 font-medium flex items-center justify-between">
                <span>Corporate Email</span>
                {mode === 'CLIENT_REGISTER' && (
                  <span className="text-[10px] text-slate-400">@client.com or Whitelist</span>
                )}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    mode === 'AGENT_LOGIN'
                      ? 'agent@icrs-support.com'
                      : 'customer@client.com'
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>

            {/* Phone (Only for Client Registration) */}
            {mode === 'CLIENT_REGISTER' && (
              <div className="space-y-1">
                <label className="text-slate-600 font-medium flex items-center justify-between">
                  <span>Mandatory Phone Number</span>
                  <span className="text-[10px] text-slate-400">Exact 10 digits</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={14}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <label className="text-slate-600 font-medium flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-slate-400">Minimum 6 characters</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>

            {/* Confirm Password (Registration) */}
            {mode === 'CLIENT_REGISTER' && (
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorText && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium">{errorText}</div>
                  {validationResult && (
                    <button
                      type="button"
                      onClick={() => setShowJsonView(!showJsonView)}
                      className="text-[11px] underline text-rose-800 font-mono"
                    >
                      {showJsonView ? 'Hide Task A Schema Output' : 'Inspect Task A Schema Output'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Task A Pure JSON Output Inspector */}
            {validationResult && showJsonView && (
              <div className="p-3 bg-slate-900 rounded-xl text-slate-100 font-mono text-[11px] space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Task A Output Schema (AUTH_VALIDATION)
                </div>
                <pre className="overflow-x-auto">{JSON.stringify(validationResult, null, 2)}</pre>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-all shadow-xs flex items-center justify-center gap-2 ${
                mode === 'AGENT_LOGIN'
                  ? 'bg-slate-900 hover:bg-slate-800'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'CLIENT_REGISTER'
                    ? 'Complete Corporate Client Registration'
                    : mode === 'AGENT_LOGIN'
                    ? 'Authenticate Internal Support Agent'
                    : 'Log In to Client Portal'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Presets for Seamless Testing */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              1-Click Internal Support Agent Roster (Direct Login)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  handleQuickFill({
                    email: 'finance@agent.company.com',
                    role: 'SUPPORT_AGENT',
                    name: 'Elena Vance',
                    company: 'Finance & Payroll (#AGT-FIN-01)',
                  })
                }
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <div className="font-semibold text-slate-900">Finance & Payroll Lead</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">finance@agent.company.com</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickFill({
                    email: 'tech@agent.company.com',
                    role: 'SUPPORT_AGENT',
                    name: 'Alex Rivera',
                    company: 'Technical Support (#AGT-TECH-01)',
                  })
                }
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <div className="font-semibold text-slate-900">Tech Support Lead</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">tech@agent.company.com</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickFill({
                    email: 'care@agent.company.com',
                    role: 'SUPPORT_AGENT',
                    name: 'Sarah Jenkins',
                    company: 'Customer Care (#AGT-CARE-01)',
                  })
                }
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <div className="font-semibold text-slate-900">Customer Care Lead</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">care@agent.company.com</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickFill({
                    email: 'logistics@agent.company.com',
                    role: 'SUPPORT_AGENT',
                    name: 'Marcus Vance',
                    company: 'Logistics Desk (#AGT-LOG-01)',
                  })
                }
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <div className="font-semibold text-slate-900">Logistics Desk Lead</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">logistics@agent.company.com</div>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span>Corporate Client:</span>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill({
                    email: 'customer@client.com',
                    role: 'CLIENT',
                    name: 'Marcus Vance',
                    company: 'FinGlobal Technologies',
                  })
                }
                className="underline hover:text-slate-800"
              >
                customer@client.com
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill({
                    email: 'anmol.client@gmail.com',
                    role: 'CLIENT',
                    name: 'Anmol Shinde',
                    company: 'Client Partner Group',
                  })
                }
                className="underline hover:text-slate-800"
              >
                anmol.client@gmail.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
