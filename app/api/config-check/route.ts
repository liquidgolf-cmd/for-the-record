import { NextResponse } from "next/server";

// Quick diagnostic — visit /api/config-check in your browser to see
// which server-side env vars Vercel can see (values are never exposed).
export async function GET() {
  return NextResponse.json({
    GOOGLE_TTS_API_KEY:  !!process.env.GOOGLE_TTS_API_KEY,
    ANTHROPIC_API_KEY:   !!process.env.ANTHROPIC_API_KEY,
    FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}
