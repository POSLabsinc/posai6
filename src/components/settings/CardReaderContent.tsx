import { useState } from "react";
import { ChevronLeft, Search, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

import { useAppearance } from "@/contexts/AppearanceContext";

interface CardReaderContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

interface DeviceEntry {
  id: string;
  name: string;
  type: string;
  serial: string;
}

const MOCK_DEVICES: DeviceEntry[] = [
  { id: "1", name: "test revert", type: "SQUARE", serial: "6846f95cf42cac52afd635d6" },
  { id: "2", name: "eOS-P400-2407", type: "ADYEN", serial: "6862ad6352c388795d6317c2" },
  { id: "3", name: "Staging Card Reader", type: "BOLT", serial: "21267692301108773462251S" },
  { id: "4", name: "EOC-S1F2-9732", type: "ADYEN", serial: "693c63f0c97c611755586489" },
];

const CardReaderContent = ({ showHeader = true, onBack, onAIClick }: CardReaderContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("4");
  const { getIconBgColor } = useAppearance();

  const selectedDevice = MOCK_DEVICES.find(d => d.id === selectedDeviceId);

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
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Card Reader</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className="px-6 pb-28">
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scans credit card data for transactions or access and can detect/pair with new card readers.
          </p>
        </div>

        {/* Detect Button */}
        <button className="w-full bg-neutral-800/60 rounded-full py-3.5 px-4 flex items-center justify-center gap-2 active:opacity-70 transition-opacity mb-6">
          <Search className="w-4 h-4 text-foreground" />
          <span className="text-foreground text-base font-medium">Detect</span>
        </button>

        {/* Selected Device */}
        {selectedDevice && (
          <div className="mb-6">
            <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">
              Selected Card Reader
            </p>
            <div className="bg-neutral-800/60 rounded-2xl py-3.5 px-4 flex items-center justify-between">
              <span className="text-foreground text-base font-medium">{selectedDevice.name}</span>
              <span className="text-neutral-500 text-xs font-mono">{selectedDevice.serial.slice(0, 12)}…</span>
            </div>
          </div>
        )}

        {/* Devices List */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider mb-3">
          Available Devices
        </p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {MOCK_DEVICES.map((device, index) => {
            const isSelected = device.id === selectedDeviceId;
            return (
              <div key={device.id}>
                <button
                  onClick={() => setSelectedDeviceId(device.id)}
                  className="w-full py-3.5 px-4 flex items-center gap-3 active:opacity-70 transition-opacity"
                >
                  {/* Selection indicator */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSelected 
                      ? 'bg-foreground' 
                      : 'border-2 border-neutral-600'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-background" />}
                  </div>

                  {/* Device info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">{device.name}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{device.type} · <span className="font-mono">{device.serial.slice(0, 16)}…</span></p>
                  </div>
                </button>
                {index < MOCK_DEVICES.length - 1 && (
                  <div className="h-px bg-neutral-700/50 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CardReaderContent;
