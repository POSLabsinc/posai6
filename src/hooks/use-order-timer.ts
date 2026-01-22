import { useState, useEffect, useCallback, useRef } from 'react';

// Parse time string like "8:00 PM" to Date object for today
const parseTimeToDate = (timeStr: string): Date => {
  const now = new Date();
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return now;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);
  
  // If the parsed time is in the future, assume it was yesterday
  if (result > now) {
    result.setDate(result.getDate() - 1);
  }
  
  return result;
};

// Format elapsed time in seconds to display string
const formatElapsedTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) return "00:00";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} Hrs`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface UseOrderTimerProps {
  orderTime: string; // e.g., "8:00 PM"
  status: string;
  staticTimer?: string; // e.g., "1:16 Hrs" for paid orders
}

export const useOrderTimer = ({ orderTime, status, staticTimer }: UseOrderTimerProps): string => {
  const isPaidOrCompleted = ['PAID', 'COMPLETED', 'Paid', 'Completed'].includes(status);
  
  const calculateElapsed = useCallback(() => {
    const startTime = parseTimeToDate(orderTime);
    const now = new Date();
    return Math.floor((now.getTime() - startTime.getTime()) / 1000);
  }, [orderTime]);

  const [elapsed, setElapsed] = useState(calculateElapsed);

  useEffect(() => {
    // For paid/completed orders, show static timer from data
    if (isPaidOrCompleted) {
      return;
    }

    // For ongoing orders, update every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaidOrCompleted, calculateElapsed]);

  // For paid orders, return the static timer from order data (total duration)
  if (isPaidOrCompleted && staticTimer) {
    return staticTimer;
  }

  // For ongoing orders, return the live timer
  return formatElapsedTime(elapsed);
};

interface OrderTimerData {
  id: string;
  time: string;
  status: string;
  timer: string;
}

// Hook for multiple orders at once (more efficient, doesn't cause scroll issues)
export const useOrderTimers = (orders: OrderTimerData[]): Record<string, string> => {
  const [timers, setTimers] = useState<Record<string, string>>({});
  const ordersRef = useRef<OrderTimerData[]>(orders);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when orders change
  ordersRef.current = orders;

  useEffect(() => {
    const updateTimers = () => {
      const currentOrders = ordersRef.current;
      const now = new Date();
      
      setTimers(prevTimers => {
        const newTimers: Record<string, string> = {};
        let hasChanges = false;
        
        currentOrders.forEach(order => {
          const isPaidOrCompleted = ['PAID', 'COMPLETED', 'Paid', 'Completed'].includes(order.status);
          
          if (isPaidOrCompleted) {
            newTimers[order.id] = order.timer;
          } else {
            const startTime = parseTimeToDate(order.time);
            const totalSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            newTimers[order.id] = formatElapsedTime(totalSeconds);
          }
          
          if (prevTimers[order.id] !== newTimers[order.id]) {
            hasChanges = true;
          }
        });
        
        // Only return new object if something actually changed
        return hasChanges ? newTimers : prevTimers;
      });
    };

    // Initial update
    updateTimers();

    // Check if any orders are ongoing (use ref to get latest)
    const hasOngoingOrders = ordersRef.current.some(order => 
      !['PAID', 'COMPLETED', 'Paid', 'Completed'].includes(order.status)
    );

    if (hasOngoingOrders) {
      intervalRef.current = setInterval(updateTimers, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency - uses ref for orders

  return timers;
};
