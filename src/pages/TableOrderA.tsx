import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Grid, List, ChevronDown, LayoutList, Clock } from "lucide-react";
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

// Mock table data - 8 tables with guests count
const tables = [
  { id: "T1", seats: 8, status: "Available", time: "", shape: "circle" as const, occupiedSeats: [], guests: 0 },
  { id: "T2", seats: 4, status: "Ordering", time: "25m", shape: "square" as const, occupiedSeats: [1, 2], guests: 2 },
  { id: "T3", seats: 4, status: "Ordered", time: "1h 15m", shape: "circle" as const, occupiedSeats: [1, 2, 3], guests: 3 },
  { id: "T4", seats: 4, status: "Reserved", time: "7:30 PM", shape: "square" as const, occupiedSeats: [], guests: 0 },
  { id: "T5", seats: 6, status: "Seated", time: "10m", shape: "circle" as const, occupiedSeats: [1, 3, 5], guests: 3 },
  { id: "T6", seats: 2, status: "Running Late", time: "15m", shape: "square" as const, occupiedSeats: [], guests: 0 },
  { id: "T7", seats: 6, status: "1st Course", time: "35m", shape: "circle" as const, occupiedSeats: [1, 2, 3, 4, 5, 6], guests: 6 },
  { id: "T8", seats: 4, status: "2nd Course", time: "50m", shape: "square" as const, occupiedSeats: [1, 2, 3, 4], guests: 4 },
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
            : "bg-muted border border-border"
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
            : "bg-muted border border-border"
        }`}
      />
    </div>
  );
};

// Circular Table Component
const CircularTable = ({ 
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

  // Calculate chair angles
  const chairAngles = Array.from({ length: table.seats }, (_, i) => 
    (360 / table.seats) * i - 90
  );

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ width: containerSize, height: containerSize + 40 }}
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
          className={`rounded-full flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105 ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-background" : ""
          }`}
          style={{ 
            width: tableRadius * 2, 
            height: tableRadius * 2,
            backgroundColor: config.bgColor,
            border: `2px solid ${config.color}`,
            boxShadow: `0 4px 20px ${config.color}20`
          }}
        >
          {/* Table ID */}
          <span className="text-foreground font-bold text-lg leading-none">{table.id}</span>
          
          {/* Status label */}
          <span 
            className="text-[10px] font-medium mt-0.5"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          
          {/* Occupancy indicator */}
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: table.seats }).map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < table.guests ? "bg-blue-400" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Timer / Info badge */}
      {table.time && (
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1"
          style={{ 
            backgroundColor: 'rgba(38, 38, 38, 0.9)',
            border: `1px solid ${config.color}40`
          }}
        >
          <Clock className="w-3 h-3" style={{ color: config.color }} />
          <span className="text-muted-foreground">{table.time}</span>
        </div>
      )}

      {/* Guest selection overlay */}
      {showGuestSelection && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10 rounded-full"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-2">Select guests</span>
            <div className="flex flex-wrap gap-2 justify-center max-w-[140px]">
              {Array.from({ length: table.seats }).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuestSelect(i + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold text-foreground bg-muted rounded-full hover:bg-green-500 transition-all hover:scale-110"
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

// Square Table Component
const SquareTable = ({ 
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
      style={{ width: containerSize, height: containerSize + 40 }}
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
          className={`rounded-xl flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105 ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-background" : ""
          }`}
          style={{ 
            width: tableSize, 
            height: tableSize,
            backgroundColor: config.bgColor,
            border: `2px solid ${config.color}`,
            boxShadow: `0 4px 20px ${config.color}20`
          }}
        >
          {/* Table ID */}
          <span className="text-foreground font-bold text-lg leading-none">{table.id}</span>
          
          {/* Status label */}
          <span 
            className="text-[10px] font-medium mt-0.5"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          
          {/* Occupancy indicator */}
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: table.seats }).map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < table.guests ? "bg-blue-400" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Timer / Info badge */}
      {table.time && (
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1"
          style={{ 
            backgroundColor: 'rgba(38, 38, 38, 0.9)',
            border: `1px solid ${config.color}40`
          }}
        >
          <Clock className="w-3 h-3" style={{ color: config.color }} />
          <span className="text-muted-foreground">{table.time}</span>
        </div>
      )}

      {/* Guest selection overlay */}
      {showGuestSelection && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10 rounded-xl"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-2">Select guests</span>
            <div className="flex flex-wrap gap-2 justify-center max-w-[120px]">
              {Array.from({ length: table.seats }).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuestSelect(i + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold text-foreground bg-muted rounded hover:bg-green-500 transition-all hover:scale-110"
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
    <div className="flex items-center justify-center gap-4 py-3 px-4 bg-surface-inset rounded-lg border border-border">
      {legendItems.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">{item.status}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-border">
        <div className="w-3 h-2 rounded-t-sm bg-blue-500" />
        <span className="text-xs text-muted-foreground">Occupied</span>
      </div>
    </div>
  );
};

const TableOrderA = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
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

  const handleTableClick = (table: typeof tables[0]) => {
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
    <div className="flex flex-col h-full bg-background p-3">
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
            <button className="flex items-center justify-center bg-surface-elevated rounded-full p-1.5 hover:bg-muted transition-colors">
              <Users className="w-4 h-4 text-foreground" />
            </button>

            {/* Dining Area Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(180deg, #B8B8B8 0%, #616161 100%)" }}
                >
                  <span className="text-foreground text-xs font-medium">{selectedArea}</span>
                  <ChevronDown className="w-3 h-3 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-surface-elevated border-border">
                {diningAreas.map((area) => (
                  <DropdownMenuItem
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`text-foreground hover:bg-muted cursor-pointer ${
                      selectedArea === area ? "bg-muted" : ""
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
                    ? "bg-foreground text-background font-medium"
                    : "bg-surface-elevated text-muted-foreground hover:bg-muted"
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

      {/* Tables Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-4 gap-6 p-4 justify-items-center">
          {filteredTables.map((table) => (
            table.shape === "circle" ? (
              <CircularTable
                key={table.id}
                table={table}
                onClick={() => handleTableClick(table)}
                isSelected={selectedTable === table.id}
                onGuestSelect={(count) => handleGuestSelect(table.id, count)}
                showGuestSelection={guestDropdownTable === table.id}
              />
            ) : (
              <SquareTable
                key={table.id}
                table={table}
                onClick={() => handleTableClick(table)}
                isSelected={selectedTable === table.id}
                onGuestSelect={(count) => handleGuestSelect(table.id, count)}
                showGuestSelection={guestDropdownTable === table.id}
              />
            )
          ))}
        </div>
      </ScrollArea>

      {/* Status Legend */}
      <div className="mt-auto pt-3">
        <StatusLegend />
      </div>
    </div>
  );
};

export default TableOrderA;
