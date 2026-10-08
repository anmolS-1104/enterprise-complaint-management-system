import React, { useState, useMemo } from 'react';
import {
  AppUser,
  IncidentTicket,
  TicketStatus,
  TicketAuditEntry,
} from '../types/icrs';
import {
  Shield,
  Search,
  Filter,
  RotateCcw,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Save,
  Sparkles,
  ArrowDownUp,
  User,
  FileText,
  LogOut,
  Building,
  Check,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  History,
} from 'lucide-react';

interface AgentCommandCenterProps {
  currentUser: AppUser;
  onSignOut: () => void;
  tickets: IncidentTicket[];
  onUpdateTicket: (updatedTicket: IncidentTicket) => void;
  onDeleteTicket: (ticketId: string) => void;
}

export const AgentCommandCenter: React.FC<AgentCommandCenterProps> = ({
  currentUser,
  onSignOut,
  tickets,
  onUpdateTicket,
  onDeleteTicket,
}) => {
  // Normalize assigned desk for current agent
  const assignedDesk =
    currentUser.department?.includes('Finance')
      ? 'Finance & Payroll'
      : currentUser.department?.includes('Tech') || currentUser.department?.includes('Cloud')
      ? 'Technical Support'
      : currentUser.department?.includes('Care')
      ? 'Customer Care'
      : currentUser.department?.includes('Logistics') || currentUser.department?.includes('Hardware')
      ? 'Logistics Desk'
      : (currentUser.department as string) || 'Technical Support';

  const agentName =
    currentUser.name ||
    (assignedDesk === 'Finance & Payroll'
      ? 'Elena Vance'
      : assignedDesk === 'Customer Care'
      ? 'Sarah Jenkins'
      : assignedDesk === 'Logistics Desk'
      ? 'Marcus Vance'
      : 'Alex Rivera');

  const agentId =
    currentUser.agentId ||
    (assignedDesk === 'Finance & Payroll'
      ? '#AGT-FIN-01'
      : assignedDesk === 'Customer Care'
      ? '#AGT-CARE-01'
      : assignedDesk === 'Logistics Desk'
      ? '#AGT-LOG-01'
      : '#AGT-TECH-01');

  // Quick Controls
  const [selectedDeskView, setSelectedDeskView] = useState<string>(assignedDesk);

  // Filters & Search Toolbar
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<
    'ALL' | 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW'
  >('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active Ticket Selection
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'ACTION_AI' | 'AUDIT_LOG'>('ACTION_AI');

  // Editable Form inside Workspace
  const [editStatus, setEditStatus] = useState<TicketStatus>('OPEN');
  const [editNotes, setEditNotes] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter tickets by Desk View
  const deskFilteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedDeskView === 'ALL') return true;
      const tQueue =
        t.triageResult?.incident_record?.assigned_queue ||
        t.triageResult?.ticket_metadata?.assigned_department ||
        t.assignedTeam ||
        '';

      if (selectedDeskView === 'Finance & Payroll') {
        return tQueue.includes('Finance') || tQueue.includes('ERP') || tQueue.includes('Payroll');
      }
      if (selectedDeskView === 'Technical Support') {
        return (
          tQueue.includes('Tech') ||
          tQueue.includes('Cloud') ||
          tQueue.includes('Infrastructure')
        );
      }
      if (selectedDeskView === 'Customer Care') {
        return tQueue.includes('Care') || tQueue.includes('DWP') || tQueue.includes('Global');
      }
      if (selectedDeskView === 'Logistics Desk') {
        return tQueue.includes('Logistics') || tQueue.includes('Hardware') || tQueue.includes('Asset');
      }
      return true;
    });
  }, [tickets, selectedDeskView]);

  // Apply Toolbar Filters & Sort
  const processedTickets = useMemo(() => {
    let result = deskFilteredTickets.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = t.id.toLowerCase().includes(query);
        const matchCust = t.customerName.toLowerCase().includes(query);
        const matchComp = t.companyName.toLowerCase().includes(query);
        const matchText = t.complaintText.toLowerCase().includes(query);
        const matchSubj = (t.subject || '').toLowerCase().includes(query);
        const matchNotes = (t.internalNotes || '').toLowerCase().includes(query);
        if (!matchId && !matchCust && !matchComp && !matchText && !matchSubj && !matchNotes) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL') {
        const normStatus =
          t.status === 'NEW' || t.status === 'TRIAGED'
            ? 'OPEN'
            : t.status === 'ESCALATED'
            ? 'IN_PROGRESS'
            : t.status;
        if (normStatus !== statusFilter) return false;
      }

      // Priority
      if (priorityFilter !== 'ALL') {
        const pStr =
          t.triageResult?.incident_record?.itil_priority ||
          t.triageResult?.priority ||
          'P3 - MEDIUM';
        if (priorityFilter === 'P1_CRITICAL' && !pStr.includes('P1') && !pStr.includes('CRITICAL'))
          return false;
        if (priorityFilter === 'P2_HIGH' && !pStr.includes('P2') && !pStr.includes('HIGH'))
          return false;
        if (priorityFilter === 'P3_MEDIUM' && !pStr.includes('P3') && !pStr.includes('MEDIUM'))
          return false;
        if (priorityFilter === 'P4_LOW' && !pStr.includes('P4') && !pStr.includes('LOW'))
          return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'NEWEST') {
        return b.id.localeCompare(a.id);
      }
      if (sortOrder === 'OLDEST') {
        return a.id.localeCompare(b.id);
      }
      if (sortOrder === 'PRIORITY') {
        const getPWeight = (t: IncidentTicket) => {
          const p =
            t.triageResult?.incident_record?.itil_priority ||
            t.triageResult?.priority ||
            '';
          if (p.includes('P1') || p.includes('CRITICAL')) return 4;
          if (p.includes('P2') || p.includes('HIGH')) return 3;
          if (p.includes('P3') || p.includes('MEDIUM')) return 2;
          return 1;
        };
        return getPWeight(b) - getPWeight(a);
      }
      return 0;
    });

    return result;
  }, [deskFilteredTickets, searchQuery, statusFilter, priorityFilter, sortOrder]);

  // Selected ticket reference
  const activeTicket = useMemo(() => {
    if (selectedTicketId) {
      const found = tickets.find((t) => t.id === selectedTicketId);
      if (found) return found;
    }
    return processedTickets[0] || tickets[0] || null;
  }, [tickets, processedTickets, selectedTicketId]);

  // Sync edit form whenever activeTicket changes
  React.useEffect(() => {
    if (activeTicket) {
      const normStatus: TicketStatus =
        activeTicket.status === 'NEW' || activeTicket.status === 'TRIAGED'
          ? 'OPEN'
          : activeTicket.status === 'ESCALATED'
          ? 'IN_PROGRESS'
          : activeTicket.status;
      setEditStatus(normStatus);
      setEditNotes(activeTicket.internalNotes || '');
      setSaveSuccessMessage(null);
      setConfirmDeleteId(null);
    }
  }, [activeTicket?.id]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setSortOrder('NEWEST');
    setSelectedDeskView(assignedDesk);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleInsertAiRecommendation = () => {
    if (!activeTicket) return;
    const recAction =
      activeTicket.triageResult?.incident_record?.recommended_smartsheet_action ||
      activeTicket.triageResult?.resolution_plan?.internal_agent_action ||
      activeTicket.triageResult?.recommended_action ||
      'Apply standard diagnostic SOP runbook.';

    setEditNotes((prev) => {
      const cleaned = prev.trim();
      if (!cleaned) return `[AI RECOMMENDATION]: ${recAction}`;
      return `${cleaned}\n\n[AI RECOMMENDATION]: ${recAction}`;
    });
  };

  const handleInsertPresetChip = (presetText: string) => {
    setEditNotes((prev) => {
      const cleaned = prev.trim();
      if (!cleaned) return presetText;
      return `${cleaned}\n• ${presetText}`;
    });
  };

  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    const newAuditEntry: TicketAuditEntry = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: `${agentName} (${agentId})`,
      action: `Updated status to [${editStatus}] with internal resolution notes logged.`,
    };

    const existingAudit = activeTicket.auditLog || [
      {
        timestamp: activeTicket.createdAt || 'Initial Intaked',
        actor: 'Cognitive NLP Engine',
        action: `Auto-routed to ${assignedDesk} under ITIL v4 rules`,
      },
    ];

    const updated: IncidentTicket = {
      ...activeTicket,
      status: editStatus,
      internalNotes: editNotes,
      auditLog: [newAuditEntry, ...existingAudit],
    };

    onUpdateTicket(updated);
    setSaveSuccessMessage(`Ticket #${activeTicket.id} updated successfully.`);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3000);
  };

  const handleDeleteTicket = () => {
    if (!activeTicket) return;
    onDeleteTicket(activeTicket.id);
    setConfirmDeleteId(null);
    setSelectedTicketId(null);
  };

  // Helper formatting functions
  const formatPriority = (t: IncidentTicket) => {
    const p =
      t.triageResult?.incident_record?.itil_priority ||
      t.triageResult?.priority ||
      'P3 - MEDIUM';
    if (p.includes('P1') || p.includes('CRITICAL')) {
      return {
        label: 'P1_CRITICAL',
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-500',
      };
    }
    if (p.includes('P2') || p.includes('HIGH')) {
      return {
        label: 'P2_HIGH',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-500',
      };
    }
    if (p.includes('P4') || p.includes('LOW')) {
      return {
        label: 'P4_LOW',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    }
    return {
      label: 'P3_MEDIUM',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      dot: 'bg-cyan-500',
    };
  };

  const formatStatus = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
      case 'NEW':
      case 'TRIAGED':
        return { label: 'OPEN', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'IN_PROGRESS':
      case 'ESCALATED':
        return { label: 'IN_PROGRESS', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'RESOLVED':
        return { label: 'RESOLVED', cls: 'bg-teal-500/15 text-[#4fd1c5] border-[#4fd1c5]/30' };
      case 'CLOSED':
        return { label: 'CLOSED', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
      default:
        return { label: status, cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
    }
  };

  const formatSla = (t: IncidentTicket) => {
    if (t.slaBreached) {
      return { text: 'BREACHED (-35m)', isBreached: true };
    }
    const hrs = t.slaRemainingHours ?? (t.status === 'RESOLVED' ? 0 : 2.5);
    if (hrs <= 0) {
      return { text: 'BREACHED (-12m)', isBreached: true };
    }
    if (hrs < 1) {
      return { text: `${Math.round(hrs * 60)}m remaining`, isBreached: false, isUrgent: true };
    }
    return { text: `${hrs.toFixed(1)}h remaining`, isBreached: false, isUrgent: false };
  };

  // Preset Chips based on Desk context
  const resolutionPresets = useMemo(() => {
    if (assignedDesk === 'Finance & Payroll') {
      return [
        'Verify Stripe / banking settlement logs',
        'Issue immediate credit memo & adjustment voucher',
        'Reconcile ERP automated ledger discrepancy',
        'Escalate to Corporate Payroll Controller',
      ];
    }
    if (assignedDesk === 'Logistics Desk') {
      return [
        'Re-issue courier carrier tracking with DHL/FedEx',
        'Dispatch immediate hardware hot-swap from central depot',
        'File damaged-in-transit courier claim #CLM-9810',
        'Confirm corporate recipient delivery address on file',
      ];
    }
    if (assignedDesk === 'Customer Care') {
      return [
        'Re-send enterprise SSO authentication token',
        'Schedule dedicated SLA onboarding consultation',
        'Verify corporate client tier entitlements & permissions',
        'Dispatch customer care courtesy credit',
      ];
    }
    // Technical Support default
    return [
      'Restart API Gateway pods & clear distributed cache',
      'Inspect PostgreSQL connection pool & transaction deadlocks',
      'Scale Horizontal Pod Autoscaler (HPA) to 15 replicas',
      'Roll back container release to stable version v2.4.1',
    ];
  }, [assignedDesk]);

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* ==================================================
          A. HEADER & STATUS BAR
      ================================================== */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(79,209,197,0.06)]">
        {/* Top row: Command Center Title & Agent Profile */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#1a3454]">
          {/* Left: Brand Badge & Command Center Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#091424] border border-[#1a3454] flex items-center justify-center text-[#4fd1c5] shadow-[0_0_15px_rgba(79,209,197,0.15)] shrink-0">
              <Shield className="w-6 h-6 fill-[#4fd1c5]/20 text-[#4fd1c5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4fd1c5] bg-[#4fd1c5]/10 px-2 py-0.5 rounded border border-[#4fd1c5]/30">
                  AGENT DESK
                </span>
                <span className="text-xs text-[#94a3b8] font-mono">CompanyCMS Platform</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
                CompanyCMS [AGENT DESK] - {assignedDesk} Command Center
              </h1>
            </div>
          </div>

          {/* Right: Agent Name, Desk Indicator, Avatar, and Sign Out */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white flex items-center justify-end gap-2">
                <span>{agentName}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#4fd1c5]/10 text-[#4fd1c5] border border-[#4fd1c5]/30">
                  {agentId}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] font-mono mt-0.5">
                {currentUser.email}
              </p>
            </div>

            {/* User Avatar */}
            <div className="w-10 h-10 rounded-xl bg-[#091424] border border-[#1a3454] flex items-center justify-center text-[#4fd1c5] font-bold text-sm font-mono shadow-xs shrink-0">
              {agentName.slice(0, 2).toUpperCase()}
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={onSignOut}
              className="px-3.5 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 hover:border-rose-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-1"
              title="Sign out of Agent Command Center"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-header & Quick Controls */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sub-header */}
          <div className="text-xs sm:text-sm text-[#94a3b8]">
            <span className="text-slate-300 font-medium">Welcome, {agentName}</span>{' '}
            <span className="text-[#94a3b8] font-mono">(Agent ID: <strong className="text-[#4fd1c5]">{agentId}</strong>)</span>{' '}
            <span className="text-slate-500 hidden md:inline">|</span>{' '}
            <span className="text-[#94a3b8] block md:inline mt-0.5 md:mt-0">
              Active Service Desk: <strong className="text-white">{assignedDesk}</strong>
            </span>
          </div>

          {/* Quick Controls: Desk View Dropdown & Active Queue Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="desk-view-select" className="text-xs text-[#94a3b8] font-medium hidden sm:inline">
                Desk View:
              </label>
              <select
                id="desk-view-select"
                aria-label="Desk View"
                value={selectedDeskView}
                onChange={(e) => setSelectedDeskView(e.target.value)}
                className="bg-[#091424] border border-[#1a3454] text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-[#4fd1c5] focus:outline-hidden font-medium cursor-pointer"
              >
                <option value={assignedDesk}>Active: {assignedDesk}</option>
                <option value="ALL">All Desks (Global Queue)</option>
                <option value="Finance & Payroll">Finance & Payroll</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Customer Care">Customer Care</option>
                <option value="Logistics Desk">Logistics Desk</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#091424] border border-[#1a3454] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#4fd1c5] animate-pulse" />
              <span className="text-[#94a3b8]">Active Queue:</span>
              <strong className="text-white font-bold">{deskFilteredTickets.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          B. QUEUE FILTER TOOLBAR
      ================================================== */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-4 shadow-[0_0_25px_rgba(79,209,197,0.04)] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search queue... text input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queue by Ticket ID, Customer, Subject, Description..."
              className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-xs sm:text-sm text-white pl-10 pr-4 py-2.5 rounded-xl placeholder:text-slate-500 transition-colors"
            />
          </div>

          {/* Quick Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="inline-flex rounded-xl bg-[#091424] p-1 border border-[#1a3454]">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#4fd1c5] text-[#091424] font-bold shadow-xs'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <div className="inline-flex items-center gap-1.5 bg-[#091424] px-2.5 py-1 rounded-xl border border-[#1a3454]">
              <span className="text-[11px] text-[#94a3b8]">Priority:</span>
              <select
                aria-label="Filter queue by priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="bg-transparent text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">ALL</option>
                <option value="P1_CRITICAL">P1_CRITICAL</option>
                <option value="P2_HIGH">P2_HIGH</option>
                <option value="P3_MEDIUM">P3_MEDIUM</option>
                <option value="P4_LOW">P4_LOW</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="inline-flex items-center gap-1.5 bg-[#091424] px-2.5 py-1 rounded-xl border border-[#1a3454]">
              <ArrowDownUp className="w-3 h-3 text-[#94a3b8]" />
              <select
                aria-label="Sort queue order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="PRIORITY">Priority First</option>
              </select>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-[#94a3b8] hover:text-white bg-[#091424] hover:bg-[#152a45] border border-[#1a3454] rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset all filters to default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            {/* Refresh Icon */}
            <button
              type="button"
              onClick={handleRefresh}
              className={`p-2 text-[#94a3b8] hover:text-[#4fd1c5] bg-[#091424] hover:bg-[#152a45] border border-[#1a3454] rounded-xl transition-all cursor-pointer ${
                isRefreshing ? 'animate-spin text-[#4fd1c5]' : ''
              }`}
              title="Refresh Queue"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          C. DEPARTMENT TICKET QUEUE & SLA MONITOR
      ================================================== */}
      <div className="bg-[#112238] border border-[#1a3454] rounded-2xl shadow-[0_0_35px_rgba(79,209,197,0.06)] overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-[#1a3454] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#4fd1c5]" />
              Department Ticket Queue & SLA Monitor ({processedTickets.length})
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Click any ticket row to inspect details and open its interactive workspace below.
            </p>
          </div>
          <span className="text-xs font-mono text-[#4fd1c5]">
            Desk: {selectedDeskView === 'ALL' ? 'Global Queue' : selectedDeskView}
          </span>
        </div>

        {processedTickets.length === 0 ? (
          <div className="p-10 text-center text-[#94a3b8]">
            <p className="text-sm">No tickets match the active search and filter criteria.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 text-xs text-[#4fd1c5] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#091424] text-[#94a3b8] font-bold uppercase tracking-wider text-[10px] border-b border-[#1a3454]">
                <tr>
                  <th className="py-3 px-4">TICKET ID</th>
                  <th className="py-3 px-4">CUSTOMER</th>
                  <th className="py-3 px-4 min-w-[240px]">ISSUE DESCRIPTION</th>
                  <th className="py-3 px-4">PRIORITY</th>
                  <th className="py-3 px-4">SLA RESOLUTION TIMER</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">INTERNAL NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a3454]/60">
                {processedTickets.map((ticket) => {
                  const isSelected = activeTicket?.id === ticket.id;
                  const prio = formatPriority(ticket);
                  const stat = formatStatus(ticket.status);
                  const sla = formatSla(ticket);
                  const issueText =
                    ticket.subject ||
                    ticket.triageResult?.incident_record?.incident_summary ||
                    ticket.complaintText;

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#152a45] ring-1 ring-inset ring-[#4fd1c5]/50'
                          : 'hover:bg-[#132742]/70 bg-[#112238]/40'
                      }`}
                    >
                      {/* TICKET ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <span className="text-[#4fd1c5] flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#4fd1c5]" />}
                          {ticket.id}
                        </span>
                      </td>

                      {/* CUSTOMER */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white truncate max-w-[150px]">
                          {ticket.customerName}
                        </div>
                        <div className="text-[10px] text-[#94a3b8] truncate max-w-[150px]">
                          {ticket.companyName}
                        </div>
                      </td>

                      {/* ISSUE DESCRIPTION */}
                      <td className="py-3.5 px-4">
                        <p className="line-clamp-2 text-slate-200 leading-snug">
                          {issueText}
                        </p>
                      </td>

                      {/* PRIORITY */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${prio.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                          {prio.label}
                        </span>
                      </td>

                      {/* SLA RESOLUTION TIMER */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold ${
                            sla.isBreached
                              ? 'text-rose-400 font-bold'
                              : sla.isUrgent
                              ? 'text-amber-400 font-bold'
                              : 'text-teal-300'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{sla.text}</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${stat.cls}`}
                        >
                          {stat.label}
                        </span>
                      </td>

                      {/* INTERNAL NOTES */}
                      <td className="py-3.5 px-4">
                        {ticket.internalNotes ? (
                          <span
                            className="text-[11px] text-teal-200/90 line-clamp-1 max-w-[160px]"
                            title={ticket.internalNotes}
                          >
                            {ticket.internalNotes}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================
          D. TICKET WORKSPACE
      ================================================== */}
      {activeTicket && (
        <div className="bg-[#112238] border border-[#1a3454] rounded-2xl p-5 sm:p-7 shadow-[0_0_35px_rgba(79,209,197,0.08)] space-y-6">
          {/* Workspace Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1a3454]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Ticket Workspace — #{activeTicket.id}</span>
                </h3>

                {/* SLA Timer Badge */}
                {(() => {
                  const sla = formatSla(activeTicket);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                        sla.isBreached
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : sla.isUrgent
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-teal-500/10 text-[#4fd1c5] border-[#4fd1c5]/30'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sla.text}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Customer ID & Info */}
              <p className="text-xs text-[#94a3b8] mt-1 font-mono">
                Customer: <strong className="text-white">{activeTicket.customerName}</strong> ({activeTicket.companyName}) · Tier: {activeTicket.tier}
              </p>
            </div>

            {/* Workspace Tabs: [Action & AI Assist, Audit Log] */}
            <div className="inline-flex rounded-xl bg-[#091424] p-1 border border-[#1a3454]">
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('ACTION_AI')}
                className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeWorkspaceTab === 'ACTION_AI'
                    ? 'bg-[#4fd1c5] text-[#091424] font-bold shadow-xs'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Action & AI Assist</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('AUDIT_LOG')}
                className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeWorkspaceTab === 'AUDIT_LOG'
                    ? 'bg-[#4fd1c5] text-[#091424] font-bold shadow-xs'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Log</span>
              </button>
            </div>
          </div>

          {/* Customer Issue Description */}
          <div className="p-4 rounded-xl bg-[#091424] border border-[#1a3454]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#4fd1c5]" />
                Customer Issue Description (Filed by {activeTicket.customerName})
              </span>
              <span className="text-[10px] font-mono text-[#94a3b8]">
                {activeTicket.createdAt || 'Recent'} · Channel: {activeTicket.source}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans whitespace-pre-wrap">
              {activeTicket.complaintText}
            </p>
          </div>

          {/* TAB 1: ACTION & AI ASSIST */}
          {activeWorkspaceTab === 'ACTION_AI' && (
            <div className="space-y-6">
              {/* AI Smart Assist & Triage Insight Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#0d1d33] border border-[#1d3d63] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#4fd1c5]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      AI Smart Assist & Triage Insight
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#4fd1c5] bg-[#4fd1c5]/10 px-2 py-0.5 rounded border border-[#4fd1c5]/30">
                    NLP Engine: gemini-3.8-flash
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* KEY ISSUE SUMMARY */}
                  <div className="p-3 rounded-lg bg-[#091424] border border-[#1a3454]">
                    <span className="font-bold text-[#4fd1c5] text-[11px] block mb-1">
                      KEY ISSUE SUMMARY:
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {activeTicket.triageResult?.incident_record?.incident_summary ||
                        activeTicket.triageResult?.summary ||
                        activeTicket.complaintText.slice(0, 160) + '...'}
                    </p>
                  </div>

                  {/* RECOMMENDED ACTION */}
                  <div className="p-3 rounded-lg bg-[#091424] border border-[#1a3454]">
                    <span className="font-bold text-[#4fd1c5] text-[11px] block mb-1">
                      RECOMMENDED ACTION:
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {activeTicket.triageResult?.incident_record?.recommended_smartsheet_action ||
                        activeTicket.triageResult?.resolution_plan?.internal_agent_action ||
                        activeTicket.triageResult?.recommended_action ||
                        'Execute standard operating protocol diagnostic steps for this incident.'}
                    </p>
                  </div>
                </div>

                {/* Button: Insert AI Recommendation into Internal Notes */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleInsertAiRecommendation}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#112238] hover:bg-[#152a45] text-[#4fd1c5] border border-[#4fd1c5]/40 hover:border-[#4fd1c5] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Insert AI Recommendation into Internal Notes</span>
                  </button>
                </div>
              </div>

              {/* Standard Resolution Presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Standard Resolution Presets ({assignedDesk}):</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {resolutionPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertPresetChip(preset)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-[#091424] hover:bg-[#152a45] text-slate-300 hover:text-[#4fd1c5] border border-[#1a3454] hover:border-[#4fd1c5]/40 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3 text-[#4fd1c5]" />
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <form onSubmit={handleSaveTicket} className="space-y-4 pt-2 border-t border-[#1a3454]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Update Status Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                      Update Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                      className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-xs sm:text-sm text-white px-3.5 py-2.5 rounded-xl font-medium cursor-pointer"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  {/* Internal Resolution Notes Text Box */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
                      <span>Internal Resolution Notes (Logged under {agentId})</span>
                      <span className="text-[10px] text-[#4fd1c5] font-mono">Operator: {agentName}</span>
                    </label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add diagnostic steps, action log, or customer communication status..."
                      className="w-full bg-[#091424] border border-[#1a3454] focus:border-[#4fd1c5] focus:outline-hidden text-xs sm:text-sm text-white p-3 rounded-xl placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Save Feedback Notice */}
                {saveSuccessMessage && (
                  <div className="p-3 rounded-lg bg-[#4fd1c5]/10 border border-[#4fd1c5]/30 text-[#4fd1c5] text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{saveSuccessMessage}</span>
                  </div>
                )}

                {/* Buttons: Delete Complaint & Save & Update Ticket */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div>
                    {confirmDeleteId === activeTicket.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-300 font-semibold">Confirm delete?</span>
                        <button
                          type="button"
                          onClick={handleDeleteTicket}
                          className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 text-xs text-[#94a3b8] hover:text-white bg-[#091424] rounded-lg border border-[#1a3454] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(activeTicket.id)}
                        className="px-4 py-2.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 hover:border-rose-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Complaint</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#4fd1c5] hover:bg-[#38b2ac] text-[#091424] font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(79,209,197,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Update Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: AUDIT LOG */}
          {activeWorkspaceTab === 'AUDIT_LOG' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block">
                Chronological Ticket Audit & Triage History
              </span>

              <div className="space-y-3">
                {(activeTicket.auditLog || [
                  {
                    timestamp: activeTicket.createdAt || 'Initial Intake',
                    actor: 'Cognitive NLP Engine',
                    action: `Auto-routed to ${assignedDesk} under ITIL v4 rules`,
                  },
                ]).map((log, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-[#091424] border border-[#1a3454] flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#4fd1c5] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{log.actor}</span>
                        <span className="text-[10px] font-mono text-[#94a3b8]">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {log.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
