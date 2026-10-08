import React, { useState } from 'react';
import { Header } from './components/Header';
import { CompanyCMSFrontPage } from './components/CompanyCMSFrontPage';
import { AgentCommandCenter } from './components/AgentCommandCenter';
import { CustomerComplaintPortal } from './components/CustomerComplaintPortal';
import { INITIAL_TICKETS } from './data/sampleComplaints';
import { IncidentTicket, TicketStatus, AppUser, CompanyCMSAuditSchema } from './types/icrs';

export default function App() {
  const [tickets, setTickets] = useState<IncidentTicket[]>(INITIAL_TICKETS);

  // STRICT VIEW-ISOLATION & PERMISSION GATEWAY:
  // Initial Landing Page State:
  // Render ONLY the CompanyCMS Front Page with the dual-role pill switchers.
  // The Customer Complaint Submission Box and the Agent Triage Console MUST REMAIN COMPLETELY HIDDEN until successful login.
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [latestAudit, setLatestAudit] = useState<CompanyCMSAuditSchema | null>(null);

  const handleSignOut = () => {
    // LOGOUT ENFORCEMENT:
    // Session termination immediately purges active auth tokens, closes all active queue views,
    // and resets the interface back to the initial CompanyCMS Front Page.
    setCurrentUser(null);
    setLatestAudit({
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
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
  };

  const handleTicketCreated = (newTicket: IncidentTicket) => {
    setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
  };

  const handleUpdateTicket = (updatedTicket: IncidentTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  };

  return (
    <div className="min-h-screen bg-[#091424] text-[#94a3b8] flex flex-col font-sans antialiased selection:bg-[#4fd1c5] selection:text-[#091424]">
      {/* 
        Render exclusively ONE view at a time based solely on the authenticated user role:
        1. When Unauthenticated: Top Header + Front Page Landing Portal
        2. When Customer: Dedicated Customer Complaint Portal
        3. When Support Agent: Dedicated Agent Command Center
      */}

      {currentUser === null && (
        <>
          <Header
            currentUser={currentUser}
            onSignOut={handleSignOut}
            onOpenSignInModal={() => {
              // Reset/scroll to card if needed
            }}
          />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
            <CompanyCMSFrontPage
              onLoginSuccess={handleLoginSuccess}
              onAuditChange={setLatestAudit}
            />
          </main>
        </>
      )}

      {currentUser !== null && currentUser.role === 'CLIENT' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          <CustomerComplaintPortal
            currentUser={currentUser}
            onSignOut={handleSignOut}
            tickets={tickets}
            onTicketCreated={handleTicketCreated}
          />
        </main>
      )}

      {currentUser !== null && currentUser.role === 'SUPPORT_AGENT' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          <AgentCommandCenter
            currentUser={currentUser}
            onSignOut={handleSignOut}
            tickets={tickets}
            onUpdateTicket={handleUpdateTicket}
            onDeleteTicket={handleDeleteTicket}
          />
        </main>
      )}

      {/* Enterprise Platform Footer */}
      <footer className="border-t border-[#1a3454] bg-[#07101d] py-5 mt-auto text-xs text-[#94a3b8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">CompanyCMS</span>
            <span>·</span>
            <span>Intelligent Complaint Resolution System (ICRS)</span>
            <span>·</span>
            <span className="text-[#4fd1c5] font-mono">ITIL v4 Zero-Click NLP Routing</span>
          </div>
          <div className="text-[#94a3b8] font-mono text-[11px]">
            Target Repositories: anmolS-1104/enterprise-complaint-management-system
          </div>
        </div>
      </footer>
    </div>
  );
}
