import { useEffect, useCallback, useRef } from 'react';

interface UseShakeOptions {
  threshold?: number;
  timeout?: number;
  onShake: () => void;
}

export function useShake({ threshold = 15, timeout = 1000, onShake }: UseShakeOptions) {
  const lastShakeRef = useRef<number>(0);
  const lastAccelRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const accel = event.accelerationIncludingGravity;
    if (!accel || accel.x === null || accel.y === null || accel.z === null) return;

    const deltaX = Math.abs(accel.x - lastAccelRef.current.x);
    const deltaY = Math.abs(accel.y - lastAccelRef.current.y);
    const deltaZ = Math.abs(accel.z - lastAccelRef.current.z);

    lastAccelRef.current = { x: accel.x, y: accel.y, z: accel.z };

    if ((deltaX > threshold || deltaY > threshold || deltaZ > threshold)) {
      const now = Date.now();
      if (now - lastShakeRef.current > timeout) {
        lastShakeRef.current = now;
        onShake();
      }
    }
  }, [threshold, timeout, onShake]);

  useEffect(() => {
    // Check if DeviceMotionEvent is available
    if (typeof DeviceMotionEvent === 'undefined') return;

    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        } catch (error) {
          console.log('Motion permission denied');
        }
      } else {
        // Non-iOS or older iOS
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);
}
