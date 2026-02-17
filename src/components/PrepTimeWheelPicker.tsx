import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface PrepTimeWheelPickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: number;
  onConfirm: (value: number) => void;
  triggerRef?: React.RefObject<HTMLDivElement>;
  externalInputValue?: number; // Value from inline input to sync scroll
}

const ITEM_HEIGHT = 44; // Height of each picker item
const VISIBLE_ITEMS = 5; // Number of visible items (odd number for center selection)
const MAX_PREP_TIME = 120; // Maximum prep time in minutes

export function PrepTimeWheelPicker({ isOpen, onClose, value, onConfirm, triggerRef, externalInputValue }: PrepTimeWheelPickerProps) {
  const [selectedValue, setSelectedValue] = useState(value);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);

  // Generate time options (0 to MAX_PREP_TIME)
  const timeOptions = Array.from({ length: MAX_PREP_TIME + 1 }, (_, i) => i);

  // Calculate position based on trigger element - align to right side
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pickerWidth = 140; // minWidth of picker
      setPosition({
        top: rect.bottom + 8,
        left: rect.right - pickerWidth // Align picker's right edge with trigger's right edge
      });
    }
  }, [isOpen, triggerRef]);

  // Scroll to selected value when picker opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      setSelectedValue(value);
      const scrollPosition = value * ITEM_HEIGHT;
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [isOpen, value]);

  // Sync scroll with external input value
  useEffect(() => {
    if (isOpen && scrollRef.current && externalInputValue !== undefined && !isNaN(externalInputValue)) {
      const clampedValue = Math.max(0, Math.min(externalInputValue, MAX_PREP_TIME));
      setSelectedValue(clampedValue);
      scrollRef.current.scrollTo({
        top: clampedValue * ITEM_HEIGHT,
        behavior: "smooth"
      });
    }
  }, [isOpen, externalInputValue]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Delay adding listener to avoid immediate close
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Snap to nearest value
  const snapToNearestValue = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(nearestIndex, MAX_PREP_TIME));
    
    scrollRef.current.scrollTo({
      top: clampedIndex * ITEM_HEIGHT,
      behavior: "smooth"
    });
    
    setSelectedValue(clampedIndex);
    onConfirm(clampedIndex);
  }, [onConfirm]);

  // Debounced snap after scroll ends
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSnap = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => {
      snapToNearestValue();
    }, 150);
  }, [snapToNearestValue]);

  // Handle scroll - update selected value during scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(nearestIndex, MAX_PREP_TIME));
    setSelectedValue(clampedIndex);
    
    // Debounce the snap and confirm
    debouncedSnap();
  }, [debouncedSnap]);

  // Native scroll handler for wheel events
  const handleWheel = useCallback(() => {
    debouncedSnap();
  }, [debouncedSnap]);

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "0 min";
    if (minutes === 1) return "1 min";
    return `${minutes} mins`;
  };

  // Use portal to render picker at document body level
  const pickerContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed rounded-2xl overflow-hidden"
          style={{ 
            top: position.top,
            left: position.left,
            zIndex: 9999,
            background: "linear-gradient(180deg, rgba(70, 70, 70, 0.98) 0%, rgba(50, 50, 50, 0.98) 100%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            minWidth: "140px"
          }}
        >
          {/* Wheel Picker */}
          <div 
            className="relative overflow-hidden"
            style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
          >
            {/* Selection Highlight */}
            <div 
              className="absolute left-2 right-2 pointer-events-none z-10 rounded-lg"
              style={{ 
                top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
                height: ITEM_HEIGHT,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.15)"
              }}
            />
            
            {/* Top Fade Gradient */}
            <div 
              className="absolute top-0 left-0 right-0 pointer-events-none z-20"
              style={{
                height: ITEM_HEIGHT * 1.5,
                background: "linear-gradient(to bottom, rgba(60, 60, 60, 0.98) 0%, transparent 100%)"
              }}
            />
            
            {/* Bottom Fade Gradient */}
            <div 
              className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
              style={{
                height: ITEM_HEIGHT * 1.5,
                background: "linear-gradient(to top, rgba(50, 50, 50, 0.98) 0%, transparent 100%)"
              }}
            />
            
            {/* Scrollable List */}
            <div
              ref={scrollRef}
              className="h-full overflow-y-scroll scrollbar-hide touch-pan-y"
              style={{ 
                scrollSnapType: "y mandatory",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
                overscrollBehavior: "contain"
              }}
              onScroll={handleScroll}
              onWheel={handleWheel}
            >
              {/* Top Padding */}
              <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
              
              {timeOptions.map((time) => {
                const isSelected = time === selectedValue;
                const distance = Math.abs(time - selectedValue);
                const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25;
                const scale = distance === 0 ? 1 : distance === 1 ? 0.95 : 0.9;
                
                return (
                  <div
                    key={time}
                    className="flex items-center justify-center cursor-pointer select-none"
                    style={{ 
                      height: ITEM_HEIGHT,
                      scrollSnapAlign: "center",
                      opacity,
                      transform: `scale(${scale})`,
                      transition: "opacity 0.15s, transform 0.15s"
                    }}
                    onClick={() => {
                      if (scrollRef.current) {
                        scrollRef.current.scrollTo({
                          top: time * ITEM_HEIGHT,
                          behavior: "smooth"
                        });
                        setSelectedValue(time);
                        onConfirm(time);
                      }
                    }}
                  >
                    <span 
                      className={`text-lg font-semibold transition-colors ${
                        isSelected ? "text-white" : "text-white/40"
                      }`}
                    >
                      {formatTime(time)}
                    </span>
                  </div>
                );
              })}
              
              {/* Bottom Padding */}
              <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(pickerContent, document.body);
}