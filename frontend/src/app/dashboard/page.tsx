"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

/**
 * ── Officer Dashboard ─────────────────────────────────────────
 * White cards with subtle shadows, stats and recent evidence table.
 */

interface Crime {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [crimes, setCrimes]       = useState<Crime[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    api.get("/crimes/all")
      .then(({ data }) => setCrimes(data.crimes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const totalCrimes = crimes.length;

  const stats = [
    { label: "Total Crimes",    value: totalCrimes,  icon: "📁", color: "#002366",  bg: "#EFF6FF" },
    { label: "Active Officers", value: "—",          icon: "👮", color: "#16A34A",  bg: "#F0FDF4" },
    { label: "System Status",   value: "Online",     icon: "⚡", color: "#D97706",  bg: "#FFFBEB" },
  ];

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 flex-1 p-8 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name || "Officer"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role} Dashboard — Evidence Management System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg"
                   style={{ background: stat.bg }}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Evidence Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">Crime Folders</h3>
            {(user?.role === "Officer" || user?.role === "Admin") && (
              <Link href="/crimes/register" className="btn-primary text-sm" id="register-new-btn">
                + Register New Crime
              </Link>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <span className="spinner" />
            </div>
          ) : crimes.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm">No crimes registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Crime Title</th>
                    <th>Description</th>
                    <th>Date Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {crimes.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono text-xs text-slate-400">#{c.id}</td>
                      <td className="font-medium text-slate-900">{c.title}</td>
                      <td className="text-slate-500 max-w-xs truncate">{c.description}</td>
                      <td className="text-slate-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link href={`/crimes/${c.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-3 py-1 rounded">
                          Open Folder →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
