"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Root page — redirect to /dashboard if logged in, /login otherwise */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="pulse-dot" />
    </div>
  );
}
