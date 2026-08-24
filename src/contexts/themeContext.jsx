// contexts/themeContext.jsx
import { createContext, useState, useEffect, useCallback, useMemo } from "react";

// Active theme: "Luxury in Simplicity" — warm bone canvas, warm espresso ink,
// one antique-brass gold used as jewelry (hairlines, active states, wordmark,
// focus). Gold is never a fill or a gradient. CTAs are neutral (ink in light,
// warm-white in dark) so the accent stays rare and valuable. Surfaces are
// separated by hairline borders and tonal steps, not by shadows or glows.
// The only gradient kept anywhere is the functional scrim under text on hero
// photography (heroGradient); every decorative gradient is set to a flat color.
export const colors = {
  light: {
    // Antique-brass gold. primary = accent/borders/icons (3:1, graphical use);
    // primaryDark = gold text/links (4.3:1, AA); primaryLight = soft highlight.
    primary: "#A8894F", primaryLight: "#C9B183", primaryDark: "#8A6F3A",
    primaryMist: "#F1EAD9", primaryTint: "rgba(168,137,79,0.08)",
    secondary: "#1C1B16", accent: "#1C1B16",
    // Warm bone canvas, warm-white cards that lift by tone (not shadow), and a
    // slightly recessed panel tone. No pure #FFF anywhere on large surfaces.
    mainBg: "#F6F4EF", surfaceL1: "#FDFCFA", surfaceL2: "#F1EEE7", surfaceL3: "#FFFFFF",
    raisedBg: "#FDFCFA", cardBg: "#FDFCFA",
    text: "#211F1A", heading: "#161510", secondaryText: "#6E6A60", mutedText: "#9A958A", invertedText: "#F6F4EF",
    border: "#E4E0D7", borderMid: "rgba(168,137,79,0.28)", borderStrong: "#A8894F", borderFocus: "#A8894F",
    // Glass surfaces kept but warm-tinted; blur toned down so nav/sidebar read
    // as solid warm paper, not frosted plastic.
    glassNavBg: "rgba(246,244,239,0.90)", glassNavBorder: "rgba(28,27,22,0.07)", glassNavBlur: "blur(14px) saturate(120%)", glassNavShadow: "0 1px 0 rgba(28,27,22,0.05)",
    glassSidebarBg: "rgba(246,244,239,0.98)", glassSidebarBorder: "rgba(28,27,22,0.07)", glassSidebarBlur: "blur(16px) saturate(120%)",
    glassCardBg: "rgba(253,252,250,0.97)", glassCardBorder: "rgba(28,27,22,0.08)", glassCardBlur: "blur(10px)", glassCardShadow: "0 6px 20px rgba(28,27,22,0.05)",
    glassModalBg: "rgba(253,252,250,0.99)", glassModalBorder: "rgba(28,27,22,0.10)", glassModalBlur: "blur(20px)", glassModalShadow: "0 20px 56px rgba(28,27,22,0.14)",
    // Primary CTA = ink, not gold. Calm and confident; gold stays the accent.
    wateryBtnBg: "#1C1B16", wateryBtnBorder: "#1C1B16", wateryBtnShine: "0 6px 18px rgba(28,27,22,0.12)",
    wateryDarkBg: "#1C1B16", wateryDarkBorder: "#1C1B16", waterySoftBg: "#FDFCFA", waterySoftBorder: "#E4E0D7",
    // Decorative gradients flattened. goldRing/goldAura are shadows, kept subtle.
    goldGlow: "transparent", goldFade: "transparent",
    goldRing: "0 0 0 1px rgba(168,137,79,0.26)", goldAura: "0 14px 40px rgba(168,137,79,0.07)",
    btnBg: "#1C1B16", btnText: "#F6F4EF", btnHover: "#333029", btnShadow: "0 6px 18px rgba(28,27,22,0.12)",
    navBg: "#1C1B16", navText: "#F6F4EF", navBorder: "rgba(168,137,79,0.22)", navHover: "rgba(168,137,79,0.10)", navActive: "#A8894F",
    sidebarBg: "rgba(246,244,239,0.98)", sidebarBorder: "rgba(28,27,22,0.07)",
    // Shadows kept minimal — luxury separates with hairlines, not depth.
    shadowXs: "0 1px 2px rgba(28,27,22,0.04)", shadowSm: "0 3px 12px rgba(28,27,22,0.05)", shadowMd: "0 10px 26px rgba(28,27,22,0.06)", shadowLg: "0 20px 52px rgba(28,27,22,0.10)", shadowGold: "0 10px 26px rgba(168,137,79,0.14)",
    success: "#1E7A4C", successBg: "#E9F5EE", successText: "#12603A",
    error: "#C0392B", errorBg: "#FBEBEA", errorText: "#8E271C",
    warning: "#B7791F", warningBg: "#FBF1DD", warningText: "#8A5A12",
    info: "#2B6CB0", infoBg: "#E9F1FA", infoText: "#1E4E7E",
    activeTab: "#A8894F", hoverBg: "rgba(28,27,22,0.04)", pressedBg: "rgba(28,27,22,0.07)", selectedBg: "rgba(168,137,79,0.10)", focusRing: "0 0 0 3px rgba(168,137,79,0.28)", linkColor: "#8A6F3A", glow: "rgba(168,137,79,0.10)",
    imageOverlayLight: "rgba(246,244,239,0.62)", imageOverlayDark: "rgba(22,21,16,0.58)", heroGradient: "linear-gradient(180deg, transparent 40%, rgba(22,21,16,0.72) 100%)",
  },
  dark: {
    // Warm espresso, never pure black; gold lifts slightly for contrast on dark.
    primary: "#C2A265", primaryLight: "#D8C08A", primaryDark: "#A8894F",
    primaryMist: "rgba(194,162,101,0.10)", primaryTint: "rgba(194,162,101,0.07)",
    secondary: "#ECE8E0", accent: "#ECE8E0",
    mainBg: "#161512", surfaceL1: "#1E1C18", surfaceL2: "#232019", surfaceL3: "#282419", raisedBg: "#1E1C18", cardBg: "#1E1C18",
    text: "#ECE8E0", heading: "#F6F3EC", secondaryText: "#A39E92", mutedText: "#6F6A5E", invertedText: "#161512",
    border: "rgba(255,255,255,0.08)", borderMid: "rgba(194,162,101,0.24)", borderStrong: "#C2A265", borderFocus: "#C2A265",
    glassNavBg: "rgba(22,21,18,0.90)", glassNavBorder: "rgba(255,255,255,0.07)", glassNavBlur: "blur(14px) saturate(130%)", glassNavShadow: "0 1px 0 rgba(255,255,255,0.03)",
    glassSidebarBg: "rgba(22,21,18,0.98)", glassSidebarBorder: "rgba(255,255,255,0.07)", glassSidebarBlur: "blur(16px) saturate(130%)",
    glassCardBg: "rgba(30,28,24,0.97)", glassCardBorder: "rgba(255,255,255,0.07)", glassCardBlur: "blur(10px)", glassCardShadow: "0 10px 28px rgba(0,0,0,0.40)",
    glassModalBg: "rgba(35,32,25,0.99)", glassModalBorder: "rgba(255,255,255,0.09)", glassModalBlur: "blur(20px)", glassModalShadow: "0 22px 60px rgba(0,0,0,0.60)",
    // Primary CTA = warm-white on dark. High-contrast neutral; gold stays accent.
    wateryBtnBg: "#ECE8E0", wateryBtnBorder: "#ECE8E0", wateryBtnShine: "0 6px 20px rgba(0,0,0,0.40)",
    wateryDarkBg: "#ECE8E0", wateryDarkBorder: "#ECE8E0", waterySoftBg: "rgba(255,255,255,0.035)", waterySoftBorder: "rgba(255,255,255,0.11)",
    goldGlow: "transparent", goldFade: "transparent", goldRing: "0 0 0 1px rgba(194,162,101,0.24)", goldAura: "0 14px 44px rgba(194,162,101,0.08)",
    btnBg: "#ECE8E0", btnText: "#161512", btnHover: "#FFFFFF", btnShadow: "0 6px 20px rgba(0,0,0,0.40)",
    navBg: "#161512", navText: "#ECE8E0", navBorder: "rgba(194,162,101,0.18)", navHover: "rgba(194,162,101,0.09)", navActive: "#C2A265",
    sidebarBg: "rgba(22,21,18,0.98)", sidebarBorder: "rgba(255,255,255,0.07)",
    shadowXs: "0 1px 3px rgba(0,0,0,0.34)", shadowSm: "0 4px 14px rgba(0,0,0,0.38)", shadowMd: "0 12px 30px rgba(0,0,0,0.46)", shadowLg: "0 24px 58px rgba(0,0,0,0.58)", shadowGold: "0 10px 30px rgba(194,162,101,0.16)",
    success: "#4ADE80", successBg: "#0C2318", successText: "#86EFAC",
    error: "#F87171", errorBg: "#2A100E", errorText: "#FCA5A5",
    warning: "#FBBF24", warningBg: "#2A1E08", warningText: "#FCD9A0",
    info: "#60A5FA", infoBg: "#0E1B2C", infoText: "#A9CBF3",
    activeTab: "#C2A265", hoverBg: "rgba(255,255,255,0.05)", pressedBg: "rgba(255,255,255,0.09)", selectedBg: "rgba(194,162,101,0.10)", focusRing: "0 0 0 3px rgba(194,162,101,0.30)", linkColor: "#D8C08A", glow: "rgba(194,162,101,0.09)",
    imageOverlayLight: "rgba(236,232,224,0.46)", imageOverlayDark: "rgba(0,0,0,0.66)", heroGradient: "linear-gradient(180deg, transparent 32%, rgba(0,0,0,0.86) 100%)",
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
      {isThemeReady ? children : <div style={{ background: '#F6F4EF', height: '100vh' }} />}
    </ThemeContext.Provider>
  );
};
