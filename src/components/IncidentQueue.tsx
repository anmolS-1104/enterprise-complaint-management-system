import React, { useState, useMemo } from 'react';
import { IncidentTicket, ICRSPriority, ICRSCategory, TicketStatus } from '../types/icrs';
import { ResolutionCard } from './ResolutionCard';
import {
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Flame,
  ChevronRight,
  X,
  CheckCircle2,
  Building,
  User,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

interface IncidentQueueProps {
  tickets: IncidentTicket[];
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onSelectTicketForStudio?: (ticket: IncidentTicket) => void;
}

export const IncidentQueue: React.FC<IncidentQueueProps> = ({
  tickets,
  onUpdateTicketStatus,
  onSelectTicketForStudio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<IncidentTicket | null>(null);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search
      const searchMatch =
        !searchTerm.trim() ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.complaintText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.triageResult?.summary && t.triageResult.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.triageResult?.nlp_analysis?.incident_summary && t.triageResult.nlp_analysis.incident_summary.toLowerCase().includes(searchTerm.toLowerCase()));

      // Priority
      const priorityMatch =
        priorityFilter === 'ALL' ||
        t.triageResult?.incident_record?.itil_priority?.includes(priorityFilter) ||
        t.triageResult?.priority === priorityFilter;

      // Department / Queue
      const categoryMatch =
        categoryFilter === 'ALL' ||
        t.triageResult?.incident_record?.assigned_queue === categoryFilter ||
        t.triageResult?.ticket_metadata?.assigned_department === categoryFilter ||
        t.triageResult?.category === categoryFilter;

      // Status
      const statusMatch = statusFilter === 'ALL' || t.status === statusFilter;

      return searchMatch && priorityMatch && categoryMatch && statusMatch;
    });
  }, [tickets, searchTerm, priorityFilter, categoryFilter, statusFilter]);

  const getPriorityDot = (priority?: string) => {
    if (!priority) return 'bg-emerald-600';
    if (priority.includes('CRITICAL') || priority === 'P1 - CRITICAL') {
      return 'bg-rose-600';
    }
    if (priority.includes('HIGH') || priority === 'P2 - HIGH') {
      return 'bg-amber-600';
    }
    if (priority.includes('MEDIUM') || priority === 'P3 - MEDIUM') {
      return 'bg-blue-600';
    }
    return 'bg-emerald-600';
  };

  const getPriorityLabel = (priority?: string) => {
    if (!priority) return 'text-emerald-700';
    if (priority.includes('CRITICAL') || priority === 'P1 - CRITICAL') {
      return 'text-rose-700';
    }
    if (priority.includes('HIGH') || priority === 'P2 - HIGH') {
      return 'text-amber-700';
    }
    if (priority.includes('MEDIUM') || priority === 'P3 - MEDIUM') {
      return 'text-blue-700';
    }
    return 'text-emerald-700';
  };

  const criticalCount = tickets.filter((t) => t.triageResult?.priority === 'CRITICAL').length;
  const highCount = tickets.filter((t) => t.triageResult?.priority === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Enterprise Incident Queue
          </h1>
          <p className="text-sm text-slate-500">
            Active complaint records prioritized and routed by ICRS triage intelligence.
          </p>
        </div>

        {/* Quick summary indicators without pill boxes */}
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span className="font-medium text-slate-900">{criticalCount}</span> Critical
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span className="font-medium text-slate-900">{highCount}</span> High
          </div>
          <span className="text-slate-300">·</span>
          <div>
            <span className="font-medium text-slate-900">{tickets.length}</span> Total Incidents
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket ID, company, keyword, or summary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Filter Segmented Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <span className="text-[11px] text-slate-500 px-2 font-medium">Priority:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    priorityFilter === p
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Department / Queue Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">All ITIL Queues & Desks</option>
              <option value="Cloud & Technical Infrastructure">Cloud & Technical Infrastructure (Alex Rivera)</option>
              <option value="Finance & ERP Operations">Finance & ERP Operations (Elena Vance)</option>
              <option value="Global Customer Care & DWP Support">Global Customer Care & DWP Support (Sarah Jenkins)</option>
              <option value="Hardware & Asset Logistics">Hardware & Asset Logistics (Marcus Vance)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="TRIAGED">Triaged</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ticket List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Company & Customer</th>
                <th className="py-3 px-4">Desk & Lead</th>
                <th className="py-3 px-4">Priority & SLA</th>
                <th className="py-3 px-4">Sentiment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No incident tickets found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const priority = ticket.triageResult?.priority;
                  const isCritical = priority === 'CRITICAL';
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-100/70' : ''
                      } ${isCritical ? 'bg-rose-50/30' : ''}`}
                    >
                      {/* Ticket ID & Source */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-900">
                          {ticket.id}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ticket.source} · {ticket.createdAt}
                        </div>
                      </td>

                      {/* Company & Customer */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {ticket.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {ticket.customerName}
                        </div>
                      </td>

                      {/* Assigned Department & Lead */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {ticket.triageResult?.ticket_metadata?.assigned_department ||
                            ticket.triageResult?.category?.replace('_', ' ') ||
                            'Unassigned'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Lead: {ticket.triageResult?.ticket_metadata?.assigned_lead || 'Desk Lead'} (
                          <span className="font-mono text-emerald-700">
                            {ticket.triageResult?.ticket_metadata?.assigned_agent_id || '#AGT-01'}
                          </span>
                          )
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className={`w-2 h-2 rounded-full ${getPriorityDot(priority)}`} />
                          <span className={getPriorityLabel(priority)}>
                            {priority || 'UNKNOWN'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ticket.slaRemainingHours
                            ? `${ticket.slaRemainingHours}h remaining`
                            : priority === 'CRITICAL'
                            ? '<1h target'
                            : '<4h target'}
                        </div>
                      </td>

                      {/* Sentiment */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 capitalize font-medium">
                          {(ticket.triageResult?.ticket_metadata?.sentiment || ticket.triageResult?.sentiment || 'Neutral').toLowerCase()}
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td
                        className="py-3.5 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={ticket.status}
                          onChange={(e) =>
                            onUpdateTicketStatus(ticket.id, e.target.value as TicketStatus)
                          }
                          className="text-[11px] p-1 font-medium bg-slate-50 border border-slate-200 rounded text-slate-800 focus:outline-hidden"
                        >
                          <option value="NEW">New</option>
                          <option value="TRIAGED">Triaged</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="ESCALATED">Escalated</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </td>

                      {/* Detail Trigger */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(ticket);
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                        >
                          View Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Ticket Modal / Side View */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">
                    {selectedTicket.id}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-medium text-slate-600">
                    {selectedTicket.companyName}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">
                    {selectedTicket.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contact: {selectedTicket.customerName} via {selectedTicket.source}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Complaint Text */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Raw Customer Inbound Message
                </h3>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs text-slate-800 leading-relaxed font-mono">
                  {selectedTicket.complaintText}
                </div>
              </div>

              {/* Triage Resolution Card */}
              {selectedTicket.triageResult ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    ICRS Triage Resolution Assessment
                  </h3>
                  <ResolutionCard
                    data={selectedTicket.triageResult}
                    ticketId={selectedTicket.id}
                    latencyMs={selectedTicket.latencyMs}
                    onSendReply={() => {
                      onUpdateTicketStatus(selectedTicket.id, 'RESOLVED');
                      setSelectedTicket({ ...selectedTicket, status: 'RESOLVED' });
                    }}
                    onActionExecute={() => {
                      onUpdateTicketStatus(selectedTicket.id, 'IN_PROGRESS');
                      setSelectedTicket({ ...selectedTicket, status: 'IN_PROGRESS' });
                    }}
                  />
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  This ticket has not yet been processed by the ICRS triage agent.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Assigned Team: <span className="font-medium text-slate-800">{selectedTicket.assignedTeam || 'Enterprise Support'}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close Ticket View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
