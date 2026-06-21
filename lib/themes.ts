/* ─────────────────────────────────────────────
   Theme preset definitions
   Each preset is defined by a hue (0-360).
   All other CSS variables (accent, ring, sidebar)
   are derived from that single hue so the whole
   app updates from one value.
───────────────────────────────────────────── */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  hue: number;
  gradient: string; // CSS gradient for the preview swatch
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "violet-space",
    name: "Violet Space",
    description: "Deep purple, the default cosmic theme.",
    hue: 267,
    gradient: "linear-gradient(135deg, #3b0764 0%, #7c3aed 50%, #a78bfa 100%)",
  },
  {
    id: "indigo",
    name: "Indigo",
    description: "Rich indigo, calm and focused.",
    hue: 242,
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #818cf8 100%)",
  },
  {
    id: "electric-blue",
    name: "Electric Blue",
    description: "Bold blue, sharp and confident.",
    hue: 221,
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)",
  },
  {
    id: "sky",
    name: "Sky",
    description: "Crisp sky blue, clean and open.",
    hue: 199,
    gradient: "linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 50%, #7dd3fc 100%)",
  },
  {
    id: "teal",
    name: "Teal",
    description: "Cool teal, balanced and fresh.",
    hue: 175,
    gradient: "linear-gradient(135deg, #134e4a 0%, #14b8a6 50%, #5eead4 100%)",
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Vibrant green, growth and energy.",
    hue: 158,
    gradient: "linear-gradient(135deg, #064e3b 0%, #10b981 50%, #6ee7b7 100%)",
  },
  {
    id: "lime",
    name: "Lime",
    description: "Bright lime, vivid and electric.",
    hue: 84,
    gradient: "linear-gradient(135deg, #1a2e05 0%, #65a30d 50%, #bef264 100%)",
  },
  {
    id: "amber",
    name: "Amber",
    description: "Warm amber, golden and energetic.",
    hue: 38,
    gradient: "linear-gradient(135deg, #78350f 0%, #f59e0b 50%, #fde68a 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Fiery orange, vivid and warm.",
    hue: 22,
    gradient: "linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fdba74 100%)",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Soft rose, elegant and warm.",
    hue: 342,
    gradient: "linear-gradient(135deg, #881337 0%, #f43f5e 50%, #fda4af 100%)",
  },
  {
    id: "fuchsia",
    name: "Fuchsia",
    description: "Vivid fuchsia, bold and expressive.",
    hue: 292,
    gradient: "linear-gradient(135deg, #4a044e 0%, #a855f7 50%, #e879f9 100%)",
  },
  {
    id: "crimson",
    name: "Crimson",
    description: "Deep crimson, powerful and striking.",
    hue: 0,
    gradient: "linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #fca5a5 100%)",
  },
];

export const DEFAULT_PRESET_ID = "violet-space";

/* ─────────────────────────────────────────────
   Build the CSS variable overrides from a hue
───────────────────────────────────────────── */
export function buildPresetVars(
  hue: number,
  dark: boolean
): Record<string, string> {
  if (dark) {
    return {
      "--primary":                    `${hue} 84% 63%`,
      "--ring":                       `${hue} 84% 63%`,
      "--accent":                     `${hue} 38% 18%`,
      "--accent-foreground":          `${hue} 90% 82%`,
      "--sidebar-primary":            `${hue} 84% 63%`,
      "--sidebar-accent":             `${hue} 38% 16%`,
      "--sidebar-accent-foreground":  `${hue} 90% 82%`,
      "--sidebar-ring":               `${hue} 84% 63%`,
    };
  }
  return {
    "--primary":                    `${hue} 84% 55%`,
    "--ring":                       `${hue} 84% 55%`,
    "--accent":                     `${hue} 30% 91%`,
    "--accent-foreground":          `${hue} 70% 35%`,
    "--sidebar-primary":            `${hue} 84% 55%`,
    "--sidebar-accent":             `${hue} 28% 89%`,
    "--sidebar-accent-foreground":  `${hue} 70% 35%`,
    "--sidebar-ring":               `${hue} 84% 55%`,
  };
}

/* ─────────────────────────────────────────────
   Apply preset CSS vars to documentElement
   (inline style beats stylesheet specificity)
───────────────────────────────────────────── */
export function applyPreset(hue: number, dark: boolean) {
  const vars = buildPresetVars(hue, dark);
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v);
  }
}

export function getPresetById(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

export const STORAGE_KEY_PRESET = "app-theme-preset";
