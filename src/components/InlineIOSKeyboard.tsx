import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumericKeypad } from "@/components/NumericKeypad";

type InlineIOSKeyboardMode = "email" | "phone";

interface InlineIOSKeyboardProps {
  mode: InlineIOSKeyboardMode;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  className?: string;
}

const emailKeyRows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
  ["@", ".", "_", "-", ".com", "delete"],
];

export const InlineIOSKeyboard = ({ mode, onKeyPress, onDelete, className }: InlineIOSKeyboardProps) => {
  if (mode === "phone") {
    return (
      <div className={cn("w-full max-w-[280px] mx-auto", className)}>
        <NumericKeypad onKeyPress={onKeyPress} onDelete={onDelete} variant="dark" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full max-w-[360px] mx-auto rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] p-2.5",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        {emailKeyRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => {
              const isDelete = key === "delete";
              const isWide = key.length > 1 && !isDelete;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => (isDelete ? onDelete() : onKeyPress(key))}
                  className={cn(
                    "h-10 rounded-xl border border-foreground/[0.08] bg-foreground/[0.06] text-foreground transition-all duration-150 active:scale-[0.95] hover:bg-foreground/[0.1]",
                    isDelete
                      ? "min-w-[50px] px-3"
                      : isWide
                        ? "min-w-[50px] px-3 text-xs font-semibold"
                        : "w-8 sm:w-9 text-sm font-medium",
                  )}
                >
                  {isDelete ? <Delete className="w-4 h-4 mx-auto" /> : key}
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
