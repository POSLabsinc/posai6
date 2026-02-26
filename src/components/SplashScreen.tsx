import { useState, useEffect, useRef } from "react";
import eatosLogo from "@/assets/icons/eatos-logo.svg";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onCompleteRef.current();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#131316" }}
    >
      <div className="flex flex-col items-center justify-center" style={{ animation: "fadeIn 0.5s ease-in" }}>
        <img
          src={eatosLogo}
          alt="eatOS Logo"
          className="w-32 h-auto md:w-44 lg:w-52"
        />
      </div>
    </div>
  );
}
