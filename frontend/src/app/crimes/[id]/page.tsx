"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Crime {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface Evidence {
  id: number;
  crime_id: number;
  title: string;
  description: string;
  location_found: string;
  locked: boolean;
  created_at: string;
  isCorrupted?: boolean;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function CrimeFolderPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [crime, setCrime] = useState<Crime | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    const fetchCrimeData = async () => {
      try {
        const crimeRes = await api.get(`/crimes/${id}`);
        setCrime(crimeRes.data.crime);

        const evidenceRes = await api.get("/evidence/all");
        // Filter out only evidence for this crime AND visible to this user
        const crimeEvidence = evidenceRes.data.evidence.filter((e: Evidence) => String(e.crime_id) === String(id));
        setEvidence(crimeEvidence);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCrimeData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="md:md:ml-64 flex-1 p-4 md:p-8 min-h-screen flex items-center justify-center">
          <span className="spinner" />
        </main>
      </div>
    );
  }

  if (!crime) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="md:md:ml-64 flex-1 p-4 md:p-8 min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Crime not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />

      <main className="md:md:ml-64 flex-1 p-4 md:p-8 min-h-screen">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-sm text-blue-600 mb-2 font-medium">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-500">Crime #{crime.id}</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">{crime.title}</h2>
          <p className="text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {crime.description}
          </p>
          <p className="text-xs text-slate-400 mt-4">Registered: {new Date(crime.created_at).toLocaleString()}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">Evidence in this Folder</h3>
            {(user?.role === "Officer" || user?.role === "Admin") && (
              <Link href={`/evidence/register?crime_id=${crime.id}`} className="btn-primary text-sm">
                + Register Evidence Here
              </Link>
            )}
          </div>

          {evidence.length === 0 ? (
            <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">No evidence associated with this crime yet, or you do not have custody of any.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>Title</th>
                    <th>Location Found</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((e) => (
                    <tr key={e.id} className={e.isCorrupted ? "bg-red-50/60" : ""}>
                      <td className="font-mono text-xs text-slate-400">#{e.id}</td>
                      <td className="font-medium text-slate-900">{e.title}</td>
                      <td className="text-slate-500">{e.location_found}</td>
                      <td>
                        {e.isCorrupted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            ⚠ CORRUPTED
                          </span>
                        ) : (
                          <span className={`badge ${e.locked ? "badge-success" : "badge-warning"}`}>
                            {e.locked ? "Locked" : "Open"}
                          </span>
                        )}
                      </td>
                      <td>
                        {e.isCorrupted ? (
                          <span className="text-red-400 text-xs font-medium px-3 py-1 rounded bg-red-50 border border-red-100 cursor-not-allowed">
                            🔒 Locked — Tampered
                          </span>
                        ) : (
                          <Link href={`/evidence/${e.id}`}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-3 py-1 rounded">
                            View Details →
                          </Link>
                        )}
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
