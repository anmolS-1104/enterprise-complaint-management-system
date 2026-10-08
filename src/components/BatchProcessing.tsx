import React, { useState } from 'react';
import { PRESET_COMPLAINTS } from '../data/sampleComplaints';
import { ICRSResult, IncidentTicket } from '../types/icrs';
import {
  Layers,
  Play,
  CheckCircle2,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  FileJson,
  Check,
} from 'lucide-react';

interface BatchProcessingProps {
  onBatchCompleted: (newTickets: IncidentTicket[]) => void;
}

export const BatchProcessing: React.FC<BatchProcessingProps> = ({
  onBatchCompleted,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [copiedBatchJson, setCopiedBatchJson] = useState(false);

  const runBatchBenchmark = async () => {
    setIsRunning(true);
    setProgress(0);
    setBatchResults([]);

    const results: any[] = [];
    const createdTickets: IncidentTicket[] = [];

    for (let i = 0; i < PRESET_COMPLAINTS.length; i++) {
      const preset = PRESET_COMPLAINTS[i];
      try {
        const res = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaint: preset.text,
            ticketId: `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
            metadata: {
              companyName: preset.companyName,
              customerName: preset.customerName,
              tier: preset.tier,
              source: preset.source,
            },
          }),
        });

        const resData = await res.json();
        if (resData.success) {
          results.push(resData);
          createdTickets.push({
            id: resData.ticketId,
            companyName: preset.companyName,
            customerName: preset.customerName,
            tier: preset.tier,
            source: preset.source,
            complaintText: preset.text,
            createdAt: 'Just now (Batch)',
            status: 'TRIAGED',
            slaRemainingHours: resData.data.priority === 'CRITICAL' ? 1 : 4,
            assignedTeam: resData.data.category === 'SERVICE_OUTAGE' ? 'Tier 3 SRE' : 'Support Queue',
            triageResult: resData.data,
            rawJsonString: resData.rawJsonString,
            latencyMs: resData.latencyMs,
          });
        }
      } catch (err) {
        console.error('Batch item error:', err);
      }

      setProgress(Math.round(((i + 1) / PRESET_COMPLAINTS.length) * 100));
      // update incremental state
      setBatchResults([...results]);
    }

    setIsRunning(false);
    if (createdTickets.length > 0) {
      onBatchCompleted(createdTickets);
    }
  };

  const downloadJson = () => {
    const pureJsonArray = batchResults.map((r) => r.data);
    const blob = new Blob([JSON.stringify(pureJsonArray, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icrs-triage-batch-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBatchJson = () => {
    const pureJsonArray = batchResults.map((r) => r.data);
    navigator.clipboard.writeText(JSON.stringify(pureJsonArray, null, 2));
    setCopiedBatchJson(true);
    setTimeout(() => setCopiedBatchJson(false), 2000);
  };

  const downloadCsv = () => {
    const headers = [
      'Ticket ID',
      'Category',
      'Priority',
      'Sentiment',
      'Summary',
      'Recommended Action',
      'Suggested Reply',
    ];
    const rows = batchResults.map((r) => [
      `"${r.ticketId}"`,
      `"${r.data.category}"`,
      `"${r.data.priority}"`,
      `"${r.data.sentiment}"`,
      `"${(r.data.summary || '').replace(/"/g, '""')}"`,
      `"${(r.data.recommended_action || '').replace(/"/g, '""')}"`,
      `"${(r.data.suggested_reply || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icrs-triage-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Batch Triage Benchmark Suite
        </h1>
        <p className="text-sm text-slate-500">
          Execute automated multi-ticket incident evaluation to test latency, rule enforcement consistency, and bulk schema verification.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Enterprise Test Suite ({PRESET_COMPLAINTS.length} Complaints)
            </h2>
            <p className="text-xs text-slate-500">
              Covers Outages, Unresolved Billing 72h+, SSO Lockouts, Defect Truncation, Feedback, and Security Vulnerabilities.
            </p>
          </div>

          <button
            type="button"
            onClick={runBatchBenchmark}
            disabled={isRunning}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Processing Batch ({progress}%)...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                Run Full Batch Suite
              </>
            )}
          </button>
        </div>

        {isRunning && (
          <div className="space-y-1.5 pt-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-slate-900 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Evaluating tickets with Gemini 3.8 Flash...</span>
              <span>{progress}% complete</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Overview */}
      {batchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Processed {batchResults.length} / {PRESET_COMPLAINTS.length} Incidents</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyBatchJson}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {copiedBatchJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied Pure JSON
                  </>
                ) : (
                  <>
                    <FileJson className="w-3.5 h-3.5 text-slate-500" />
                    Copy Pure JSON
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={downloadJson}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Table of batch outputs */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Sentiment</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchResults.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {item.ticketId}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {item.data.category}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            item.data.priority === 'CRITICAL'
                              ? 'text-rose-600'
                              : item.data.priority === 'HIGH'
                              ? 'text-amber-600'
                              : item.data.priority === 'MEDIUM'
                              ? 'text-blue-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {item.data.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-700">
                        {item.data.sentiment.toLowerCase()}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-sm truncate">
                        {item.data.summary}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {item.latencyMs}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
