import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

interface ServerConnectionContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const ServerConnectionContent = ({ showHeader = true, onBack, onAIClick }: ServerConnectionContentProps) => {
  const navigate = useNavigate();
  const [cloudServerEnabled, setCloudServerEnabled] = useState(true);
  const [edgeOSEnabled, setEdgeOSEnabled] = useState(false);

  const handleCloudToggle = (checked: boolean) => {
    setCloudServerEnabled(checked);
    if (checked) {
      setEdgeOSEnabled(false);
    } else {
      // When Cloud Server is turned off, auto-enable edgeOS + Cloud Server
      setEdgeOSEnabled(true);
    }
  };

  const handleEdgeOSToggle = (checked: boolean) => {
    setEdgeOSEnabled(checked);
    if (checked) setCloudServerEnabled(false);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader &&
      <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack &&
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">

              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
        }
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Server Connection</h1>
        </div>
      }

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-4 md:px-6 pb-28`}>
        {/* AI Assistant Icon */}
        



        {/* Description */}
        <p className="text-sm text-neutral-400 leading-relaxed mb-6 md:text-balance">
          A system of interconnected computers or devices that communicate and share resources, enabling data exchange and collaboration.
        </p>

        {/* CLOUD SERVER Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-0.5 px-1">
            <span className="text-base font-medium text-muted-foreground">Cloud Server</span>
            <Switch
              checked={cloudServerEnabled}
              onCheckedChange={handleCloudToggle}
              className="data-[state=checked]:bg-green-500" />

          </div>

          {cloudServerEnabled &&
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              {/* Device Name */}
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">Device Name</span>
<span className="text-neutral-400 text-base">rohan Point of Sale</span>
              </div>
              <div className="h-px bg-neutral-700/50 mx-4" />

              {/* IP Address */}
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">IP Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-base">ws.eatos.net</span>
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              <div className="h-px bg-neutral-700/50 mx-4" />

              {/* Status */}
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">Status</span>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-400 text-base">Connected</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </div>
            </div>
          }
        </div>

        {/* Sync Buttons - Cloud Server */}
        {cloudServerEnabled &&
        <>
            <div className="flex gap-3 mb-4">
              <button className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-foreground font-semibold py-3.5 rounded-2xl text-sm tracking-wide transition-colors text-center">
                Manual Sync
                <span className="block text-[10px] font-normal text-neutral-400 tracking-wider mt-0.5">Cloud Server</span>
              </button>
              <button className="flex-1 bg-transparent border border-neutral-700 hover:bg-neutral-800/50 text-foreground font-semibold py-3.5 rounded-2xl text-sm tracking-wide transition-colors text-center">
                Force Sync
                <span className="block text-[10px] font-normal text-neutral-400 tracking-wider mt-0.5">Cloud Server</span>
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed mb-8">
              The local server acts as a backup to the cloud server, ensuring continuous operation and enhanced network reliability.
            </p>
          </>
        }

        {/* edgeOS + CLOUD SERVER Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-0.5 px-1">
            <span className="text-base font-medium text-muted-foreground">edgeOS + Cloud Server</span>
            <Switch
              checked={edgeOSEnabled}
              onCheckedChange={handleEdgeOSToggle}
              className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-red-500/30" />

          </div>

          {edgeOSEnabled &&
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              {/* Device Name */}
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">Device Name</span>
                <span className="text-neutral-400 text-base">rohan Point of Sale</span>
              </div>
              <div className="h-px bg-neutral-700/50 mx-4" />

              {/* edgeOS IP Address */}
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">edgeOS IP Address</span>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="h-px bg-neutral-700/50 mx-4" />

              {/* Last Order Number */}
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">Last Order Number</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-base">No orders today</span>
                  <RefreshCw className="w-4 h-4 text-neutral-500" />
                </div>
              </div>
              <div className="h-px bg-neutral-700/50 mx-4" />

              {/* Cloud Server Address */}
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base font-medium">Cloud Server Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-base">ws.eatos.net</span>
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        {/* Sync Buttons - edgeOS */}
        {edgeOSEnabled &&
        <>
            <div className="flex gap-3 mb-4">
              <button className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-foreground font-semibold py-3.5 rounded-2xl text-sm tracking-wide transition-colors text-center">
                Manual Sync
                <span className="block text-[10px] font-normal text-neutral-400 tracking-wider mt-0.5">Cloud Server</span>
              </button>
              <button className="flex-1 bg-transparent border border-neutral-700 hover:bg-neutral-800/50 text-foreground font-semibold py-3.5 rounded-2xl text-sm tracking-wide transition-colors text-center">
                Force Sync
                <span className="block text-[10px] font-normal text-neutral-400 tracking-wider mt-0.5">Cloud Server</span>
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              The local server acts as a backup to the cloud server, ensuring continuous operation and enhanced network reliability.
            </p>
          </>
        }
      </div>
    </div>);

};

export default ServerConnectionContent;