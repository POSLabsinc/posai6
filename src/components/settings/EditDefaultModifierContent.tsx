import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditDefaultModifierContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  modifierId?: string;
}

const EditDefaultModifierContent = ({ showHeader = true, onBack, modifierId: modifierIdProp }: EditDefaultModifierContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { id: idFromParams } = useParams<{ id: string }>();
  const id = modifierIdProp ?? idFromParams ?? undefined;
  const [name, setName] = useState("");
  const [type, setType] = useState<"Normal" | "Exceptional">("Normal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data } = await (supabase as any).from("default_modifiers").select("*").eq("id", id).single();
      if (data) {
        setName(data.name);
        setType(data.type);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    const { error } = await (supabase as any).from("default_modifiers").update({
      name: name.trim() || undefined,
      type,
    }).eq("id", id);
    if (!error) {
      toast({ title: "Default modifier updated" });
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

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  // Desktop / Tablet layout
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && (
          <div className="flex items-center justify-center relative px-6 pt-5">
            <button onClick={handleBack} className="absolute left-6 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity" aria-label="Back">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Edit Default Modifier</h1>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 pb-6">
          <section className="rounded-2xl bg-[#26262699] overflow-hidden mt-6">
            <div className="flex items-center justify-between w-full px-8 py-5">
              <span className="text-[15px] text-foreground">Default Modifier Name</span>
              <div className="flex items-center gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" className="w-48 h-9 text-right bg-transparent border-none text-[15px] text-[hsl(var(--text-subtle))] placeholder:text-[hsl(var(--text-subtle))] focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
            </div>
            <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
            <button onClick={toggleType} className="flex items-center justify-between w-full px-8 py-5 hover:bg-neutral-700/30 transition-colors text-left">
              <span className="text-[15px] text-foreground">Default Modifier Category</span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-[hsl(var(--text-subtle))]">{type}</span>
                <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
              </div>
            </button>
          </section>
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
          <h1 className="text-xl font-semibold text-foreground">Edit Default Modifier</h1>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        <section className="rounded-2xl bg-neutral-800/60 overflow-hidden">
          <div className="flex items-center justify-between w-full py-4 px-4">
            <span className="text-foreground text-base font-medium">Default Modifier Name</span>
            <div className="flex items-center gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" className="w-36 h-9 text-right bg-transparent border-none text-base text-neutral-400 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <button onClick={toggleType} className="flex items-center justify-between w-full py-4 px-4 active:bg-neutral-700/30 transition-colors text-left">
            <span className="text-foreground text-base font-medium">Default Modifier Category</span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-base">{type}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </section>
      </div>
    </div>
  );
};

export default EditDefaultModifierContent;
