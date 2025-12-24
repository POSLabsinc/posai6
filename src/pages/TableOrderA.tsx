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

// Table shape status configurations - colors based on reference image
const shapeStatusConfig: Record<string, { borderColor: string; bgColor: string; dotColor: string }> = {
  "Available": { borderColor: "border-green-400", bgColor: "bg-transparent", dotColor: "bg-green-500" },
  "Ordering": { borderColor: "border-purple-400", bgColor: "bg-purple-400/20", dotColor: "bg-purple-500" },
  "Ordered": { borderColor: "border-orange-400", bgColor: "bg-orange-400/20", dotColor: "bg-orange-500" },
  "Reserved": { borderColor: "border-gray-400", bgColor: "bg-gray-400/20", dotColor: "bg-gray-500" },
  "Seated": { borderColor: "border-blue-400", bgColor: "bg-blue-400/20", dotColor: "bg-blue-500" },
  "Running Late": { borderColor: "border-red-400", bgColor: "bg-red-400/20", dotColor: "bg-red-500" },
  "1st Course": { borderColor: "border-purple-400", bgColor: "bg-purple-400/30", dotColor: "bg-purple-500" },
  "2nd Course": { borderColor: "border-yellow-400", bgColor: "bg-yellow-400/20", dotColor: "bg-yellow-500" },
  "3rd Course": { borderColor: "border-orange-400", bgColor: "bg-orange-400/30", dotColor: "bg-orange-500" },
  "Dessert": { borderColor: "border-pink-400", bgColor: "bg-pink-400/20", dotColor: "bg-pink-500" },
  "Partially Seated": { borderColor: "border-green-400", bgColor: "bg-green-400/20", dotColor: "bg-green-500" },
  "Served": { borderColor: "border-blue-400", bgColor: "bg-blue-400/30", dotColor: "bg-blue-500" },
  "Paid": { borderColor: "border-emerald-400", bgColor: "bg-emerald-400/20", dotColor: "bg-emerald-500" },
};

// Mock table data with shapes and occupied seats - 8 tables only
const tables = [
  { id: "T1", seats: 8, status: "Available", time: "", shape: "circle" as const, occupiedSeats: [] },
  { id: "T2", seats: 4, status: "Ordering", time: "25M", shape: "square" as const, occupiedSeats: [1, 2] },
  { id: "T3", seats: 4, status: "Ordered", time: "2H 25M", shape: "circle" as const, occupiedSeats: [1, 2, 3] },
  { id: "T4", seats: 4, status: "Reserved", time: "2H 25M", shape: "square" as const, occupiedSeats: [] },
  { id: "T5", seats: 6, status: "Seated", time: "25M", shape: "circle" as const, occupiedSeats: [1, 3, 5] },
  { id: "T6", seats: 2, status: "Running Late", time: "45M", shape: "square" as const, occupiedSeats: [1] },
  { id: "T7", seats: 6, status: "1st Course", time: "12M", shape: "circle" as const, occupiedSeats: [1, 2, 3, 4, 5, 6] },
  { id: "T8", seats: 4, status: "2nd Course", time: "13M", shape: "square" as const, occupiedSeats: [1, 2, 3, 4] },
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

// Get seat position for circular tables
const getCircularSeatPosition = (index: number, totalSeats: number, radius: number) => {
  const angle = (360 / totalSeats) * index - 90; // Start from top
  const radian = (angle * Math.PI) / 180;
  return {
    left: `${50 + Math.cos(radian) * radius}%`,
    top: `${50 + Math.sin(radian) * radius}%`,
  };
};

// Get seat position for square tables
const getSquareSeatPosition = (index: number, totalSeats: number) => {
  // Distribute seats evenly on 4 sides
  const seatsPerSide = Math.ceil(totalSeats / 4);
  const side = Math.floor(index / seatsPerSide);
  const positionOnSide = index % seatsPerSide;
  const offset = (positionOnSide + 1) / (seatsPerSide + 1);

  switch (side) {
    case 0: // Top
      return { left: `${offset * 100}%`, top: "-20%" };
    case 1: // Right
      return { left: "120%", top: `${offset * 100}%` };
    case 2: // Bottom
      return { left: `${(1 - offset) * 100}%`, top: "120%" };
    case 3: // Left
      return { left: "-20%", top: `${(1 - offset) * 100}%` };
    default:
      return { left: "50%", top: "50%" };
  }
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
  const config = shapeStatusConfig[table.status] || shapeStatusConfig["Available"];
  const tableSize = table.seats >= 8 ? 100 : table.seats >= 6 ? 80 : 70;
  const seatRadius = 48;
  const containerSize = 180;

  return (
    <div 
      className="relative flex flex-col items-center justify-center cursor-pointer"
      style={{ width: containerSize, height: containerSize + 30 }}
      onClick={onClick}
    >
      {/* Container for table and seats */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Seats around the table */}
        {Array.from({ length: table.seats }).map((_, i) => {
          const pos = getCircularSeatPosition(i, table.seats, seatRadius);
          const isOccupied = table.occupiedSeats.includes(i + 1);
          
          return (
            <div
              key={i}
              className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                isOccupied 
                  ? "bg-blue-500 text-white" 
                  : "bg-neutral-700 text-gray-400 border border-neutral-600"
              }`}
              style={pos}
            >
              {i + 1}
            </div>
          );
        })}

        {/* Table Circle */}
        <div 
          className={`rounded-full border-2 flex flex-col items-center justify-center transition-all ${config.borderColor} ${config.bgColor} ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          }`}
          style={{ width: tableSize, height: tableSize }}
        >
          {/* Status indicator dot */}
          <div className={`absolute w-3 h-3 rounded-full ${config.dotColor}`} style={{ top: '50%', right: 0, transform: 'translate(50%, -50%)' }} />
          
          {/* Table number */}
          <span className="text-white font-bold text-base">{table.id}</span>
          
          {/* Seats count */}
          <span className="text-gray-400 text-[10px]">{table.seats} seats</span>
        </div>
      </div>

      {/* Timer badge */}
      {table.time && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{table.time}</span>
        </div>
      )}

      {/* Guest selection overlay */}
      {showGuestSelection && (
        <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center z-10">
          <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
            {Array.from({ length: table.seats }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onGuestSelect(i + 1);
                }}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded-full hover:bg-orange-500 transition-colors"
              >
                {i + 1}
              </button>
            ))}
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
  const config = shapeStatusConfig[table.status] || shapeStatusConfig["Available"];
  const tableSize = 70;
  const containerSize = 180;

  // Position seats on edges - simplified for cleaner layout
  const getSeatPositions = (totalSeats: number) => {
    const positions: { left: string; top: string }[] = [];
    const offset = 30; // Distance from table center
    
    if (totalSeats === 2) {
      positions.push({ left: `${50 - offset}%`, top: "50%" }); // Left
      positions.push({ left: `${50 + offset}%`, top: "50%" }); // Right
    } else if (totalSeats === 4) {
      positions.push({ left: "50%", top: `${50 - offset}%` }); // Top
      positions.push({ left: `${50 + offset}%`, top: "50%" }); // Right
      positions.push({ left: "50%", top: `${50 + offset}%` }); // Bottom
      positions.push({ left: `${50 - offset}%`, top: "50%" }); // Left
    } else if (totalSeats === 6) {
      positions.push({ left: "38%", top: `${50 - offset}%` }); // Top left
      positions.push({ left: "62%", top: `${50 - offset}%` }); // Top right
      positions.push({ left: `${50 + offset}%`, top: "50%" }); // Right
      positions.push({ left: "62%", top: `${50 + offset}%` }); // Bottom right
      positions.push({ left: "38%", top: `${50 + offset}%` }); // Bottom left
      positions.push({ left: `${50 - offset}%`, top: "50%" }); // Left
    } else {
      for (let i = 0; i < totalSeats; i++) {
        positions.push(getSquareSeatPosition(i, totalSeats));
      }
    }
    
    return positions;
  };

  const seatPositions = getSeatPositions(table.seats);

  return (
    <div 
      className="relative flex flex-col items-center justify-center cursor-pointer"
      style={{ width: containerSize, height: containerSize + 30 }}
      onClick={onClick}
    >
      {/* Container for table and seats */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Seats around the table */}
        {seatPositions.map((pos, i) => {
          const isOccupied = table.occupiedSeats.includes(i + 1);
          
          return (
            <div
              key={i}
              className={`absolute w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                isOccupied 
                  ? "bg-blue-500 text-white" 
                  : "bg-neutral-700 text-gray-400 border border-neutral-600"
              }`}
              style={pos}
            >
              {i + 1}
            </div>
          );
        })}

        {/* Table Square */}
        <div 
          className={`rounded-lg border-2 flex flex-col items-center justify-center transition-all ${config.borderColor} ${config.bgColor} ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          }`}
          style={{ width: tableSize, height: tableSize }}
        >
          {/* Status indicator dot */}
          <div className={`absolute w-3 h-3 rounded-full ${config.dotColor}`} style={{ top: '50%', right: 55, transform: 'translateY(-50%)' }} />
          
          {/* Table number */}
          <span className="text-white font-bold text-base">{table.id}</span>
          
          {/* Seats count */}
          <span className="text-gray-400 text-[10px]">{table.seats} seats</span>
        </div>
      </div>

      {/* Timer badge */}
      {table.time && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{table.time}</span>
        </div>
      )}

      {/* Guest selection overlay */}
      {showGuestSelection && (
        <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center z-10">
          <div className="flex flex-wrap gap-1 justify-center max-w-[100px]">
            {Array.from({ length: table.seats }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onGuestSelect(i + 1);
                }}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded hover:bg-orange-500 transition-colors"
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
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

      {/* Tables View */}
      <ScrollArea className="flex-1">
        {viewMode === "grid" ? (
          /* Shape Grid View - 4 columns with proper spacing */
          <div className="grid grid-cols-4 gap-6 p-4">
            {filteredTables.map((table) => (
              table.shape === "circle" ? (
                <CircularTable
                  key={table.id}
                  table={table}
                  onClick={() => handleTableClick(table)}
                  isSelected={selectedTable === table.id}
                  onGuestSelect={(count) => handleGuestSelect(table.id, count)}
                  showGuestSelection={guestDropdownTable === table.id && table.status === "Available"}
                />
              ) : (
                <SquareTable
                  key={table.id}
                  table={table}
                  onClick={() => handleTableClick(table)}
                  isSelected={selectedTable === table.id}
                  onGuestSelect={(count) => handleGuestSelect(table.id, count)}
                  showGuestSelection={guestDropdownTable === table.id && table.status === "Available"}
                />
              )
            ))}
          </div>
        ) : viewMode === "list" ? (
          /* List View - 2 columns */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredTables.map((table) => {
              const config = shapeStatusConfig[table.status] || shapeStatusConfig["Available"];
              
              return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`bg-neutral-900 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-800 transition-all border-2 ${
                    selectedTable === table.id 
                      ? "border-orange-500 ring-2 ring-orange-500/30" 
                      : "border-neutral-800"
                  }`}
                >
                  {/* Table Shape Icon */}
                  <div className={`w-10 h-10 ${table.shape === "circle" ? "rounded-full" : "rounded-lg"} border-2 ${config.borderColor} ${config.bgColor} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">{table.id}</span>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: table.seats }).map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                            table.occupiedSeats.includes(i + 1) ? "bg-blue-500" : "bg-neutral-600"
                          }`} />
                        ))}
                      </div>
                      <span className="text-gray-400 text-xs">{table.seats} Seats</span>
                      {table.time && <span className="text-gray-500 text-xs">{table.time}</span>}
                    </div>
                  </div>
                  
                  {/* Status */}
                  {guestDropdownTable === table.id && table.status === "Available" ? (
                    <div className="flex gap-1 px-2">
                      {Array.from({ length: table.seats }).map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGuestSelect(table.id, i + 1);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded hover:bg-orange-500 transition-colors"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`px-3 py-1 rounded-md border ${config.borderColor} ${config.bgColor}`}>
                      <span className="text-xs font-medium text-white">
                        {table.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Compact List View */
          <div className="flex flex-col gap-1">
            {filteredTables.map((table) => {
              const config = shapeStatusConfig[table.status] || shapeStatusConfig["Available"];
              
              return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`bg-neutral-900 rounded-lg px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-neutral-800 transition-all border ${
                    selectedTable === table.id 
                      ? "border-orange-500" 
                      : "border-neutral-800"
                  }`}
                >
                  {/* Table Number */}
                  <span className="text-lg font-bold text-white w-10">{table.id}</span>
                  
                  {/* Shape indicator */}
                  <div className={`w-4 h-4 ${table.shape === "circle" ? "rounded-full" : "rounded"} border ${config.borderColor} ${config.bgColor}`} />
                  
                  {/* Seat Dots */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: table.seats }).map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                        table.occupiedSeats.includes(i + 1) ? "bg-blue-500" : "bg-neutral-600"
                      }`} />
                    ))}
                  </div>
                  
                  {/* Seats Count */}
                  <span className="text-gray-400 text-xs">{table.seats}S</span>
                  
                  {/* Time */}
                  <span className="text-gray-500 text-xs flex-1">{table.time || "-"}</span>
                  
                  {/* Status */}
                  {guestDropdownTable === table.id && table.status === "Available" ? (
                    <div className="flex gap-1 px-2">
                      {Array.from({ length: table.seats }).map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGuestSelect(table.id, i + 1);
                          }}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded hover:bg-orange-500 transition-colors"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`px-2 py-0.5 rounded border ${config.borderColor} ${config.bgColor}`}>
                      <span className="text-xs font-medium text-white">
                        {table.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default TableOrderA;
