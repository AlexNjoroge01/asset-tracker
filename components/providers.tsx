"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import {
  applyPreset,
  getPresetById,
  STORAGE_KEY_PRESET,
} from "@/lib/themes";

/* Applies the saved color preset whenever the mode (dark/light) changes */
function PresetApplier() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_PRESET) ?? "violet-space";
    const preset  = getPresetById(savedId);
    applyPreset(preset.hue, resolvedTheme === "dark");
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <PresetApplier />
      {children}
    </ThemeProvider>
  );
}
