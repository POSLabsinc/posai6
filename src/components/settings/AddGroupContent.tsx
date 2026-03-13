import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import { supabase } from "@/integrations/supabase/client";

interface AddGroupContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const AddGroupContent = ({ showHeader = true, onBack }: AddGroupContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [groupType, setGroupType] = useState<"Add-On" | "Modifier">("Add-On");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isAddOnSheetOpen, setIsAddOnSheetOpen] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [isModifierSheetOpen, setIsModifierSheetOpen] = useState(false);
  const [selectedDefaultModifiers, setSelectedDefaultModifiers] = useState<string[]>([]);
  const [isDefaultModifierSheetOpen, setIsDefaultModifierSheetOpen] = useState(false);

  const [modifierOptions, setModifierOptions] = useState<string[]>([]);
  const [defaultModifierOptions, setDefaultModifierOptions] = useState<string[]>([]);
  const [addOnOptions, setAddOnOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const [modRes, defModRes, addOnRes] = await Promise.all([
        supabase.from("modifiers").select("name").eq("active", true),
        (supabase as any).from("default_modifiers").select("name").eq("archived", false),
        supabase.from("add_ons").select("name").eq("active", true),
      ]);
      if (modRes.data) setModifierOptions(modRes.data.map((m: any) => m.name));
      if (defModRes.data) setDefaultModifierOptions(defModRes.data.map((m: any) => m.name));
      if (addOnRes.data) setAddOnOptions(addOnRes.data.map((a: any) => a.name));
    };
    fetchOptions();
  }, []);
  
  const [modifierGroupPosition, setModifierGroupPosition] = useState("");
  const [hasMaxSelections, setHasMaxSelections] = useState(false);
  const [maxSelections, setMaxSelections] = useState(1);

  const handleSave = async () => {
    if (groupName.trim()) {
      const { error } = await (supabase as any).from("groups").insert({
        name: groupName.trim(),
        type: groupType,
        archived: false,
        display_name: displayName,
        selected_add_ons: selectedAddOns,
        selected_modifiers: selectedModifiers,
        selected_default_modifiers: selectedDefaultModifiers,
        modifier_group_position: parseInt(modifierGroupPosition) || 0,
        has_max_selections: hasMaxSelections,
        max_selections: maxSelections,
        sort_order: 0,
      });
      if (!error) {
        toast({ title: "Group saved" });
      } else {
        toast({ description: "Failed to save group", variant: "destructive" });
      }
    }
  };

  const handleBack = async () => {
    await handleSave();
    if (onBack) onBack();
    else navigate('/settings/menu/groups');
  };

  const toggleGroupType = () => {
    setGroupType(prev => prev === "Add-On" ? "Modifier" : "Add-On");
  };

  // Desktop / Tablet layout
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && (
          <div className="flex items-center gap-3 px-6 pt-5">
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity" aria-label="Back">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Add Groups</h1>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide pt-0 px-6 pb-28">
          <h2 className="text-xs font-semibold tracking-wider text-[hsl(var(--text-subtle))] mb-3">Group Information</h2>
          <section className="rounded-2xl bg-[#26262699] overflow-hidden mb-6">
            <div className="flex items-center justify-between w-full px-8 py-5">
              <span className="text-[15px] text-foreground">Group Name</span>
              <div className="flex items-center gap-2">
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter Name" className="w-48 h-9 text-right bg-transparent border-none text-[15px] text-[hsl(var(--text-subtle))] placeholder:text-[hsl(var(--text-subtle))] focus-visible:ring-0 focus-visible:ring-offset-0" />
                <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
              </div>
            </div>
            <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
            <div className="flex items-center justify-between w-full px-8 py-5">
              <span className="text-[15px] text-foreground">Group Display Name</span>
              <div className="flex items-center gap-2">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter Name" className="w-48 h-9 text-right bg-transparent border-none text-[15px] text-[hsl(var(--text-subtle))] placeholder:text-[hsl(var(--text-subtle))] focus-visible:ring-0 focus-visible:ring-offset-0" />
                <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
              </div>
            </div>
            <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
            <button onClick={toggleGroupType} className="flex items-center justify-between w-full px-8 py-5 hover:bg-neutral-700/30 transition-colors text-left">
              <span className="text-[15px] text-foreground">Group Type</span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-[hsl(var(--text-subtle))]">{groupType || "Select Type"}</span>
                <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
              </div>
            </button>

            {groupType === "Add-On" ? (
              <>
                <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
                <button onClick={() => setIsAddOnSheetOpen(true)} className="flex items-center justify-between w-full px-8 py-5 hover:bg-neutral-700/30 transition-colors text-left">
                  <span className="text-[15px] text-foreground">Add-On</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-[hsl(var(--text-subtle))]">{selectedAddOns.length > 0 ? `${selectedAddOns.length} selected` : "Choose"}</span>
                    <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
                  </div>
                </button>
                <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
                <div className="flex items-center justify-between w-full px-8 py-5">
                  <span className="text-[15px] text-foreground">Add-On Group Position</span>
                  <Input type="number" value={modifierGroupPosition} onChange={(e) => setModifierGroupPosition(e.target.value)} placeholder="0" className="w-20 h-9 text-right bg-transparent border-none text-[15px] text-[hsl(var(--text-subtle))] placeholder:text-[hsl(var(--text-subtle))] focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
              </>
            ) : (
              <>
                <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
                <button onClick={() => setIsModifierSheetOpen(true)} className="flex items-center justify-between w-full px-8 py-5 hover:bg-neutral-700/30 transition-colors text-left">
                  <span className="text-[15px] text-foreground">Modifier</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-[hsl(var(--text-subtle))]">{selectedModifiers.length > 0 ? `${selectedModifiers.length} selected` : "Choose"}</span>
                    <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
                  </div>
                </button>
                <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
                <button onClick={() => setIsDefaultModifierSheetOpen(true)} className="flex items-center justify-between w-full px-8 py-5 hover:bg-neutral-700/30 transition-colors text-left">
                  <span className="text-[15px] text-foreground">Default Modifiers</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-[hsl(var(--text-subtle))]">{selectedDefaultModifiers.length > 0 ? `${selectedDefaultModifiers.length} selected` : "Choose"}</span>
                    <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
                  </div>
                </button>
                <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
                <button className="flex items-center justify-between w-full px-8 py-5 hover:bg-neutral-700/30 transition-colors text-left">
                  <span className="text-[15px] text-foreground">Organize</span>
                  <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
                </button>
                <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
                <div className="flex items-center justify-between w-full px-8 py-5">
                  <span className="text-[15px] text-foreground">Modifier Group Position</span>
                  <Input type="number" value={modifierGroupPosition} onChange={(e) => setModifierGroupPosition(e.target.value)} placeholder="0" className="w-20 h-9 text-right bg-transparent border-none text-[15px] text-[hsl(var(--text-subtle))] placeholder:text-[hsl(var(--text-subtle))] focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
              </>
            )}
          </section>

          <h2 className="text-xs font-semibold tracking-wider text-[hsl(var(--text-subtle))] mb-3">Modifier Group Advanced</h2>
          <section className="rounded-2xl bg-[#26262699] overflow-hidden mb-6">
            <div className="flex items-center justify-between w-full px-8 py-5">
              <span className="text-[15px] text-foreground">Maximum Number of Selections</span>
              <Switch checked={hasMaxSelections} onCheckedChange={setHasMaxSelections} />
            </div>
            {hasMaxSelections && (
              <>
                <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
                <div className="flex items-center justify-between w-full px-8 py-5">
                  <span className="text-[15px] text-foreground">Max Selections</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMaxSelections(Math.max(1, maxSelections - 1))} className="w-8 h-8 rounded-full bg-[hsl(var(--surface-3))] flex items-center justify-center active:opacity-70">
                      <Minus className="w-4 h-4 text-foreground" />
                    </button>
                    <span className="text-[15px] text-foreground w-8 text-center">{maxSelections}</span>
                    <button onClick={() => setMaxSelections(maxSelections + 1)} className="w-8 h-8 rounded-full bg-[hsl(var(--surface-3))] flex items-center justify-center active:opacity-70">
                      <Plus className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <MultiSelectSheet isOpen={isAddOnSheetOpen} onClose={(items) => { setSelectedAddOns(items); setIsAddOnSheetOpen(false); }} initialSelected={selectedAddOns} options={addOnOptions} title="Select Add-Ons" />
        <MultiSelectSheet isOpen={isModifierSheetOpen} onClose={(items) => { setSelectedModifiers(items); setIsModifierSheetOpen(false); }} initialSelected={selectedModifiers} options={modifierOptions} title="Select Modifiers" />
        <MultiSelectSheet isOpen={isDefaultModifierSheetOpen} onClose={(items) => { setSelectedDefaultModifiers(items); setIsDefaultModifierSheetOpen(false); }} initialSelected={selectedDefaultModifiers} options={defaultModifierOptions} title="Select Default Modifiers" />
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {showHeader && (
        <div className="flex items-center gap-3 py-4 px-4">
          <button onClick={handleBack} className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Add Groups</h1>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-28">
        <h2 className="text-xs font-semibold tracking-wider text-neutral-500 mb-3">Group Information</h2>
        <section className="rounded-2xl bg-neutral-800/60 overflow-hidden mb-6">
          <div className="flex items-center justify-between w-full py-4 px-4">
            <span className="text-foreground text-base font-medium">Group Name</span>
            <div className="flex items-center gap-2">
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter Name" className="w-36 h-9 text-right bg-transparent border-none text-base text-neutral-400 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0" />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between w-full py-4 px-4">
            <span className="text-foreground text-base font-medium">Group Display Name</span>
            <div className="flex items-center gap-2">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter Name" className="w-36 h-9 text-right bg-transparent border-none text-base text-neutral-400 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0" />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <button onClick={toggleGroupType} className="flex items-center justify-between w-full py-4 px-4 active:bg-neutral-700/30 transition-colors text-left">
            <span className="text-foreground text-base font-medium">Group Type</span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-base">{groupType || "Select Type"}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>

          {groupType === "Add-On" ? (
            <>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <button onClick={() => setIsAddOnSheetOpen(true)} className="flex items-center justify-between w-full py-4 px-4 active:bg-neutral-700/30 transition-colors text-left">
                <span className="text-foreground text-base font-medium">Add-On</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-base">{selectedAddOns.length > 0 ? `${selectedAddOns.length} selected` : "Choose"}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </button>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <div className="flex items-center justify-between w-full py-4 px-4">
                <span className="text-foreground text-base font-medium">Add-On Group Position</span>
                <Input type="number" value={modifierGroupPosition} onChange={(e) => setModifierGroupPosition(e.target.value)} placeholder="0" className="w-20 h-9 text-right bg-transparent border-none text-base text-neutral-400 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
            </>
          ) : (
            <>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <button onClick={() => setIsModifierSheetOpen(true)} className="flex items-center justify-between w-full py-4 px-4 active:bg-neutral-700/30 transition-colors text-left">
                <span className="text-foreground text-base font-medium">Modifier</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-base">{selectedModifiers.length > 0 ? `${selectedModifiers.length} selected` : "Choose"}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </button>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <button onClick={() => setIsDefaultModifierSheetOpen(true)} className="flex items-center justify-between w-full py-4 px-4 active:bg-neutral-700/30 transition-colors text-left">
                <span className="text-foreground text-base font-medium">Default Modifiers</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-base">{selectedDefaultModifiers.length > 0 ? `${selectedDefaultModifiers.length} selected` : "Choose"}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </button>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <button className="flex items-center justify-between w-full py-4 px-4 active:bg-neutral-700/30 transition-colors text-left">
                <span className="text-foreground text-base font-medium">Organize</span>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </button>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <div className="flex items-center justify-between w-full py-4 px-4">
                <span className="text-foreground text-base font-medium">Modifier Group Position</span>
                <Input type="number" value={modifierGroupPosition} onChange={(e) => setModifierGroupPosition(e.target.value)} placeholder="0" className="w-20 h-9 text-right bg-transparent border-none text-base text-neutral-400 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
            </>
          )}
        </section>

        <h2 className="text-xs font-semibold tracking-wider text-neutral-500 mb-3">Modifier Group Advanced</h2>
        <section className="rounded-2xl bg-neutral-800/60 overflow-hidden mb-6">
          <div className="flex items-center justify-between w-full py-4 px-4">
            <span className="text-foreground text-base font-medium">Maximum Number of Selections</span>
            <Switch checked={hasMaxSelections} onCheckedChange={setHasMaxSelections} />
          </div>
          {hasMaxSelections && (
            <>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <div className="flex items-center justify-between w-full py-4 px-4">
                <span className="text-foreground text-base font-medium">Max Selections</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setMaxSelections(Math.max(1, maxSelections - 1))} className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center active:opacity-70">
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-foreground text-base w-8 text-center">{maxSelections}</span>
                  <button onClick={() => setMaxSelections(maxSelections + 1)} className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center active:opacity-70">
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <MultiSelectSheet isOpen={isAddOnSheetOpen} onClose={(items) => { setSelectedAddOns(items); setIsAddOnSheetOpen(false); }} initialSelected={selectedAddOns} options={addOnOptions} title="Select Add-Ons" />
      <MultiSelectSheet isOpen={isModifierSheetOpen} onClose={(items) => { setSelectedModifiers(items); setIsModifierSheetOpen(false); }} initialSelected={selectedModifiers} options={modifierOptions} title="Select Modifiers" />
      <MultiSelectSheet isOpen={isDefaultModifierSheetOpen} onClose={(items) => { setSelectedDefaultModifiers(items); setIsDefaultModifierSheetOpen(false); }} initialSelected={selectedDefaultModifiers} options={defaultModifierOptions} title="Select Default Modifiers" />
    </div>
  );
};

export default AddGroupContent;
