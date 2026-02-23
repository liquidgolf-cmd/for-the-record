"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut }          from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import { useAuth }   from "@/hooks/useAuth";
import NotificationSettings from "@/components/NotificationSettings";
import Image                from "next/image";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  async function handleSignOut() {
    await signOut(getAuthInstance());
    router.replace("/login");
  }

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
    <div className="min-h-screen bg-studio">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-cream/[0.06]">
        <a href="/">
          <Image src="/ftr-text.png" alt="For the Record" width={140} height={25} />
        </a>
        <div className="flex items-center gap-5">
          <a href="/archive" className="text-sm text-cream/40 hover:text-amber transition-warm">
            Archive
          </a>
          <span className="text-sm text-cream/70">Settings</span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-10 space-y-10 animate-fade-in">
        <h1 className="font-georgia text-2xl text-cream">Settings</h1>

        {/* ── Account ── */}
        <section>
          <h2 className="text-xs text-cream/30 uppercase tracking-widest font-sans mb-4">
            Account
          </h2>
          <div className="bg-cream/[0.04] rounded border border-cream/[0.08] p-4 flex items-center gap-4">
            {user.photoURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName ?? ""}
                className="w-10 h-10 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <p className="text-cream font-sans font-medium text-sm">
                {user.displayName}
              </p>
              <p className="text-cream/40 text-xs">
                {user.email}
              </p>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ── Notifications ── */}
        <section>
          <h2 className="text-xs text-cream/30 uppercase tracking-widest font-sans mb-4">
            Daily Reminder
          </h2>
          <NotificationSettings userId={user.uid} />
        </section>

        <hr className="divider" />

        {/* ── Sign out ── */}
        <section>
          <button
            onClick={handleSignOut}
            className="btn-ghost text-sm text-cream/50 hover:text-red/70 hover:border-red/30"
          >
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}
