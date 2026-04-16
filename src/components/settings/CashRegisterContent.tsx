import { useState } from "react";
import { ChevronLeft, Search, Check, Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

import { useAppearance } from "@/contexts/AppearanceContext";

interface CashRegisterContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

interface DrawerDevice {
  id: string;
  name: string;
  type: string;
  serial: string;
}

const MOCK_DRAWERS: DrawerDevice[] = [
  { id: "1", name: "CS1 revert test", type: "PAX REGISTER", serial: "367200b40436adf77648617d" },
  { id: "2", name: "epos", type: "STAR CASH DRAWER ETHERNET", serial: "99745d2b19dd1ac93c460a8f" },
  { id: "3", name: "Feb 11", type: "PAX REGISTER", serial: "698c2d931bd30e384180c3dn" },
  { id: "4", name: "gghhhhj", type: "STAR CASH DRAWER ETHERNET", serial: "2f0ae7c654e576f427728d2" },
  { id: "5", name: "sunmi cash register", type: "PAX REGISTER", serial: "4159c71fbf1157b6d5ec93d5" },
  { id: "6", name: "Test", type: "PAX REGISTER", serial: "6a50b037611338a156734bc" },
  { id: "7", name: "Testing Revert", type: "PAX REGISTER", serial: "174f612d50ff41c81501b45a" },
];

const DRAWER_MODELS = [
  "PAX REGISTER",
  "STAR CASH DRAWER ETHERNET",
  "STAR CASH DRAWER USB",
  "SUNMI REGISTER",
];

const CashRegisterContent = ({ showHeader = true, onBack, onAIClick }: CashRegisterContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getIconBgColor } = useAppearance();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("1");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newModel, setNewModel] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [drawers, setDrawers] = useState<DrawerDevice[]>(MOCK_DRAWERS);

  const selectedDevice = drawers.find(d => d.id === selectedDeviceId);

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
          <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Cash Register</h1>
        </div>
      )}

      <div className="px-6 pb-28">
        <div className="mb-4 px-1 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Administer the cash drawer to ensure smooth handling of your payments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button className="flex-1 bg-neutral-800/60 rounded-full py-3.5 px-4 flex items-center justify-center gap-2 active:opacity-70 transition-opacity">
            <Search className="w-4 h-4 text-foreground" />
            <span className="text-foreground text-base font-medium">Detect</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex-1 bg-neutral-800/60 rounded-full py-3.5 px-4 flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <Plus className="w-4 h-4 text-foreground" />
            <span className="text-foreground text-base font-medium">Add New</span>
          </button>
        </div>

        {/* Add New Form */}
        {showAddForm && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-neutral-400 tracking-wider">
                Add New Cash Drawer
              </p>
              <button
                onClick={() => { setShowAddForm(false); setNewName(""); setNewModel(""); }}
                className="text-xs text-neutral-500 active:opacity-70"
              >
                Cancel
              </button>
            </div>
            <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-3">
              <div className="py-3.5 px-4 flex items-center justify-between">
                <span className="text-foreground text-sm font-medium">Name</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter Name"
                  maxLength={100}
                  className="bg-transparent text-right text-sm text-neutral-400 placeholder:text-neutral-600 outline-none w-1/2"
                />
              </div>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <button
                onClick={() => setShowModelPicker(true)}
                className="w-full py-3.5 px-4 flex items-center justify-between active:opacity-70 transition-opacity"
              >
                <span className="text-foreground text-sm font-medium">Drawer Model</span>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500 text-sm">{newModel || "Please Select Model"}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </button>
            </div>
            <button
              onClick={() => {
                if (newName.trim() && newModel) {
                  const newDevice: DrawerDevice = {
                    id: String(Date.now()),
                    name: newName.trim(),
                    type: newModel,
                    serial: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
                  };
                  setDrawers(prev => [...prev, newDevice]);
                  setShowAddForm(false);
                  setNewName("");
                  setNewModel("");
                }
              }}
              disabled={!newName.trim() || !newModel}
              className={`w-full rounded-full py-3.5 px-4 flex items-center justify-center transition-opacity ${
                newName.trim() && newModel
                  ? 'bg-foreground active:opacity-70'
                  : 'bg-neutral-700/50 opacity-50'
              }`}
            >
              <span className={`text-base font-medium ${newName.trim() && newModel ? 'text-background' : 'text-neutral-400'}`}>
                Save
              </span>
            </button>
          </div>
        )}

        {/* Model Picker Overlay */}
        {showModelPicker && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowModelPicker(false)} />
            <div className="relative bg-neutral-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-sm overflow-hidden">
              <div className="py-4 px-6 border-b border-neutral-700/50">
                <p className="text-foreground text-base font-semibold text-center">Select Drawer Model</p>
              </div>
              <div className="py-2">
                {DRAWER_MODELS.map((model) => (
                  <button
                    key={model}
                    onClick={() => { setNewModel(model); setShowModelPicker(false); }}
                    className="w-full py-3.5 px-6 flex items-center justify-between active:opacity-70 transition-opacity"
                  >
                    <span className="text-foreground text-sm">{model}</span>
                    {newModel === model && <Check className="w-4 h-4 text-foreground" />}
                  </button>
                ))}
              </div>
              <div className="py-3 px-6 border-t border-neutral-700/50">
                <button
                  onClick={() => setShowModelPicker(false)}
                  className="w-full rounded-full py-3 bg-neutral-800/60 text-foreground text-sm font-medium active:opacity-70 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Device */}
        {selectedDevice && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-neutral-400 tracking-wider mb-3">
              Active Cash Drawer
            </p>
            <div className="bg-neutral-800/60 rounded-2xl py-3.5 px-4 flex items-center justify-between">
              <span className="text-foreground text-base font-medium">{selectedDevice.name}</span>
              <span className="text-neutral-500 text-xs font-mono">{selectedDevice.serial.slice(0, 12)}…</span>
            </div>
          </div>
        )}

        {/* Devices List */}
        <p className="text-sm font-semibold text-neutral-400 tracking-wider mb-3">
          Available Devices
        </p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {drawers.map((device, index) => {
            const isSelected = device.id === selectedDeviceId;
            return (
              <div key={device.id}>
                <button
                  onClick={() => setSelectedDeviceId(device.id)}
                  className="w-full py-3.5 px-4 flex items-center gap-3 active:opacity-70 transition-opacity"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-foreground'
                      : 'border-2 border-neutral-600'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-background" />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">{device.name}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{device.type} · <span className="font-mono">{device.serial.slice(0, 16)}…</span></p>
                  </div>
                </button>
                {index < drawers.length - 1 && (
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

export default CashRegisterContent;
