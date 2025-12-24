import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Grid, List, ChevronDown, LayoutList, Clock, MapPin, Move, RotateCcw } from "lucide-react";
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

// Default table data with x, y positions for map view
const defaultTables = [
  { id: "T1", seats: 8, status: "Available", time: "", shape: "circle" as const, occupiedSeats: [] as number[], guests: 0, x: 80, y: 60 },
  { id: "T2", seats: 4, status: "Ordering", time: "25m", shape: "square" as const, occupiedSeats: [1, 2], guests: 2, x: 320, y: 80 },
  { id: "T3", seats: 4, status: "Ordered", time: "1h 15m", shape: "circle" as const, occupiedSeats: [1, 2, 3], guests: 3, x: 520, y: 50 },
  { id: "T4", seats: 4, status: "Reserved", time: "7:30 PM", shape: "square" as const, occupiedSeats: [] as number[], guests: 0, x: 720, y: 90 },
  { id: "T5", seats: 6, status: "Seated", time: "10m", shape: "circle" as const, occupiedSeats: [1, 3, 5], guests: 3, x: 120, y: 320 },
  { id: "T6", seats: 2, status: "Running Late", time: "15m", shape: "square" as const, occupiedSeats: [] as number[], guests: 0, x: 340, y: 300 },
  { id: "T7", seats: 6, status: "1st Course", time: "35m", shape: "circle" as const, occupiedSeats: [1, 2, 3, 4, 5, 6], guests: 6, x: 540, y: 340 },
  { id: "T8", seats: 4, status: "2nd Course", time: "50m", shape: "square" as const, occupiedSeats: [1, 2, 3, 4], guests: 4, x: 750, y: 320 },
];

type TableType = typeof defaultTables[0];

// Load saved positions from localStorage or use defaults
const loadSavedPositions = (): TableType[] => {
  try {
    const saved = localStorage.getItem('tablePositions');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge saved positions with default table data (in case new tables were added)
      return defaultTables.map(table => {
        const savedTable = parsed.find((t: TableType) => t.id === table.id);
        return savedTable ? { ...table, x: savedTable.x, y: savedTable.y } : table;
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
  showGuestSelection 
}: { 
  table: TableType;
  onClick: () => void;
  isSelected: boolean;
  onGuestSelect: (count: number) => void;
  showGuestSelection: boolean;
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
          }`}
          style={{ 
            width: tableRadius * 2, 
            height: tableRadius * 2,
            backgroundColor: config.bgColor,
            border: `2px solid ${config.color}`,
            boxShadow: `0 4px 20px ${config.color}40`
          }}
        >
          {/* Table ID */}
          <span className="text-white font-bold text-sm leading-none">{table.id}</span>
          
          {/* Status label */}
          <span 
            className="text-[9px] font-medium mt-0.5"
            style={{ color: config.color }}
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
  showGuestSelection 
}: { 
  table: TableType;
  onClick: () => void;
  isSelected: boolean;
  onGuestSelect: (count: number) => void;
  showGuestSelection: boolean;
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
          }`}
          style={{ 
            width: tableSize, 
            height: tableSize,
            backgroundColor: config.bgColor,
            border: `2px solid ${config.color}`,
            boxShadow: `0 4px 20px ${config.color}40`
          }}
        >
          {/* Table ID */}
          <span className="text-white font-bold text-sm leading-none">{table.id}</span>
          
          {/* Status label */}
          <span 
            className="text-[9px] font-medium mt-0.5"
            style={{ color: config.color }}
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
    </div>
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const filterCounts = getFilterCounts(tablePositions);

  // Save positions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('tablePositions', JSON.stringify(tablePositions));
  }, [tablePositions]);

  // Get client coordinates from mouse or touch event
  const getClientCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, tableId: string) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
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
  }, [isEditMode, tablePositions]);

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
    
    setTablePositions(prev => prev.map(t => 
      t.id === draggedTableId ? { ...t, x: newX, y: newY } : t
    ));
  }, [isDragging, draggedTableId, dragOffset]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedTableId(null);
  }, []);

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

  const handleTableClick = (table: TableType) => {
    // Don't handle clicks while dragging or in edit mode
    if (isDragging || isEditMode) return;
    
    if (table.status === "Available") {
      setGuestDropdownTable(guestDropdownTable === table.id ? null : table.id);
    } else {
      navigate(`/tableorder/${table.id}`);
    }
  };

  const handleGuestSelect = (tableId: string, guestCount: number) => {
    console.log(`Selected ${guestCount} guests for table ${tableId}`);
    setGuestDropdownTable(null);
    setSelectedTable(tableId);
    navigate(`/orders`);
  };

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

        {/* Edit Mode Toggle */}
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isEditMode 
              ? "bg-orange-500 text-white" 
              : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>{isEditMode ? "Done" : "Edit Layout"}</span>
        </button>

        {/* Reset Button (only show in edit mode) */}
        {isEditMode && (
          <button
            onClick={handleResetPositions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 text-gray-300 hover:bg-neutral-700 text-xs font-medium transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
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
        className={`flex-1 relative overflow-hidden rounded-xl border-2 bg-neutral-950 transition-colors ${
          isEditMode ? "border-orange-500/50" : "border-neutral-800"
        }`}
      >
        {/* Edit mode hint */}
        {isEditMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
            <div className="text-center">
              <Move className="w-12 h-12 text-neutral-700 mx-auto mb-2" />
              <p className="text-neutral-600 text-sm">Drag tables to reposition</p>
            </div>
          </div>
        )}

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

        {/* Tables positioned absolutely on the map */}
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`absolute transition-all select-none ${
              draggedTableId === table.id 
                ? "z-50 scale-105 duration-0" 
                : "duration-300"
            } ${isEditMode ? "cursor-grab active:cursor-grabbing" : ""}`}
            style={{ 
              left: table.x, 
              top: table.y,
              boxShadow: draggedTableId === table.id ? "0 20px 40px rgba(0,0,0,0.5)" : undefined,
            }}
            onMouseDown={(e) => handleDragStart(e, table.id)}
            onTouchStart={(e) => handleDragStart(e, table.id)}
          >
            {table.shape === "circle" ? (
              <MapCircularTable
                table={table}
                onClick={() => handleTableClick(table)}
                isSelected={selectedTable === table.id}
                onGuestSelect={(count) => handleGuestSelect(table.id, count)}
                showGuestSelection={guestDropdownTable === table.id && !isEditMode}
              />
            ) : (
              <MapSquareTable
                table={table}
                onClick={() => handleTableClick(table)}
                isSelected={selectedTable === table.id}
                onGuestSelect={(count) => handleGuestSelect(table.id, count)}
                showGuestSelection={guestDropdownTable === table.id && !isEditMode}
              />
            )}
          </div>
        ))}
      </div>

      {/* Status Legend */}
      <div className="mt-3">
        <StatusLegend />
      </div>
    </div>
  );
};

export default TableOrderB;
