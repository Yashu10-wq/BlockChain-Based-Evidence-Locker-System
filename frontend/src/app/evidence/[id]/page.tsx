"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

/**
 * ── Evidence Detail Page ──────────────────────────────────────
 * Shows evidence info, photos, QR code, and blockchain custody timeline.
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

export default function EvidenceDetailPage() {
  const params   = useParams();
  const id       = params?.id;
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [photos, setPhotos]     = useState<Photo[]>([]);
  const [chain, setChain]       = useState<CustodyLog[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      api.get(`/evidence/${id}`),
      api.get(`/custody/history/${id}`),
    ])
      .then(([evRes, custRes]) => {
        setEvidence(evRes.data.evidence);
        setPhotos(evRes.data.photos || []);
        setChain(custRes.data.custody_chain || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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

            {/* Custody Chain — Formal Ledger */}
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
