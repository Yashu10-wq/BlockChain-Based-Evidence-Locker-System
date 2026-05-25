"use client";

import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function HackerPage() {
  const router = useRouter();
  const [evidenceId, setEvidenceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserRole(parsed.role);
      // Strictly redirect non-hackers
      if (parsed.role !== "Hacker" && parsed.role !== "Admin") {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleTamper = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/hacker/tamper", { evidence_id: evidenceId });
      setMessage(data.message);
      setEvidenceId("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to tamper with evidence.");
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== "Hacker" && userRole !== "Admin") {
    return null; // Don't render until redirected
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-4 md:p-8 min-h-screen">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">System Intrusion Panel</h2>
          <p className="text-sm text-slate-500 mt-1">
            Simulate a direct database breach to demonstrate blockchain integrity.
          </p>
        </div>

        {/* Feedback messages */}
        {message && <div className="alert-success mb-6">{message}</div>}
        {error && <div className="alert-error mb-6">{error}</div>}

        <div className="max-w-2xl">
          <div className="card">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
              Tamper Evidence Record
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Enter an Evidence ID below. This tool will directly bypass application logic and execute an unauthorized SQL UPDATE on the ledger, mutating the historical custody record. This proves that the blockchain hashes will catch tampering even if the database is breached.
            </p>

            <form onSubmit={handleTamper} className="space-y-4">
              <div>
                <label className="field-label">Target Evidence ID</label>
                <input
                  type="number"
                  required
                  value={evidenceId}
                  onChange={(e) => setEvidenceId(e.target.value)}
                  placeholder="e.g. 1"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !evidenceId}
                className="btn-danger w-full justify-center mt-2"
              >
                {loading ? <span className="spinner border-t-white" /> : "Execute Database Tamper"}
              </button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">How it works:</h4>
              <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                <li>Temporarily disables the <code>prevent_update_delete</code> PostgreSQL triggers.</li>
                <li>Updates the <code>to_user</code> column on an existing block to corrupt the data payload.</li>
                <li>Re-enables the triggers before returning.</li>
                <li>When the system next verifies this chain, the computed SHA-256 hash will instantly mismatch.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
