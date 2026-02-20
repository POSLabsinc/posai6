import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Clock, 
  RotateCcw,
  Package,
  ChevronDown,
  ChevronRight,
  X,
  ChevronLeft,
  Ban
} from "lucide-react";
import { EightySixBadge } from "./EightySixBadge";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const restoreDurations = [
  { id: 'now', label: 'Restore Now', ms: 0 },
  { id: '5min', label: 'In 5 minutes', ms: 5 * 60 * 1000 },
  { id: '10min', label: 'In 10 minutes', ms: 10 * 60 * 1000 },
  { id: '15min', label: 'In 15 minutes', ms: 15 * 60 * 1000 },
  { id: '20min', label: 'In 20 minutes', ms: 20 * 60 * 1000 },
  { id: '1hr', label: 'In 1 hour', ms: 60 * 60 * 1000 },
  { id: '2hr', label: 'In 2 hours', ms: 2 * 60 * 60 * 1000 },
  { id: 'custom', label: 'Custom time', ms: null },
];

export interface EightySixedItem {
  id: string;
  name: string;
  category: string;
  reason: string;
  snoozedAt: Date;
  snoozeEndTime: Date | null; // null = indefinite
  scheduledRestoreTime?: Date | null; // When the item is scheduled to be restored
}

interface EightySixSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eightySixedItems: EightySixedItem[];
  onRestoreItem: (itemId: string) => void;
  onScheduleRestore: (itemId: string, restoreTime: Date) => void;
  onEightySixItem: (item: { name: string; category: string; snoozeDuration: string }) => void;
}

const menuCategories = [
  {
    name: "Entrees",
    items: ["Grilled Salmon", "Ribeye Steak", "Chicken Parmesan", "Lamb Chops", "Lobster Roll"]
  },
  {
    name: "Appetizers", 
    items: ["Caesar Salad", "Buffalo Wings", "Garlic Bread", "Clam Chowder", "Guacamole"]
  },
  {
    name: "Sides",
    items: ["Mashed Potatoes", "Roasted Vegetables", "Asparagus", "French Fries", "Rice Pilaf"]
  },
  {
    name: "Drinks",
    items: ["Sparkling Water", "Iced Tea", "Margarita", "Glass of Wine", "Cappuccino"]
  },
  {
    name: "Desserts",
    items: ["Tiramisu", "Churros", "Chocolate Cake", "Fresh Fruit Bowl", "Ice Cream"]
  }
];

const snoozeDurations = [
  { id: '15min', label: '15 min', ms: 15 * 60 * 1000 },
  { id: '1hr', label: '1 hour', ms: 60 * 60 * 1000 },
  { id: 'end_of_shift', label: 'End of shift', ms: 8 * 60 * 60 * 1000 },
  { id: 'indefinite', label: 'Until restored', ms: null },
];

const formatTimeRemaining = (endTime: Date | null) => {
  if (!endTime) return "Until restored";
  
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return "Expired";
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m left`;
  }
  return `${minutes}m left`;
};

const formatScheduledRestoreTime = (restoreTime: Date) => {
  return restoreTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export function EightySixSheet({
  open,
  onOpenChange,
  eightySixedItems,
  onRestoreItem,
  onScheduleRestore,
  onEightySixItem,
}: EightySixSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Entrees"]));
  const [selectedDuration, setSelectedDuration] = useState<string>("1hr");
  const [view, setView] = useState<'add' | 'manage'>('manage');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);
  
  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const minutesScrollRef = useRef<HTMLDivElement>(null);
  const hoursTimeout = useRef<NodeJS.Timeout | null>(null);
  const minutesTimeout = useRef<NodeJS.Timeout | null>(null);

  const hoursOptions = Array.from({ length: 13 }, (_, i) => i); // 0-12 hours
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i); // 0-59 minutes

  // Scroll to initial values when custom picker opens
  useEffect(() => {
    if (showCustomTimePicker) {
      if (hoursScrollRef.current) {
        hoursScrollRef.current.scrollTop = customHours * ITEM_HEIGHT;
      }
      if (minutesScrollRef.current) {
        minutesScrollRef.current.scrollTop = customMinutes * ITEM_HEIGHT;
      }
    }
  }, [showCustomTimePicker]);

  const snapToNearest = useCallback((scrollRef: React.RefObject<HTMLDivElement>, maxValue: number, setValue: (v: number) => void) => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(nearestIndex, maxValue));
    scrollRef.current.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: "smooth" });
    setValue(clampedIndex);
  }, []);

  const handleHoursScroll = useCallback(() => {
    if (!hoursScrollRef.current) return;
    const scrollTop = hoursScrollRef.current.scrollTop;
    const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
    setCustomHours(Math.max(0, Math.min(nearestIndex, 12)));
    
    if (hoursTimeout.current) clearTimeout(hoursTimeout.current);
    hoursTimeout.current = setTimeout(() => snapToNearest(hoursScrollRef, 12, setCustomHours), 150);
  }, [snapToNearest]);

  const handleMinutesScroll = useCallback(() => {
    if (!minutesScrollRef.current) return;
    const scrollTop = minutesScrollRef.current.scrollTop;
    const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
    setCustomMinutes(Math.max(0, Math.min(nearestIndex, 59)));
    
    if (minutesTimeout.current) clearTimeout(minutesTimeout.current);
    minutesTimeout.current = setTimeout(() => snapToNearest(minutesScrollRef, 59, setCustomMinutes), 150);
  }, [snapToNearest]);

  const handleRestoreWithDuration = (itemId: string, durationId: string) => {
    if (durationId === 'custom') {
      setShowCustomTimePicker(true);
      return;
    }
    
    // Handle immediate restore
    if (durationId === 'now') {
      onRestoreItem(itemId);
      setOpenPopoverId(null);
      setShowCustomTimePicker(false);
      return;
    }
    
    // Find the duration and calculate restore time
    const duration = restoreDurations.find(d => d.id === durationId);
    if (duration && duration.ms) {
      const restoreTime = new Date(Date.now() + duration.ms);
      onScheduleRestore(itemId, restoreTime);
    } else {
      // Immediate restore fallback
      onRestoreItem(itemId);
    }
    setOpenPopoverId(null);
    setShowCustomTimePicker(false);
  };

  const handleCustomTimeConfirm = (itemId: string) => {
    if (customHours > 0 || customMinutes > 0) {
      const ms = (customHours * 60 + customMinutes) * 60 * 1000;
      const restoreTime = new Date(Date.now() + ms);
      onScheduleRestore(itemId, restoreTime);
      setOpenPopoverId(null);
      setShowCustomTimePicker(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleEightySix = (itemName: string, category: string) => {
    onEightySixItem({
      name: itemName,
      category,
      snoozeDuration: selectedDuration
    });
  };

  const isItemEightySixed = (itemName: string) => {
    return eightySixedItems.some(item => item.name === itemName);
  };

  const filteredCategories = menuCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-[400px] sm:max-w-[400px] bg-neutral-900 border-neutral-800 p-0 flex flex-col"
        >
          <SheetHeader className="p-4 border-b border-[hsl(0,84%,60%)]/30">
            <SheetTitle className="text-white text-lg font-semibold flex items-center gap-3">
              <div className="eighty-six-icon w-7 h-7">
                <Ban size={16} strokeWidth={2.5} />
              </div>
              <span>86 Products</span>
              {eightySixedItems.length > 0 && (
                <EightySixBadge 
                  size="lg" 
                  label={eightySixedItems.length.toString()} 
                  showIcon={false}
                  pulse
                />
              )}
            </SheetTitle>
          </SheetHeader>

          {/* View Toggle */}
          <div className="flex items-center gap-2 p-4 border-b border-white/10">
            <button
              onClick={() => setView('manage')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'manage' 
                  ? 'bg-white text-black' 
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'
              }`}
            >
              Currently 86'd ({eightySixedItems.length})
            </button>
            <button
              onClick={() => setView('add')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'add' 
                  ? 'bg-white text-black' 
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'
              }`}
            >
              Add Products
            </button>
          </div>

          {view === 'manage' ? (
            /* Currently 86'd Products */
            <ScrollArea className="flex-1">
              {eightySixedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <Package className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/40 text-center">No products are currently 86'd</p>
                  <Button
                    variant="outline"
                    onClick={() => setView('add')}
                    className="mt-4 border-white/20 text-white hover:bg-white/10"
                  >
                    Add Products
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {eightySixedItems.map(item => (
                    <div
                      key={item.id}
                      className="eighty-six-card flex items-center justify-between"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="eighty-six-icon flex-shrink-0 mt-0.5">
                          <X size={12} strokeWidth={3} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[hsl(0,84%,60%)] font-semibold truncate">{item.name}</p>
                            <EightySixBadge size="sm" variant="subtle" />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-white/50">{item.category}</span>
                            <span className="text-xs text-white/20">•</span>
                            <span className="text-xs text-[hsl(0,84%,60%)] font-medium">{item.reason}</span>
                          </div>
                          {item.scheduledRestoreTime ? (
                            <div className="flex items-center gap-1.5 mt-2 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md w-fit">
                              <RotateCcw className="w-3 h-3" />
                              <span className="text-xs font-medium">Restores at {formatScheduledRestoreTime(item.scheduledRestoreTime)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-2 text-white/60">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{formatTimeRemaining(item.snoozeEndTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Popover 
                        open={openPopoverId === item.id} 
                        onOpenChange={(open) => {
                          setOpenPopoverId(open ? item.id : null);
                          if (!open) setShowCustomTimePicker(false);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-[220px] p-0 bg-neutral-900 border-white/10 rounded-xl overflow-hidden" 
                          align="end"
                          sideOffset={8}
                        >
                          {showCustomTimePicker ? (
                            <div className="p-3">
                              <div className="flex items-center gap-2 mb-3">
                                <button
                                  onClick={() => setShowCustomTimePicker(false)}
                                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                >
                                  <ChevronLeft className="w-4 h-4 text-white/60" />
                                </button>
                                <p className="text-white text-sm font-medium">Custom time</p>
                              </div>
                              
                              {/* Wheel Picker */}
                              <div className="flex items-center justify-center gap-2 mb-3">
                                {/* Hours Picker */}
                                <div className="relative overflow-hidden rounded-lg" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, width: 80 }}>
                                  <div 
                                    className="absolute left-1 right-1 pointer-events-none z-10 rounded-md"
                                    style={{ 
                                      top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
                                      height: ITEM_HEIGHT,
                                      background: "rgba(255, 255, 255, 0.1)",
                                      border: "1px solid rgba(255, 255, 255, 0.15)"
                                    }}
                                  />
                                  <div 
                                    className="absolute top-0 left-0 right-0 pointer-events-none z-20"
                                    style={{ height: ITEM_HEIGHT * 1.5, background: "linear-gradient(to bottom, #171717 0%, transparent 100%)" }}
                                  />
                                  <div 
                                    className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
                                    style={{ height: ITEM_HEIGHT * 1.5, background: "linear-gradient(to top, #171717 0%, transparent 100%)" }}
                                  />
                                  <div
                                    ref={hoursScrollRef}
                                    className="h-full overflow-y-scroll scrollbar-hide touch-pan-y"
                                    style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", scrollBehavior: "smooth", overscrollBehavior: "contain" }}
                                    onScroll={handleHoursScroll}
                                  >
                                    <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
                                    {hoursOptions.map((hour) => {
                                      const isSelected = hour === customHours;
                                      const distance = Math.abs(hour - customHours);
                                      const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25;
                                      return (
                                        <div
                                          key={hour}
                                          className="flex items-center justify-center cursor-pointer select-none"
                                          style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center", opacity, transition: "opacity 0.15s" }}
                                          onClick={() => {
                                            if (hoursScrollRef.current) {
                                              hoursScrollRef.current.scrollTo({ top: hour * ITEM_HEIGHT, behavior: "smooth" });
                                              setCustomHours(hour);
                                            }
                                          }}
                                        >
                                          <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/40"}`}>
                                            {hour}h
                                          </span>
                                        </div>
                                      );
                                    })}
                                    <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
                                  </div>
                                </div>

                                {/* Minutes Picker */}
                                <div className="relative overflow-hidden rounded-lg" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, width: 80 }}>
                                  <div 
                                    className="absolute left-1 right-1 pointer-events-none z-10 rounded-md"
                                    style={{ 
                                      top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
                                      height: ITEM_HEIGHT,
                                      background: "rgba(255, 255, 255, 0.1)",
                                      border: "1px solid rgba(255, 255, 255, 0.15)"
                                    }}
                                  />
                                  <div 
                                    className="absolute top-0 left-0 right-0 pointer-events-none z-20"
                                    style={{ height: ITEM_HEIGHT * 1.5, background: "linear-gradient(to bottom, #171717 0%, transparent 100%)" }}
                                  />
                                  <div 
                                    className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
                                    style={{ height: ITEM_HEIGHT * 1.5, background: "linear-gradient(to top, #171717 0%, transparent 100%)" }}
                                  />
                                  <div
                                    ref={minutesScrollRef}
                                    className="h-full overflow-y-scroll scrollbar-hide touch-pan-y"
                                    style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", scrollBehavior: "smooth", overscrollBehavior: "contain" }}
                                    onScroll={handleMinutesScroll}
                                  >
                                    <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
                                    {minutesOptions.map((minute) => {
                                      const isSelected = minute === customMinutes;
                                      const distance = Math.abs(minute - customMinutes);
                                      const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25;
                                      return (
                                        <div
                                          key={minute}
                                          className="flex items-center justify-center cursor-pointer select-none"
                                          style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center", opacity, transition: "opacity 0.15s" }}
                                          onClick={() => {
                                            if (minutesScrollRef.current) {
                                              minutesScrollRef.current.scrollTo({ top: minute * ITEM_HEIGHT, behavior: "smooth" });
                                              setCustomMinutes(minute);
                                            }
                                          }}
                                        >
                                          <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/40"}`}>
                                            {minute}m
                                          </span>
                                        </div>
                                      );
                                    })}
                                    <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
                                  </div>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleCustomTimeConfirm(item.id)}
                                disabled={customHours === 0 && customMinutes === 0}
                                className="w-full py-2 bg-white text-black hover:bg-white/90 rounded-lg text-sm font-semibold disabled:opacity-50"
                              >
                                Confirm
                              </Button>
                            </div>
                          ) : (
                            <div className="py-2">
                              <p className="text-white/40 text-xs px-3 py-1.5">Restore after</p>
                              {restoreDurations.map((duration) => (
                                <button
                                  key={duration.id}
                                  onClick={() => handleRestoreWithDuration(item.id, duration.id)}
                                  className="w-full py-2.5 px-3 hover:bg-white/10 text-white text-sm text-left transition-colors"
                                >
                                  {duration.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          ) : (
            /* Add Products View */
            <>
              {/* Search */}
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu products..."
                    className="pl-9 bg-neutral-800 border-neutral-700 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              {/* Duration Selector */}
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-white/60 text-xs mb-2">Mark as unavailable for:</p>
                <div className="flex gap-1">
                  {snoozeDurations.map(duration => (
                    <button
                      key={duration.id}
                      onClick={() => setSelectedDuration(duration.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedDuration === duration.id
                          ? 'bg-white text-black'
                          : 'bg-neutral-800 text-white/60 hover:bg-neutral-700'
                      }`}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Categories */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {filteredCategories.map(category => (
                    <div key={category.name} className="bg-neutral-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category.name)}
                        className="w-full flex items-center justify-between p-3 hover:bg-neutral-700 transition-colors"
                      >
                        <span className="text-white font-medium">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-sm">{category.items.length}</span>
                          {expandedCategories.has(category.name) ? (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white/40" />
                          )}
                        </div>
                      </button>
                      
                      {expandedCategories.has(category.name) && (
                        <div className="border-t border-white/10">
                          {category.items.map(item => {
                            const is86ed = isItemEightySixed(item);
                            return (
                              <button
                                key={item}
                                onClick={() => !is86ed && handleEightySix(item, category.name)}
                                disabled={is86ed}
                                className={`w-full flex items-center justify-between p-3 border-t border-white/5 first:border-t-0 transition-colors ${
                                  is86ed 
                                    ? 'cursor-not-allowed eighty-six-row' 
                                    : 'hover:bg-neutral-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {is86ed && (
                                    <div className="eighty-six-icon w-4 h-4 flex-shrink-0">
                                      <X size={10} strokeWidth={3} />
                                    </div>
                                  )}
                                  <span className={`text-sm ${is86ed ? 'eighty-six-text' : 'text-white/80'}`}>
                                    {item}
                                  </span>
                                </div>
                                {is86ed ? (
                                  <EightySixBadge size="sm" variant="subtle" />
                                ) : (
                                  <span className="text-xs text-white/40">Tap to 86</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}