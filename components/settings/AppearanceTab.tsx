"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Sun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  THEME_PRESETS,
  DEFAULT_PRESET_ID,
  applyPreset,
  getPresetById,
  STORAGE_KEY_PRESET,
  type ThemePreset,
} from "@/lib/themes";

/* ── Mode card ──────────────────────────────── */
interface ModeOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const MODES: ModeOption[] = [
  {
    id: "system",
    label: "System preference",
    description: "Follows your OS setting automatically.",
    icon: Monitor,
  },
  {
    id: "light",
    label: "Light mode",
    description: "Light and bright for readability.",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark mode",
    description: "Reduced glare and blue light.",
    icon: Moon,
  },
];

function ModeCard({
  option,
  active,
  onClick,
}: {
  option: ModeOption;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
        "hover:border-primary/50 hover:bg-accent/30",
        active
          ? "border-primary bg-primary/8 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
          : "border-border bg-card"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm", active ? "text-primary" : "text-foreground")}>
          {option.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
      </div>
      {active && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

/* ── Preset swatch ──────────────────────────── */
function PresetCard({
  preset,
  active,
  onClick,
}: {
  preset: ThemePreset;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
        "hover:border-primary/50 hover:bg-accent/20",
        active
          ? "border-primary bg-primary/8 shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]"
          : "border-border bg-card"
      )}
    >
      {/* Gradient swatch */}
      <div
        className="h-12 w-12 shrink-0 rounded-lg shadow-sm"
        style={{ background: preset.gradient }}
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm", active ? "text-primary" : "text-foreground")}>
          {preset.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{preset.description}</p>
      </div>

      {/* Selected check */}
      {active ? (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border border-border/50 group-hover:border-primary/30 transition-colors" />
      )}
    </button>
  );
}

/* ── Main component ─────────────────────────── */
export function AppearanceTab() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY_PRESET) ?? DEFAULT_PRESET_ID;
    setPresetId(saved);
  }, []);

  function handleSetMode(id: string) {
    setTheme(id);
  }

  function handleSetPreset(preset: ThemePreset) {
    setPresetId(preset.id);
    localStorage.setItem(STORAGE_KEY_PRESET, preset.id);
    applyPreset(preset.hue, resolvedTheme === "dark");
  }

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 rounded-xl bg-muted/40" />
        <div className="h-64 rounded-xl bg-muted/40" />
      </div>
    );
  }

  const currentMode = theme ?? "dark";

  return (
    <div className="space-y-8">
      {/* ── Mode section ── */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Appearance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose if the app should be light, dark, or follow your system settings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <ModeCard
              key={m.id}
              option={m}
              active={currentMode === m.id}
              onClick={() => handleSetMode(m.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Preset section ── */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Theme presets</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose an accent colour. It applies instantly across the whole app.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {THEME_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              active={presetId === preset.id}
              onClick={() => handleSetPreset(preset)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
