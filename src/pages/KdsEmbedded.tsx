import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { SettingsManager } from "@/lib/settingsManager";

/**
 * KdsEmbedded
 * Embeds the standalone "POSAI - Kitchen Display System (KDS)" project
 * via iframe so screen-mode switching from POS lands on the new KDS UI.
 *
 * Source project preview: https://kitchen-display-system-posai6.lovable.app
 *
 * The old src/pages/KDS.tsx is still mounted at /kds as a fallback.
 */
const KDS_URL = "https://kitchen-display-system-posai6.lovable.app";

const KdsEmbedded = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // When the user leaves this route (back to POS), flip currentMode back to "pos"
  // so the screen-mode switcher reflects the active mode correctly.
  const handleBackToPos = () => {
    SettingsManager.updateScreenModeSettings({ currentMode: "pos" });
    navigate("/");
  };

  const handleReload = () => {
    setLoading(true);
    setIframeKey((k) => k + 1);
  };

  // Safety: if the iframe never fires onLoad (network blocked), hide spinner after 8s.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, [iframeKey]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Floating top bar over the iframe */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          onClick={handleBackToPos}
          className="flex items-center gap-2 h-9 px-3 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white text-sm font-medium hover:bg-black/85 transition-colors shadow-lg"
          aria-label="Back to Point of Sale"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Point of Sale
        </button>
        <button
          onClick={handleReload}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white hover:bg-black/85 transition-colors shadow-lg"
          aria-label="Reload Kitchen Display"
          title="Reload"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/70 text-sm font-medium">Loading Kitchen Display</p>
          </div>
        </div>
      )}

      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={KDS_URL}
        title="Kitchen Display System"
        className="w-full h-full border-0"
        allow="autoplay; clipboard-read; clipboard-write; fullscreen"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export default KdsEmbedded;
