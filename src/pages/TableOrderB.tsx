import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Grid, List, ChevronDown, LayoutList, Clock, MapPin, RotateCcw, Merge, Link, Unlink, ArrowUpDown, Eye, UserPlus, Armchair, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import icons
import burgerOpenIcon from "@/assets/icons/burger-open.png";
import burgerCloseIcon from "@/assets/icons/burger-close.png";

// Table status configurations with semantic colors
const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  "Available": { color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.15)", label: "Available" },
  "Ordering": { color: "#a855f7", bgColor: "rgba(168, 85, 247, 0.2)", label: "Ordering" },
  "Ordered": { color: "#f97316", bgColor: "rgba(249, 115, 22, 0.2)", label: "Ordered" },
  "Reserved": { color: "#6b7280", bgColor: "rgba(107, 114, 128, 0.2)", label: "Reserved" },
  "Seated": { color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.2)", label: "Seated" },
  "Running Late": { color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.2)", label: "Late" },
  "1st Course": { color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.25)", label: "1st Course" },
  "2nd Course": { color: "#eab308", bgColor: "rgba(234, 179, 8, 0.2)", label: "2nd Course" },
  "3rd Course": { color: "#f97316", bgColor: "rgba(249, 115, 22, 0.25)", label: "3rd Course" },
  "Dessert": { color: "#ec4899", bgColor: "rgba(236, 72, 153, 0.2)", label: "Dessert" },
  "Partially Seated": { color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.2)", label: "Partial" },
  "Served": { color: "#0ea5e9", bgColor: "rgba(14, 165, 233, 0.25)", label: "Served" },
  "Paid": { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.2)", label: "Paid" },
};

// Extended table type with merge properties
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
  mergedWith?: string | null;
  isMergeSource?: boolean;
  mergeGroupId?: string;
};

// Default table data with x, y positions for map view
const defaultTables: TableType[] = [
  { id: "T1", seats: 8, status: "Available", time: "", shape: "circle", occupiedSeats: [], guests: 0, x: 80, y: 60 },
  { id: "T2", seats: 4, status: "Ordering", time: "25m", shape: "square", occupiedSeats: [1, 2], guests: 2, x: 320, y: 80 },
  { id: "T3", seats: 4, status: "Ordered", time: "1h 15m", shape: "circle", occupiedSeats: [1, 2, 3], guests: 3, x: 520, y: 50 },
  { id: "T4", seats: 4, status: "Reserved", time: "7:30 PM", shape: "square", occupiedSeats: [], guests: 0, x: 720, y: 90 },
  { id: "T5", seats: 6, status: "Seated", time: "10m", shape: "circle", occupiedSeats: [1, 3, 5], guests: 3, x: 120, y: 320 },
  { id: "T6", seats: 2, status: "Running Late", time: "15m", shape: "square", occupiedSeats: [], guests: 0, x: 340, y: 300 },
  { id: "T7", seats: 6, status: "1st Course", time: "35m", shape: "circle", occupiedSeats: [1, 2, 3, 4, 5, 6], guests: 6, x: 540, y: 340 },
  { id: "T8", seats: 4, status: "2nd Course", time: "50m", shape: "square", occupiedSeats: [1, 2, 3, 4], guests: 4, x: 750, y: 320 },
];

// Merge validation - check if two tables can be merged based on their status
const canMerge = (table1: TableType, table2: TableType): { allowed: boolean; reason: string } => {
  const activeOrderStatuses = ["Ordering", "Ordered", "Unpaid", "1st Course", "2nd Course", "3rd Course", "Dessert", "Served", "Seated"];
  const completedStatuses = ["Paid", "Completed"];
  
  const status1 = table1.status;
  const status2 = table2.status;
  
  // Both available - allowed (to increase seats)
  if (status1 === "Available" && status2 === "Available") {
    return { allowed: true, reason: "" };
  }
  
  // Both have active orders - allowed
  if (activeOrderStatuses.includes(status1) && activeOrderStatuses.includes(status2)) {
    return { allowed: true, reason: "" };
  }
  
  // One is paid/completed - not allowed
  if (completedStatuses.includes(status1) || completedStatuses.includes(status2)) {
    return { allowed: false, reason: "Cannot merge with paid or completed tables" };
  }
  
  // One is available and one has active order - not allowed
  if ((status1 === "Available" && activeOrderStatuses.includes(status2)) ||
      (status2 === "Available" && activeOrderStatuses.includes(status1))) {
    return { allowed: false, reason: "Cannot merge available table with table that has an active order" };
  }
  
  // Reserved tables - not allowed to merge
  if (status1 === "Reserved" || status2 === "Reserved") {
    return { allowed: false, reason: "Cannot merge reserved tables" };
  }
  
  return { allowed: false, reason: "These tables cannot be merged" };
};

// Load saved positions from localStorage or use defaults
const loadSavedPositions = (): TableType[] => {
  try {
    const saved = localStorage.getItem('tablePositions');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge saved positions with default table data (in case new tables were added)
      return defaultTables.map(table => {
        const savedTable = parsed.find((t: TableType) => t.id === table.id);
        return savedTable ? { 
          ...table, 
          x: savedTable.x, 
          y: savedTable.y,
          mergedWith: savedTable.mergedWith || null,
          isMergeSource: savedTable.isMergeSource || false,
          mergeGroupId: savedTable.mergeGroupId || undefined,
          guests: savedTable.guests ?? table.guests,
          occupiedSeats: savedTable.occupiedSeats || table.occupiedSeats,
          status: savedTable.status || table.status,
          time: savedTable.time ?? table.time,
        } : table;
      });
    }
  } catch (e) {
    console.error('Error loading table positions:', e);
  }
  return defaultTables;
};

// Filter categories with counts
const getFilterCounts = (tables: TableType[]) => {
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
  const chairDistance = tableRadius + 14;
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
        className={`w-4 h-2.5 rounded-t-full transition-colors ${
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
  const offset = tableSize / 2 + 10;
  const positionOffset = (position - 0.5) * 22;
  
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
        className={`w-4 h-2.5 rounded-t transition-colors ${
          isOccupied 
            ? "bg-blue-500 shadow-lg shadow-blue-500/30" 
            : "bg-neutral-700 border border-neutral-600"
        }`}
      />
    </div>
  );
};

// Map Circular Table Component (smaller for map view)
const MapCircularTable = ({ 
  table, 
  onClick, 
  isSelected,
  onGuestSelect,
  showGuestSelection,
  isMerged
}: { 
  table: TableType;
  onClick: () => void;
  isSelected: boolean;
  onGuestSelect: (count: number) => void;
  showGuestSelection: boolean;
  isMerged?: boolean;
}) => {
  const config = statusConfig[table.status] || statusConfig["Available"];
  const tableRadius = table.seats >= 8 ? 40 : table.seats >= 6 ? 34 : 28;
  const containerSize = 140;

  // Calculate chair angles
  const chairAngles = Array.from({ length: table.seats }, (_, i) => 
    (360 / table.seats) * i - 90
  );

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ width: containerSize, height: containerSize }}
      onClick={onClick}
    >
      {/* Table container */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Chairs */}
        {chairAngles.map((angle, i) => (
          <CircularChair
            key={i}
            angle={angle}
            isOccupied={table.occupiedSeats.includes(i + 1)}
            tableRadius={tableRadius}
          />
        ))}

        {/* Table surface */}
        <div 
          className={`rounded-full flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110 ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          } ${isMerged ? "ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20" : ""}`}
          style={{ 
            width: tableRadius * 2, 
            height: tableRadius * 2,
            backgroundColor: config.bgColor,
            border: `2px solid ${isMerged ? "#22d3ee" : config.color}`,
            boxShadow: isMerged 
              ? `0 4px 20px rgba(34, 211, 238, 0.4)` 
              : `0 4px 20px ${config.color}40`
          }}
        >
          {/* Table ID */}
          <span className="text-white font-bold text-sm leading-none">{table.id}</span>
          
          {/* Status label */}
          <span 
            className="text-[9px] font-medium mt-0.5"
            style={{ color: isMerged ? "#22d3ee" : config.color }}
          >
            {config.label}
          </span>
          
          {/* Occupancy indicator */}
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: Math.min(table.seats, 6) }).map((_, i) => (
              <div 
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${
                  i < table.guests ? "bg-blue-400" : "bg-neutral-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Timer badge */}
        {table.time && (
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ 
              backgroundColor: 'rgba(23, 23, 23, 0.95)',
              border: `1px solid ${config.color}50`
            }}
          >
            <Clock className="w-2.5 h-2.5" style={{ color: config.color }} />
            <span className="text-gray-300">{table.time}</span>
          </div>
        )}
      </div>

      {/* Guest selection overlay */}
      {showGuestSelection && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10 rounded-full"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 mb-1.5">Select guests</span>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-[100px]">
              {Array.from({ length: table.seats }).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuestSelect(i + 1);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-xs font-bold text-white bg-neutral-700 rounded-full hover:bg-green-500 transition-all hover:scale-110"
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

// Map Square Table Component (smaller for map view)
const MapSquareTable = ({ 
  table, 
  onClick, 
  isSelected,
  onGuestSelect,
  showGuestSelection,
  isMerged
}: { 
  table: TableType;
  onClick: () => void;
  isSelected: boolean;
  onGuestSelect: (count: number) => void;
  showGuestSelection: boolean;
  isMerged?: boolean;
}) => {
  const config = statusConfig[table.status] || statusConfig["Available"];
  const tableSize = 55;
  const containerSize = 140;

  // Distribute chairs around the table
  const getChairLayout = (seats: number) => {
    const chairs: { side: 'top' | 'right' | 'bottom' | 'left'; position: number }[] = [];
    
    if (seats === 2) {
      chairs.push({ side: 'left', position: 0.5 });
      chairs.push({ side: 'right', position: 0.5 });
    } else if (seats === 4) {
      chairs.push({ side: 'top', position: 0.5 });
      chairs.push({ side: 'right', position: 0.5 });
      chairs.push({ side: 'bottom', position: 0.5 });
      chairs.push({ side: 'left', position: 0.5 });
    } else if (seats === 6) {
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
      style={{ width: containerSize, height: containerSize }}
      onClick={onClick}
    >
      {/* Table container */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Chairs */}
        {chairLayout.map((chair, i) => (
          <SquareChair
            key={i}
            side={chair.side}
            position={chair.position}
            isOccupied={table.occupiedSeats.includes(i + 1)}
            tableSize={tableSize}
          />
        ))}

        {/* Table surface */}
        <div 
          className={`rounded-lg flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110 ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          } ${isMerged ? "ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20" : ""}`}
          style={{ 
            width: tableSize, 
            height: tableSize,
            backgroundColor: config.bgColor,
            border: `2px solid ${isMerged ? "#22d3ee" : config.color}`,
            boxShadow: isMerged 
              ? `0 4px 20px rgba(34, 211, 238, 0.4)` 
              : `0 4px 20px ${config.color}40`
          }}
        >
          {/* Table ID */}
          <span className="text-white font-bold text-sm leading-none">{table.id}</span>
          
          {/* Status label */}
          <span 
            className="text-[9px] font-medium mt-0.5"
            style={{ color: isMerged ? "#22d3ee" : config.color }}
          >
            {config.label}
          </span>
          
          {/* Occupancy indicator */}
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: table.seats }).map((_, i) => (
              <div 
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${
                  i < table.guests ? "bg-blue-400" : "bg-neutral-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Timer badge */}
        {table.time && (
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ 
              backgroundColor: 'rgba(23, 23, 23, 0.95)',
              border: `1px solid ${config.color}50`
            }}
          >
            <Clock className="w-2.5 h-2.5" style={{ color: config.color }} />
            <span className="text-gray-300">{table.time}</span>
          </div>
        )}
      </div>

      {/* Guest selection overlay */}
      {showGuestSelection && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10 rounded-lg"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 mb-1.5">Select guests</span>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-[90px]">
              {Array.from({ length: table.seats }).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuestSelect(i + 1);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-xs font-bold text-white bg-neutral-700 rounded hover:bg-green-500 transition-all hover:scale-110"
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
    <div className="flex items-center justify-center gap-4 py-2.5 px-4 bg-neutral-900/70 rounded-lg border border-neutral-800">
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
      <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-neutral-700">
        <Link className="w-3 h-3 text-cyan-400" />
        <span className="text-xs text-gray-400">Merged</span>
      </div>
    </div>
  );
};

// Connector Line Component between merged tables
const MergeConnectorLine = ({ 
  table1, 
  table2,
  containerOffset
}: { 
  table1: TableType; 
  table2: TableType;
  containerOffset: { x: number; y: number };
}) => {
  const tableCenter = 70; // Center of the 140px table container
  const x1 = table1.x + tableCenter;
  const y1 = table1.y + tableCenter;
  const x2 = table2.x + tableCenter;
  const y2 = table2.y + tableCenter;
  
  // Calculate midpoint for the info panel
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Calculate combined stats
  const totalSeats = table1.seats + table2.seats;
  const totalGuests = table1.guests + table2.guests;
  
  return (
    <>
      {/* SVG connector line */}
      <svg 
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id={`gradient-${table1.id}-${table2.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Glow effect line */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#22d3ee"
          strokeWidth="6"
          strokeOpacity="0.3"
          strokeLinecap="round"
        />
        
        {/* Main connector line */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={`url(#gradient-${table1.id}-${table2.id})`}
          strokeWidth="3"
          strokeDasharray="12,6"
          strokeLinecap="round"
          filter="url(#glow)"
          className="animate-pulse"
        />
        
        {/* Link icon circle at midpoint */}
        <circle
          cx={midX}
          cy={midY}
          r="14"
          fill="#171717"
          stroke="#22d3ee"
          strokeWidth="2"
        />
      </svg>
      
      {/* Link icon at midpoint */}
      <div 
        className="absolute z-20 pointer-events-none flex items-center justify-center"
        style={{ 
          left: midX - 10, 
          top: midY - 10,
          width: 20,
          height: 20
        }}
      >
        <Link className="w-3.5 h-3.5 text-cyan-400" />
      </div>
      
      {/* Combined info panel */}
      <div 
        className="absolute z-20 pointer-events-none"
        style={{ 
          left: midX - 60, 
          top: midY + 20
        }}
      >
        <div className="px-3 py-1.5 bg-neutral-900/95 border border-cyan-500/50 rounded-lg shadow-lg shadow-cyan-500/20">
          <div className="text-cyan-400 font-bold text-[10px] text-center">
            {table1.id} + {table2.id}
          </div>
          <div className="text-white text-[9px] text-center mt-0.5">
            {totalSeats} seats • {totalGuests} guests
          </div>
        </div>
      </div>
    </>
  );
};

const TableOrderB = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
  const [selectedArea, setSelectedArea] = useState("Main Dining Room");
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [guestDropdownTable, setGuestDropdownTable] = useState<string | null>(null);
  
  // Drag and drop state
  const [tablePositions, setTablePositions] = useState<TableType[]>(loadSavedPositions);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Merge functionality state
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{ source: string; target: string } | null>(null);
  
  // Unmerge dialog state
  const [showUnmergeDialog, setShowUnmergeDialog] = useState(false);
  const [pendingUnmerge, setPendingUnmerge] = useState<{ table1: string; table2: string } | null>(null);
  
  // Table options popup state
  const [tableOptionsOpen, setTableOptionsOpen] = useState<string | null>(null);
  const [seatEditTable, setSeatEditTable] = useState<string | null>(null);
  const [tempSeats, setTempSeats] = useState<number>(0);
  
  const MERGE_THRESHOLD = 120; // pixels - distance at which tables can merge
  const SNAP_OFFSET = 160; // pixels - how far apart merged tables should be
  
  const filterCounts = getFilterCounts(tablePositions);

  // Save positions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('tablePositions', JSON.stringify(tablePositions));
  }, [tablePositions]);
  
  // Get merged table pairs (only return unique pairs)
  const getMergedPairs = useCallback(() => {
    const pairs: { table1: TableType; table2: TableType }[] = [];
    const processed = new Set<string>();
    
    tablePositions.forEach(table => {
      if (table.mergedWith && !processed.has(table.id) && !processed.has(table.mergedWith)) {
        const partner = tablePositions.find(t => t.id === table.mergedWith);
        if (partner) {
          pairs.push({ table1: table, table2: partner });
          processed.add(table.id);
          processed.add(partner.id);
        }
      }
    });
    
    return pairs;
  }, [tablePositions]);
  
  // Check for table overlap during drag
  const checkTableOverlap = useCallback((draggedX: number, draggedY: number, draggedId: string): string | null => {
    const draggedTable = tablePositions.find(t => t.id === draggedId);
    if (!draggedTable) return null;
    
    for (const table of tablePositions) {
      if (table.id === draggedId) continue;
      
      // Skip if either table is already merged
      if (draggedTable.mergedWith || table.mergedWith) continue;
      
      const distance = Math.sqrt(
        Math.pow(table.x - draggedX, 2) + 
        Math.pow(table.y - draggedY, 2)
      );
      
      if (distance < MERGE_THRESHOLD) {
        // Check if merge is allowed based on status
        const { allowed } = canMerge(draggedTable, table);
        if (allowed) {
          return table.id;
        }
      }
    }
    return null;
  }, [tablePositions]);
  
  // Handle merge confirmation
  const handleConfirmMerge = () => {
    if (!pendingMerge) return;
    
    const { source, target } = pendingMerge;
    const sourceTable = tablePositions.find(t => t.id === source);
    const targetTable = tablePositions.find(t => t.id === target);
    
    if (sourceTable && targetTable) {
      // Merge guests and occupied seats
      const mergedGuests = sourceTable.guests + targetTable.guests;
      const mergedOccupiedSeats = [
        ...targetTable.occupiedSeats,
        ...sourceTable.occupiedSeats.map(s => s + targetTable.seats)
      ];
      
      // Determine the merged status (use the more "advanced" status)
      const statusPriority = ["Available", "Reserved", "Seated", "Ordering", "Ordered", "1st Course", "2nd Course", "3rd Course", "Dessert", "Served", "Paid"];
      const sourceIndex = statusPriority.indexOf(sourceTable.status);
      const targetIndex = statusPriority.indexOf(targetTable.status);
      const mergedStatus = sourceIndex > targetIndex ? sourceTable.status : targetTable.status;
      
      // Calculate snap position for source table (to the right of target)
      const newSourceX = targetTable.x + SNAP_OFFSET;
      const newSourceY = targetTable.y;
      
      // Generate merge group ID
      const mergeGroupId = `merge-${target}-${source}`;
      
      // Update tables with merge relationship
      setTablePositions(prev => prev.map(t => {
        if (t.id === target) {
          return {
            ...t,
            guests: mergedGuests,
            occupiedSeats: mergedOccupiedSeats.slice(0, t.seats + sourceTable.seats),
            status: mergedStatus,
            time: sourceTable.time || targetTable.time,
            mergedWith: source,
            mergeGroupId,
          };
        }
        if (t.id === source) {
          return { 
            ...t, 
            x: newSourceX,
            y: newSourceY,
            guests: mergedGuests,
            status: mergedStatus,
            time: sourceTable.time || targetTable.time,
            mergedWith: target,
            isMergeSource: true,
            mergeGroupId,
          };
        }
        return t;
      }));
      
      toast.success(`Tables ${source} and ${target} merged successfully`);
    }
    
    setShowMergeDialog(false);
    setPendingMerge(null);
  };
  
  // Cancel merge
  const handleCancelMerge = () => {
    setShowMergeDialog(false);
    setPendingMerge(null);
  };
  
  // Handle unmerge
  const handleUnmerge = (tableId: string) => {
    const table = tablePositions.find(t => t.id === tableId);
    if (!table?.mergedWith) return;
    
    setPendingUnmerge({ table1: tableId, table2: table.mergedWith });
    setShowUnmergeDialog(true);
  };
  
  // Confirm unmerge
  const handleConfirmUnmerge = () => {
    if (!pendingUnmerge) return;
    
    const { table1, table2 } = pendingUnmerge;
    
    setTablePositions(prev => prev.map(t => {
      if (t.id === table1 || t.id === table2) {
        // Find original default data
        const original = defaultTables.find(dt => dt.id === t.id);
        return {
          ...t,
          mergedWith: null,
          isMergeSource: false,
          mergeGroupId: undefined,
          guests: t.isMergeSource ? 0 : Math.min(t.guests, t.seats),
          status: t.isMergeSource ? "Available" : t.status,
          occupiedSeats: t.isMergeSource ? [] : t.occupiedSeats.filter(s => s <= t.seats),
          time: t.isMergeSource ? "" : t.time,
        };
      }
      return t;
    }));
    
    toast.success(`Tables ${table1} and ${table2} unmerged`);
    setShowUnmergeDialog(false);
    setPendingUnmerge(null);
  };

  // Get client coordinates from mouse or touch event
  const getClientCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTableOptionsOpen(null); // Close any open options popup
    
    const coords = getClientCoords(e);
    const table = tablePositions.find(t => t.id === tableId);
    const container = mapContainerRef.current;
    
    if (!table || !container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    setDragOffset({
      x: coords.x - containerRect.left - table.x,
      y: coords.y - containerRect.top - table.y
    });
    setDraggedTableId(tableId);
    setIsDragging(true);
    setHasDragged(false);
  }, [tablePositions]);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !draggedTableId || !mapContainerRef.current) return;
    
    const coords = getClientCoords(e);
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    
    // Calculate new position relative to container
    let newX = coords.x - containerRect.left - dragOffset.x;
    let newY = coords.y - containerRect.top - dragOffset.y;
    
    // Constrain to container bounds (with some padding for table size)
    const padding = 10;
    const maxX = containerRect.width - 150;
    const maxY = containerRect.height - 150;
    
    newX = Math.max(padding, Math.min(newX, maxX));
    newY = Math.max(padding, Math.min(newY, maxY));
    
    setHasDragged(true); // Mark that we've moved
    
    const draggedTable = tablePositions.find(t => t.id === draggedTableId);
    
    // If table is merged, move partner table too
    if (draggedTable?.mergedWith) {
      const partner = tablePositions.find(t => t.id === draggedTable.mergedWith);
      if (partner) {
        const deltaX = newX - draggedTable.x;
        const deltaY = newY - draggedTable.y;
        
        setTablePositions(prev => prev.map(t => {
          if (t.id === draggedTableId) {
            return { ...t, x: newX, y: newY };
          }
          if (t.id === draggedTable.mergedWith) {
            return { 
              ...t, 
              x: Math.max(padding, Math.min(t.x + deltaX, maxX)),
              y: Math.max(padding, Math.min(t.y + deltaY, maxY))
            };
          }
          return t;
        }));
        setMergeTarget(null);
        return;
      }
    }
    
    setTablePositions(prev => prev.map(t => 
      t.id === draggedTableId ? { ...t, x: newX, y: newY } : t
    ));
    
    // Check for merge target (only if not already merged)
    if (!draggedTable?.mergedWith) {
      const overlappingTable = checkTableOverlap(newX, newY, draggedTableId);
      setMergeTarget(overlappingTable);
    }
  }, [isDragging, draggedTableId, dragOffset, checkTableOverlap, tablePositions]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    const draggedTable = tablePositions.find(t => t.id === draggedTableId);
    const targetTable = tablePositions.find(t => t.id === mergeTarget);
    
    // Only show merge dialog if not already merged and merge is valid
    if (mergeTarget && draggedTableId && !draggedTable?.mergedWith && draggedTable && targetTable) {
      const { allowed, reason } = canMerge(draggedTable, targetTable);
      
      if (allowed) {
        // Show merge confirmation dialog
        setPendingMerge({ source: draggedTableId, target: mergeTarget });
        setShowMergeDialog(true);
      } else {
        toast.error(reason);
      }
    }
    
    setIsDragging(false);
    setDraggedTableId(null);
    setMergeTarget(null);
    // Reset hasDragged after a short delay to allow click events to check it
    setTimeout(() => setHasDragged(false), 100);
  }, [mergeTarget, draggedTableId, tablePositions, hasDragged]);

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Reset positions to default
  const handleResetPositions = () => {
    setTablePositions(defaultTables);
    localStorage.removeItem('tablePositions');
    toast.success("Table positions reset to default");
  };

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
    ? tablePositions 
    : tablePositions.filter(t => t.status === activeFilter);

  const handleTableClick = (table: TableType, e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't open options if we just finished dragging
    if (hasDragged) return;
    
    setGuestDropdownTable(null);
    setTableOptionsOpen(tableOptionsOpen === table.id ? null : table.id);
  };
  
  // Handle view order action
  const handleViewOrder = (tableId: string) => {
    setTableOptionsOpen(null);
    navigate(`/tableorder/${tableId}`);
  };
  
  // Handle add guests action (for available tables)
  const handleAddGuests = (tableId: string, guestCount: number) => {
    setTablePositions(prev => prev.map(t => 
      t.id === tableId 
        ? { ...t, guests: guestCount, occupiedSeats: Array.from({ length: guestCount }, (_, i) => i + 1), status: "Seated", time: "Just now" }
        : t
    ));
    setTableOptionsOpen(null);
    toast.success(`${guestCount} guests seated at table ${tableId}`);
  };
  
  // Handle change seats
  const handleChangeSeats = (tableId: string) => {
    const table = tablePositions.find(t => t.id === tableId);
    if (table) {
      setSeatEditTable(tableId);
      setTempSeats(table.seats);
    }
  };
  
  const confirmSeatChange = () => {
    if (seatEditTable && tempSeats >= 2 && tempSeats <= 12) {
      setTablePositions(prev => prev.map(t => 
        t.id === seatEditTable 
          ? { ...t, seats: tempSeats, occupiedSeats: t.occupiedSeats.filter(s => s <= tempSeats) }
          : t
      ));
      toast.success(`Table ${seatEditTable} updated to ${tempSeats} seats`);
      setSeatEditTable(null);
      setTableOptionsOpen(null);
    }
  };
  
  // Close options when clicking outside
  const handleContainerClick = () => {
    setTableOptionsOpen(null);
    setGuestDropdownTable(null);
  };

  const handleGuestSelect = (tableId: string, guestCount: number) => {
    console.log(`Selected ${guestCount} guests for table ${tableId}`);
    setGuestDropdownTable(null);
    setSelectedTable(tableId);
    navigate(`/orders`);
  };
  
  const mergedPairs = getMergedPairs();

  return (
    <div className="flex flex-col h-full bg-black p-3">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4">
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
              onClick={() => setViewMode(viewMode === "grid" ? "list" : viewMode === "list" ? "compact" : "grid")}
              className="flex items-center justify-center rounded-full p-1.5 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              {viewMode === "grid" ? (
                <Grid className="w-4 h-4 text-black" />
              ) : viewMode === "list" ? (
                <List className="w-4 h-4 text-black" />
              ) : (
                <LayoutList className="w-4 h-4 text-black" />
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

        {/* Map View Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-700/50">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Floor Plan</span>
        </div>

        {/* Reset Positions Button */}
        <button
          onClick={handleResetPositions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 text-gray-300 hover:bg-neutral-700 text-xs font-medium transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {/* Filter Tabs */}
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? "bg-white text-black font-medium"
                    : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                }`}
              >
                {filter}
                {filterCounts[filter] !== undefined && (
                  <span className={`text-xs ${activeFilter === filter ? "text-gray-600" : "text-gray-500"}`}>
                    {filterCounts[filter]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Interactive Floor Plan Map */}
      <div 
        ref={mapContainerRef}
        className="flex-1 relative overflow-hidden rounded-xl border-2 bg-neutral-950 border-neutral-800"
        onClick={handleContainerClick}
      >

        {/* Grid background pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(75, 75, 75, 0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} 
        />

        {/* Floor plan labels */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-amber-400 font-medium">Kitchen</span>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
          <span className="text-xs text-blue-400 font-medium">Entry</span>
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
          <span className="text-xs text-purple-400 font-medium">Bar</span>
          <div className="w-2 h-2 rounded-full bg-purple-500" />
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-green-400 font-medium">Patio</span>
        </div>

        {/* Decorative divider lines */}
        <div className="absolute top-[45%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent" />
        <div className="absolute left-[50%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neutral-700/30 to-transparent" />

        {/* Merge connector lines */}
        {mergedPairs.map(({ table1, table2 }) => (
          <MergeConnectorLine
            key={`${table1.id}-${table2.id}`}
            table1={table1}
            table2={table2}
            containerOffset={{ x: 0, y: 0 }}
          />
        ))}

        {/* Tables positioned absolutely on the map */}
        {filteredTables.map((table) => {
          const isMergeTarget = mergeTarget === table.id;
          const isBeingDragged = draggedTableId === table.id;
          const isMerged = !!table.mergedWith;
          const config = statusConfig[table.status] || statusConfig["Available"];
          
          return (
            <Popover 
              key={table.id} 
              open={tableOptionsOpen === table.id} 
              onOpenChange={(open) => {
                if (!open) setTableOptionsOpen(null);
              }}
            >
              <PopoverTrigger asChild>
                <div
                  className={`absolute transition-all select-none cursor-grab active:cursor-grabbing ${
                    isBeingDragged 
                      ? "z-50 scale-105 duration-0" 
                      : isMergeTarget
                        ? "z-40 scale-110 duration-200"
                        : tableOptionsOpen === table.id
                          ? "z-50 duration-200"
                          : "z-30 duration-300"
                  }`}
                  style={{ 
                    left: table.x, 
                    top: table.y,
                    boxShadow: isBeingDragged 
                      ? "0 20px 40px rgba(0,0,0,0.5)" 
                      : isMergeTarget 
                        ? "0 0 30px rgba(34, 211, 238, 0.6)"
                        : undefined,
                  }}
                  onMouseDown={(e) => handleDragStart(e, table.id)}
                  onTouchStart={(e) => handleDragStart(e, table.id)}
                  onClick={(e) => handleTableClick(table, e)}
                >
                  {/* Merge target glow ring */}
                  {isMergeTarget && (
                    <div className="absolute inset-0 -m-3 rounded-full animate-pulse pointer-events-none">
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-400/60" />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-cyan-500 text-white text-xs font-bold whitespace-nowrap">
                        Drop to Merge
                      </div>
                    </div>
                  )}
                  
                  {/* Merged badge */}
                  {isMerged && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-500/90 rounded-full text-[9px] font-bold text-white flex items-center gap-1 z-10 whitespace-nowrap shadow-lg shadow-cyan-500/30">
                      <Link className="w-2.5 h-2.5" />
                      {table.id}+{table.mergedWith}
                    </div>
                  )}
                  
                  {table.shape === "circle" ? (
                    <MapCircularTable
                      table={table}
                      onClick={() => {}}
                      isSelected={selectedTable === table.id || tableOptionsOpen === table.id}
                      onGuestSelect={() => {}}
                      showGuestSelection={false}
                      isMerged={isMerged}
                    />
                  ) : (
                    <MapSquareTable
                      table={table}
                      onClick={() => {}}
                      isSelected={selectedTable === table.id || tableOptionsOpen === table.id}
                      onGuestSelect={() => {}}
                      showGuestSelection={false}
                      isMerged={isMerged}
                    />
                  )}
                </div>
              </PopoverTrigger>
              
              {/* Table Options Popup */}
              <PopoverContent 
                className="w-56 p-0 bg-neutral-900 border-neutral-700 shadow-xl" 
                side="right" 
                align="start"
                sideOffset={10}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">Table {table.id}</h3>
                      <p className="text-sm" style={{ color: config.color }}>
                        {config.label} {table.guests > 0 && `• ${table.guests} guests`}
                      </p>
                    </div>
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: config.bgColor, border: `2px solid ${config.color}` }}
                    >
                      <span className="text-white font-bold text-sm">{table.seats}</span>
                    </div>
                  </div>
                </div>
                
                {/* Options */}
                <div className="py-2">
                  {/* View Order - for non-available tables */}
                  {table.status !== "Available" && (
                    <button
                      onClick={() => handleViewOrder(table.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span>View Order</span>
                    </button>
                  )}
                  
                  {/* Add Guests - for available tables */}
                  {table.status === "Available" && (
                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-400 mb-2">Select Guests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: table.seats }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => handleAddGuests(table.id, i + 1)}
                            className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-neutral-700 rounded-lg hover:bg-green-500 transition-all hover:scale-105"
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Change Seats */}
                  {seatEditTable === table.id ? (
                    <div className="px-4 py-2 border-t border-neutral-800">
                      <p className="text-xs text-gray-400 mb-2">Number of Seats</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTempSeats(Math.max(2, tempSeats - 1))}
                          className="w-8 h-8 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-white font-bold">{tempSeats}</span>
                        <button
                          onClick={() => setTempSeats(Math.min(12, tempSeats + 1))}
                          className="w-8 h-8 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600"
                        >
                          +
                        </button>
                        <button
                          onClick={confirmSeatChange}
                          className="ml-auto px-3 py-1 rounded-lg bg-green-500 text-white text-sm font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleChangeSeats(table.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors border-t border-neutral-800"
                    >
                      <Armchair className="w-4 h-4 text-amber-400" />
                      <span>Change Seats ({table.seats})</span>
                    </button>
                  )}
                  
                  {/* Merge hint */}
                  {!isMerged && (
                    <div className="px-4 py-2.5 border-t border-neutral-800">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Merge className="w-3.5 h-3.5" />
                        <span>Drag to another table to merge</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Unmerge - for merged tables */}
                  {isMerged && !table.isMergeSource && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTableOptionsOpen(null);
                        handleUnmerge(table.id);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 transition-colors border-t border-neutral-800"
                    >
                      <Unlink className="w-4 h-4" />
                      <span>Unmerge Tables</span>
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Status Legend */}
      <div className="mt-3">
        <StatusLegend />
      </div>
      
      {/* Merge Confirmation Dialog - Styled like MergeOrders */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-md overflow-hidden">
          {/* Grabber */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>

          {pendingMerge && (() => {
            const sourceTable = tablePositions.find(t => t.id === pendingMerge.source);
            const targetTable = tablePositions.find(t => t.id === pendingMerge.target);
            
            // Table card component matching MergeOrders style
            const TableMergeCard = ({ table, label }: { table: TableType | undefined; label: string }) => {
              if (!table) return null;
              const config = statusConfig[table.status] || statusConfig["Available"];
              
              return (
                <div className="rounded-xl border border-white/20 overflow-hidden" style={{ backgroundColor: '#1B1C20' }}>
                  <div className="flex items-stretch gap-3 p-3">
                    {/* Table ID Box */}
                    <div className="flex-shrink-0 w-14 h-16 rounded-lg border border-neutral-600 flex flex-col items-center justify-center" style={{ background: '#1A1A1A' }}>
                      <span className="text-lg font-bold text-white">{table.id}</span>
                      <span className="text-[9px] text-gray-500 capitalize">{table.shape}</span>
                    </div>
                    {/* Table Info */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{table.seats} Seats</span>
                        <span className="text-sm font-medium" style={{ color: config.color }}>{table.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">{table.guests} guests</span>
                        {table.time && <span className="text-white/60">{table.time}</span>}
                      </div>
                      <div className="text-xs text-white/40">
                        Combined: {(sourceTable?.seats || 0) + (targetTable?.seats || 0)} seats
                      </div>
                    </div>
                  </div>
                </div>
              );
            };

            const handleSwapMergeDirection = () => {
              setPendingMerge({
                source: pendingMerge.target,
                target: pendingMerge.source
              });
            };

            return (
              <>
                {/* From Table */}
                <div className="px-6 pb-4">
                  <p className="text-white/60 text-sm mb-2">Merge From</p>
                  <TableMergeCard table={sourceTable} label="Source" />
                </div>

                {/* Swap Button */}
                <div className="flex justify-center py-2">
                  <button 
                    onClick={handleSwapMergeDirection}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20 hover:bg-neutral-700 transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* To Table */}
                <div className="px-6 pb-4">
                  <p className="text-white/60 text-sm mb-2">Merge To</p>
                  <TableMergeCard table={targetTable} label="Target" />
                </div>

                {/* After Merge Summary */}
                <div className="px-6 pb-4">
                  <div className="p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/30">
                    <div className="text-xs text-cyan-400 mb-1">After Merge</div>
                    <div className="text-white font-medium">
                      {(sourceTable?.seats || 0) + (targetTable?.seats || 0)} total seats • {(sourceTable?.guests || 0) + (targetTable?.guests || 0)} guests
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={handleCancelMerge}
                    className="px-6 py-2 rounded-full text-white font-medium text-sm bg-neutral-800 hover:bg-neutral-700 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleConfirmMerge}
                    className="flex-1 py-2 rounded-full text-black font-medium text-sm"
                    style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                  >
                    CONFIRM MERGE
                  </button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      
      {/* Unmerge Confirmation Dialog */}
      <AlertDialog open={showUnmergeDialog} onOpenChange={setShowUnmergeDialog}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Unlink className="w-5 h-5 text-red-400" />
              Unmerge Tables
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {pendingUnmerge && (
                <div className="space-y-3 mt-2">
                  <p>
                    Are you sure you want to unmerge <span className="text-white font-semibold">{pendingUnmerge.table1}</span> and <span className="text-white font-semibold">{pendingUnmerge.table2}</span>?
                  </p>
                  <p className="text-xs text-gray-500">
                    The source table will become available and guests will remain on the target table.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowUnmergeDialog(false);
                setPendingUnmerge(null);
              }}
              className="bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmUnmerge}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Unmerge Tables
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TableOrderB;
