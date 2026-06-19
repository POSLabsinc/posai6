import { useEffect, useState } from "react";
import darkBgLogo from "@/assets/icons/posai-logo-light.png";
import lightBgLogo from "@/assets/icons/posai-logo.png";

interface ThemeLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt?: string;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(el.classList.contains("dark"));
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function ThemeLogo({ alt = "Point of Sale AI Logo", className, ...props }: ThemeLogoProps) {
  const isDark = useIsDark();
  return (
    <img
      {...props}
      src={isDark ? darkBgLogo : lightBgLogo}
      alt={alt}
      className={className}
    />
  );
}
