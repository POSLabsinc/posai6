import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, ShieldCheck, ShieldAlert, MessageSquareText, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "pos_device_id";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

const PREF_KEYS = {
  dos: "ai_rules_dos",
  donts: "ai_rules_donts",
  instructions: "ai_rules_custom_instructions",
  restaurantType: "ai_rules_restaurant_type",
  knowledgeBase: "ai_rules_knowledge_base",
};

const DEFAULT_DOS = [
  "Provide accurate information about menu products.",
  "Assist staff with operational guidance.",
  "Suggest upselling products based on menu data.",
  "Provide summaries of reports or operational data.",
];

const DEFAULT_DONTS = [
  "Do not provide incorrect pricing information.",
  "Do not modify orders without user confirmation.",
  "Do not expose sensitive business or customer data.",
  "Avoid generating responses unrelated to restaurant operations.",
];

const RESTAURANT_TYPES = [
  "Fine Dining",
  "Casual Dining",
  "Café",
  "Quick Service",
  "Fast Casual",
  "Bar & Lounge",
  "Bakery",
  "Food Truck",
  "Buffet",
  "Cloud Kitchen",
  "Other",
];

const AIRulesContent = () => {
  const deviceId = getDeviceId();
  const [dos, setDos] = useState<string[]>(DEFAULT_DOS);
  const [donts, setDonts] = useState<string[]>(DEFAULT_DONTS);
  const [customInstructions, setCustomInstructions] = useState("");
  const [restaurantType, setRestaurantType] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Collapsible sections
  const [dosOpen, setDosOpen] = useState(true);
  const [dontsOpen, setDontsOpen] = useState(true);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [knowledgeOpen, setKnowledgeOpen] = useState(true);

  // Auto-save debounce ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    loadAll();
  }, []);

  // Auto-save whenever data changes (debounced)
  useEffect(() => {
    if (!loaded) return;
    // Skip the first render after load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      autoSave();
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [dos, donts, customInstructions, restaurantType, knowledgeBase, loaded]);

  const loadAll = async () => {
    try {
      const { data } = await supabase
        .from("user_preferences")
        .select("preference_key, preference_value")
        .eq("device_id", deviceId)
        .in("preference_key", Object.values(PREF_KEYS));

      if (data) {
        const prefs: Record<string, string> = {};
        data.forEach((r) => (prefs[r.preference_key] = r.preference_value));

        if (prefs[PREF_KEYS.dos]) {
          try { setDos(JSON.parse(prefs[PREF_KEYS.dos])); } catch {}
        }
        if (prefs[PREF_KEYS.donts]) {
          try { setDonts(JSON.parse(prefs[PREF_KEYS.donts])); } catch {}
        }
        if (prefs[PREF_KEYS.instructions]) setCustomInstructions(prefs[PREF_KEYS.instructions]);
        if (prefs[PREF_KEYS.restaurantType]) setRestaurantType(prefs[PREF_KEYS.restaurantType]);
        if (prefs[PREF_KEYS.knowledgeBase]) setKnowledgeBase(prefs[PREF_KEYS.knowledgeBase]);
      }
    } catch (err) {
      console.error("Failed to load AI rules:", err);
    } finally {
      setLoaded(true);
    }
  };

  const savePref = async (key: string, value: string) => {
    await (supabase as any)
      .from("user_preferences")
      .upsert(
        { device_id: deviceId, preference_key: key, preference_value: value },
        { onConflict: "device_id,preference_key" }
      );
  };

  const autoSave = async () => {
    try {
      await Promise.all([
        savePref(PREF_KEYS.dos, JSON.stringify(dos)),
        savePref(PREF_KEYS.donts, JSON.stringify(donts)),
        savePref(PREF_KEYS.instructions, customInstructions),
        savePref(PREF_KEYS.restaurantType, restaurantType),
        savePref(PREF_KEYS.knowledgeBase, knowledgeBase),
      ]);
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  };

  const addDo = () => {
    const trimmed = newDo.trim();
    if (!trimmed) return;
    setDos((prev) => [...prev, trimmed]);
    setNewDo("");
  };

  const removeDo = (index: number) => setDos((prev) => prev.filter((_, i) => i !== index));

  const addDont = () => {
    const trimmed = newDont.trim();
    if (!trimmed) return;
    setDonts((prev) => [...prev, trimmed]);
    setNewDont("");
  };

  const removeDont = (index: number) => setDonts((prev) => prev.filter((_, i) => i !== index));

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="pt-2">
        <span className="text-xs font-medium text-neutral-500 tracking-wider">
          AI Rules & Instructions
        </span>
      </div>

      {/* DO's */}
      <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
        <button
          onClick={() => setDosOpen(!dosOpen)}
          className="flex items-center justify-between w-full py-3.5 px-4"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-green-400" />
            <span className="text-foreground text-base font-medium">Do's</span>
            <span className="text-xs text-neutral-500 bg-neutral-700/60 rounded-full px-2 py-0.5">
              {dos.length}
            </span>
          </div>
          {dosOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>
        {dosOpen && (
          <div className="px-4 pb-4 space-y-2">
            {dos.map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-neutral-700/40 rounded-xl px-3 py-2.5 group">
                <span className="text-green-400 text-xs mt-0.5 shrink-0">✓</span>
                <span className="text-sm text-neutral-200 flex-1 leading-relaxed">{item}</span>
                <button
                  onClick={() => removeDo(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <Input
                value={newDo}
                onChange={(e) => setNewDo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDo()}
                placeholder="Add a new rule..."
                className="bg-neutral-700/50 border-neutral-600 text-foreground text-sm flex-1"
              />
              <button
                onClick={addDo}
                disabled={!newDo.trim()}
                className="w-10 h-10 rounded-xl bg-green-600/80 hover:bg-green-600 disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DON'Ts */}
      <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
        <button
          onClick={() => setDontsOpen(!dontsOpen)}
          className="flex items-center justify-between w-full py-3.5 px-4"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
            <span className="text-foreground text-base font-medium">Don'ts</span>
            <span className="text-xs text-neutral-500 bg-neutral-700/60 rounded-full px-2 py-0.5">
              {donts.length}
            </span>
          </div>
          {dontsOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>
        {dontsOpen && (
          <div className="px-4 pb-4 space-y-2">
            {donts.map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-neutral-700/40 rounded-xl px-3 py-2.5 group">
                <span className="text-red-400 text-xs mt-0.5 shrink-0">✗</span>
                <span className="text-sm text-neutral-200 flex-1 leading-relaxed">{item}</span>
                <button
                  onClick={() => removeDont(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <Input
                value={newDont}
                onChange={(e) => setNewDont(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDont()}
                placeholder="Add a restriction..."
                className="bg-neutral-700/50 border-neutral-600 text-foreground text-sm flex-1"
              />
              <button
                onClick={addDont}
                disabled={!newDont.trim()}
                className="w-10 h-10 rounded-xl bg-red-600/80 hover:bg-red-600 disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Instructions */}
      <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
        <button
          onClick={() => setInstructionsOpen(!instructionsOpen)}
          className="flex items-center justify-between w-full py-3.5 px-4"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquareText className="w-4.5 h-4.5 text-blue-400" />
            <span className="text-foreground text-base font-medium">Custom Instructions</span>
          </div>
          {instructionsOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>
        {instructionsOpen && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Define tone, style, and behavior guidelines. These instructions are sent to every AI conversation.
            </p>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={`Example:\n- Use a professional and friendly tone.\n- Always recommend menu products when relevant.\n- Keep responses concise (under 3 sentences).\n- Assist staff with step-by-step operational guidance.\n- When discussing pricing, always use the current menu prices.`}
              className="bg-neutral-700/50 border-neutral-600 text-foreground text-sm min-h-[160px] resize-y"
              rows={7}
            />
          </div>
        )}
      </div>

      {/* Restaurant Knowledge Base */}
      <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
        <button
          onClick={() => setKnowledgeOpen(!knowledgeOpen)}
          className="flex items-center justify-between w-full py-3.5 px-4"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4.5 h-4.5 text-amber-400" />
            <span className="text-foreground text-base font-medium">Restaurant Knowledge Base</span>
          </div>
          {knowledgeOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>
        {knowledgeOpen && (
          <div className="px-4 pb-4 space-y-4">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Provide restaurant-specific context so AI can give accurate, relevant responses.
            </p>

            {/* Restaurant Type */}
            <div>
              <label className="text-xs font-medium text-neutral-400 block mb-2">Restaurant Type</label>
              <div className="flex flex-wrap gap-2">
                {RESTAURANT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setRestaurantType(restaurantType === type ? "" : type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      restaurantType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge Base Text */}
            <div>
              <label className="text-xs font-medium text-neutral-400 block mb-2">
                Additional Knowledge & Context
              </label>
              <Textarea
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder={`Add restaurant-specific information:\n\n- Menu highlights and specialties\n- Pricing and current promotions\n- Operational workflows\n- Customer service guidelines\n- Dietary and allergen policies\n- Seating and reservation rules`}
                className="bg-neutral-700/50 border-neutral-600 text-foreground text-sm min-h-[160px] resize-y"
                rows={7}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRulesContent;
