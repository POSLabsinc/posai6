import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddDefaultModifierContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const AddDefaultModifierContent = ({ showHeader = true, onBack }: AddDefaultModifierContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<"Normal" | "Exceptional">("Normal");

  const handleSave = async () => {
    if (name.trim()) {
      const { error } = await (supabase as any).from("default_modifiers").insert({
        name: name.trim(),
        type,
        archived: false,
        sort_order: 0,
      });
      if (!error) {
        toast({ title: "Default modifier saved" });
      } else {
        toast({ description: "Failed to save default modifier", variant: "destructive" });
      }
    }
  };

  const handleBack = async () => {
    await handleSave();
    if (onBack) onBack();
    else navigate('/settings/menu/default-modifiers');
  };

  const toggleType = () => {
    setType(prev => prev === "Normal" ? "Exceptional" : "Normal");
  };

  // Desktop / Tablet layout
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && (
          <div className="flex items-center justify-center relative px-6 pt-5">
            <button onClick={handleBack} className="absolute left-6 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity" aria-label="Back">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Add Default Modifier</h1>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 pb-6">
          <section className="rounded-2xl bg-[#26262699] overflow-hidden mt-6 mb-1">
            <div className="flex items-center justify-between w-full px-8 py-5">
              <span className="text-[15px] text-foreground">Add Default Modifiers</span>
              <div className="flex items-center gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" className="w-48 h-9 text-right bg-transparent border-none text-[15px] text-[hsl(var(--text-subtle))] placeholder:text-[hsl(var(--text-subtle))] focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
            </div>
            <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
            <button onClick={toggleType} className="flex items-center justify-between w-full px-8 py-5 hover:bg-neutral-700/30 transition-colors text-left">
              <span className="text-[15px] text-foreground">Add Default Modifier Category</span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-[hsl(var(--text-subtle))]">{type}</span>
                <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
              </div>
            </button>
          </section>
          <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
            Select the category type for the default modifier (for example, Normal or another defined type). This helps organise and manage default modifiers correctly within the system.
          </p>
        </div>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {showHeader && (
        <div className="flex items-center gap-3 py-4 px-4">
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Add Default Modifier</h1>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        <section className="rounded-2xl bg-neutral-800/60 overflow-hidden mb-1">
          <div className="flex items-center justify-between w-full py-4 px-4">
            <span className="text-foreground text-base font-medium">Add Default Modifiers</span>
            <div className="flex items-center gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" className="w-36 h-9 text-right bg-transparent border-none text-base text-neutral-400 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <button onClick={toggleType} className="flex items-center justify-between w-full py-4 px-4 active:bg-neutral-700/30 transition-colors text-left">
            <span className="text-foreground text-base font-medium">Add Default Modifier Category</span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-base">{type}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </section>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Select the category type for the default modifier (for example, Normal or another defined type). This helps organise and manage default modifiers correctly within the system.
        </p>
      </div>
    </div>
  );
};

export default AddDefaultModifierContent;
