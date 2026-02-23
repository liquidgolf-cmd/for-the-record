import { getMessagingInstance } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;

const NOTIFICATION_MESSAGES = [
  "Georgia's ready when you are. What happened today?",
  "Your story from today is waiting to be told.",
  "One question. A few minutes. Something worth keeping.",
  "Ready when you are. The light's on.",
  "Don't let today get away. Georgia's listening.",
];

export function getRotatingMessage(lastIndex?: number): { message: string; index: number } {
  let index: number;
  do {
    index = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length);
  } while (index === lastIndex && NOTIFICATION_MESSAGES.length > 1);
  return { message: NOTIFICATION_MESSAGES[index], index };
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
}

export async function setupForegroundNotifications() {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    // Show in-app notification when app is in foreground
    if (payload.notification) {
      const { title, body } = payload.notification;
      // You can dispatch a custom event here for the UI to pick up
      const event = new CustomEvent("ftr-notification", { detail: { title, body } });
      window.dispatchEvent(event);
    }
  });
}
