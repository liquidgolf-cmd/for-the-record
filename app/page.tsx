"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth }   from "@/hooks/useAuth";
import SessionManager from "@/components/SessionManager";
import Image          from "next/image";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-studio flex items-center justify-center">
        <span className="georgia-text text-cream/30 text-lg animate-pulse">
          For the Record
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studio flex flex-col">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-cream/[0.06]">
        <a href="/">
          <Image src="/logo.png" alt="For the Record" width={40} height={40} className="rounded-md" />
        </a>
        <div className="flex items-center gap-5">
          <a
            href="/archive"
            className="text-sm text-cream/40 hover:text-amber transition-warm"
          >
            Archive
          </a>
          <a
            href="/settings"
            className="text-sm text-cream/40 hover:text-amber transition-warm"
          >
            Settings
          </a>
        </div>
      </nav>

      {/* ── Main session area ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <SessionManager userId={user.uid} />
      </main>

      {/* ── Footer ── */}
      <footer className="py-4 text-center">
        <p className="text-xs text-cream/15 font-sans tracking-wider">
          For the Record
        </p>
      </footer>
    </div>
  );
}
