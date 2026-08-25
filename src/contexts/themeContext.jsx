// contexts/themeContext.jsx
import { createContext, useState, useEffect, useCallback, useMemo } from "react";

// Active theme: "White, Black & Gold" — the definitive house palette.
// Light is pure white with a bright metallic gold; dark is true black with a
// slightly brighter gold that glows against it. No warm/brown tint in either:
// neutrals are clean, and the gold is the only hue. Gold is used as jewelry —
// hairlines, icons, active states, focus rings, the wordmark, links — and is
// never a flat fill or a decorative gradient, which is what keeps it reading as
// luxury rather than loud. Primary CTAs are therefore neutral (black on white,
// warm-white on black). Surfaces separate by hairline borders and small tonal
// steps, not by heavy shadow. The only gradient kept is the functional scrim
// under text on hero photography (heroGradient).
export const colors = {
  light: {
    // Bright metallic gold on pure white. primary = accent/border/icon/active
    // (decorative, graphical use); primaryDark and linkColor carry gold text at
    // AA contrast; primaryLight is the soft highlight/glint.
    primary: "#D4AF37", primaryLight: "#E8CE7A", primaryDark: "#927619",
    primaryMist: "#FBF4DC", primaryTint: "rgba(212,175,55,0.08)",
    secondary: "#0A0A0A", accent: "#0A0A0A",
    // Pure white canvas and cards; hierarchy comes from hairlines and one
    // whisper-warm recessed tone, never from grey panels.
    mainBg: "#FFFFFF", surfaceL1: "#FFFFFF", surfaceL2: "#F7F6F2", surfaceL3: "#FFFFFF",
    raisedBg: "#FFFFFF", cardBg: "#FFFFFF",
    text: "#1A1A18", heading: "#0A0A0A", secondaryText: "#5C5B55", mutedText: "#8E8D85", invertedText: "#FFFFFF",
    border: "#EBEAE4", borderMid: "rgba(212,175,55,0.34)", borderStrong: "#D4AF37", borderFocus: "#D4AF37",
    // Glass surfaces read as near-solid white paper; blur is subtle.
    glassNavBg: "rgba(255,255,255,0.85)", glassNavBorder: "rgba(10,10,10,0.06)", glassNavBlur: "blur(16px) saturate(140%)", glassNavShadow: "0 1px 0 rgba(10,10,10,0.04)",
    glassSidebarBg: "rgba(255,255,255,0.97)", glassSidebarBorder: "rgba(10,10,10,0.06)", glassSidebarBlur: "blur(16px) saturate(140%)",
    glassCardBg: "rgba(255,255,255,0.96)", glassCardBorder: "rgba(10,10,10,0.07)", glassCardBlur: "blur(10px)", glassCardShadow: "0 6px 20px rgba(10,10,10,0.05)",
    glassModalBg: "rgba(255,255,255,0.99)", glassModalBorder: "rgba(10,10,10,0.09)", glassModalBlur: "blur(20px)", glassModalShadow: "0 20px 56px rgba(10,10,10,0.14)",
    // Primary CTA is black, so gold is never a flat fill and stays the accent.
    wateryBtnBg: "#0A0A0A", wateryBtnBorder: "#0A0A0A", wateryBtnShine: "0 6px 18px rgba(10,10,10,0.14)",
    wateryDarkBg: "#0A0A0A", wateryDarkBorder: "#0A0A0A", waterySoftBg: "#FFFFFF", waterySoftBorder: "#EBEAE4",
    // Decorative gradients flattened. goldRing/goldAura are subtle gold shadows.
    goldGlow: "transparent", goldFade: "transparent",
    goldRing: "0 0 0 1px rgba(212,175,55,0.30)", goldAura: "0 14px 40px rgba(212,175,55,0.10)",
    btnBg: "#0A0A0A", btnText: "#FFFFFF", btnHover: "#262626", btnShadow: "0 6px 18px rgba(10,10,10,0.14)",
    navBg: "#0A0A0A", navText: "#FFFFFF", navBorder: "rgba(212,175,55,0.24)", navHover: "rgba(212,175,55,0.12)", navActive: "#D4AF37",
    sidebarBg: "rgba(255,255,255,0.98)", sidebarBorder: "rgba(10,10,10,0.06)",
    // Shadows kept minimal — luxury separates with hairlines, not depth.
    shadowXs: "0 1px 2px rgba(10,10,10,0.04)", shadowSm: "0 3px 12px rgba(10,10,10,0.05)", shadowMd: "0 10px 26px rgba(10,10,10,0.07)", shadowLg: "0 20px 52px rgba(10,10,10,0.10)", shadowGold: "0 10px 26px rgba(212,175,55,0.18)",
    success: "#1E7A4C", successBg: "#E9F6EF", successText: "#12603A",
    error: "#C0392B", errorBg: "#FCEBE9", errorText: "#8E271C",
    warning: "#B7791F", warningBg: "#FBF1DD", warningText: "#8A5A12",
    info: "#2B6CB0", infoBg: "#E9F1FA", infoText: "#1E4E7E",
    activeTab: "#D4AF37", hoverBg: "rgba(10,10,10,0.04)", pressedBg: "rgba(10,10,10,0.07)", selectedBg: "rgba(212,175,55,0.12)", focusRing: "0 0 0 3px rgba(212,175,55,0.35)", linkColor: "#927619", glow: "rgba(212,175,55,0.12)",
    imageOverlayLight: "rgba(255,255,255,0.62)", imageOverlayDark: "rgba(10,10,10,0.55)", heroGradient: "linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.72) 100%)",
  },
  dark: {
    // True black with a brighter gold that glows against it. No brown anywhere.
    primary: "#E1BE4D", primaryLight: "#F0D888", primaryDark: "#C9A431",
    primaryMist: "rgba(225,190,77,0.12)", primaryTint: "rgba(225,190,77,0.08)",
    secondary: "#F2F1EC", accent: "#F2F1EC",
    // Pure black canvas; cards lift by a few points of lightness, not by hue.
    mainBg: "#000000", surfaceL1: "#0C0C0C", surfaceL2: "#141414", surfaceL3: "#1B1B1B", raisedBg: "#0C0C0C", cardBg: "#0C0C0C",
    text: "#F2F1EC", heading: "#FFFFFF", secondaryText: "#A7A6A0", mutedText: "#6E6D67", invertedText: "#000000",
    border: "rgba(255,255,255,0.10)", borderMid: "rgba(225,190,77,0.30)", borderStrong: "#E1BE4D", borderFocus: "#E1BE4D",
    glassNavBg: "rgba(0,0,0,0.80)", glassNavBorder: "rgba(255,255,255,0.08)", glassNavBlur: "blur(16px) saturate(140%)", glassNavShadow: "0 1px 0 rgba(255,255,255,0.04)",
    glassSidebarBg: "rgba(0,0,0,0.96)", glassSidebarBorder: "rgba(255,255,255,0.08)", glassSidebarBlur: "blur(16px) saturate(140%)",
    glassCardBg: "rgba(12,12,12,0.96)", glassCardBorder: "rgba(255,255,255,0.08)", glassCardBlur: "blur(10px)", glassCardShadow: "0 10px 28px rgba(0,0,0,0.55)",
    glassModalBg: "rgba(14,14,14,0.99)", glassModalBorder: "rgba(255,255,255,0.10)", glassModalBlur: "blur(20px)", glassModalShadow: "0 22px 60px rgba(0,0,0,0.72)",
    // Primary CTA is warm-white on black; gold stays the accent, never a fill.
    wateryBtnBg: "#F2F1EC", wateryBtnBorder: "#F2F1EC", wateryBtnShine: "0 6px 20px rgba(0,0,0,0.55)",
    wateryDarkBg: "#F2F1EC", wateryDarkBorder: "#F2F1EC", waterySoftBg: "rgba(255,255,255,0.04)", waterySoftBorder: "rgba(255,255,255,0.12)",
    goldGlow: "transparent", goldFade: "transparent", goldRing: "0 0 0 1px rgba(225,190,77,0.28)", goldAura: "0 14px 44px rgba(225,190,77,0.12)",
    btnBg: "#F2F1EC", btnText: "#000000", btnHover: "#FFFFFF", btnShadow: "0 6px 20px rgba(0,0,0,0.55)",
    navBg: "#000000", navText: "#F2F1EC", navBorder: "rgba(225,190,77,0.20)", navHover: "rgba(225,190,77,0.10)", navActive: "#E1BE4D",
    sidebarBg: "rgba(0,0,0,0.96)", sidebarBorder: "rgba(255,255,255,0.08)",
    shadowXs: "0 1px 3px rgba(0,0,0,0.50)", shadowSm: "0 4px 14px rgba(0,0,0,0.55)", shadowMd: "0 12px 30px rgba(0,0,0,0.60)", shadowLg: "0 24px 58px rgba(0,0,0,0.70)", shadowGold: "0 10px 30px rgba(225,190,77,0.18)",
    success: "#4ADE80", successBg: "#0C2318", successText: "#86EFAC",
    error: "#F87171", errorBg: "#2A0E0C", errorText: "#FCA5A5",
    warning: "#FBBF24", warningBg: "#2A1E08", warningText: "#FCD9A0",
    info: "#60A5FA", infoBg: "#0E1B2C", infoText: "#A9CBF3",
    activeTab: "#E1BE4D", hoverBg: "rgba(255,255,255,0.05)", pressedBg: "rgba(255,255,255,0.09)", selectedBg: "rgba(225,190,77,0.12)", focusRing: "0 0 0 3px rgba(225,190,77,0.35)", linkColor: "#F0D888", glow: "rgba(225,190,77,0.10)",
    imageOverlayLight: "rgba(245,245,240,0.14)", imageOverlayDark: "rgba(0,0,0,0.68)", heroGradient: "linear-gradient(180deg, transparent 32%, rgba(0,0,0,0.88) 100%)",
  },
};

export const ThemeContext = createContext();

// A hand-edited or half-written localStorage entry would otherwise throw here
// and take the whole app down with a blank screen, so bad data just means
// "no stored preference".
const readStoredTheme = () => {
  try {
    const raw = localStorage.getItem("squallyline_theme");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.mode === "light" || parsed.mode === "dark")) return parsed;
    return null;
  } catch {
    return null;
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({ mode: "light", system: true });
  const [isThemeReady, setIsThemeReady] = useState(false);

  const getSystemTheme = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  // Writes the resolved theme to state, storage and :root. Kept dependency-free
  // so the boot effect below can depend on it without re-running on every
  // theme change.
  const applyTheme = useCallback((next) => {
    const mode = next.system ? getSystemTheme() : next.mode;
    const resolved = { ...next, mode };

    setTheme(resolved);
    // Private-browsing modes can refuse writes; the theme still applies for
    // this session, it just will not be remembered.
    try {
      localStorage.setItem("squallyline_theme", JSON.stringify(resolved));
    } catch {
      /* preference not persisted */
    }

    // Inject CSS Variables into :root
    const currentColors = colors[mode];
    const root = document.documentElement;
    Object.keys(currentColors).forEach((key) => {
      root.style.setProperty(`--${key}`, currentColors[key]);
    });

    document.body.className = `theme-${mode}`;

    // Keep the browser chrome (mobile address bar, PWA status bar) on the same
    // palette as the page, otherwise dark mode gets a white bar above it.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", currentColors.mainBg);
  }, []);

  // Called with no argument this flips light/dark and drops "follow system".
  const updateTheme = useCallback(
    (newTheme) => {
      if (newTheme) {
        applyTheme(newTheme);
        return;
      }
      applyTheme({ mode: theme.mode === "dark" ? "light" : "dark", system: false });
    },
    [applyTheme, theme.mode],
  );

  useEffect(() => {
    const stored = readStoredTheme();
    applyTheme(stored || { mode: getSystemTheme(), system: true });

    // Only follow the OS when the user has not pinned a mode themselves.
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const saved = readStoredTheme();
      const followsSystem = saved ? saved.system : true;
      if (followsSystem) applyTheme({ mode: e.matches ? "dark" : "light", system: true });
    };

    mediaQuery.addEventListener("change", handler);
    setIsThemeReady(true);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [applyTheme]);

  const value = useMemo(
    () => ({
      theme,
      updateTheme,
      isThemeReady,
      colors: colors[theme.mode],
    }),
    [theme, updateTheme, isThemeReady],
  );

  return (
    <ThemeContext.Provider value={value}>
      {isThemeReady ? children : <div style={{ background: '#FFFFFF', height: '100vh' }} />}
    </ThemeContext.Provider>
  );
};
