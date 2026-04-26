"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

/**
 * ── Login Page ────────────────────────────────────────────────
 * Professional white login form. Stores JWT + user in localStorage.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-4"
               style={{ background: '#002366' }}>
            EL
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Evidence Locker</h1>
          <p className="text-sm text-slate-500 mt-1">Blockchain-secured evidence management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="card space-y-5">
          <div>
            <label className="field-label">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="officer@evidence.gov"
              className="input-field" id="login-email" />
          </div>

          <div>
            <label className="field-label">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="••••••••"
              className="input-field" id="login-password" />
          </div>

          {error && (
            <div className="alert-error text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center" id="login-submit">
            {loading ? (
              <span className="spinner" />
            ) : (
              <>Sign In</>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Authorized personnel only. All access is monitored and logged.
        </p>
      </div>
    </div>
  );
}
