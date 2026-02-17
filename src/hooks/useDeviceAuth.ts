import { useState, useEffect, useCallback } from "react";

// Device session stored in localStorage
interface DeviceSession {
  deviceId: string;
  deviceType: "company" | "personal";
  trustedAt: string; // ISO timestamp when device was first authenticated
  lastValidated?: string; // ISO timestamp of last successful validation
}

// Clock-in session (active user session)
interface ClockInSession {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeAvatar?: string;
  revenueCenter: string;
  deviceType: "company" | "personal";
  loginTime: string;
}

const DEVICE_SESSION_KEY = "pos_device_session";
const CLOCK_IN_SESSION_KEY = "pos_session";

export function useDeviceAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceSession, setDeviceSession] = useState<DeviceSession | null>(null);
  const [clockInSession, setClockInSession] = useState<ClockInSession | null>(null);

  // Check for existing sessions on mount
  useEffect(() => {
    const checkSessions = () => {
      try {
        // Check device session (trusted device)
        const storedDeviceSession = localStorage.getItem(DEVICE_SESSION_KEY);
        if (storedDeviceSession) {
          const parsed = JSON.parse(storedDeviceSession) as DeviceSession;
          setDeviceSession(parsed);
        }

        // Check clock-in session (active employee)
        const storedClockIn = localStorage.getItem(CLOCK_IN_SESSION_KEY);
        if (storedClockIn) {
          const parsed = JSON.parse(storedClockIn) as ClockInSession;
          setClockInSession(parsed);
        }
      } catch (error) {
        console.error("Error reading sessions:", error);
        // Clear corrupted sessions
        localStorage.removeItem(DEVICE_SESSION_KEY);
        localStorage.removeItem(CLOCK_IN_SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkSessions();
  }, []);

  // Trust this device (called after first successful login)
  const trustDevice = useCallback((deviceType: "company" | "personal") => {
    const session: DeviceSession = {
      deviceId: generateDeviceId(),
      deviceType,
      trustedAt: new Date().toISOString(),
      lastValidated: new Date().toISOString(),
    };
    localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(session));
    setDeviceSession(session);
    return session;
  }, []);

  // Clock in an employee
  const clockIn = useCallback((session: ClockInSession) => {
    localStorage.setItem(CLOCK_IN_SESSION_KEY, JSON.stringify(session));
    setClockInSession(session);
    
    // Update device session last validated time
    if (deviceSession) {
      const updatedDevice: DeviceSession = {
        ...deviceSession,
        lastValidated: new Date().toISOString(),
      };
      localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(updatedDevice));
      setDeviceSession(updatedDevice);
    }
  }, [deviceSession]);

  // Clock out (clear employee session, keep device trusted)
  const clockOut = useCallback(() => {
    localStorage.removeItem(CLOCK_IN_SESSION_KEY);
    setClockInSession(null);
  }, []);

  // Full logout (clear everything, return to login)
  const logout = useCallback(() => {
    localStorage.removeItem(DEVICE_SESSION_KEY);
    localStorage.removeItem(CLOCK_IN_SESSION_KEY);
    setDeviceSession(null);
    setClockInSession(null);
  }, []);

  // Validate device session (simulate server validation)
  const validateDeviceSession = useCallback(async (): Promise<boolean> => {
    if (!deviceSession) return false;
    
    // In production, this would call the server to validate the session
    // For now, simulate a successful validation
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update last validated timestamp
      const updatedSession: DeviceSession = {
        ...deviceSession,
        lastValidated: new Date().toISOString(),
      };
      localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(updatedSession));
      setDeviceSession(updatedSession);
      
      return true;
    } catch {
      // Session invalid, force re-login
      logout();
      return false;
    }
  }, [deviceSession, logout]);

  return {
    isLoading,
    // Device is trusted if we have a valid device session
    isDeviceTrusted: !!deviceSession,
    // User is clocked in if we have an active clock-in session
    isClockedIn: !!clockInSession,
    deviceSession,
    clockInSession,
    trustDevice,
    clockIn,
    clockOut,
    logout,
    validateDeviceSession,
  };
}

// Generate a unique device ID
function generateDeviceId(): string {
  const existingId = localStorage.getItem("pos_device_id");
  if (existingId) return existingId;
  
  const newId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem("pos_device_id", newId);
  return newId;
}

export type { DeviceSession, ClockInSession };
