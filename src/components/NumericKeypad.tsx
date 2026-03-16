import { Delete } from "lucide-react";

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  variant?: "dark" | "light";
  className?: string;
  fullWidth?: boolean;
}

/**
 * iOS 26-inspired numeric keypad with liquid glass design.
 * Used across Clock In/Out flows and activation code entry.
 */
export const NumericKeypad = ({ 
  onKeyPress, 
  onDelete, 
  variant = "dark",
  className = "",
  fullWidth = false
}: NumericKeypadProps) => {
  const isDark = variant === "dark";
  
  // iOS 26 liquid glass style
  const buttonBaseClass = isDark
    ? "rounded-[18px] bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-foreground transition-all duration-150 active:scale-[0.94] active:bg-white/[0.12] hover:bg-white/[0.09]"
    : "rounded-[18px] bg-black/[0.04] backdrop-blur-md border border-black/[0.06] text-black transition-all duration-150 active:scale-[0.94] active:bg-black/[0.08] hover:bg-black/[0.06]";
  
  const textClass = isDark
    ? "text-[26px] font-light tracking-wide"
    : "text-[26px] font-light tracking-wide text-black";

  const deleteIconClass = isDark
    ? "w-6 h-6 text-foreground/50"
    : "w-6 h-6 text-black/50";

  const buttonHeight = fullWidth ? "h-[60px]" : "h-[56px]";

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {/* Numeric Keypad - 3x3 grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => onKeyPress(num.toString())}
            className={`${buttonHeight} ${buttonBaseClass} flex items-center justify-center cursor-pointer select-none`}
          >
            <span className={textClass}>{num}</span>
          </button>
        ))}
      </div>

      {/* Bottom row: empty, 0, delete */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className={buttonHeight} />
        <button
          onClick={() => onKeyPress("0")}
          className={`${buttonHeight} ${buttonBaseClass} flex items-center justify-center cursor-pointer select-none`}
        >
          <span className={textClass}>0</span>
        </button>
        <button
          onClick={onDelete}
          className={`${buttonHeight} rounded-[18px] flex items-center justify-center cursor-pointer select-none transition-all duration-150 active:scale-[0.94] hover:bg-white/[0.04]`}
        >
          <Delete className={deleteIconClass} />
        </button>
      </div>
    </div>
  );
};

export default NumericKeypad;
