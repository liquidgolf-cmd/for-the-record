"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { signInWithPopup }     from "firebase/auth";
import { getAuthInstance, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth }             from "@/hooks/useAuth";
import { saveUserProfile }     from "@/lib/firestore";
import Image                   from "next/image";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Redirect already-logged-in users
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError(null);
    try {
      const result = await signInWithPopup(getAuthInstance(), googleProvider);
      const u = result.user;
      await saveUserProfile(u.uid, {
        name:                 u.displayName || "",
        email:                u.email       || "",
        notificationsEnabled: false,
        notificationTime:     "20:00",
      });
      router.replace("/");
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "";
      console.error("[FTR] signIn error:", code, e);
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // user dismissed — no message needed
      } else if (code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (code === "auth/unauthorized-domain") {
        setError("Domain not authorized — add fortherecord.loamstrategy.com in Firebase Console → Authentication → Settings → Authorized domains.");
      } else {
        setError(`Sign-in failed. (${code || "unknown"})`);
      }
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-studio flex items-center justify-center">
        <span className="georgia-text text-cream/30 text-lg animate-pulse">
          For the Record
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studio flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-fade-up">

        {/* Brand mark */}
        <div className="mb-10">
          <div className="flex justify-center mb-5">
            <Image src="/ftr-on-air.png" alt="ON AIR" width={110} height={41} priority />
          </div>
          <div className="flex justify-center mb-5">
            <Image src="/ftr-mic.png" alt="" width={150} height={263} priority />
          </div>
          <div className="flex justify-center mb-6">
            <Image src="/ftr-text.png" alt="For the Record" width={270} height={47} priority />
          </div>
          <p className="text-cream/40 text-sm font-sans leading-relaxed tracking-wide">
            Your life is worth recording. Every day.
          </p>
        </div>

        {/* Sign in / setup message */}
        {!isFirebaseConfigured ? (
          <div className="rounded bg-cream/10 border border-cream/20 px-4 py-4 text-left">
            <p className="text-cream/80 font-sans text-sm font-medium mb-2">
              Firebase not configured
            </p>
            <p className="text-cream/60 text-sm font-sans leading-relaxed">
              Add <code className="text-cream/80">NEXT_PUBLIC_FIREBASE_API_KEY</code>,{" "}
              <code className="text-cream/80">NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>, and{" "}
              <code className="text-cream/80">NEXT_PUBLIC_FIREBASE_APP_ID</code> to{" "}
              <code className="text-cream/80">.env.local</code>. Get values from Firebase Console → Project Settings → General → Your apps. Restart the dev server after saving.
            </p>
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded bg-cream text-dark-brown font-sans font-semibold text-sm transition-warm hover:bg-cream-dark active:scale-[0.98] disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {signingIn ? "Signing in…" : "Continue with Google"}
          </button>
        )}

        {error && (
          <p className="mt-4 text-sm text-red/70 animate-fade-in leading-relaxed">{error}</p>
        )}

        <p className="mt-8 text-xs text-cream/20 font-sans leading-relaxed">
          Your stories are private and belong to you.
        </p>
      </div>
    </div>
  );
}
