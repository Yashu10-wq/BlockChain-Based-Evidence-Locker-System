"use client";

import Sidebar from "@/components/Sidebar";
import QRScanner from "@/components/QRScanner";
import { useEffect, useState } from "react";
import api from "@/lib/api";

/**
 * ── Custody Handshake Page ────────────────────────────────────
 * Initiate transfers, accept via QR modal, view chain history.
 */

interface User {
  id: number;
  name: string;
  role: string;
}

export default function CustodyPage() {
  const [user, setUser]             = useState<User | null>(null);
  const [evidenceId, setEvidenceId] = useState("");
  const [toUser, setToUser]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState("");
  const [error, setError]           = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [acceptEvidenceId, setAcceptEvidenceId] = useState("");
  const [chain, setChain]           = useState<any[]>([]);
  const [historyEvidenceId, setHistoryEvidenceId] = useState("");
  const [allUsers, setAllUsers]     = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    api.get("/auth/users")
      .then(({ data }) => setAllUsers(data.users || []))
      .catch(() => {});
  }, []);

  // ── Initiate Transfer ────────────────────────────────────────
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/custody/initiate", {
        evidence_id: evidenceId,
        to_user: toUser,
      });
      setMessage(`Transfer initiated. The receiving officer must now scan this Evidence QR code to accept.`);
      setEvidenceId(""); setToUser("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initiate transfer.");
    } finally {
      setLoading(false);
    }
  };

  // ── QR Scan → Accept ─────────────────────────────────────────
  const handleQRScan = async (decodedText: string) => {
    setShowScanner(false);
    setError(""); setMessage("");
    setLoading(true);

    try {
      const parsed = JSON.parse(decodedText);
      const evId = parsed.evidence_id;
      setAcceptEvidenceId(String(evId));

      const { data } = await api.post("/custody/accept", {
        evidence_id: evId,
        qr_data: decodedText,
      });

      setMessage(`Transfer accepted for Evidence #${evId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to accept transfer.");
    } finally {
      setLoading(false);
    }
  };

  // ── View History ──────────────────────────────────────────────
  const handleViewHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyEvidenceId) return;
    try {
      const { data } = await api.get(`/custody/history/${historyEvidenceId}`);
      setChain(data.custody_chain || []);
    } catch {
      setChain([]);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 min-h-screen">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Custody Handshake</h2>
          <p className="text-sm text-slate-500 mt-1">
            Initiate evidence transfers and accept via QR scanning.
          </p>
        </div>

        {/* Feedback messages */}
        {message && <div className="alert-success mb-6">{message}</div>}
        {error && <div className="alert-error mb-6">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Initiate Transfer Card ────────────────────────── */}
          <div className="card">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              Initiate Transfer
            </h3>
            <form onSubmit={handleInitiate} className="space-y-4">
              <div>
                <label className="field-label">Evidence ID</label>
                <input type="text" value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)}
                  required placeholder="e.g. 1"
                  className="input-field" id="custody-evidence-id" />
              </div>
              <div className="relative">
                <label className="field-label">Transfer To (Search/Select User)</label>
                <input 
                  type="text" 
                  placeholder="Search by name or role..."
                  value={userSearchTerm}
                  onChange={(e) => { 
                    setUserSearchTerm(e.target.value); 
                    setIsUserDropdownOpen(true); 
                    setToUser(""); // reset if they type
                  }}
                  onFocus={() => setIsUserDropdownOpen(true)}
                  className="input-field"
                  required={!toUser}
                />
                {isUserDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto text-sm">
                    {allUsers
                      .filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.role.toLowerCase().includes(userSearchTerm.toLowerCase()))
                      .map((u) => (
                      <div 
                        key={u.id} 
                        className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-slate-800 border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setToUser(String(u.id));
                          setUserSearchTerm(`${u.name} — ${u.role} (ID: ${u.id})`);
                          setIsUserDropdownOpen(false);
                        }}
                      >
                        <span className="font-semibold">{u.name}</span> <span className="text-slate-500">— {u.role} (ID: {u.id})</span>
                      </div>
                    ))}
                    {allUsers.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.role.toLowerCase().includes(userSearchTerm.toLowerCase())).length === 0 && (
                      <div className="px-4 py-2 text-slate-500">No users found.</div>
                    )}
                  </div>
                )}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center" id="initiate-transfer-btn">
                {loading ? <span className="spinner" /> : "Initiate Transfer"}
              </button>
            </form>
          </div>

          {/* ── Accept Transfer (QR Scan) Card ────────────────── */}
          <div className="card">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>
              Accept Transfer
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Scan the QR code on the evidence to accept custody.
            </p>

            {/* ── QR Scanner Modal Overlay ────────────────────── */}
            {showScanner && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Scan Evidence QR Code</h4>
                    <button onClick={() => setShowScanner(false)}
                      className="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>
                  </div>
                  <QRScanner
                    onScan={handleQRScan}
                    onError={(err) => { setError(err); setShowScanner(false); }}
                  />
                </div>
              </div>
            )}

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-3xl text-slate-300">
                📷
              </div>
              <button onClick={() => { setShowScanner(true); setError(""); setMessage(""); }}
                className="btn-primary" id="scan-accept-btn">
                Open QR Scanner
              </button>
            </div>

            {acceptEvidenceId && (
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">
                  Last accepted: Evidence #{acceptEvidenceId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Custody Chain History (Formal Ledger) ───────────── */}
        {user?.role === "Admin" && (
          <div className="card mt-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Custody Chain History
            </h3>
            <form onSubmit={handleViewHistory} className="flex gap-3 mb-4">
              <input type="text" value={historyEvidenceId}
                onChange={(e) => setHistoryEvidenceId(e.target.value)}
                placeholder="Enter Evidence ID" className="input-field flex-1" id="history-evidence-id" />
              <button type="submit" className="btn-outline" id="view-chain-btn">View Chain</button>
            </form>

            {chain.length > 0 && (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Block #</th>
                      <th>From → To</th>
                      <th>Timestamp</th>
                      <th>Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chain.map((log: any) => (
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
      </main>
    </div>
  );
}
