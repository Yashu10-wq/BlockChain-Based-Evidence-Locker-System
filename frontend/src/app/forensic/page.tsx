"use client";

import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import api from "@/lib/api";

/**
 * ── Forensic Reports Page ─────────────────────────────────────
 * Forensic Technicians upload and view analysis reports.
 */
export default function ForensicPage() {
  const [evidenceId, setEvidenceId]   = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [reports, setReports]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState("");
  const [error, setError]             = useState("");
  const [viewId, setViewId]           = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError(""); setMessage("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("evidence_id", evidenceId);
      formData.append("report", file);

      const { data } = await api.post("/forensic/upload-report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(data.message || "Report uploaded successfully.");
      setFile(null); setEvidenceId("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReports = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.get(`/forensic/reports/${viewId}`);
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
          <h2 className="text-2xl font-bold text-slate-900">Forensic Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Upload analysis documents and view forensic reports.</p>
        </div>

        {message && <div className="alert-success mb-6">{message}</div>}
        {error && <div className="alert-error mb-6">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload */}
          <div className="card">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
              Upload Report
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="field-label">Evidence ID</label>
                <input type="text" value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)}
                  required placeholder="e.g. 1" className="input-field" id="forensic-evidence-id" />
              </div>
              <div>
                <label className="field-label">Report File (PDF)</label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required className="input-field text-sm" id="forensic-file" />
              </div>
              <button type="submit" disabled={loading || !file} className="btn-primary w-full justify-center" id="upload-report-btn">
                {loading ? <span className="spinner" /> : "Upload Report"}
              </button>
            </form>
          </div>

          {/* View Reports */}
          <div className="card">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
              View Reports
            </h3>
            <form onSubmit={handleViewReports} className="flex gap-3 mb-4">
              <input type="text" value={viewId} onChange={(e) => setViewId(e.target.value)}
                required placeholder="Evidence ID" className="input-field flex-1" id="forensic-view-id" />
              <button type="submit" className="btn-outline" id="load-forensic-btn">Load</button>
            </form>

            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Report #</th>
                      <th>Uploaded</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r: any) => (
                      <tr key={r.id}>
                        <td className="font-mono text-xs text-blue-600 font-semibold">#{r.id}</td>
                        <td className="text-slate-400 text-xs">{new Date(r.uploaded_at).toLocaleString()}</td>
                        <td>
                          <a href={r.report_file} target="_blank" rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                            View →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No reports loaded.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
