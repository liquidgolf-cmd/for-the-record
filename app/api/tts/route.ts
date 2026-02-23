import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY!;
const TTS_ENDPOINT = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`;

export async function POST(req: NextRequest) {
  try {
    const { text }: { text: string } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Truncate to Google TTS limit
    const truncatedText = text.slice(0, 5000);

    const ttsRequest = {
      input: { text: truncatedText },
      voice: {
        languageCode: "en-US",
        name:         "en-US-Neural2-F",   // Warm female neural voice
        ssmlGender:   "FEMALE",
      },
      audioConfig: {
        audioEncoding:   "MP3",
        speakingRate:    0.92,   // Slightly slower — unhurried, Georgia's pace
        pitch:           -1.0,   // Slightly lower — warmer, more grounded
        volumeGainDb:    0.0,
        effectsProfileId: ["headphone-class-device"],
      },
    };

    const response = await fetch(TTS_ENDPOINT, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(ttsRequest),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Google TTS error:", errorBody);
      return NextResponse.json(
        { error: "TTS service unavailable" },
        { status: 502 }
      );
    }

    const data: { audioContent: string } = await response.json();

    // Google returns base64-encoded MP3
    const audioBuffer = Buffer.from(data.audioContent, "base64");

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "audio/mpeg",
        "Content-Length":      String(audioBuffer.length),
        "Cache-Control":       "no-store",
      },
    });
  } catch (error) {
    console.error("TTS route error:", error);
    return NextResponse.json(
      { error: "TTS processing failed" },
      { status: 500 }
    );
  }
}
