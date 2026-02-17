import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, Users, MapPin, Bell, UserPlus, Lock, Unlock, 
  CalendarPlus, Eye, Grid, Map, X, ChevronDown
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Reservation } from "@/components/ReservationsPanel";
import chairIcon from "@/assets/icons/chair-icon.png";

// Table status configurations
const statusConfig: Record<string, { color: string; bgColor: string; hexColor: string; hexBgColor: string; label: string; isReady?: boolean }> = {
  "Available": { color: "text-white", bgColor: "bg-neutral-700", hexColor: "#22c55e", hexBgColor: "rgba(34, 197, 94, 0.15)", label: "Available" },
  "Ordering": { color: "text-yellow-400", bgColor: "bg-neutral-800", hexColor: "#a855f7", hexBgColor: "rgba(168, 85, 247, 0.2)", label: "Ordering" },
  "Ordered": { color: "text-orange-500", bgColor: "bg-neutral-800", hexColor: "#f97316", hexBgColor: "rgba(249, 115, 22, 0.2)", label: "Ordered" },
  "Reserved": { color: "text-gray-400", bgColor: "bg-neutral-800", hexColor: "#6b7280", hexBgColor: "rgba(107, 114, 128, 0.2)", label: "Reserved" },
  "Seated": { color: "text-gray-300", bgColor: "bg-neutral-800", hexColor: "#3b82f6", hexBgColor: "rgba(59, 130, 246, 0.2)", label: "Seated" },
  "Running Late": { color: "text-red-400", bgColor: "bg-neutral-800", hexColor: "#ef4444", hexBgColor: "rgba(239, 68, 68, 0.2)", label: "Late" },
  "1st Course": { color: "text-purple-400", bgColor: "bg-neutral-800", hexColor: "#8b5cf6", hexBgColor: "rgba(139, 92, 246, 0.25)", label: "1st Course" },
  "3rd Course": { color: "text-orange-500", bgColor: "bg-neutral-800", hexColor: "#f97316", hexBgColor: "rgba(249, 115, 22, 0.25)", label: "3rd Course" },
  "Dessert": { color: "text-pink-400", bgColor: "bg-neutral-800", hexColor: "#ec4899", hexBgColor: "rgba(236, 72, 153, 0.2)", label: "Dessert" },
  "Partially Seated": { color: "text-green-400", bgColor: "bg-neutral-800", hexColor: "#22c55e", hexBgColor: "rgba(34, 197, 94, 0.2)", label: "Partial" },
  "Served": { color: "text-blue-400", bgColor: "bg-neutral-800", hexColor: "#0ea5e9", hexBgColor: "rgba(14, 165, 233, 0.25)", label: "Served" },
  "Blocked": { color: "text-red-500", bgColor: "bg-neutral-800", hexColor: "#dc2626", hexBgColor: "rgba(220, 38, 38, 0.2)", label: "Blocked" },
  "Ready": { color: "text-emerald-400", bgColor: "bg-neutral-800", hexColor: "#10b981", hexBgColor: "rgba(16, 185, 129, 0.25)", label: "Ready", isReady: true },
};

// Table type
type TableType = {
  id: string;
  seats: number;
  status: string;
  time: string;
  shape: "circle" | "square";
  occupiedSeats: number[];
  guests: number;
  x: number;
  y: number;
  blockedNote?: string;
};

// Default table data
const defaultTables: TableType[] = [
  { id: "T1", seats: 8, status: "Reserved", time: "", shape: "circle", occupiedSeats: [], guests: 0, x: 100, y: 80 },
  { id: "T2", seats: 5, status: "Ordering", time: "25M", shape: "square", occupiedSeats: [1, 2], guests: 2, x: 330, y: 100 },
  { id: "T3", seats: 4, status: "Ordered", time: "2H 25M", shape: "circle", occupiedSeats: [1, 2, 3], guests: 3, x: 560, y: 70 },
  { id: "T4", seats: 3, status: "Reserved", time: "2H 25M", shape: "square", occupiedSeats: [], guests: 0, x: 790, y: 110 },
  { id: "T5", seats: 4, status: "Seated", time: "25M", shape: "circle", occupiedSeats: [1, 3], guests: 2, x: 140, y: 310 },
  { id: "T6", seats: 2, status: "Running Late", time: "45M", shape: "square", occupiedSeats: [], guests: 0, x: 380, y: 290 },
  { id: "T7", seats: 5, status: "1st Course", time: "12M", shape: "circle", occupiedSeats: [1, 2, 3, 4, 5], guests: 5, x: 610, y: 330 },
  { id: "T8", seats: 4, status: "Ready", time: "13M", shape: "square", occupiedSeats: [1, 2, 3, 4], guests: 4, x: 840, y: 310 },
  { id: "T9", seats: 3, status: "3rd Course", time: "14M", shape: "circle", occupiedSeats: [1, 2, 3], guests: 3, x: 100, y: 540 },
  { id: "T10", seats: 4, status: "Dessert", time: "16M", shape: "square", occupiedSeats: [1, 2], guests: 2, x: 330, y: 520 },
  { id: "T11", seats: 5, status: "Partially Seated", time: "18M", shape: "circle", occupiedSeats: [1, 3, 5], guests: 3, x: 560, y: 560 },
  { id: "T12", seats: 5, status: "Served", time: "36M", shape: "square", occupiedSeats: [1, 2, 3, 4, 5], guests: 5, x: 790, y: 540 },
];

// Seat dot colors
const getSeatDotColor = (status: string): string => {
  switch (status) {
    case "Available": return "bg-green-500";
    case "Ordering": return "bg-red-500";
    case "Ordered": return "bg-orange-500";
    case "Reserved": return "bg-gray-500";
    case "Seated": return "bg-gray-400";
    case "Running Late": return "bg-red-500";
    case "1st Course": return "bg-purple-500";
    case "3rd Course": return "bg-orange-500";
    case "Dessert": return "bg-pink-500";
    case "Partially Seated": return "bg-green-500";
    case "Served": return "bg-blue-500";
    case "Blocked": return "bg-red-600";
    case "Ready": return "bg-emerald-500";
    default: return "bg-gray-500";
  }
};

// Chair components
const CircularChair = ({ angle, isOccupied, tableRadius }: { angle: number; isOccupied: boolean; tableRadius: number }) => {
  const chairDistance = tableRadius + 22;
  const radian = (angle * Math.PI) / 180;
  const x = Math.cos(radian) * chairDistance;
  const y = Math.sin(radian) * chairDistance;
  
  return (
    <div
      className="absolute transition-all duration-200"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
      }}
    >
      <div 
        className={`w-6 h-3.5 rounded-t-full transition-colors ${
          isOccupied ? "bg-blue-500 shadow-lg shadow-blue-500/30" : "bg-neutral-700 border border-neutral-600"
        }`}
      />
    </div>
  );
};

const SquareChair = ({ side, position, isOccupied, tableSize }: { 
  side: 'top' | 'right' | 'bottom' | 'left';
  position: number;
  isOccupied: boolean;
  tableSize: number;
}) => {
  const offset = tableSize / 2 + 18;
  const positionOffset = (position - 0.5) * 28;
  
  let style: React.CSSProperties = {};
  let rotation = 0;
  
  switch (side) {
    case 'top':
      style = { left: `calc(50% + ${positionOffset}px)`, top: `calc(50% - ${offset}px)` };
      rotation = 0;
      break;
    case 'right':
      style = { left: `calc(50% + ${offset}px)`, top: `calc(50% + ${positionOffset}px)` };
      rotation = 90;
      break;
    case 'bottom':
      style = { left: `calc(50% - ${positionOffset}px)`, top: `calc(50% + ${offset}px)` };
      rotation = 180;
      break;
    case 'left':
      style = { left: `calc(50% - ${offset}px)`, top: `calc(50% + ${positionOffset}px)` };
      rotation = 270;
      break;
  }
  
  return (
    <div
      className="absolute transition-all duration-200"
      style={{ ...style, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
    >
      <div 
        className={`w-6 h-3.5 rounded-t transition-colors ${
          isOccupied ? "bg-blue-500 shadow-lg shadow-blue-500/30" : "bg-neutral-700 border border-neutral-600"
        }`}
      />
    </div>
  );
};

// Floor Plan Table Components
const FloorPlanCircularTable = ({ table, isSelected, isHighlighted }: { 
  table: TableType; 
  isSelected: boolean;
  isHighlighted: boolean;
}) => {
  const config = statusConfig[table.status] || statusConfig["Available"];
  const tableRadius = table.seats >= 8 ? 60 : table.seats >= 6 ? 50 : 42;
  const containerSize = 200;

  const chairAngles = Array.from({ length: table.seats }, (_, i) => 
    (360 / table.seats) * i - 90
  );

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ width: containerSize, height: containerSize }}
    >
      <div 
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {chairAngles.map((angle, i) => (
          <CircularChair
            key={i}
            angle={angle}
            isOccupied={table.occupiedSeats.includes(i + 1)}
            tableRadius={tableRadius}
          />
        ))}

        {config.isReady && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <div className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/50">
              <Bell className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold whitespace-nowrap">ORDER READY</span>
            </div>
          </div>
        )}

        <div 
          className={`rounded-full flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110 ${
            isSelected || isHighlighted ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          } ${config.isReady ? "animate-pulse" : ""}`}
          style={{ 
            width: tableRadius * 2, 
            height: tableRadius * 2,
            backgroundColor: config.hexBgColor,
            border: `2px solid ${isHighlighted ? "#f97316" : config.hexColor}`,
            boxShadow: isHighlighted 
              ? `0 4px 20px rgba(249, 115, 22, 0.5)` 
              : `0 4px 20px ${config.hexColor}40`
          }}
        >
          <span className="text-white font-bold text-lg leading-none">{table.id}</span>
          <span className="text-[12px] font-semibold mt-0.5" style={{ color: config.hexColor }}>
            {config.label}
          </span>
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: Math.min(table.seats, 6) }).map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < table.guests ? "bg-blue-400" : "bg-neutral-600"
                }`}
              />
            ))}
          </div>
        </div>

        {table.time && (
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold"
            style={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', border: `1px solid ${config.hexColor}50` }}
          >
            <Clock className="w-3 h-3" style={{ color: config.hexColor }} />
            <span className="text-gray-300">{table.time}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const FloorPlanSquareTable = ({ table, isSelected, isHighlighted }: { 
  table: TableType; 
  isSelected: boolean;
  isHighlighted: boolean;
}) => {
  const config = statusConfig[table.status] || statusConfig["Available"];
  const tableSize = 82;
  const containerSize = 200;

  const getChairLayout = (seats: number) => {
    const chairs: { side: 'top' | 'right' | 'bottom' | 'left'; position: number }[] = [];
    if (seats === 2) {
      chairs.push({ side: 'left', position: 0.5 }, { side: 'right', position: 0.5 });
    } else if (seats <= 4) {
      chairs.push({ side: 'top', position: 0.5 }, { side: 'right', position: 0.5 }, { side: 'bottom', position: 0.5 }, { side: 'left', position: 0.5 });
    } else {
      chairs.push({ side: 'top', position: 0.25 }, { side: 'top', position: 0.75 }, { side: 'right', position: 0.5 }, { side: 'bottom', position: 0.75 }, { side: 'bottom', position: 0.25 }, { side: 'left', position: 0.5 });
    }
    return chairs;
  };

  const chairLayout = getChairLayout(table.seats);

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ width: containerSize, height: containerSize }}
    >
      <div 
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {chairLayout.map((chair, i) => (
          <SquareChair
            key={i}
            side={chair.side}
            position={chair.position}
            isOccupied={table.occupiedSeats.includes(i + 1)}
            tableSize={tableSize}
          />
        ))}

        {config.isReady && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <div className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/50">
              <Bell className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold whitespace-nowrap">ORDER READY</span>
            </div>
          </div>
        )}

        <div 
          className={`rounded-lg flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110 ${
            isSelected || isHighlighted ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          } ${config.isReady ? "animate-pulse" : ""}`}
          style={{ 
            width: tableSize, 
            height: tableSize,
            backgroundColor: config.hexBgColor,
            border: `2px solid ${isHighlighted ? "#f97316" : config.hexColor}`,
            boxShadow: isHighlighted 
              ? `0 4px 20px rgba(249, 115, 22, 0.5)` 
              : `0 4px 20px ${config.hexColor}40`
          }}
        >
          <span className="text-white font-bold text-lg leading-none">{table.id}</span>
          <span className="text-[12px] font-semibold mt-0.5" style={{ color: config.hexColor }}>
            {config.label}
          </span>
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: table.seats }).map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < table.guests ? "bg-blue-400" : "bg-neutral-600"
                }`}
              />
            ))}
          </div>
        </div>

        {table.time && (
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold"
            style={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', border: `1px solid ${config.hexColor}50` }}
          >
            <Clock className="w-3 h-3" style={{ color: config.hexColor }} />
            <span className="text-gray-300">{table.time}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Grid Table Card Component
const GridTableCard = ({ table, isHighlighted, onClick, onGuestSelect, showGuestSelection }: { 
  table: TableType;
  isHighlighted: boolean;
  onClick: () => void;
  onGuestSelect: (count: number) => void;
  showGuestSelection: boolean;
}) => {
  const config = statusConfig[table.status] || statusConfig["Available"];
  const dotColor = getSeatDotColor(table.status);
  const isReady = table.status === "Ready";
  
  return (
    <div className={`relative ${isHighlighted ? "animate-pulse" : ""}`}>
      {isReady && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-1 rounded-full shadow-lg shadow-emerald-500/50">
            <Bell className="w-3 h-3" />
            <span className="text-[10px] font-bold whitespace-nowrap">ORDER READY</span>
          </div>
        </div>
      )}
      
      {table.status === "Reserved" && (
        <div className="absolute -top-2 right-1 z-20">
          <div className="flex items-center gap-1 bg-gray-700 text-white px-2 py-0.5 rounded-full border border-gray-500">
            <Clock className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-[10px] font-medium">7:30 PM</span>
          </div>
        </div>
      )}
      
      <div
        onClick={onClick}
        className={`bg-neutral-900 rounded-xl p-3 flex flex-col items-center cursor-pointer hover:bg-neutral-800 transition-all border-2 ${
          isHighlighted
            ? "border-orange-500 ring-2 ring-orange-500/50"
            : isReady 
              ? "border-emerald-500" 
              : "border-neutral-800"
        }`}
      >
        <span className="text-3xl font-bold text-white mb-1">{table.id}</span>
        <span className="text-gray-400 text-sm mb-2">{table.seats} Seats</span>
        
        <div className="flex gap-1 mb-2">
          {Array.from({ length: table.seats }).map((_, i) => (
            <div key={i} className={`w-2 h-2 flex-shrink-0 rounded-full ${dotColor}`} />
          ))}
        </div>
        
        <div className="mt-auto w-full">
          <div className="flex justify-end mb-1 min-h-[1rem] px-1">
            {table.time && <span className="text-gray-500 text-xs">{table.time}</span>}
          </div>
          
          {showGuestSelection && table.status === "Available" ? (
            <div className="w-full py-1 px-2 rounded-md border border-neutral-600 bg-neutral-700">
              <div className="flex justify-center items-center gap-1">
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                  <img src={chairIcon} alt="Select seats" className="w-4 h-4 object-contain" />
                </div>
                {Array.from({ length: table.seats }).map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      onGuestSelect(i + 1);
                    }}
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded hover:bg-orange-500 transition-colors"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={`w-full text-center py-1 rounded-md border ${isReady ? "border-emerald-500 bg-emerald-500/20" : `border-neutral-600 ${config.bgColor}`}`}>
              <span className={`text-xs font-medium ${isReady ? "text-emerald-400" : config.color}`}>
                {table.status}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Status Legend
const StatusLegend = () => (
  <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-neutral-900/50 rounded-lg border border-neutral-800">
    {[
      { color: "#22c55e", label: "Available" },
      { color: "#a855f7", label: "Ordering" },
      { color: "#f97316", label: "Ordered" },
      { color: "#6b7280", label: "Reserved" },
      { color: "#3b82f6", label: "Seated" },
      { color: "#ef4444", label: "Late" },
      { color: "#10b981", label: "Ready" },
    ].map((status) => (
      <div key={status.label} className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
        <span className="text-[10px] text-neutral-400">{status.label}</span>
      </div>
    ))}
  </div>
);

// Props
interface TableMapPanelProps {
  viewMode: "floorplan" | "grid";
  selectedReservation: Reservation | null;
  onTableSelect?: (tableId: string) => void;
}

// Main Component
const TableMapPanel = ({ viewMode, selectedReservation, onTableSelect }: TableMapPanelProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tables, setTables] = useState<TableType[]>(defaultTables);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [guestDropdownTable, setGuestDropdownTable] = useState<string | null>(null);
  
  // Dialogs state
  const [seatWalkInDialog, setSeatWalkInDialog] = useState(false);
  const [createReservationDialog, setCreateReservationDialog] = useState(false);
  const [blockTableDialog, setBlockTableDialog] = useState(false);
  const [tableForAction, setTableForAction] = useState<TableType | null>(null);
  const [blockNote, setBlockNote] = useState("");
  const [walkInGuests, setWalkInGuests] = useState(2);
  const [walkInName, setWalkInName] = useState("");
  
  // Reservation form state
  const [reservationForm, setReservationForm] = useState({
    guestName: "",
    partySize: 2,
    date: new Date().toISOString().split('T')[0],
    time: "7:00 PM",
  });

  // Highlighted table from selected reservation
  const highlightedTableId = selectedReservation?.tableId || null;

  const handleTableClick = (table: TableType) => {
    setSelectedTableId(table.id);
    onTableSelect?.(table.id);
  };

  const handleSeatWalkIn = (table: TableType) => {
    setTableForAction(table);
    setWalkInGuests(2);
    setWalkInName("");
    setSeatWalkInDialog(true);
  };

  const confirmSeatWalkIn = () => {
    if (tableForAction) {
      setTables(prev => prev.map(t => 
        t.id === tableForAction.id 
          ? { ...t, status: "Ordering", guests: walkInGuests, occupiedSeats: Array.from({length: walkInGuests}, (_, i) => i + 1) }
          : t
      ));
      toast({
        title: "Walk-In Seated",
        description: `${walkInName || "Guest"} (${walkInGuests} guests) seated at Table ${tableForAction.id}`,
      });
      setSeatWalkInDialog(false);
      setSelectedTableId(null);
      // Navigate to orders
      navigate(`/orders?tableId=${tableForAction.id}&partySize=${walkInGuests}`);
    }
  };

  const handleCreateReservation = (table: TableType) => {
    setTableForAction(table);
    setReservationForm({
      guestName: "",
      partySize: 2,
      date: new Date().toISOString().split('T')[0],
      time: "7:00 PM",
    });
    setCreateReservationDialog(true);
  };

  const confirmCreateReservation = () => {
    if (tableForAction) {
      setTables(prev => prev.map(t => 
        t.id === tableForAction.id 
          ? { ...t, status: "Reserved" }
          : t
      ));
      toast({
        title: "Reservation Created",
        description: `Reserved Table ${tableForAction.id} for ${reservationForm.guestName} at ${reservationForm.time}`,
      });
      setCreateReservationDialog(false);
      setSelectedTableId(null);
    }
  };

  const handleBlockTable = (table: TableType) => {
    setTableForAction(table);
    setBlockNote("");
    setBlockTableDialog(true);
  };

  const confirmBlockTable = () => {
    if (tableForAction) {
      setTables(prev => prev.map(t => 
        t.id === tableForAction.id 
          ? { ...t, status: "Blocked", blockedNote: blockNote }
          : t
      ));
      toast({
        title: "Table Blocked",
        description: `Table ${tableForAction.id} has been blocked${blockNote ? `: ${blockNote}` : ""}`,
        variant: "destructive",
      });
      setBlockTableDialog(false);
      setSelectedTableId(null);
    }
  };

  const handleUnblockTable = (table: TableType) => {
    setTables(prev => prev.map(t => 
      t.id === table.id 
        ? { ...t, status: "Available", blockedNote: undefined }
        : t
    ));
    toast({
      title: "Table Unblocked",
      description: `Table ${table.id} is now available`,
    });
    setSelectedTableId(null);
  };

  const handleViewOrder = (tableId: string) => {
    navigate(`/tableorder/${tableId}`);
  };

  const handleGuestSelect = (tableId: string, guestCount: number) => {
    setGuestDropdownTable(null);
    navigate(`/orders?tableId=${tableId}&partySize=${guestCount}`);
  };

  // Table action popover content
  const TableActionPopover = ({ table }: { table: TableType }) => {
    const config = statusConfig[table.status] || statusConfig["Available"];
    
    return (
      <div className="w-56 p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">Table {table.id}</h3>
              <p className="text-sm" style={{ color: config.hexColor }}>
                {config.label} {table.guests > 0 && `• ${table.guests} guests`}
              </p>
            </div>
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: config.hexBgColor, border: `2px solid ${config.hexColor}` }}
            >
              <span className="text-white font-bold text-sm">{table.seats}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="py-2">
          {/* Available table actions */}
          {table.status === "Available" && (
            <>
              <button
                onClick={() => handleSeatWalkIn(table)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-green-400" />
                <span>Seat Walk-In</span>
              </button>
              <button
                onClick={() => handleCreateReservation(table)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors"
              >
                <CalendarPlus className="w-4 h-4 text-orange-400" />
                <span>Create Reservation</span>
              </button>
              <button
                onClick={() => handleBlockTable(table)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors border-t border-neutral-700"
              >
                <Lock className="w-4 h-4 text-red-400" />
                <span>Block Table</span>
              </button>
            </>
          )}
          
          {/* Blocked table actions */}
          {table.status === "Blocked" && (
            <button
              onClick={() => handleUnblockTable(table)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors"
            >
              <Unlock className="w-4 h-4 text-green-400" />
              <span>Unblock Table</span>
            </button>
          )}
          
          {/* Occupied/Reserved table actions */}
          {!["Available", "Blocked"].includes(table.status) && (
            <button
              onClick={() => handleViewOrder(table.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>View Order</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* Status Legend - Fixed at top */}
      <div className="sticky top-0 z-30 bg-neutral-950 border-b border-neutral-800">
        <StatusLegend />
      </div>

      {/* Floor Plan View */}
      {viewMode === "floorplan" && (
        <div className="flex-1 relative overflow-auto">
          {/* Area labels */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-500 text-xs font-medium">Kitchen</span>
            </div>
          </div>
          
          {/* Grid background */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(75, 75, 75, 0.4) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }} 
          />
          
          {/* Divider line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-neutral-700/50 to-transparent" />
          
          {/* Tables positioned absolutely */}
          <div className="relative min-h-[600px] p-8">
            {tables.map((table) => (
              <Popover 
                key={table.id}
                open={selectedTableId === table.id}
                onOpenChange={(open) => !open && setSelectedTableId(null)}
              >
                <PopoverTrigger asChild>
                  <div
                    className="absolute transition-all duration-300"
                    style={{ left: table.x, top: table.y }}
                    onClick={() => handleTableClick(table)}
                  >
                    {table.shape === "circle" ? (
                      <FloorPlanCircularTable
                        table={table}
                        isSelected={selectedTableId === table.id}
                        isHighlighted={highlightedTableId === table.id}
                      />
                    ) : (
                      <FloorPlanSquareTable
                        table={table}
                        isSelected={selectedTableId === table.id}
                        isHighlighted={highlightedTableId === table.id}
                      />
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-56 p-0 bg-neutral-900 border-neutral-700 shadow-xl" 
                  side="right" 
                  align="start"
                  sideOffset={10}
                >
                  <TableActionPopover table={table} />
                </PopoverContent>
              </Popover>
            ))}
          </div>
          
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tables.map((table) => (
              <Popover 
                key={table.id}
                open={selectedTableId === table.id}
                onOpenChange={(open) => !open && setSelectedTableId(null)}
              >
                <PopoverTrigger asChild>
                  <div>
                    <GridTableCard
                      table={table}
                      isHighlighted={highlightedTableId === table.id}
                      onClick={() => {
                        if (table.status === "Available") {
                          setGuestDropdownTable(guestDropdownTable === table.id ? null : table.id);
                        } else {
                          handleTableClick(table);
                        }
                      }}
                      onGuestSelect={(count) => handleGuestSelect(table.id, count)}
                      showGuestSelection={guestDropdownTable === table.id}
                    />
                  </div>
                </PopoverTrigger>
                {table.status !== "Available" && (
                  <PopoverContent 
                    className="w-56 p-0 bg-neutral-900 border-neutral-700 shadow-xl" 
                    side="right" 
                    align="start"
                    sideOffset={10}
                  >
                    <TableActionPopover table={table} />
                  </PopoverContent>
                )}
              </Popover>
            ))}
          </div>
          
        </ScrollArea>
      )}

      {/* Seat Walk-In Dialog */}
      <Dialog open={seatWalkInDialog} onOpenChange={setSeatWalkInDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle>Seat Walk-In at Table {tableForAction?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Guest Name (Optional)</Label>
              <Input 
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                placeholder="Enter guest name"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Party Size</Label>
              <div className="flex gap-2">
                {Array.from({ length: tableForAction?.seats || 4 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setWalkInGuests(i + 1)}
                    className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                      walkInGuests === i + 1 
                        ? "bg-orange-500 text-white" 
                        : "bg-neutral-700 text-white hover:bg-neutral-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeatWalkInDialog(false)} className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700">
              Cancel
            </Button>
            <Button onClick={confirmSeatWalkIn} className="bg-green-600 hover:bg-green-500">
              Go To New Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Reservation Dialog */}
      <Dialog open={createReservationDialog} onOpenChange={setCreateReservationDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle>Create Reservation for Table {tableForAction?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Guest Name</Label>
              <Input 
                value={reservationForm.guestName}
                onChange={(e) => setReservationForm(prev => ({ ...prev, guestName: e.target.value }))}
                placeholder="Enter guest name"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Party Size</Label>
              <div className="flex gap-2">
                {Array.from({ length: tableForAction?.seats || 4 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReservationForm(prev => ({ ...prev, partySize: i + 1 }))}
                    className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                      reservationForm.partySize === i + 1 
                        ? "bg-orange-500 text-white" 
                        : "bg-neutral-700 text-white hover:bg-neutral-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date"
                value={reservationForm.date}
                onChange={(e) => setReservationForm(prev => ({ ...prev, date: e.target.value }))}
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input 
                value={reservationForm.time}
                onChange={(e) => setReservationForm(prev => ({ ...prev, time: e.target.value }))}
                placeholder="e.g., 7:00 PM"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateReservationDialog(false)} className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700">
              Cancel
            </Button>
            <Button onClick={confirmCreateReservation} className="bg-orange-500 hover:bg-orange-400">
              Save Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Table Dialog */}
      <Dialog open={blockTableDialog} onOpenChange={setBlockTableDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle>Block Table {tableForAction?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea 
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                placeholder="Enter reason for blocking..."
                className="bg-neutral-800 border-neutral-700 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTableDialog(false)} className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700">
              Cancel
            </Button>
            <Button onClick={confirmBlockTable} className="bg-red-600 hover:bg-red-500">
              Block Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableMapPanel;
