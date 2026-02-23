import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  GEORGIA_SYSTEM_PROMPT,
  WRAP_UP_PROMPT,
  formatTranscriptForClaude,
  parseStoryFromResponse,
} from "@/lib/georgia";
import { TranscriptMessage } from "@/lib/firestore";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      wrapUp      = false,
      forceStory  = false,
    }: {
      messages:    TranscriptMessage[];
      wrapUp?:     boolean;
      forceStory?: boolean;
    } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const formattedMessages = formatTranscriptForClaude(messages);

    // Ensure messages start with 'user' role for Claude API
    // (Georgia's opening is assistant, then user responds — this is correct)

    if (wrapUp || forceStory) {
      // Ask Claude to generate the story JSON
      formattedMessages.push({
        role:    "user",
        content: WRAP_UP_PROMPT,
      });
    }

    const response = await anthropic.messages.create({
      model:      "claude-opus-4-5",
      max_tokens: 1024,
      system:     GEORGIA_SYSTEM_PROMPT,
      messages:   formattedMessages,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No text response from Claude" }, { status: 500 });
    }

    const responseText = textContent.text;

    // If wrapping up, try to parse story JSON
    if (wrapUp || forceStory) {
      const story = parseStoryFromResponse(responseText);
      if (story) {
        return NextResponse.json({ story });
      }
      // If JSON parse fails, return as a regular message
    }

    // Regular interview turn
    return NextResponse.json({ message: responseText });
  } catch (error) {
    console.error("Georgia API error:", error);
    return NextResponse.json(
      { error: "Georgia is unavailable right now. Please try again." },
      { status: 500 }
    );
  }
}
