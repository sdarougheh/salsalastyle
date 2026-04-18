// Theme — Copper-Green palette + Modern typography (single direction).

const PALETTE_LIGHT = {
  bg:        "#F6F1E7",
  surface:   "#FFFFFF",
  ink:       "#1B2420",
  inkSoft:   "#4E5E57",
  line:      "#D9D3C4",
  accent:    "#E05A2B",  // sunset orange
  accent2:   "#3F6E5E",  // copper-oxidized green
  accentInk: "#FFFFFF",
  chip:      "#E1ECE6",
  heroTint:  "linear-gradient(140deg, #F4A259 0%, #E05A2B 45%, #3F6E5E 100%)",
};

const PALETTE_DARK = {
  bg:        "#0F1512",
  surface:   "#162019",
  ink:       "#F1EADA",
  inkSoft:   "#B7C0B9",
  line:      "#2A3630",
  accent:    "#F4783F",
  accent2:   "#6FA38F",
  accentInk: "#0F1512",
  chip:      "#1F2A24",
  heroTint:  "linear-gradient(140deg, #F4A259 0%, #E05A2B 45%, #1F3A31 100%)",
};

const FONT = {
  display: '"Bricolage Grotesque", "Inter", system-ui, sans-serif',
  body:    '"Inter", system-ui, -apple-system, sans-serif',
  displayWeight: 700,
  displayTracking: "-0.035em",
  displayItalic: false,
};

function applyTheme(_palette, _fontKey, dark) {
  const p = dark ? PALETTE_DARK : PALETTE_LIGHT;
  const r = document.documentElement.style;
  r.setProperty("--bg", p.bg);
  r.setProperty("--surface", p.surface);
  r.setProperty("--ink", p.ink);
  r.setProperty("--ink-soft", p.inkSoft);
  r.setProperty("--line", p.line);
  r.setProperty("--accent", p.accent);
  r.setProperty("--accent-2", p.accent2);
  r.setProperty("--accent-ink", p.accentInk);
  r.setProperty("--chip", p.chip);
  r.setProperty("--hero-tint", p.heroTint);
  r.setProperty("--font-display", FONT.display);
  r.setProperty("--font-body", FONT.body);
  r.setProperty("--display-weight", FONT.displayWeight);
  r.setProperty("--display-tracking", FONT.displayTracking);
  r.setProperty("--display-italic", FONT.displayItalic ? "italic" : "normal");
}

Object.assign(window, { applyTheme });
