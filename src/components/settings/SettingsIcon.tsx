import { ReactNode } from "react";
import { useAppearance, iconContainerSizeMap } from "@/contexts/AppearanceContext";

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
  const { getIconBgColor, getIconSizeClass, iconSize } = useAppearance();
  const containerSize = iconContainerSizeMap[iconSize];
  const iconSizeClass = getIconSizeClass();

  return (
    <div
      className={`${containerSize} rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: getIconBgColor(bgColor) }}
    >
      {iconSrc ? (
        <img src={iconSrc} alt={iconAlt} className={`${iconSizeClass} object-contain`} />
      ) : (
        children
      )}
    </div>
  );
};

export default SettingsIcon;
