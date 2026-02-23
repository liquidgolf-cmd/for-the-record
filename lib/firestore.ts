import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDbInstance } from "./firebase";
const getDb = () => getDbInstance();
import { v4 as uuidv4 } from "uuid";

// ── Types ──────────────────────────────────────────────

export interface TranscriptMessage {
  role: "georgia" | "user";
  content: string;
}

export interface Story {
  id:                string;
  title:             string;
  body:              string;
  threeWords:        [string, string, string];
  tags:              string[];
  mood:              string;
  themes:            string[];
  date:              string;       // ISO date string (YYYY-MM-DD)
  createdAt:         Timestamp | null;
  sessionTranscript: TranscriptMessage[];
}

export interface UserProfile {
  name:                string;
  email:               string;
  createdAt:           Timestamp | null;
  notificationsEnabled: boolean;
  notificationTime:    string;   // "HH:MM" 24h format
}

// ── Story CRUD ────────────────────────────────────────

export async function saveStory(
  userId: string,
  story: Omit<Story, "id" | "createdAt">
): Promise<string> {
  const id = uuidv4();
  const ref = doc(getDb(), "users", userId, "stories", id);
  await setDoc(ref, {
    ...story,
    id,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function getStory(
  userId: string,
  storyId: string
): Promise<Story | null> {
  const ref = doc(getDb(), "users", userId, "stories", storyId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Story) : null;
}

export async function getAllStories(userId: string): Promise<Story[]> {
  const ref = collection(getDb(), "users", userId, "stories");
  const q   = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Story);
}

export async function updateStory(
  userId: string,
  storyId: string,
  updates: Partial<Omit<Story, "id" | "createdAt">>
): Promise<void> {
  const ref = doc(getDb(), "users", userId, "stories", storyId);
  await updateDoc(ref, updates);
}

export async function deleteStory(
  userId: string,
  storyId: string
): Promise<void> {
  const ref = doc(getDb(), "users", userId, "stories", storyId);
  await deleteDoc(ref);
}

// ── User Profile ─────────────────────────────────────

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const ref  = doc(getDb(), "users", userId, "profile", "data");
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function saveUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const ref = doc(getDb(), "users", userId, "profile", "data");
  await setDoc(ref, profile, { merge: true });
}
