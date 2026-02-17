import { Delete } from "lucide-react";

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  variant?: "dark" | "light";
  className?: string;
  fullWidth?: boolean;
}

/**
 * Shared numeric keypad component used across:
 * - Clock In / Clock Out flows
 * - Text Receipt phone number entry
 * 
 * Maintains identical layout, key sizing, spacing, typography, 
 * visual states (default, pressed, disabled), and interaction behavior.
 */
export const NumericKeypad = ({ 
  onKeyPress, 
  onDelete, 
  variant = "dark",
  className = "",
  fullWidth = false
}: NumericKeypadProps) => {
  const isDark = variant === "dark";
  
  const buttonBaseClass = isDark
    ? "rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-foreground transition-all duration-150 active:scale-95"
    : "rounded-lg bg-white hover:bg-neutral-100 active:bg-neutral-200 transition-colors";
  
  const textClass = isDark
    ? "text-2xl font-medium"
    : "text-black text-2xl font-medium";

  const deleteIconClass = isDark
    ? "w-6 h-6 text-foreground/60"
    : "w-6 h-6 text-black";

  // Full width mode uses rectangular buttons instead of square
  const buttonHeight = fullWidth ? "h-[72px]" : "aspect-square";
  const lastRowHeight = fullWidth ? "h-[72px]" : "h-[70px]";

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Numeric Keypad 1-9 */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => onKeyPress(num.toString())}
            className={`${buttonHeight} ${buttonBaseClass} flex items-center justify-center`}
          >
            <span className={textClass}>{num}</span>
          </button>
        ))}
      </div>

      {/* Last row: 0 and Delete - 2 column layout */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onKeyPress("0")}
          className={`${lastRowHeight} ${buttonBaseClass} flex items-center justify-center`}
        >
          <span className={textClass}>0</span>
        </button>
        <button
          onClick={onDelete}
          className={`${lastRowHeight} ${buttonBaseClass} flex items-center justify-center`}
        >
          <Delete className={deleteIconClass} />
        </button>
      </div>
    </div>
  );
};

export default NumericKeypad;
