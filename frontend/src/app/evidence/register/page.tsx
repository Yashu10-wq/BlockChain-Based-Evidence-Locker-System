"use client";

import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Suspense } from "react";

/**
 * ── Evidence Registration Page ────────────────────────────────
 * Clean form for registering new evidence + photo upload.
 */
function RegisterEvidenceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const crime_id = searchParams.get("crime_id");

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation]       = useState("");
  const [photo, setPhoto]             = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<any>(null);
  const [error, setError]             = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/evidence/register", {
        crime_id,
        title,
        description,
        location_found: location,
      });

      const evidenceId = data.evidence.id;

      if (photo) {
        const formData = new FormData();
        formData.append("evidence_id", String(evidenceId));
        formData.append("photo", photo);
        await api.post("/evidence/upload-photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setResult(data.evidence);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="md:md:ml-64 flex-1 p-4 md:p-8 min-h-screen">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Register New Evidence</h2>
          <p className="text-sm text-slate-500 mt-1">Fill in the details and upload a photo of the evidence item.</p>
        </div>

        {result ? (
          /* ── Success State ──────────────────────────────────── */
          <div className="card max-w-lg mx-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-3xl">
              ✅
            </div>
            <h3 className="text-xl font-bold text-slate-900">Evidence Registered</h3>
            <p className="text-sm text-slate-500">
              Evidence <span className="text-blue-600 font-mono font-semibold">#{result.id}</span> — {result.title}
            </p>

            {result.qr_code && (
              <div className="p-4 bg-slate-50 rounded-xl inline-block border border-slate-200">
                <img src={result.qr_code} alt="Evidence QR Code" className="w-48 h-48" />
              </div>
            )}

            <p className="text-xs text-slate-400">
              Print this QR code and attach it to the physical evidence.
            </p>

            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push(`/evidence/${result.id}`)} className="btn-primary">
                View Evidence →
              </button>
              <button onClick={() => { setResult(null); setTitle(""); setDescription(""); setLocation(""); setPhoto(null); setPreview(null); }}
                className="btn-outline">
                Register Another
              </button>
            </div>
          </div>
        ) : (
          /* ── Registration Form ──────────────────────────────── */
          <form onSubmit={handleSubmit} className="card max-w-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="field-label">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  required placeholder="e.g. Knife found at crime scene"
                  className="input-field" id="evidence-title" />
              </div>
              <div>
                <label className="field-label">Location Found *</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  required placeholder="e.g. 123 Main St, Room 4B"
                  className="input-field" id="evidence-location" />
              </div>
            </div>

            <div>
              <label className="field-label">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="Detailed description of the evidence..."
                className="input-field resize-none" id="evidence-desc" />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="field-label">Evidence Photo</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors cursor-pointer bg-slate-50"
                onClick={() => document.getElementById("photo-input")?.click()}>
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <div className="space-y-2">
                    <span className="text-3xl text-slate-300">📷</span>
                    <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400">JPEG, PNG, WebP up to 5MB</p>
                  </div>
                )}
                <input id="photo-input" type="file" accept="image/*" onChange={handlePhotoChange}
                  className="hidden" />
              </div>
            </div>

            {error && <div className="alert-error text-sm">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center" id="submit-evidence">
              {loading ? <span className="spinner" /> : <>Register Evidence</>}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function RegisterEvidencePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterEvidenceForm />
    </Suspense>
  );
}
