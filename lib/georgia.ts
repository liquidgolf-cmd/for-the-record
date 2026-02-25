import { TranscriptMessage } from "./firestore";

// ── Georgia's system prompt ────────────────────────────
export const GEORGIA_SYSTEM_PROMPT = `You are Georgia, a warm, patient, and genuinely curious female voice guide for an app called "For the Record." Your job is to interview the user about their day and help them capture a meaningful story.

Rules:
- Ask only ONE question at a time. Never stack questions.
- Keep your responses short — 1-2 sentences maximum.
- Never say "Great!" or "Awesome!" — avoid empty affirmations.
- Be warm but not performative. Sound like a trusted friend, not a chatbot.
- Ask follow-ups that go one layer deeper: feelings, people, significance.
- After 3-5 exchanges, offer to wrap up and shape the story.
- When wrapping up, generate: a story title, a 2-3 paragraph narrative, three key words, a mood, and 2-3 theme tags.
- Return the final story as JSON: { title, body, threeWords, mood, themes }`;

// ── Opening questions — rotate by day of year ─────────
const OPENING_QUESTIONS: string[] = [
  "What from today is still with you — a moment, a feeling, a conversation, anything at all?",
  "What's lingering from today — something you saw, felt, said, or wondered about?",
  "What moment from today do you find yourself returning to?",
  "Something from today is still with you. What is it?",
  "What from today hasn't quite let go of you yet?",
  "What did today stir in you — big or small, expected or not?",
  "What's still alive in you from today — a thought, a feeling, a face, a moment?",
  "What did you carry home from today without meaning to?",
  "If today left a mark on you, what would it be?",
  "What's one thing from today you don't want to lose?",
];

export function getTodaysOpeningQuestion(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return OPENING_QUESTIONS[dayOfYear % OPENING_QUESTIONS.length];
}

// ── Wrap-up prompt appended after 3-5 user turns ──────
export const WRAP_UP_PROMPT = `Based on our conversation so far, please shape this into a story entry. Return ONLY valid JSON with this exact structure:
{
  "title": "A short, evocative story title",
  "body": "A 2-3 paragraph narrative in warm, first-person prose",
  "threeWords": ["word1", "word2", "word3"],
  "mood": "one word mood (e.g. reflective, grateful, curious, bittersweet)",
  "themes": ["theme1", "theme2"]
}`;

// ── Format transcript for Claude API ──────────────────
export function formatTranscriptForClaude(
  transcript: TranscriptMessage[]
): { role: "user" | "assistant"; content: string }[] {
  return transcript.map((msg) => ({
    role:    msg.role === "georgia" ? "assistant" : "user",
    content: msg.content,
  }));
}

// ── Parse story JSON from Claude response ─────────────
export interface GeneratedStory {
  title:      string;
  body:       string;
  threeWords: [string, string, string];
  mood:       string;
  themes:     string[];
}

export function parseStoryFromResponse(text: string): GeneratedStory | null {
  try {
    // Extract JSON block — Claude sometimes wraps it in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (
      !parsed.title ||
      !parsed.body ||
      !Array.isArray(parsed.threeWords) ||
      !parsed.mood ||
      !Array.isArray(parsed.themes)
    ) {
      return null;
    }

    return {
      title:      String(parsed.title),
      body:       String(parsed.body),
      threeWords: [
        String(parsed.threeWords[0] || ""),
        String(parsed.threeWords[1] || ""),
        String(parsed.threeWords[2] || ""),
      ],
      mood:   String(parsed.mood),
      themes: parsed.themes.map(String),
    };
  } catch {
    return null;
  }
}
