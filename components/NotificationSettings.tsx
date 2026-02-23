"use client";

import { useState, useEffect } from "react";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { requestNotificationPermission } from "@/lib/notifications";

interface NotificationSettingsProps {
  userId: string;
}

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [time,    setTime]    = useState("20:00");
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState<string | null>(null);

  useEffect(() => {
    getUserProfile(userId).then((p) => {
      if (p) {
        setEnabled(p.notificationsEnabled ?? false);
        setTime(p.notificationTime ?? "20:00");
      }
    });
  }, [userId]);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);

    if (next) {
      // Request FCM permission
      const token = await requestNotificationPermission();
      if (!token) {
        setEnabled(false);
        setStatus("Notification permission was denied. Check your browser settings.");
        return;
      }
      setStatus("Notifications enabled.");
    } else {
      setStatus(null);
    }

    await saveUserProfile(userId, { notificationsEnabled: next });
  }

  async function handleSaveTime() {
    setSaving(true);
    await saveUserProfile(userId, { notificationTime: time });
    setSaving(false);
    setStatus("Reminder time saved.");
    setTimeout(() => setStatus(null), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-cream font-sans font-medium">Daily reminder</p>
          <p className="text-cream/40 text-sm mt-0.5">
            Georgia will invite you in once a day.
          </p>
        </div>
        <button
          onClick={handleToggle}
          aria-pressed={enabled}
          className={[
            "relative w-12 h-6 rounded-full transition-warm",
            enabled ? "bg-amber" : "bg-cream/10",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
              enabled ? "left-7" : "left-1",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Time picker */}
      {enabled && (
        <div className="flex items-center gap-3 animate-fade-in">
          <label className="text-cream/60 text-sm font-sans whitespace-nowrap">
            Remind me at
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input-warm w-auto"
          />
          <button
            onClick={handleSaveTime}
            disabled={saving}
            className="btn-primary py-2 px-4 text-sm"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      {/* Status message */}
      {status && (
        <p className="text-sm text-amber/80 animate-fade-in">{status}</p>
      )}
    </div>
  );
}
