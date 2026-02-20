import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Delete, Plus } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface CustomItemBottomSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, price: number) => void;
}

const CustomItemBottomSheet: React.FC<CustomItemBottomSheetProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [activeField, setActiveField] = useState<"name" | "price">("name");
  const [isShiftActive, setIsShiftActive] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setName("");
      setPrice("");
      setActiveField("name");
      setIsShiftActive(false);
      // Auto-focus name field after animation
      const t = setTimeout(() => nameInputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAdd = useCallback(() => {
    const p = parseFloat(price);
    if (name.trim() && p > 0) {
      onAdd(name.trim(), p);
      handleClose();
    }
  }, [name, price, onAdd, handleClose]);

  // Swipe-down to dismiss
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      handleClose();
    }
  };

  // Numpad handler for price
  const handleNumpad = (val: string) => {
    if (val === "backspace") {
      setPrice((p) => p.slice(0, -1));
    } else if (val === ".") {
      if (!price.includes(".")) setPrice((p) => p + ".");
    } else {
      const parts = price.split(".");
      if (parts.length === 2 && parts[1].length >= 2) return;
      setPrice((p) => p + val);
    }
  };

  // Keyboard handler for name
  const handleKeyboard = (key: string) => {
    if (key === "backspace") {
      setName((n) => n.slice(0, -1));
    } else if (key === "space") {
      setName((n) => n + " ");
    } else if (key === "shift") {
      setIsShiftActive((s) => !s);
    } else if (key === "123") {
      setActiveField("price");
    } else {
      setName((prev) => {
        const shouldCap = prev.length === 0 || prev.endsWith(" ");
        const ch = shouldCap || isShiftActive ? key.toUpperCase() : key.toLowerCase();
        if (isShiftActive) setIsShiftActive(false);
        return prev + ch;
      });
    }
  };

  const isValid = name.trim().length > 0 && parseFloat(price) > 0;

  const keyBtn =
    "bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center select-none touch-manipulation";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — blur but NOT dismissible on tap */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[61] flex flex-col"
            style={{ height: "90dvh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <div className="flex flex-col h-full bg-neutral-900 rounded-t-[20px] overflow-hidden shadow-2xl">
              {/* Drag indicator */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full bg-neutral-600" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-neutral-800">
                <h2 className="text-white text-base font-semibold">Custom Item</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-500 flex items-center justify-center transition-colors touch-manipulation"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="px-4 pt-4 pb-2 flex flex-col gap-3 flex-shrink-0">
                {/* Name Field */}
                <div
                  className={`flex items-center gap-3 bg-neutral-800 rounded-xl px-4 py-3 border-2 transition-colors ${
                    activeField === "name" ? "border-orange-500" : "border-neutral-700"
                  }`}
                  onClick={() => {
                    setActiveField("name");
                    nameInputRef.current?.focus();
                  }}
                >
                  <span className="text-neutral-400 text-xs uppercase font-semibold w-12 flex-shrink-0">Name</span>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    readOnly
                    onFocus={() => setActiveField("name")}
                    placeholder="Enter item name"
                    className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-neutral-500 caret-orange-500"
                  />
                  {name.length > 0 && activeField === "name" && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setName("")}
                      className="text-neutral-500 hover:text-white transition-colors touch-manipulation p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Price Field */}
                <div
                  className={`flex items-center gap-3 bg-neutral-800 rounded-xl px-4 py-3 border-2 transition-colors ${
                    activeField === "price" ? "border-orange-500" : "border-neutral-700"
                  }`}
                  onClick={() => setActiveField("price")}
                >
                  <span className="text-neutral-400 text-xs uppercase font-semibold w-12 flex-shrink-0">Price</span>
                  <span className="text-white text-sm font-medium flex-shrink-0">$</span>
                  <input
                    type="text"
                    value={price}
                    readOnly
                    onFocus={() => setActiveField("price")}
                    placeholder="0.00"
                    inputMode="none"
                    className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-neutral-500 caret-orange-500"
                  />
                  {price.length > 0 && activeField === "price" && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setPrice("")}
                      className="text-neutral-500 hover:text-white transition-colors touch-manipulation p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sticky Add Button */}
              <div className="px-4 py-3 flex-shrink-0">
                <button
                  onClick={handleAdd}
                  disabled={!isValid}
                  className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: isValid
                      ? "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
                      : "#444",
                    minHeight: 48,
                  }}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Add to Order
                  {price && parseFloat(price) > 0 && (
                    <span className="font-bold">${parseFloat(price).toFixed(2)}</span>
                  )}
                </button>
              </div>

              {/* Keyboard / Numpad Area */}
              <div className="flex-1 px-3 pb-4 flex flex-col gap-2 overflow-hidden min-h-0">
                {activeField === "name" ? (
                  /* QWERTY keyboard */
                  <div className="flex flex-col gap-1.5 flex-1">
                    {/* Row 1 */}
                    <div className="grid grid-cols-10 gap-1 flex-1">
                      {["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].map((k) => (
                        <button
                          key={k}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleKeyboard(k)}
                          className={`${keyBtn} text-sm py-0`}
                          style={{ minHeight: 40 }}
                        >
                          {isShiftActive ? k.toUpperCase() : k}
                        </button>
                      ))}
                    </div>
                    {/* Row 2 */}
                    <div className="grid grid-cols-10 gap-1 flex-1">
                      {["a", "s", "d", "f", "g", "h", "j", "k", "l"].map((k) => (
                        <button
                          key={k}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleKeyboard(k)}
                          className={`${keyBtn} text-sm py-0`}
                          style={{ minHeight: 40 }}
                        >
                          {isShiftActive ? k.toUpperCase() : k}
                        </button>
                      ))}
                      <div />
                    </div>
                    {/* Row 3 */}
                    <div className="grid grid-cols-10 gap-1 flex-1">
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleKeyboard("shift")}
                        className={`${keyBtn} text-sm py-0 col-span-1 ${isShiftActive ? "bg-orange-600 hover:bg-orange-500" : ""}`}
                        style={{ minHeight: 40 }}
                      >
                        ⇧
                      </button>
                      {["z", "x", "c", "v", "b", "n", "m"].map((k) => (
                        <button
                          key={k}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleKeyboard(k)}
                          className={`${keyBtn} text-sm py-0`}
                          style={{ minHeight: 40 }}
                        >
                          {isShiftActive ? k.toUpperCase() : k}
                        </button>
                      ))}
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleKeyboard("backspace")}
                        className={`${keyBtn} text-sm py-0 col-span-2`}
                        style={{ minHeight: 40 }}
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Row 4 */}
                    <div className="grid grid-cols-6 gap-1 flex-1">
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleKeyboard("123")}
                        className={`${keyBtn} text-xs py-0`}
                        style={{ minHeight: 40 }}
                      >
                        123
                      </button>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleKeyboard("space")}
                        className={`${keyBtn} text-sm py-0 col-span-5`}
                        style={{ minHeight: 40 }}
                      >
                        Space
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Numpad */
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((n) => (
                        <button
                          key={n}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleNumpad(n)}
                          className={`${keyBtn} text-xl font-semibold`}
                          style={{ minHeight: 52 }}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleNumpad(".")}
                        className={`${keyBtn} text-xl font-semibold`}
                        style={{ minHeight: 52 }}
                      >
                        .
                      </button>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleNumpad("0")}
                        className={`${keyBtn} text-xl font-semibold`}
                        style={{ minHeight: 52 }}
                      >
                        0
                      </button>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleNumpad("backspace")}
                        className={`${keyBtn} text-xl`}
                        style={{ minHeight: 52 }}
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomItemBottomSheet;
