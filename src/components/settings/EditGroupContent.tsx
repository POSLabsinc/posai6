import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";

interface EditGroupContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const STORAGE_KEY = "groups-settings";

const EditGroupContent = ({ showHeader = true, onBack }: EditGroupContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [groupName, setGroupName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [groupType, setGroupType] = useState<"Add-On" | "Modifier">("Add-On");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isAddOnSheetOpen, setIsAddOnSheetOpen] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [isModifierSheetOpen, setIsModifierSheetOpen] = useState(false);
  const [selectedDefaultModifiers, setSelectedDefaultModifiers] = useState<string[]>([]);
  const [isDefaultModifierSheetOpen, setIsDefaultModifierSheetOpen] = useState(false);
  const [modifierGroupPosition, setModifierGroupPosition] = useState("");
  const [hasMaxSelections, setHasMaxSelections] = useState(false);
  const [maxSelections, setMaxSelections] = useState(1);

  // Load existing group data
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && id) {
      try {
        const parsed = JSON.parse(stored);
        const item = parsed.find((g: any) => g.id === id);
        if (item) {
          setGroupName(item.name || "");
          setDisplayName(item.displayName || "");
          setGroupType(item.type === "Modifier" ? "Modifier" : "Add-On");
          setSelectedAddOns(item.selectedAddOns || []);
          setSelectedModifiers(item.selectedModifiers || []);
          setSelectedDefaultModifiers(item.selectedDefaultModifiers || []);
          setModifierGroupPosition(item.modifierGroupPosition || "");
          setHasMaxSelections(item.hasMaxSelections || false);
          setMaxSelections(item.maxSelections || 1);
        }
      } catch {}
    }
  }, [id]);

  const modifierOptions = useMemo(() => {
    const stored = localStorage.getItem("modifiers-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.filter((m: any) => !m.archived).map((m: any) => m.name);
      } catch {}
    }
    return ["Extra Cheese", "No Onions", "Gluten Free", "Spicy", "Mild", "Well Done", "Rare"];
  }, []);

  const defaultModifierOptions = useMemo(() => {
    const stored = localStorage.getItem("default-modifiers-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.filter((m: any) => !m.archived).map((m: any) => m.name);
      } catch {}
    }
    return [];
  }, []);

  const addOnOptions = useMemo(() => {
    const stored = localStorage.getItem("addons-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.filter((a: any) => !a.archived).map((a: any) => a.name);
      } catch {}
    }
    return ["1 Scoop Vanilla", "Abuelita", "Add Avocado", "Add Brioche"];
  }, []);

  const handleSave = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && id) {
      try {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((g: any) =>
          g.id === id
            ? {
                ...g,
                name: groupName.trim() || g.name,
                displayName,
                type: groupType,
                selectedAddOns,
                selectedModifiers,
                selectedDefaultModifiers,
                modifierGroupPosition,
                hasMaxSelections,
                maxSelections,
              }
            : g
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        toast({ title: "Group updated" });
      } catch {}
    }
  };

  const handleBack = () => {
    handleSave();
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
          <div className="flex items-center justify-center relative px-6 pt-5">
            <button
              onClick={handleBack}
              className="absolute left-6 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Edit Group</h1>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide pt-6 px-6 pb-28">
          <h2 className="text-xs font-semibold tracking-wider text-[hsl(var(--text-subtle))] uppercase mb-3">Group Information</h2>
          <section className="rounded-2xl bg-[hsl(var(--surface-2))] overflow-hidden mb-6">
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
                <span className="text-[15px] text-[hsl(var(--text-subtle))]">{groupType}</span>
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
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-5 w-5 text-[hsl(var(--text-subtle))]" />
                  </div>
                </button>
                <div className="h-px bg-[hsl(var(--surface-border))] mx-4" />
                <div className="flex items-center justify-between w-full px-8 py-5">
                  <span className="text-[15px] text-foreground">Modifier Group Position</span>
                  <Input type="number" value={modifierGroupPosition} onChange={(e) => setModifierGroupPosition(e.target.value)} placeholder="0" className="w-20 h-9 text-right bg-transparent border-none text-[15px] text-[hsl(var(--text-subtle))] placeholder:text-[hsl(var(--text-subtle))] focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
              </>
            )}
          </section>

          <h2 className="text-xs font-semibold tracking-wider text-[hsl(var(--text-subtle))] uppercase mb-3">Modifier Group Advanced</h2>
          <section className="rounded-2xl bg-[hsl(var(--surface-2))] overflow-hidden mb-6">
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
          <h1 className="text-lg font-semibold text-foreground">Edit Group</h1>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-28">
        <h2 className="text-xs font-semibold tracking-wider text-neutral-500 uppercase mb-3">Group Information</h2>
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
              <span className="text-neutral-400 text-base">{groupType}</span>
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
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </button>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <div className="flex items-center justify-between w-full py-4 px-4">
                <span className="text-foreground text-base font-medium">Modifier Group Position</span>
                <Input type="number" value={modifierGroupPosition} onChange={(e) => setModifierGroupPosition(e.target.value)} placeholder="0" className="w-20 h-9 text-right bg-transparent border-none text-base text-neutral-400 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
            </>
          )}
        </section>

        <h2 className="text-xs font-semibold tracking-wider text-neutral-500 uppercase mb-3">Modifier Group Advanced</h2>
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

export default EditGroupContent;
