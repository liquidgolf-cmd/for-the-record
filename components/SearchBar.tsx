"use client";

interface SearchBarProps {
  value:          string;
  onChange:       (v: string) => void;
  moodFilter:     string;
  onMoodChange:   (v: string) => void;
  themeFilter:    string;
  onThemeChange:  (v: string) => void;
  availableMoods:  string[];
  availableThemes: string[];
}

export default function SearchBar({
  value,
  onChange,
  moodFilter,
  onMoodChange,
  themeFilter,
  onThemeChange,
  availableMoods,
  availableThemes,
}: SearchBarProps) {
  return (
    <div className="flex flex-col gap-3 mb-8">
      {/* Search input */}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search stories…"
        className="input-warm text-base"
      />

      {/* Filter row */}
      {(availableMoods.length > 0 || availableThemes.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {/* Mood filter */}
          {availableMoods.length > 0 && (
            <select
              value={moodFilter}
              onChange={(e) => onMoodChange(e.target.value)}
              className="input-warm text-sm py-1.5 w-auto min-w-[130px]"
              style={{ backgroundColor: "rgba(245,240,232,0.06)" }}
            >
              <option value="">All moods</option>
              {availableMoods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Theme filter */}
          {availableThemes.length > 0 && (
            <select
              value={themeFilter}
              onChange={(e) => onThemeChange(e.target.value)}
              className="input-warm text-sm py-1.5 w-auto min-w-[130px]"
              style={{ backgroundColor: "rgba(245,240,232,0.06)" }}
            >
              <option value="">All themes</option>
              {availableThemes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {(moodFilter || themeFilter || value) && (
            <button
              onClick={() => { onMoodChange(""); onThemeChange(""); onChange(""); }}
              className="text-sm text-cream/40 hover:text-amber transition-warm"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
