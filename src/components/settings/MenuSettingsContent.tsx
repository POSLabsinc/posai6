import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAppearance, iconContainerSizeMap } from "@/contexts/AppearanceContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMenuPreferences } from "@/hooks/useMenuPreferences";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";

// Import custom icons
import menuSettingsIcon from "@/assets/icons/menu-settings.png";
import categoriesIcon from "@/assets/icons/menu-categories.png";
import modifiersIcon from "@/assets/icons/menu-modifiers.png";
import addonsIcon from "@/assets/icons/menu-addons.png";
import productsIcon from "@/assets/icons/menu-products.png";
import defaultModifiersIcon from "@/assets/icons/menu-default-modifiers.png";
import groupsIcon from "@/assets/icons/menu-groups.png";
import settingsMenuIcon from "@/assets/icons/settings-menu.png";
interface MenuSettingsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}
interface MenuItemData {
  id: string;
  iconSrc: string;
  label: string;
  iconBgColor: string;
  description?: string;
}
const menuItems: MenuItemData[] = [{
  id: "menu",
  iconSrc: menuSettingsIcon,
  label: "Menu Items",
  iconBgColor: "#CF0064",
  description: "Create, edit, and organize your menu items with pricing, images, and availability settings across all channels."
}, {
  id: "categories",
  iconSrc: categoriesIcon,
  label: "Categories",
  iconBgColor: "#9436FF",
  description: "Group menu items into categories and subcategories for easier navigation and organization on your Point of Sale."
}, {
  id: "modifiers",
  iconSrc: modifiersIcon,
  label: "Modifiers",
  iconBgColor: "#FFBD00",
  description: "Set up customization options like sizes, toppings, and preparation preferences for your menu items."
}, {
  id: "add-ons",
  iconSrc: addonsIcon,
  label: "Add-Ons",
  iconBgColor: "#FF6381",
  description: "Configure extra items that can be added to orders, such as sides, drinks, or premium upgrades."
}, {
  id: "products",
  iconSrc: productsIcon,
  label: "Products",
  iconBgColor: "#CF0064",
  description: "Manage standalone products and retail items that are sold separately from your food and beverage menu."
}, {
  id: "default-modifiers",
  iconSrc: defaultModifiersIcon,
  label: "Default Modifiers",
  iconBgColor: "#48009E",
  description: "Define modifier sets that are automatically applied to new menu items to streamline menu creation."
}, {
  id: "groups",
  iconSrc: groupsIcon,
  label: "Groups",
  iconBgColor: "#000000",
  description: "Organize modifier options into logical groups with selection rules like required, optional, or multi-select."
}];
const additionalOptions = [{
  id: "menu-sort",
  label: "Menu Sort",
  options: ["Default", "Alphabetical", "Drag & Drop", "Popular"],
  defaultValue: "Default"
}, {
  id: "modifier-style",
  label: "Modifier Style",
  options: ["Standard", "Classic"],
  defaultValue: "Standard"
}];
const MenuSettingsContent = ({
  showHeader = true,
  onBack,
  onNavigate,
  onAIClick
}: MenuSettingsContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    getIconBgColor,
    getIconSizeClass,
    iconSize
  } = useAppearance();
  const isMobile = useIsMobile();
  const { menuSort, modifierStyle } = useMenuPreferences();
  const iconSizeClass = getIconSizeClass();
  const containerSize = iconContainerSizeMap[iconSize];
  const handleItemClick = (itemId: string) => {
    onNavigate?.(`/settings/menu/${itemId}`);
  };

  const selectValues: Record<string, {value: string;setter: (v: string) => void;}> = {
    "menu-sort": { value: menuSort.value, setter: (v) => menuSort.update(v) },
    "modifier-style": { value: modifierStyle.value, setter: (v) => modifierStyle.update(v) }
  };
  return <div className="flex flex-col h-full">
      {/* Header */}
      {showHeader








    }

      {/* Content */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide ${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-start">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
          backgroundColor: "#FF9500"
        }}>
            <img src={settingsMenuIcon} alt="Menu" className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Menu</h2>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            {isExpanded ? <>
                Menu Settings allow you to create, organize, control availability, and customize how your menu appears across different ordering channels such as Point of Sale, online ordering, and self-service kiosks.{" "}
                <button onClick={() => setIsExpanded(false)} className="hover:underline" style={{
              color: "#0088FF"
            }}>
                  Less
                </button>
              </> : <>
                Menu Settings allow you to create, organize, control availability, and customize how your menu appears across different ordering channels.{" "}
                <button onClick={() => setIsExpanded(true)} className="hover:underline" style={{
              color: "#0088FF"
            }}>
                  Learn More...
                </button>
              </>}
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => onNavigate?.('/settings/ai'))} />
        </div>

        {/* Menu Items List */}
        <div className="space-y-4 mb-4">
          {menuItems.map((item) => <div key={item.id}>
              <button onClick={() => handleItemClick(item.id)} className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity bg-neutral-800/60 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`${containerSize} rounded-xl flex items-center justify-center transition-all`} style={{
                backgroundColor: getIconBgColor(item.iconBgColor)
              }}>
                    <img src={item.iconSrc} alt={item.label} className={`${iconSizeClass} transition-all`} />
                  </div>
                   <span className="text-foreground text-base font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </button>
              {item.description && <p className="text-neutral-500 text-xs mt-1.5 px-4 leading-relaxed">{item.description}</p>}
            </div>)}
        </div>

        {/* Additional Options */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          {additionalOptions.map((option, index) => <div key={option.id}>
              <div className="flex items-center justify-between w-full py-3.5 px-4">
                <span className="text-foreground text-lg font-medium">{option.label}</span>
                <Select
              value={selectValues[option.id].value}
              onValueChange={selectValues[option.id].setter}>

                  <SelectTrigger className="w-auto min-w-[120px] bg-transparent border-0 shadow-none text-neutral-400 text-sm gap-1.5 h-auto p-0 focus:ring-0 [&>svg]:text-neutral-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700 z-[9999]">
                    {option.options.map((opt) =>
                <SelectItem key={opt} value={opt} className="text-foreground focus:bg-neutral-700 focus:text-foreground">
                        {opt}
                      </SelectItem>
                )}
                  </SelectContent>
                </Select>
              </div>
              {index < additionalOptions.length - 1 && <div className="h-px bg-neutral-700/50 mx-4" />}
            </div>)}
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          These settings control how menu items are sorted and how modifiers appear on the Point of Sale, helping staff navigate and take orders more efficiently.
        </p>
      </div>
    </div>;
};
export default MenuSettingsContent;