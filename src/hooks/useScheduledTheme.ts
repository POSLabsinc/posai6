import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";

const STORAGE_KEY = "scheduled-theme";

export type ScheduleType = "sunset-sunrise" | "custom";

interface ScheduleConfig {
  enabled: boolean;
  scheduleType: ScheduleType;
  lightStart: string; // HH:MM format
  lightEnd: string;   // HH:MM format
}

const DEFAULT_CONFIG: ScheduleConfig = {
  enabled: false,
  scheduleType: "sunset-sunrise",
  lightStart: "07:00",
  lightEnd: "19:00",
};

function loadConfig(): ScheduleConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: ScheduleConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function isTimeInRange(now: Date, start: string, end: string): boolean {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Wraps midnight
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function useScheduledTheme() {
  const { setTheme } = useTheme();
  const [config, setConfigState] = useState<ScheduleConfig>(loadConfig);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const applySchedule = useCallback(() => {
    if (!config.enabled) return;
    const inLight = isTimeInRange(new Date(), config.lightStart, config.lightEnd);
    setTheme(inLight ? "light" : "dark");
  }, [config, setTheme]);

  // Apply on config change and set interval
  useEffect(() => {
    if (!config.enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    applySchedule();
    intervalRef.current = setInterval(applySchedule, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config.enabled, config.lightStart, config.lightEnd, applySchedule]);

  const setEnabled = (enabled: boolean) => {
    const next = { ...config, enabled };
    setConfigState(next);
    saveConfig(next);
    // Don't change theme immediately - just enable/disable the schedule
  };

  const setLightStart = (time: string) => {
    const next = { ...config, lightStart: time };
    setConfigState(next);
    saveConfig(next);
  };

  const setLightEnd = (time: string) => {
    const next = { ...config, lightEnd: time };
    setConfigState(next);
    saveConfig(next);
  };

  const setScheduleType = (type: ScheduleType) => {
    const next = { ...config, scheduleType: type };
    setConfigState(next);
    saveConfig(next);
    if (next.enabled) {
      if (type === "sunset-sunrise") {
        // Default sunset-sunrise: light 06:00 - 18:00
        const sunriseConfig = { ...next, lightStart: "06:00", lightEnd: "18:00" };
        setConfigState(sunriseConfig);
        saveConfig(sunriseConfig);
        const inLight = isTimeInRange(new Date(), sunriseConfig.lightStart, sunriseConfig.lightEnd);
        setTheme(inLight ? "light" : "dark");
      } else {
        const inLight = isTimeInRange(new Date(), next.lightStart, next.lightEnd);
        setTheme(inLight ? "light" : "dark");
      }
    }
  };

  return {
    scheduleEnabled: config.enabled,
    scheduleType: config.scheduleType,
    lightStart: config.lightStart,
    lightEnd: config.lightEnd,
    setScheduleEnabled: setEnabled,
    setScheduleType,
    setLightStart,
    setLightEnd,
  };
}
