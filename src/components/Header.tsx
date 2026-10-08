import React from 'react';
import { AppUser } from '../types/icrs';
import {
  Shield,
  User,
  Lock,
  LogOut,
  Sparkles,
  Code,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  currentUser: AppUser | null;
  onSignOut: () => void;
  onOpenSignInModal?: () => void;
  onToggleStateInspector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSignOut,
  onOpenSignInModal,
  onToggleStateInspector,
}) => {
  return (
    <header className="border-b border-[#1a3454] bg-[#091424]/95 backdrop-blur-md sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Shield icon badge 🛡, "CompanyCMS" title with "AI POWERED" pill, and subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#112238] border border-[#1a3454] flex items-center justify-center text-[#4fd1c5] shadow-[0_0_15px_rgba(79,209,197,0.15)]">
              <Shield className="w-5 h-5 fill-[#4fd1c5]/20 text-[#4fd1c5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  CompanyCMS
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-[#4fd1c5] bg-[#4fd1c5]/10 border border-[#4fd1c5]/30 px-2 py-0.5 rounded-full uppercase">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI POWERED
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] font-medium leading-none mt-0.5 hidden sm:block">
                Intelligent Complaint Resolution System
              </p>
            </div>
          </div>

          {/* Right: Quick-access action button "👤 Sign In / Register" or Active User session */}
          <div className="flex items-center gap-3">
            {onToggleStateInspector && (
              <button
                type="button"
                onClick={onToggleStateInspector}
                className="px-2.5 py-1.5 text-xs font-mono font-medium text-[#94a3b8] hover:text-[#4fd1c5] bg-[#112238] hover:bg-[#152a45] border border-[#1a3454] hover:border-[#4fd1c5]/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="View CompanyCMS JSON State Controller"
              >
                <Code className="w-3.5 h-3.5 text-[#4fd1c5]" />
                <span className="hidden md:inline">State JSON</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                    {currentUser.role === 'SUPPORT_AGENT' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4fd1c5] bg-[#4fd1c5]/10 px-2 py-0.5 rounded-full border border-[#4fd1c5]/30">
                        <Lock className="w-3 h-3" />
                        {currentUser.agentId || '#AGT-TECH-01'} · Support Agent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/30">
                        <User className="w-3 h-3" />
                        Corporate Client
                      </span>
                    )}
                    <span>{currentUser.name}</span>
                  </div>
                  <div className="text-[10px] text-[#94a3b8] font-mono flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="truncate max-w-[150px]">{currentUser.email}</span>
                    <span>·</span>
                    <span className="truncate max-w-[130px] text-teal-200">
                      {currentUser.department || currentUser.company || 'Enterprise'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign out of current session"
                  className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 hover:border-rose-400 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenSignInModal}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#091424] bg-[#4fd1c5] hover:bg-[#38b2ac] shadow-[0_0_15px_rgba(79,209,197,0.3)] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <User className="w-3.5 h-3.5" />
                <span>👤 Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
