import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Bridges AI-driven theme updates (dispatched by SettingsManager
 * as `theme-change` and `settings-updated` events) to next-themes,
 * so that changes made via the AI assistant are reflected live in
 * the actual theme provider.
 */
const ThemeBridge = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const next = detail?.theme;
      if (typeof next === "string" && (next === "light" || next === "dark")) {
        setTheme(next);
      }
    };

    const handleSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.type === "appearance" && detail?.data?.theme) {
        const next = detail.data.theme;
        if (next === "light" || next === "dark") {
          setTheme(next);
        }
      }
    };

    window.addEventListener("theme-change", handleThemeChange as EventListener);
    window.addEventListener("settings-updated", handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener("theme-change", handleThemeChange as EventListener);
      window.removeEventListener("settings-updated", handleSettingsUpdate as EventListener);
    };
  }, [setTheme]);

  return null;
};

export default ThemeBridge;
