"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

/**
 * ── Forgot Password Page ──────────────────────────────────────
 * 2-Step OTP Handshake for password recovery.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]             = useState("");
  const [otp, setOtp]                 = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [step, setStep]       = useState(1); // 1 = enter email, 2 = enter OTP
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSuccess(data.message || "OTP Sent! Please check your email.");
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/reset-password", { 
        email, 
        otp, 
        newPassword 
      });
      setSuccess(data.message || "Password reset successfully!");
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password. Invalid OTP?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)' }}>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-4"
               style={{ background: '#002366' }}>
            EL
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
          <p className="text-sm text-slate-500 mt-1">Recover your Evidence Locker account</p>
        </div>

        {/* Alerts */}
        {error && <div className="alert-error text-sm mb-4">{error}</div>}
        {success && <div className="alert-success text-sm mb-4">{success}</div>}

        {/* Step 1: Send OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="card space-y-5">
            <div>
              <label className="field-label">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="officer@evidence.gov"
                className="input-field" />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center">
              {loading ? <span className="spinner" /> : "Send Reset OTP"}
            </button>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">
                ← Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP and Reset */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="card space-y-5">
            <div>
              <label className="field-label">OTP Code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                required placeholder="Enter 6-digit OTP"
                className="input-field tracking-widest text-center text-lg font-mono" />
              <p className="text-[10px] text-slate-400 mt-1">Sent to {email}</p>
            </div>

            <div>
              <label className="field-label">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                required placeholder="••••••••" minLength={6}
                className="input-field" />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center">
              {loading ? <span className="spinner" /> : "Reset Password"}
            </button>
            
            <div className="text-center mt-4">
              <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-blue-600 transition-colors">
                ← Start Over
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
