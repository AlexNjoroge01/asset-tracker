"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyPreset, getPresetById, STORAGE_KEY_PRESET } from "@/lib/themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = resolvedTheme === "dark";

  function toggle() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    // Re-apply current preset for the new mode
    const saved  = localStorage.getItem(STORAGE_KEY_PRESET) ?? "violet-space";
    const preset = getPresetById(saved);
    applyPreset(preset.hue, next === "dark");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
    >
      {isDark ? (
        <Sun  className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
