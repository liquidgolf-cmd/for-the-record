"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Story } from "@/lib/firestore";
import { updateStory, deleteStory } from "@/lib/firestore";

interface StoryDetailProps {
  story:  Story;
  userId: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month:   "long",
      day:     "numeric",
      year:    "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function StoryDetail({ story, userId }: StoryDetailProps) {
  const router = useRouter();

  const [isEditing,   setIsEditing]   = useState(false);
  const [editTitle,   setEditTitle]   = useState(story.title);
  const [editBody,    setEditBody]    = useState(story.body);
  const [editTags,    setEditTags]    = useState(story.tags?.join(", ") || "");
  const [saving,      setSaving]      = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateStory(userId, story.id, {
      title: editTitle,
      body:  editBody,
      tags:  editTags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
    setIsEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    await deleteStory(userId, story.id);
    router.push("/archive");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      {/* Back */}
      <a
        href="/archive"
        className="inline-flex items-center gap-2 text-sm text-cream/40 hover:text-amber transition-warm mb-8"
      >
        ← Back to archive
      </a>

      {/* Date */}
      <time className="block text-sm font-sans uppercase tracking-wider text-tobacco mb-3">
        {formatDate(story.date)}
      </time>

      {/* Title */}
      {isEditing ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="input-warm font-georgia text-2xl font-bold mb-4 text-dark-brown bg-cream-dark border-tobacco/30"
          style={{ color: "#2C1810", backgroundColor: "#E8DFC8" }}
        />
      ) : (
        <h1 className="font-georgia text-3xl sm:text-4xl font-bold text-cream mb-4 leading-tight">
          {story.title}
        </h1>
      )}

      {/* Three words */}
      <div className="flex flex-wrap gap-2 mb-6">
        {story.threeWords?.filter(Boolean).map((w, i) => (
          <span key={i} className="tag-pill">
            {w}
          </span>
        ))}
        {story.mood && (
          <span className="tag-pill opacity-70">{story.mood}</span>
        )}
      </div>

      <hr className="divider" />

      {/* Body */}
      {isEditing ? (
        <textarea
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          rows={12}
          className="input-warm leading-relaxed resize-y"
        />
      ) : (
        <div className="space-y-4 mb-8">
          {story.body?.split("\n\n").map((para, i) => (
            <p key={i} className="text-cream/85 text-base leading-relaxed font-georgia">
              {para}
            </p>
          ))}
        </div>
      )}

      {/* Tags */}
      {isEditing ? (
        <div className="mt-4">
          <label className="block text-xs text-cream/40 mb-1 uppercase tracking-wider">
            Tags (comma-separated)
          </label>
          <input
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="input-warm"
            placeholder="memory, family, work…"
          />
        </div>
      ) : story.themes?.length > 0 ? (
        <div className="flex flex-wrap gap-2 mt-6">
          {story.themes.map((t, i) => (
            <span key={i} className="tag-pill opacity-80">{t}</span>
          ))}
        </div>
      ) : null}

      <hr className="divider" />

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {isEditing ? (
          <>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button onClick={() => setIsEditing(false)} className="btn-ghost">
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} className="btn-ghost">
              Edit story
            </button>
            {/* Share — post-MVP, disabled */}
            <button
              disabled
              title="Sharing coming soon"
              className="btn-ghost opacity-30 cursor-not-allowed"
            >
              Share
            </button>
          </>
        )}

        {/* Delete */}
        {!isEditing && (
          confirmDel ? (
            <div className="flex gap-2 items-center ml-auto">
              <span className="text-sm text-cream/50">Delete this story?</span>
              <button
                onClick={handleDelete}
                className="text-sm text-red/80 hover:text-red transition-warm"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="text-sm text-cream/40 hover:text-cream/70 transition-warm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="text-sm text-cream/30 hover:text-red/70 transition-warm ml-auto"
            >
              Delete
            </button>
          )
        )}
      </div>
    </div>
  );
}
