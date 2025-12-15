import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Grid, List, ChevronDown } from "lucide-react";
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

// Table status configurations
const statusConfig: Record<string, { color: string; bgColor: string }> = {
  "Available": { color: "text-white", bgColor: "bg-neutral-700" },
  "Ordering": { color: "text-yellow-400", bgColor: "bg-neutral-800" },
  "Ordered": { color: "text-orange-500", bgColor: "bg-neutral-800" },
  "Reserved": { color: "text-gray-400", bgColor: "bg-neutral-800" },
  "Seated": { color: "text-gray-300", bgColor: "bg-neutral-800" },
  "Running Late": { color: "text-red-400", bgColor: "bg-neutral-800" },
  "1st Course": { color: "text-purple-400", bgColor: "bg-neutral-800" },
  "2nd Course": { color: "text-yellow-400", bgColor: "bg-neutral-800" },
  "3rd Course": { color: "text-orange-500", bgColor: "bg-neutral-800" },
  "Dessert": { color: "text-pink-400", bgColor: "bg-neutral-800" },
  "Partially Seated": { color: "text-green-400", bgColor: "bg-neutral-800" },
  "Served": { color: "text-blue-400", bgColor: "bg-neutral-800" },
  "Paid": { color: "text-emerald-400", bgColor: "bg-neutral-800" },
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

// Mock table data
const tables = [
  { id: "T1", seats: 6, status: "Available", time: "" },
  { id: "T2", seats: 5, status: "Ordering", time: "25M" },
  { id: "T3", seats: 4, status: "Ordered", time: "2H 25M" },
  { id: "T4", seats: 3, status: "Reserved", time: "2H 25M" },
  { id: "T5", seats: 4, status: "Seated", time: "25M" },
  { id: "T6", seats: 2, status: "Running Late", time: "45M" },
  { id: "T7", seats: 5, status: "1st Course", time: "12M" },
  { id: "T8", seats: 4, status: "2nd Course", time: "13M" },
  { id: "T9", seats: 3, status: "3rd Course", time: "14M" },
  { id: "T10", seats: 4, status: "Dessert", time: "16M" },
  { id: "T11", seats: 5, status: "Partially Seated", time: "18M" },
  { id: "T12", seats: 5, status: "Served", time: "36M" },
  { id: "T13", seats: 6, status: "Available", time: "" },
  { id: "T14", seats: 5, status: "Ordering", time: "25M" },
  { id: "T15", seats: 4, status: "Ordered", time: "2H 25M" },
  { id: "T16", seats: 3, status: "Reserved", time: "2H 25M" },
  { id: "T17", seats: 4, status: "Seated", time: "25M" },
  { id: "T18", seats: 2, status: "Running Late", time: "45M" },
  { id: "T19", seats: 5, status: "1st Course", time: "12M" },
  { id: "T20", seats: 4, status: "2nd Course", time: "13M" },
  { id: "T21", seats: 3, status: "3rd Course", time: "14M" },
  { id: "T22", seats: 4, status: "Dessert", time: "16M" },
  { id: "T23", seats: 5, status: "Paid", time: "18M" },
  { id: "T24", seats: 5, status: "Served", time: "36M" },
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

const TableOrder = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="flex items-center justify-center rounded-full p-1.5 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              {viewMode === "grid" ? (
                <Grid className="w-4 h-4 text-black" />
              ) : (
                <List className="w-4 h-4 text-black" />
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

      {/* Tables Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filteredTables.map((table, index) => {
            const config = statusConfig[table.status] || statusConfig["Available"];
            const dotColor = getSeatDotColor(table.status);
            
            const handleTableClick = () => {
              if (table.status === "Available") {
                setGuestDropdownTable(guestDropdownTable === table.id ? null : table.id);
              } else {
                // Navigate to table order details for non-available tables
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
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: table.seats }).map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${dotColor}`} />
                    ))}
                  </div>
                  
                  <div className="mt-auto w-full">
                    {/* Time - just above status, right aligned with same padding */}
                    <div className="flex justify-end mb-1 min-h-[1rem] px-1">
                      {table.time && (
                        <span className="text-gray-500 text-xs">{table.time}</span>
                      )}
                    </div>
                    
                    {/* Status Label */}
                    <div className={`w-full text-center py-1 rounded-md border border-neutral-600 ${config.bgColor}`}>
                      <span className={`text-xs font-medium ${config.color}`}>
                        {table.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Guest Count Dropdown for Available tables */}
                {guestDropdownTable === table.id && table.status === "Available" && (
                  <div className="absolute top-0 right-0 translate-x-full ml-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[100px]">
                    <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <span className="text-sm font-semibold text-black">Table #{table.id}</span>
                    </div>
                    {Array.from({ length: table.seats }).map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGuestSelect(i + 1);
                        }}
                        className="w-full px-3 py-2 text-center text-black hover:bg-gray-100 border-b border-gray-100 last:border-b-0 last:rounded-b-lg transition-colors"
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export default TableOrder;