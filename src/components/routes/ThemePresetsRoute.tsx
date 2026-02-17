import { useIsMobile } from "@/hooks/use-mobile";
import ThemePresets from "@/pages/ThemePresets";
import Settings from "@/pages/Settings";

// Wrapper that shows full-page ThemePresets on mobile, split-view on desktop
const ThemePresetsRoute = () => {
  const isMobile = useIsMobile();
  
  // On mobile, show the full-page theme presets
  if (isMobile) {
    return <ThemePresets />;
  }
  
  // On desktop, show the split-view settings with theme presets content in right panel
  return <Settings />;
};

export default ThemePresetsRoute;
