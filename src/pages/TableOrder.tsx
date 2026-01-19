import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Grid, List, ChevronDown, Circle, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Import icons
import burgerOpenIcon from "@/assets/icons/burger-open.png";
import burgerCloseIcon from "@/assets/icons/burger-close.png";
import chairIcon from "@/assets/icons/chair-icon.png";

// Table status configurations - includes both Tailwind classes and hex values for visual view
const statusConfig: Record<string, { color: string; bgColor: string; hexColor: string; hexBgColor: string; label: string }> = {
  "Available": { color: "text-white", bgColor: "bg-neutral-700", hexColor: "#22c55e", hexBgColor: "rgba(34, 197, 94, 0.15)", label: "Available" },
  "Ordering": { color: "text-yellow-400", bgColor: "bg-neutral-800", hexColor: "#a855f7", hexBgColor: "rgba(168, 85, 247, 0.2)", label: "Ordering" },
  "Ordered": { color: "text-orange-500", bgColor: "bg-neutral-800", hexColor: "#f97316", hexBgColor: "rgba(249, 115, 22, 0.2)", label: "Ordered" },
  "Reserved": { color: "text-gray-400", bgColor: "bg-neutral-800", hexColor: "#6b7280", hexBgColor: "rgba(107, 114, 128, 0.2)", label: "Reserved" },
  "Seated": { color: "text-gray-300", bgColor: "bg-neutral-800", hexColor: "#3b82f6", hexBgColor: "rgba(59, 130, 246, 0.2)", label: "Seated" },
  "Running Late": { color: "text-red-400", bgColor: "bg-neutral-800", hexColor: "#ef4444", hexBgColor: "rgba(239, 68, 68, 0.2)", label: "Late" },
  "1st Course": { color: "text-purple-400", bgColor: "bg-neutral-800", hexColor: "#8b5cf6", hexBgColor: "rgba(139, 92, 246, 0.25)", label: "1st Course" },
  "2nd Course": { color: "text-yellow-400", bgColor: "bg-neutral-800", hexColor: "#eab308", hexBgColor: "rgba(234, 179, 8, 0.2)", label: "2nd Course" },
  "3rd Course": { color: "text-orange-500", bgColor: "bg-neutral-800", hexColor: "#f97316", hexBgColor: "rgba(249, 115, 22, 0.25)", label: "3rd Course" },
  "Dessert": { color: "text-pink-400", bgColor: "bg-neutral-800", hexColor: "#ec4899", hexBgColor: "rgba(236, 72, 153, 0.2)", label: "Dessert" },
  "Partially Seated": { color: "text-green-400", bgColor: "bg-neutral-800", hexColor: "#22c55e", hexBgColor: "rgba(34, 197, 94, 0.2)", label: "Partial" },
  "Served": { color: "text-blue-400", bgColor: "bg-neutral-800", hexColor: "#0ea5e9", hexBgColor: "rgba(14, 165, 233, 0.25)", label: "Served" },
  "Paid": { color: "text-emerald-400", bgColor: "bg-neutral-800", hexColor: "#10b981", hexBgColor: "rgba(16, 185, 129, 0.2)", label: "Paid" },
};

// Seat dot colors based on status
const getSeatDotColor = (status: string): string => {
  switch (status) {
    case "Available": return "bg-green-500";
    case "Ordering": return "bg-red-500";
    case "Ordered": return "bg-orange-500";
    case "Reserved": return "bg-gray-500";
    case "Seated": return "bg-gray-400";
    case "Running Late": return "bg-red-500";
    case "1st Course": return "bg-purple-500";
    case "2nd Course": return "bg-yellow-500";
    case "3rd Course": return "bg-orange-500";
    case "Dessert": return "bg-pink-500";
    case "Partially Seated": return "bg-green-500";
    case "Served": return "bg-blue-500";
    case "Paid": return "bg-emerald-500";
    default: return "bg-gray-500";
  }
};

// Mock table data - extended with shape, occupiedSeats, and guests for visual view
const tables = [
  { id: "T1", seats: 12, status: "Available", time: "", shape: "circle" as const, occupiedSeats: [] as number[], guests: 0 },
  { id: "T2", seats: 5, status: "Ordering", time: "25M", shape: "square" as const, occupiedSeats: [1, 2], guests: 2 },
  { id: "T3", seats: 4, status: "Ordered", time: "2H 25M", shape: "circle" as const, occupiedSeats: [1, 2, 3], guests: 3 },
  { id: "T4", seats: 3, status: "Reserved", time: "2H 25M", shape: "square" as const, occupiedSeats: [], guests: 0 },
  { id: "T5", seats: 4, status: "Seated", time: "25M", shape: "circle" as const, occupiedSeats: [1, 3], guests: 2 },
  { id: "T6", seats: 2, status: "Running Late", time: "45M", shape: "square" as const, occupiedSeats: [], guests: 0 },
  { id: "T7", seats: 5, status: "1st Course", time: "12M", shape: "circle" as const, occupiedSeats: [1, 2, 3, 4, 5], guests: 5 },
  { id: "T8", seats: 4, status: "2nd Course", time: "13M", shape: "square" as const, occupiedSeats: [1, 2, 3, 4], guests: 4 },
  { id: "T9", seats: 3, status: "3rd Course", time: "14M", shape: "circle" as const, occupiedSeats: [1, 2, 3], guests: 3 },
  { id: "T10", seats: 4, status: "Dessert", time: "16M", shape: "square" as const, occupiedSeats: [1, 2], guests: 2 },
  { id: "T11", seats: 5, status: "Partially Seated", time: "18M", shape: "circle" as const, occupiedSeats: [1, 3, 5], guests: 3 },
  { id: "T12", seats: 5, status: "Served", time: "36M", shape: "square" as const, occupiedSeats: [1, 2, 3, 4, 5], guests: 5 },
  { id: "T13", seats: 6, status: "Available", time: "", shape: "circle" as const, occupiedSeats: [], guests: 0 },
  { id: "T14", seats: 5, status: "Ordering", time: "25M", shape: "square" as const, occupiedSeats: [1, 2, 3], guests: 3 },
  { id: "T15", seats: 4, status: "Ordered", time: "2H 25M", shape: "circle" as const, occupiedSeats: [1, 2, 3, 4], guests: 4 },
  { id: "T16", seats: 3, status: "Reserved", time: "2H 25M", shape: "square" as const, occupiedSeats: [], guests: 0 },
  { id: "T17", seats: 4, status: "Seated", time: "25M", shape: "circle" as const, occupiedSeats: [1, 2], guests: 2 },
  { id: "T18", seats: 2, status: "Running Late", time: "45M", shape: "square" as const, occupiedSeats: [], guests: 0 },
  { id: "T19", seats: 5, status: "1st Course", time: "12M", shape: "circle" as const, occupiedSeats: [1, 2, 3], guests: 3 },
  { id: "T20", seats: 4, status: "2nd Course", time: "13M", shape: "square" as const, occupiedSeats: [1, 2, 3, 4], guests: 4 },
  { id: "T21", seats: 3, status: "3rd Course", time: "14M", shape: "circle" as const, occupiedSeats: [1, 2], guests: 2 },
  { id: "T22", seats: 4, status: "Dessert", time: "16M", shape: "square" as const, occupiedSeats: [1, 2, 3], guests: 3 },
  { id: "T23", seats: 5, status: "Paid", time: "18M", shape: "circle" as const, occupiedSeats: [1, 2, 3, 4], guests: 4 },
  { id: "T24", seats: 5, status: "Served", time: "36M", shape: "square" as const, occupiedSeats: [1, 2, 3, 4, 5], guests: 5 },
];

// Filter categories with counts
const getFilterCounts = () => {
  const counts: Record<string, number> = { "All": tables.length };
  tables.forEach(table => {
    counts[table.status] = (counts[table.status] || 0) + 1;
  });
  return counts;
};

// Dining areas
const diningAreas = [
  "Main Dining Room",
  "Patio",
  "Private Room",
  "Bar Area",
  "Outdoor Terrace",
];

// Chair component for circular tables
const CircularChair = ({ 
  angle, 
  isOccupied, 
  tableRadius 
}: { 
  angle: number; 
  isOccupied: boolean; 
  tableRadius: number;
}) => {
  const chairDistance = tableRadius + 18;
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
        className={`w-5 h-3 rounded-t-full transition-colors ${
          isOccupied 
            ? "bg-blue-500 shadow-lg shadow-blue-500/30" 
            : "bg-neutral-700 border border-neutral-600"
        }`}
      />
    </div>
  );
};

// Chair component for square tables
const SquareChair = ({ 
  side, 
  position, 
  isOccupied,
  tableSize
}: { 
  side: 'top' | 'right' | 'bottom' | 'left';
  position: number;
  isOccupied: boolean;
  tableSize: number;
}) => {
  const offset = tableSize / 2 + 12;
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
      style={{
        ...style,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
    >
      <div 
        className={`w-5 h-3 rounded-t transition-colors ${
          isOccupied 
            ? "bg-blue-500 shadow-lg shadow-blue-500/30" 
            : "bg-neutral-700 border border-neutral-600"
        }`}
      />
    </div>
  );
};

// Circular Table Component for Visual View
const CircularTableVisual = ({ 
  table, 
  onClick, 
  isSelected,
  onGuestSelect,
  showGuestSelection 
}: { 
  table: typeof tables[0]; 
  onClick: () => void;
  isSelected: boolean;
  onGuestSelect: (count: number) => void;
  showGuestSelection: boolean;
}) => {
  const config = statusConfig[table.status] || statusConfig["Available"];
  const tableRadius = table.seats >= 8 ? 50 : table.seats >= 6 ? 42 : 36;
  const containerSize = 200;

  const chairAngles = Array.from({ length: table.seats }, (_, i) => 
    (360 / table.seats) * i - 90
  );

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ width: containerSize, height: containerSize + 40 }}
      onClick={onClick}
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

        <div 
          className={`rounded-full flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105 ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          }`}
          style={{ 
            width: tableRadius * 2, 
            height: tableRadius * 2,
            backgroundColor: config.hexBgColor,
            border: `2px solid ${config.hexColor}`,
            boxShadow: `0 4px 20px ${config.hexColor}20`
          }}
        >
          <span className="text-white font-bold text-lg leading-none">{table.id}</span>
          <span 
            className="text-[10px] font-medium mt-0.5"
            style={{ color: config.hexColor }}
          >
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
      </div>

      {table.time && (
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1"
          style={{ 
            backgroundColor: 'rgba(38, 38, 38, 0.9)',
            border: `1px solid ${config.hexColor}40`
          }}
        >
          <Clock className="w-3 h-3" style={{ color: config.hexColor }} />
          <span className="text-gray-300">{table.time}</span>
        </div>
      )}

      {showGuestSelection && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10 rounded-full"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 mb-2">Select guests</span>
            <div className="flex flex-wrap gap-2 justify-center max-w-[140px]">
              {Array.from({ length: table.seats }).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuestSelect(i + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-neutral-700 rounded-full hover:bg-green-500 transition-all hover:scale-110"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Square Table Component for Visual View
const SquareTableVisual = ({ 
  table, 
  onClick, 
  isSelected,
  onGuestSelect,
  showGuestSelection 
}: { 
  table: typeof tables[0]; 
  onClick: () => void;
  isSelected: boolean;
  onGuestSelect: (count: number) => void;
  showGuestSelection: boolean;
}) => {
  const config = statusConfig[table.status] || statusConfig["Available"];
  const tableSize = 70;
  const containerSize = 200;

  const getChairLayout = (seats: number) => {
    const chairs: { side: 'top' | 'right' | 'bottom' | 'left'; position: number }[] = [];
    
    if (seats === 2) {
      chairs.push({ side: 'left', position: 0.5 });
      chairs.push({ side: 'right', position: 0.5 });
    } else if (seats <= 4) {
      chairs.push({ side: 'top', position: 0.5 });
      chairs.push({ side: 'right', position: 0.5 });
      chairs.push({ side: 'bottom', position: 0.5 });
      chairs.push({ side: 'left', position: 0.5 });
    } else if (seats <= 6) {
      chairs.push({ side: 'top', position: 0.25 });
      chairs.push({ side: 'top', position: 0.75 });
      chairs.push({ side: 'right', position: 0.5 });
      chairs.push({ side: 'bottom', position: 0.75 });
      chairs.push({ side: 'bottom', position: 0.25 });
      chairs.push({ side: 'left', position: 0.5 });
    }
    
    return chairs;
  };

  const chairLayout = getChairLayout(table.seats);

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ width: containerSize, height: containerSize + 40 }}
      onClick={onClick}
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

        <div 
          className={`rounded-xl flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105 ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          }`}
          style={{ 
            width: tableSize, 
            height: tableSize,
            backgroundColor: config.hexBgColor,
            border: `2px solid ${config.hexColor}`,
            boxShadow: `0 4px 20px ${config.hexColor}20`
          }}
        >
          <span className="text-white font-bold text-lg leading-none">{table.id}</span>
          <span 
            className="text-[10px] font-medium mt-0.5"
            style={{ color: config.hexColor }}
          >
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
      </div>

      {table.time && (
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1"
          style={{ 
            backgroundColor: 'rgba(38, 38, 38, 0.9)',
            border: `1px solid ${config.hexColor}40`
          }}
        >
          <Clock className="w-3 h-3" style={{ color: config.hexColor }} />
          <span className="text-gray-300">{table.time}</span>
        </div>
      )}

      {showGuestSelection && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10 rounded-xl"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 mb-2">Select guests</span>
            <div className="flex flex-wrap gap-2 justify-center max-w-[120px]">
              {Array.from({ length: table.seats }).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuestSelect(i + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-neutral-700 rounded hover:bg-green-500 transition-all hover:scale-110"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Status Legend Component
const StatusLegend = () => {
  const legendItems = [
    { status: "Available", color: "#22c55e" },
    { status: "Ordering", color: "#a855f7" },
    { status: "Ordered", color: "#f97316" },
    { status: "Seated", color: "#3b82f6" },
    { status: "Late", color: "#ef4444" },
    { status: "Reserved", color: "#6b7280" },
  ];

  return (
    <div className="flex items-center justify-center gap-4 py-3 px-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
      {legendItems.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-gray-400">{item.status}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-neutral-700">
        <div className="w-3 h-2 rounded-t-sm bg-blue-500" />
        <span className="text-xs text-gray-400">Occupied</span>
      </div>
    </div>
  );
};

const TableOrder = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "visual">("grid");
  const [selectedArea, setSelectedArea] = useState("Main Dining Room");
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [guestDropdownTable, setGuestDropdownTable] = useState<string | null>(null);
  const filterCounts = getFilterCounts();

  const filters = [
    "All",
    "Available",
    "Ordering",
    "Ordered",
    "Reserved",
    "Seated",
    "Running Late",
    "1st Course",
    "2nd Course",
    "3rd Course",
    "Dessert",
    "Partially Seated",
    "Served",
    "Paid",
  ];

  const filteredTables = activeFilter === "All" 
    ? tables 
    : tables.filter(t => t.status === activeFilter);

  return (
    <div className="flex flex-col h-full bg-black p-2 pb-2">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-3">
        {/* Collapsible Controls */}
        {isControlsOpen ? (
          <div className="flex items-center gap-1.5 bg-sidebar-accent rounded-full pl-1.5 pr-1 py-1">
            {/* Close Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 p-0" 
              onClick={() => setIsControlsOpen(false)}
            >
              <img src={burgerCloseIcon} alt="Close" className="w-5 h-5" />
            </Button>

            {/* View Button */}
            <button
              onClick={() => setViewMode(
                viewMode === "grid" ? "list" : 
                viewMode === "list" ? "visual" : "grid"
              )}
              className="flex items-center justify-center rounded-full p-1.5 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              {viewMode === "grid" ? (
                <Grid className="w-4 h-4 text-black" />
              ) : viewMode === "list" ? (
                <List className="w-4 h-4 text-black" />
              ) : (
                <Circle className="w-4 h-4 text-black" />
              )}
            </button>

            {/* Users Button */}
            <button className="flex items-center justify-center bg-neutral-800 rounded-full p-1.5 hover:bg-neutral-700 transition-colors">
              <Users className="w-4 h-4 text-white" />
            </button>

            {/* Dining Area Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(180deg, #B8B8B8 0%, #616161 100%)" }}
                >
                  <span className="text-white text-xs font-medium">{selectedArea}</span>
                  <ChevronDown className="w-3 h-3 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
                {diningAreas.map((area) => (
                  <DropdownMenuItem
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`text-white hover:bg-neutral-700 cursor-pointer ${
                      selectedArea === area ? "bg-neutral-700" : ""
                    }`}
                  >
                    {area}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 p-0" 
            onClick={() => setIsControlsOpen(true)}
          >
            <img src={burgerOpenIcon} alt="Open controls" className="w-8 h-8" />
          </Button>
        )}

        {/* Filter Tabs */}
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? "text-black"
                    : "text-white"
                }`}
                style={
                  activeFilter === filter
                    ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
                    : { 
                        background: "#7575754D",
                        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                      }
                }
              >
                <span>{filter}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                  activeFilter === filter ? "bg-black text-white" : "bg-neutral-800"
                }`}>
                  {filterCounts[filter] || 0}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>

      {/* Tables Grid/List View */}
      <ScrollArea className="flex-1">
        {viewMode === "list" ? (
          /* List View - 3 columns */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredTables.map((table, index) => {
              const config = statusConfig[table.status] || statusConfig["Available"];
              const dotColor = getSeatDotColor(table.status);
              
              const handleTableClick = () => {
                if (table.status === "Available") {
                  setGuestDropdownTable(guestDropdownTable === table.id ? null : table.id);
                } else {
                  navigate(`/tableorder/${table.id}`);
                }
              };

              const handleGuestSelect = (guestCount: number) => {
                console.log(`Selected ${guestCount} guests for table ${table.id}`);
                setGuestDropdownTable(null);
                setSelectedTable(table.id);
              };

              return (
                <div
                  key={`${table.id}-${index}`}
                  onClick={handleTableClick}
                  className={`bg-neutral-900 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-800 transition-all border-2 ${
                    selectedTable === table.id 
                      ? "border-orange-500 ring-2 ring-orange-500/30" 
                      : "border-neutral-800"
                  }`}
                >
                  {/* Table Number */}
                  <span className="text-2xl font-bold text-white">{table.id}</span>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: table.seats }).map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        ))}
                      </div>
                      <span className="text-gray-400 text-xs">{table.seats} Seats</span>
                      {table.time && <span className="text-gray-500 text-xs">{table.time}</span>}
                    </div>
                  </div>
                  
                  {/* Status or Guest Selection */}
                  {guestDropdownTable === table.id && table.status === "Available" ? (
                    <div className="flex gap-1 px-2">
                      {Array.from({ length: table.seats }).map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGuestSelect(i + 1);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded hover:bg-orange-500 transition-colors"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`px-3 py-1 rounded-md border border-neutral-600 ${config.bgColor}`}>
                      <span className={`text-xs font-medium ${config.color}`}>
                        {table.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : viewMode === "visual" ? (
          /* Visual View with chairs */
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-wrap justify-center gap-4 p-4">
              {filteredTables.map((table) => {
                const handleTableClick = () => {
                  if (table.status === "Available") {
                    setGuestDropdownTable(guestDropdownTable === table.id ? null : table.id);
                  } else {
                    navigate(`/tableorder/${table.id}`);
                  }
                };

                const handleGuestSelect = (guestCount: number) => {
                  console.log(`Selected ${guestCount} guests for table ${table.id}`);
                  setGuestDropdownTable(null);
                  setSelectedTable(table.id);
                  navigate(`/orders?tableId=${table.id}&seats=${table.seats}&guests=${guestCount}`);
                };

                return table.shape === "circle" ? (
                  <CircularTableVisual
                    key={table.id}
                    table={table}
                    onClick={handleTableClick}
                    isSelected={selectedTable === table.id}
                    onGuestSelect={handleGuestSelect}
                    showGuestSelection={guestDropdownTable === table.id && table.status === "Available"}
                  />
                ) : (
                  <SquareTableVisual
                    key={table.id}
                    table={table}
                    onClick={handleTableClick}
                    isSelected={selectedTable === table.id}
                    onGuestSelect={handleGuestSelect}
                    showGuestSelection={guestDropdownTable === table.id && table.status === "Available"}
                  />
                );
              })}
            </div>
            <StatusLegend />
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredTables.map((table, index) => {
              const config = statusConfig[table.status] || statusConfig["Available"];
              const dotColor = getSeatDotColor(table.status);
              
              const handleTableClick = () => {
                if (table.status === "Available") {
                  setGuestDropdownTable(guestDropdownTable === table.id ? null : table.id);
                } else {
                  navigate(`/tableorder/${table.id}`);
                }
              };

              const handleGuestSelect = (guestCount: number) => {
                console.log(`Selected ${guestCount} guests for table ${table.id}`);
                setGuestDropdownTable(null);
                setSelectedTable(table.id);
                navigate(`/orders?tableId=${table.id}&seats=${table.seats}&guests=${guestCount}`);
              };

              return (
                <div
                  key={`${table.id}-${index}`}
                  className="relative"
                >
                  <div
                    onClick={handleTableClick}
                    className={`bg-neutral-900 rounded-xl p-3 flex flex-col items-center cursor-pointer hover:bg-neutral-800 transition-all border-2 ${
                      selectedTable === table.id 
                        ? "border-orange-500 ring-2 ring-orange-500/30" 
                        : "border-neutral-800"
                    }`}
                  >
                    {/* Table Number */}
                    <span className="text-3xl font-bold text-white mb-1">{table.id}</span>
                    
                    {/* Seats */}
                    <span className="text-gray-400 text-sm mb-2">{table.seats} Seats</span>
                    
                    {/* Seat Dots */}
                    <div className={`flex gap-1 mb-2 ${table.seats > 6 ? 'overflow-x-auto max-w-full scrollbar-hide' : ''}`}>
                      {Array.from({ length: table.seats }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 flex-shrink-0 rounded-full ${dotColor}`} />
                      ))}
                    </div>
                    
                    <div className="mt-auto w-full">
                      {/* Time - just above status, right aligned with same padding */}
                      <div className="flex justify-end mb-1 min-h-[1rem] px-1">
                        {table.time && (
                          <span className="text-gray-500 text-xs">{table.time}</span>
                        )}
                      </div>
                      
                      {/* Status Label - Shows guest numbers when Available table is clicked */}
                      {guestDropdownTable === table.id && table.status === "Available" ? (
                        <div className={`w-full py-1 px-2 rounded-md border border-neutral-600 bg-neutral-700 ${table.seats > 6 ? 'overflow-x-auto scrollbar-hide' : ''}`}>
                          <div className={`flex ${table.seats > 6 ? 'justify-start' : 'justify-center'} items-center gap-1`}>
                            {/* Chair icon indicator */}
                            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                              <img src={chairIcon} alt="Select seats" className="w-4 h-4 object-contain" />
                            </div>
                            {Array.from({ length: table.seats }).map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGuestSelect(i + 1);
                                }}
                                className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded hover:bg-orange-500 transition-colors"
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className={`w-full text-center py-1 rounded-md border border-neutral-600 ${config.bgColor}`}>
                          <span className={`text-xs font-medium ${config.color}`}>
                            {table.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export default TableOrder;