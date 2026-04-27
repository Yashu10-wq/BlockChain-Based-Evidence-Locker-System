"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

/**
 * ── Evidence Detail Page ──────────────────────────────────────
 * Shows evidence info, photos, QR code, blockchain custody timeline,
 * and forensic report upload/viewing.
 */

interface Evidence {
  id: number;
  title: string;
  description: string;
  location_found: string;
  officer_id: number;
  qr_code: string;
  locked: boolean;
  created_at: string;
}

interface Photo {
  id: number;
  file_path: string;
  uploaded_at: string;
}

interface CustodyLog {
  id: number;
  from_user: number;
  to_user: number;
  timestamp: string;
  block_index: number;
  current_hash: string;
  previous_hash: string;
}

interface ForensicReport {
  id: number;
  evidence_id: number;
  technician_id: number;
  report_file: string;
  uploaded_at: string;
}

export default function EvidenceDetailPage() {
  const params   = useParams();
  const id       = params?.id;
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [photos, setPhotos]     = useState<Photo[]>([]);
  const [chain, setChain]       = useState<CustodyLog[]>([]);
  const [reports, setReports]   = useState<ForensicReport[]>([]);
  const [loading, setLoading]   = useState(true);
  const [user, setUser]         = useState<any>(null);

  // Forensic upload state
  const [reportFile, setReportFile]     = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadMsg, setUploadMsg]       = useState("");
  const [uploadErr, setUploadErr]       = useState("");

  useEffect(() => {
    if (!id) return;

    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    api.get(`/evidence/${id}`)
      .then((evRes) => {
        setEvidence(evRes.data.evidence);
        setPhotos(evRes.data.photos || []);

        // Only fetch custody history if Admin
        if (parsedUser?.role === "Admin") {
          api.get(`/custody/history/${id}`)
            .then((custRes) => {
              setChain(custRes.data.custody_chain || []);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch forensic reports (accessible to all authenticated users now)
    api.get(`/forensic/reports/${id}`)
      .then((res) => setReports(res.data.reports || []))
      .catch(() => {});
  }, [id]);

  const handleReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile || !id) return;
    setUploading(true);
    setUploadMsg("");
    setUploadErr("");

    const formData = new FormData();
    formData.append("evidence_id", String(id));
    formData.append("report", reportFile);

    try {
      await api.post("/forensic/upload-report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMsg("Forensic report uploaded successfully.");
      setReportFile(null);

      // Refresh reports list
      const res = await api.get(`/forensic/reports/${id}`);
      setReports(res.data.reports || []);
    } catch (err: any) {
      setUploadErr(err.response?.data?.error || "Failed to upload report.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 p-8 min-h-screen flex items-center justify-center">
          <span className="spinner" />
        </main>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 p-8 min-h-screen flex items-center justify-center">
          <p className="text-slate-400">Evidence not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{evidence.title}</h2>
              <span className={`badge ${evidence.locked ? "badge-success" : "badge-warning"}`}>
                {evidence.locked ? "Locked" : "Open"}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Evidence #{evidence.id} · Registered {new Date(evidence.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Info + Photos ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card */}
            <div className="card space-y-4">
              <h3 className="field-label text-xs">Evidence Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Location Found</p>
                  <p className="text-slate-900 font-medium">{evidence.location_found}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Officer ID</p>
                  <p className="text-slate-900 font-medium">#{evidence.officer_id}</p>
                </div>
              </div>
              {evidence.description && (
                <div>
                  <p className="text-slate-400 text-xs">Description</p>
                  <p className="text-slate-700 text-sm mt-1">{evidence.description}</p>
                </div>
              )}
            </div>

            {/* Photos Grid */}
            {photos.length > 0 && (
              <div className="card">
                <h3 className="field-label text-xs mb-4">
                  Evidence Photos ({photos.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="rounded-lg overflow-hidden border border-slate-200">
                      <img src={p.file_path} alt={`Evidence photo ${p.id}`}
                        className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Forensic Reports Section ────────────────────── */}
            <div className="card">
              <h3 className="field-label text-xs mb-4">
                🔬 Forensic Reports ({reports.length})
              </h3>

              {/* Upload Form — Only for Forensic Technician */}
              {user?.role === "Forensic Technician" && (
                <form onSubmit={handleReportUpload} className="mb-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-3">Upload New Report</p>
                  {uploadMsg && <div className="alert-success mb-3 text-xs">{uploadMsg}</div>}
                  {uploadErr && <div className="alert-error mb-3 text-xs">{uploadErr}</div>}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                    <button
                      type="submit"
                      disabled={uploading || !reportFile}
                      className="btn-primary text-xs whitespace-nowrap"
                    >
                      {uploading ? "Uploading..." : "Upload Report"}
                    </button>
                  </div>
                </form>
              )}

              {/* Reports List */}
              {reports.length === 0 ? (
                <p className="text-slate-400 text-sm">No forensic reports submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Report #{r.id}
                        </p>
                        <p className="text-xs text-slate-400">
                          Technician #{r.technician_id} · {new Date(r.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={r.report_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-3 py-1 rounded"
                      >
                        View Report →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custody Chain — Formal Ledger (Admin Only) */}
            {user?.role === "Admin" && (
              <div className="card">
                <h3 className="field-label text-xs mb-4">
                  Blockchain Custody Chain ({chain.length} blocks)
                </h3>
                {chain.length === 0 ? (
                  <p className="text-slate-400 text-sm">No custody transfers yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Block</th>
                          <th>Transfer</th>
                          <th>Timestamp</th>
                          <th>Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chain.map((log) => (
                          <tr key={log.id}>
                            <td className="font-mono text-xs text-blue-600 font-semibold">#{log.block_index}</td>
                            <td className="text-slate-700">
                              User #{log.from_user} → #{log.to_user}
                            </td>
                            <td className="text-slate-400 text-xs">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="font-mono text-[10px] text-slate-400 max-w-[200px] truncate">
                              {log.current_hash}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: QR Code ──────────────────────────────── */}
          <div className="space-y-6">
            {evidence.qr_code && (
              <div className="card text-center">
                <h3 className="field-label text-xs mb-4">Evidence QR Code</h3>
                <div className="bg-slate-50 rounded-xl p-4 inline-block border border-slate-200">
                  <img src={evidence.qr_code} alt="QR Code" className="w-44 h-44" />
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Scan to verify evidence identity
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
