import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Info, BookOpen, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import aiIntegrationIcon from "@/assets/icons/ai-integration.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";

interface AIIntegrationContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

type ConnectionStatus = "not_configured" | "connected" | "invalid_key" | "error";

interface ProviderOption {
  id: string;
  name: string;
}

const PROVIDERS: ProviderOption[] = [
  { id: "openai", name: "OpenAI (ChatGPT)" },
  { id: "google", name: "Google Gemini" },
  { id: "maya", name: "Maya AI" },
];

const STATUS_LABELS: Record<ConnectionStatus, { label: string; color: string }> = {
  not_configured: { label: "Not Configured", color: "text-neutral-400" },
  connected: { label: "Connected", color: "text-green-400" },
  invalid_key: { label: "Invalid Key", color: "text-red-400" },
  error: { label: "Error", color: "text-red-400" },
};

const PREF_KEYS = {
  enabled: "ai_integration_enabled",
  provider: "ai_integration_provider",
  status: "ai_integration_status",
};

const SHARED_DEVICE_ID = "shared";

const AIIntegrationContent = ({ showHeader = true, onBack, onAIClick }: AIIntegrationContentProps) => {
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("not_configured");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const deviceId = SHARED_DEVICE_ID;

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data } = await supabase
        .from("user_preferences")
        .select("preference_key, preference_value")
        .eq("device_id", deviceId)
        .in("preference_key", Object.values(PREF_KEYS));

      if (data) {
        const prefs: Record<string, string> = {};
        data.forEach((row) => (prefs[row.preference_key] = row.preference_value));

        setEnabled(prefs[PREF_KEYS.enabled] === "true");
        setProvider(prefs[PREF_KEYS.provider] || "");
        setStatus((prefs[PREF_KEYS.status] as ConnectionStatus) || "not_configured");
      }
    } catch (err) {
      console.error("Failed to load AI preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const savePref = async (key: string, value: string) => {
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("device_id", deviceId)
      .eq("preference_key", key)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_preferences")
        .update({ preference_value: value, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("user_preferences").insert({
        device_id: deviceId,
        preference_key: key,
        preference_value: value,
      });
    }
  };

  const handleSave = async () => {
    if (!provider) {
      toast.error("Please select a provider");
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all([
        savePref(PREF_KEYS.enabled, String(enabled)),
        savePref(PREF_KEYS.provider, provider),
        savePref(PREF_KEYS.status, status),
      ]);
      toast.success("AI integration settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      await supabase
        .from("user_preferences")
        .delete()
        .eq("device_id", deviceId)
        .in("preference_key", Object.values(PREF_KEYS));

      setEnabled(false);
      setProvider("");
      setStatus("not_configured");

      toast.success("AI integration removed");
    } catch {
      toast.error("Failed to remove integration");
    }
  };

  const handleToggleEnabled = async (checked: boolean) => {
    setEnabled(checked);
    await savePref(PREF_KEYS.enabled, String(checked));
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setStatus("not_configured");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
            AI Integration
          </h1>
        </div>
      )}

      <div className="pt-0 px-4 md:px-6 pb-28">
        {/* Description */}
        <p className="text-sm text-neutral-400 leading-relaxed mb-6 md:text-balance">
          Configure external AI providers using your own API keys. AI-powered features across the platform will use this integration when enabled.
        </p>

        {/* Enable/Disable Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-neutral-400 tracking-wider">
              AI Integration
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleEnabled}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-4">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-base font-medium">Status</span>
            <span className={`text-base font-medium ${STATUS_LABELS[status].color}`}>
              {STATUS_LABELS[status].label}
            </span>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="mb-4">
          <span className="text-sm font-semibold text-neutral-400 tracking-wider block mb-1">
            AI Provider
          </span>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {PROVIDERS.map((p, index) => (
              <div key={p.id}>
                <button
                  onClick={() => handleProviderChange(p.id)}
                  className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
                >
                  <span className="text-foreground text-base font-medium">{p.name}</span>
                  {provider === p.id && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
                {index < PROVIDERS.length - 1 && <div className="h-px bg-neutral-700/50 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* API Key (managed server-side) */}
        {provider && (
          <div className="mb-4">
            <span className="text-sm font-semibold text-neutral-400 tracking-wider block mb-1">
              API Key
            </span>
            <div className="bg-neutral-800/60 rounded-2xl p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-300 leading-relaxed">
                For security, provider API keys are now configured server-side as
                a project secret (<span className="font-mono">EXTERNAL_AI_API_KEY</span>).
                Ask your workspace admin to set or rotate the key in Project
                Settings → Secrets. Keys are never stored in the database or sent
                to the browser.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {provider && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl text-sm tracking-wide transition-colors text-center"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleRemove}
              className="flex-1 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-400 font-semibold py-3.5 rounded-2xl text-sm tracking-wide transition-colors text-center"
            >
              Reset
            </button>
          </div>
        )}

        {/* Info Note */}
        <div className="rounded-2xl p-4 flex gap-3 mb-6">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-400 leading-relaxed">
            All AI usage will be billed directly to your own provider account. This does not use platform credits. Only Admin, Owner, or Manager roles can configure this integration.
          </p>
        </div>

        {/* AI Instructions Navigation */}
        <div className="mb-4">
          <span className="text-sm font-semibold text-neutral-400 tracking-wider block mb-1">
            AI Behavior
          </span>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <button
              onClick={() => navigate('/settings/network/ai-integration/ai-instructions')}
              className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-foreground text-base font-medium block">AI Instructions</span>
                  <span className="text-neutral-400 text-xs">Rules, custom instructions & knowledge base</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIIntegrationContent;
