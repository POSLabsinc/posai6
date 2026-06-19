import { useEffect, useState } from "react";
import darkBgLogo from "@/assets/icons/posai-logo-light.png";
import lightBgLogo from "@/assets/icons/posai-logo.png";

export function useThemeLogo() {
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

  return isDark ? darkBgLogo : lightBgLogo;
}

interface ThemeLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt?: string;
}

export function ThemeLogo({ alt = "Point of Sale AI Logo", className, ...props }: ThemeLogoProps) {
  const src = useThemeLogo();
  return <img {...props} src={src} alt={alt} className={className} />;
}
