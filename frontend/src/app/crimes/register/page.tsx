"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";

export default function RegisterCrimePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/crimes/register", {
        title,
        description,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to register crime.");
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="card max-w-lg w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Register New Crime</h2>
          <p className="text-sm text-slate-500 mb-6">Create a new folder to organize related evidence.</p>

          {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">Crime Title / Case Name</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                className="input-field" placeholder="e.g. Downtown Bank Robbery" />
            </div>

            <div>
              <label className="field-label">Description & Details</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[100px]" placeholder="Summary of the incident..." />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-4">
              {loading ? <span className="spinner" /> : "Create Crime Folder"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
