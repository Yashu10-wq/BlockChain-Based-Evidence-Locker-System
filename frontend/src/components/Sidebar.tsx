"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * ── Sidebar ───────────────────────────────────────────────────
 * White professional sidebar with role-based navigation.
 * SRS Section 2.3 — User Classes: Officer, Custodian, Admin, Forensic Technician
 */

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const NAV_ITEMS: Record<string, { label: string; href: string; icon: string }[]> = {
  Officer: [
    { label: "Dashboard",          href: "/dashboard",          icon: "📊" },
    { label: "Register Crime",     href: "/crimes/register",    icon: "📋" },
    { label: "Custody Transfer",    href: "/custody",            icon: "🔗" },
  ],
  Custodian: [
    { label: "Dashboard",          href: "/dashboard",          icon: "📊" },
    { label: "Custody Transfer",    href: "/custody",            icon: "🔗" },
  ],
  Admin: [
    { label: "Dashboard",          href: "/dashboard",          icon: "📊" },
    { label: "Register Crime",     href: "/crimes/register",    icon: "📋" },
    { label: "Integrity Audit",     href: "/audit",              icon: "🛡️" },
  ],
  "Forensic Technician": [
    { label: "Dashboard",          href: "/dashboard",          icon: "📊" },
    { label: "Custody Transfer",    href: "/custody",            icon: "🔗" },
    { label: "Forensic Reports",    href: "/forensic",           icon: "🔬" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const items = user ? NAV_ITEMS[user.role] || NAV_ITEMS.Officer : [];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40">
      {/* ── Logo / Brand ──────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
               style={{ background: '#002366' }}>
            EL
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-wide">
              EVIDENCE LOCKER
            </h1>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase">
              Police Service
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Navigation
        </p>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-blue-50 text-blue-900 font-semibold border border-blue-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </Link>
          );
        })}
      </nav>

      {/* ── User Info + Logout ─────────────────────────────── */}
      {user && (
        <div className="px-4 py-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                 style={{ background: '#002366' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-xs text-slate-400 hover:text-red-600 transition-colors py-1.5 rounded-md hover:bg-red-50 border border-transparent hover:border-red-100">
            ← Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
