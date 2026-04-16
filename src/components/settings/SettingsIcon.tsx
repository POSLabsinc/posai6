import { ReactNode } from "react";
import { useAppearance } from "@/contexts/AppearanceContext";

interface SettingsIconProps {
  bgColor: string;
  iconSrc?: string;
  iconAlt?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Reusable settings icon container that respects the global icon size setting.
 * Use `iconSrc` for image-based icons, or pass SVG/elements as `children`.
 */
const SettingsIcon = ({ bgColor, iconSrc, iconAlt = "", children, className = "" }: SettingsIconProps) => {
  const { getIconBgColor } = useAppearance();

  return (
    <div
      className={`w-[2.15rem] h-[2.15rem] rounded-[0.55rem] flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: getIconBgColor(bgColor) }}
    >
      {iconSrc ? (
        <img src={iconSrc} alt={iconAlt} className="w-[1.25rem] h-[1.25rem] object-contain" />
      ) : (
        children
      )}
    </div>
  );
};

export default SettingsIcon;
