import { useThemePresets } from '@/contexts/ThemePresetsContext';
import {
  FloatingPanelsLayout,
  GlassAccordionLayout,
  SidebarNavigationLayout,
  TwoTierTabsLayout,
  FloatingTabBarLayout,
  GlassCategoryCardsLayout,
  CardStackLayout,
  GlassPillDrawerLayout,
  MorphingPanelLayout,
  VerticalAccordionLayout,
  TwoRowHorizontalTabsLayout,
  CardBasedGridLayout,
  ExpandableCategoryGridLayout,
  MultiRowCategoryTabsLayout,
  FoodTruckSidebarLayout,
  BarMenuCollapsibleLayout,
} from '@/components/pos-layouts';

const themeLayoutMap: Record<string, React.ComponentType> = {
  'theme-1': FloatingPanelsLayout,
  'theme-2': GlassAccordionLayout,
  'theme-3': SidebarNavigationLayout,
  'theme-4': TwoTierTabsLayout,
  'theme-5': FloatingTabBarLayout,
  'theme-6': GlassCategoryCardsLayout,
  'theme-7': CardStackLayout,
  'theme-8': GlassPillDrawerLayout,
  'theme-9': MorphingPanelLayout,
  'theme-10': VerticalAccordionLayout,
  'theme-11': TwoRowHorizontalTabsLayout,
  'theme-12': CardBasedGridLayout,
  'theme-13': ExpandableCategoryGridLayout,
  'theme-14': MultiRowCategoryTabsLayout,
  'theme-15': FoodTruckSidebarLayout,
  'theme-16': BarMenuCollapsibleLayout,
};

const POSHome = () => {
  const { selectedThemeId, selectedTheme } = useThemePresets();

  const LayoutComponent = themeLayoutMap[selectedThemeId] || FloatingTabBarLayout;

  return (
    <div className="h-full flex flex-col bg-black rounded-xl overflow-hidden">
      {/* Theme indicator */}
      <div className="px-4 py-2 bg-white/5 flex items-center justify-between">
        <span className="text-white/60 text-sm">Current Theme: <span className="text-orange-400 font-medium">{selectedTheme?.name}</span></span>
      </div>
      
      {/* Dynamic Layout */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <LayoutComponent />
      </div>
    </div>
  );
};

export default POSHome;
