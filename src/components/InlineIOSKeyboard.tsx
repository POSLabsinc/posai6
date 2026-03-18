import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumericKeypad } from "@/components/NumericKeypad";

type InlineIOSKeyboardMode = "email" | "phone";
type InlineIOSKeyboardSize = "default" | "large";

interface InlineIOSKeyboardProps {
  mode: InlineIOSKeyboardMode;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  className?: string;
  fullWidth?: boolean;
  size?: InlineIOSKeyboardSize;
}

const emailKeyRows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
  ["@", ".", "_", "-", ".com", "delete"],
];

export const InlineIOSKeyboard = ({
  mode,
  onKeyPress,
  onDelete,
  className,
  fullWidth = false,
  size = "default",
}: InlineIOSKeyboardProps) => {
  const isLarge = size === "large";

  if (mode === "phone") {
    return (
      <div className={cn(fullWidth ? "w-full" : "w-full max-w-[280px] mx-auto", className)}>
        <NumericKeypad
          onKeyPress={onKeyPress}
          onDelete={onDelete}
          variant="dark"
          fullWidth={fullWidth || isLarge}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02]",
        fullWidth ? (isLarge ? "p-4" : "p-3") : "max-w-[360px] mx-auto p-2.5",
        className,
      )}
    >
      <div className={cn("flex flex-col", isLarge ? "gap-2" : "gap-1.5")}>
        {emailKeyRows.map((row, rowIndex) => (
          <div key={rowIndex} className={cn("flex", fullWidth ? "w-full gap-2" : "justify-center gap-1")}>
            {row.map((key) => {
              const isDelete = key === "delete";
              const isWide = key.length > 1 && !isDelete;

              const keySizeClass = fullWidth
                ? isDelete
                  ? "flex-[1.15] px-3"
                  : isWide
                    ? "flex-[1.15] px-3 text-sm font-semibold"
                    : "flex-1 text-base font-medium"
                : isDelete
                  ? "min-w-[50px] px-3"
                  : isWide
                    ? cn("min-w-[50px] px-3 font-semibold", isLarge ? "text-sm" : "text-xs")
                    : cn(isLarge ? "w-10 sm:w-11 text-base" : "w-8 sm:w-9 text-sm", "font-medium");

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => (isDelete ? onDelete() : onKeyPress(key))}
                  className={cn(
                    "rounded-xl border border-foreground/[0.08] bg-foreground/[0.06] text-foreground transition-all duration-150 active:scale-[0.95] hover:bg-foreground/[0.1]",
                    isLarge || fullWidth ? "h-12" : "h-10",
                    keySizeClass,
                  )}
                >
                  {isDelete ? (
                    <Delete className={cn("mx-auto", isLarge || fullWidth ? "w-5 h-5" : "w-4 h-4")} />
                  ) : (
                    key
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InlineIOSKeyboard;
