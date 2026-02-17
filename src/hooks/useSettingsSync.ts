import { useEffect, useCallback, useState, useRef } from 'react';

/**
 * Custom hook to sync UI components with settings changes made via AI Assistant.
 * Listens for 'settings-updated' events dispatched by SettingsManager and
 * triggers a re-read of settings from localStorage.
 * 
 * @param settingsType - The type of settings to listen for (e.g., 'gratuity', 'discounts', 'taxes', 'serviceCharges', 'menus')
 * @param storageKey - The localStorage key for these settings
 * @param defaultValue - Default value if nothing is stored
 * @returns [currentValue, setValue, forceRefresh] - Current settings state, setter, and manual refresh function
 */
export function useSettingsSync<T>(
  settingsType: string,
  storageKey: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  // Track if component is mounted to avoid stale updates
  const isMounted = useRef(true);
  
  // Initialize state from localStorage
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // For arrays, return parsed directly; for objects, merge with defaults
        if (Array.isArray(defaultValue)) {
          return (Array.isArray(parsed) ? parsed : defaultValue) as T;
        }
        return { ...(defaultValue as object), ...parsed } as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  });

  // Force refresh function to re-read from localStorage
  const forceRefresh = useCallback(() => {
    if (!isMounted.current) return;
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(defaultValue)) {
          setValue((Array.isArray(parsed) ? parsed : defaultValue) as T);
        } else {
          setValue({ ...(defaultValue as object), ...parsed } as T);
        }
      } catch {
        setValue(defaultValue);
      }
    } else {
      setValue(defaultValue);
    }
  }, [storageKey, defaultValue]);

  // Listen for settings-updated events from SettingsManager
  useEffect(() => {
    isMounted.current = true;
    
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (!isMounted.current) return;
      
      const { type, data } = event.detail || {};
      
      // Check if this event is for our settings type
      if (type === settingsType && data !== undefined) {
        // Directly use the new data from the event
        console.log(`[useSettingsSync] Received update for ${settingsType}:`, data);
        setValue(data as T);
      }
    };

    // Add event listener
    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);

    // Also listen for storage events (for cross-tab sync)
    const handleStorageChange = (event: StorageEvent) => {
      if (!isMounted.current) return;
      
      if (event.key === storageKey && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (Array.isArray(defaultValue)) {
            setValue((Array.isArray(parsed) ? parsed : defaultValue) as T);
          } else {
            setValue({ ...(defaultValue as object), ...parsed } as T);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted.current = false;
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [settingsType, storageKey, defaultValue]);

  // Persist to localStorage when value changes (for local changes)
  const setValueAndPersist = useCallback((newValue: React.SetStateAction<T>) => {
    setValue((prev) => {
      const nextValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue;
      localStorage.setItem(storageKey, JSON.stringify(nextValue));
      return nextValue;
    });
  }, [storageKey]);

  return [value, setValueAndPersist, forceRefresh];
}

/**
 * Lightweight hook that only triggers a re-render when settings of a specific type are updated.
 * Use this when you just need to know when to re-fetch, not manage the full state.
 */
export function useSettingsUpdateListener(settingsType: string | string[]): number {
  const [updateCount, setUpdateCount] = useState(0);
  const types = Array.isArray(settingsType) ? settingsType : [settingsType];

  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { type } = event.detail || {};
      if (types.includes(type) || types.includes('all')) {
        setUpdateCount(c => c + 1);
      }
    };

    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
    };
  }, [types]);

  return updateCount;
}
