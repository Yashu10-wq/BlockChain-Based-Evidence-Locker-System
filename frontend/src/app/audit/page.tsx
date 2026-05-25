"use client";

import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import api from "@/lib/api";

/**
 * ── Admin Audit Page ──────────────────────────────────────────
 * Formal "Evidence Ledger" spreadsheet style.
 * - Verify individual evidence chain integrity
 * - Run full system audit
 * - View past audit reports
 */
export default function AuditPage() {
  const [evidenceId, setEvidenceId]     = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [auditResult, setAuditResult]   = useState<any>(null);
  const [reports, setReports]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setVerifyResult(null);
    setLoading(true);
    try {
      const { data } = await api.get(`/audit/verify/${evidenceId}`);
      setVerifyResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (brokenAt: number) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/audit/restore", {
        evidence_id: evidenceId,
        broken_at: brokenAt,
      });
      setVerifyResult({
        valid: true,
        restored: true,
        new_evidence_id: data.new_evidence_id,
        blocks: [],
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Restore failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setError(""); setAuditResult(null);
    setLoading(true);
    try {
      const { data } = await api.post("/audit/run");
      setAuditResult(data.summary);
    } catch (err: any) {
      setError(err.response?.data?.error || "Audit failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetReports = async () => {
    try {
      const { data } = await api.get("/audit/reports");
      setReports(data.reports || []);
    } catch {
      setReports([]);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="md:md:ml-64 flex-1 p-4 md:p-8 min-h-screen">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Integrity Audit</h2>
          <p className="text-sm text-slate-500 mt-1">
            Verify blockchain custody chains and run system-wide audits.
          </p>
        </div>

        {error && <div className="alert-error mb-6">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ── Verify Single Chain ───────────────────────────── */}
          <div className="card">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              Verify Evidence Chain
            </h3>
            <form onSubmit={handleVerify} className="flex gap-3 mb-4">
              <input type="text" value={evidenceId}
                onChange={(e) => setEvidenceId(e.target.value)}
                required placeholder="Evidence ID"
                className="input-field flex-1" id="audit-evidence-id" />
              <button type="submit" disabled={loading} className="btn-primary" id="verify-chain-btn">
                {loading ? <span className="spinner" /> : "Verify Chain"}
              </button>
            </form>

            {verifyResult && (
              <div className="mt-4">
                {verifyResult.valid ? (
                  <div className="text-center py-6 space-y-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-16 h-16 mx-auto rounded-full bg-white border-2 border-green-300 flex items-center justify-center text-3xl">
                      ✅
                    </div>
                    <span className="badge badge-success text-sm px-4 py-1.5">
                      {verifyResult.restored ? "Restored Successfully" : "Verified Immutable"}
                    </span>
                    <p className="text-xs text-slate-500">
                      {verifyResult.restored 
                        ? `New valid evidence created with ID #${verifyResult.new_evidence_id}`
                        : `${verifyResult.blocks?.length || 0} blocks verified — chain is intact.`}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3 bg-red-50 rounded-xl border border-red-200">
                    <div className="w-16 h-16 mx-auto rounded-full bg-white border-2 border-red-300 flex items-center justify-center text-3xl">
                      ⚠️
                    </div>
                    <span className="badge badge-danger text-sm px-4 py-1.5">
                      TAMPERED
                    </span>
                    <p className="text-xs text-red-600">
                      Chain broken at block #{verifyResult.brokenAt}.
                    </p>
                    <button onClick={() => handleRestore(verifyResult.brokenAt)} disabled={loading} className="btn-primary mt-2 text-xs py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white border-none rounded">
                      {loading ? "..." : "Restore Valid Copy"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Run Full Audit ────────────────────────────────── */}
          <div className="card">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              Full System Audit
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Validate blockchain integrity across all evidence items.
            </p>
            <button onClick={handleRunAudit} disabled={loading}
              className="btn-primary w-full justify-center mb-4" id="run-audit-btn">
              {loading ? <span className="spinner" /> : "Run Full Audit"}
            </button>

            {auditResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                    <p className="text-2xl font-bold text-slate-900">{auditResult.evidence_items}</p>
                    <p className="text-xs text-slate-500">Items Audited</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                    <p className="text-2xl font-bold text-green-700">{auditResult.valid}</p>
                    <p className="text-xs text-slate-500">Valid Chains</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                    <p className="text-2xl font-bold text-red-600">{auditResult.invalid}</p>
                    <p className="text-xs text-slate-500">Invalid Chains</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(auditResult.audited_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">Audit Time</p>
                  </div>
                </div>

                {auditResult.issues?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-red-600 font-semibold mb-2">Issues Found:</p>
                    {auditResult.issues.map((issue: any, i: number) => (
                      <div key={i} className="alert-error text-xs mb-1">
                        Evidence #{issue.evidence_id}: {issue.title} — broken at block #{issue.brokenAt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Past Audit Reports — Formal Ledger Table ─────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Audit Reports Ledger</h3>
            <button onClick={handleGetReports} className="btn-outline text-sm" id="load-reports-btn">
              Load Reports
            </button>
          </div>

          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Report #</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Valid</th>
                    <th>Invalid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r: any) => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs text-blue-600 font-semibold">#{r.id}</td>
                      <td className="text-slate-400 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="font-semibold text-slate-900">{r.report_summary.evidence_items}</td>
                      <td className="text-green-700 font-semibold">{r.report_summary.valid}</td>
                      <td className="text-red-600 font-semibold">{r.report_summary.invalid}</td>
                      <td>
                        <span className={`badge ${r.report_summary.invalid === 0 ? "badge-success" : "badge-danger"}`}>
                          {r.report_summary.invalid === 0 ? "All Clear" : `${r.report_summary.invalid} Issues`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Click &quot;Load Reports&quot; to view past audits.</p>
          )}
        </div>
      </main>
    </div>
  );
}
