import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Grid, List, ChevronDown, LayoutList } from "lucide-react";
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

// Table status configurations - using semantic approach
const statusConfig: Record<string, { colorClass: string; bgClass: string }> = {
  "Available": { colorClass: "text-foreground", bgClass: "bg-muted" },
  "Ordering": { colorClass: "text-warning", bgClass: "bg-card" },
  "Ordered": { colorClass: "text-primary", bgClass: "bg-card" },
  "Reserved": { colorClass: "text-muted-foreground", bgClass: "bg-card" },
  "Seated": { colorClass: "text-muted-foreground", bgClass: "bg-card" },
  "Running Late": { colorClass: "text-destructive", bgClass: "bg-card" },
  "1st Course": { colorClass: "text-purple-400", bgClass: "bg-card" },
  "2nd Course": { colorClass: "text-warning", bgClass: "bg-card" },
  "3rd Course": { colorClass: "text-primary", bgClass: "bg-card" },
  "Dessert": { colorClass: "text-pink-400", bgClass: "bg-card" },
  "Partially Seated": { colorClass: "text-success", bgClass: "bg-card" },
  "Served": { colorClass: "text-info", bgClass: "bg-card" },
  "Paid": { colorClass: "text-emerald-400", bgClass: "bg-card" },
};

// Seat dot colors based on status
const getSeatDotColor = (status: string): string => {
  switch (status) {
    case "Available": return "bg-success";
    case "Ordering": return "bg-destructive";
    case "Ordered": return "bg-primary";
    case "Reserved": return "bg-muted-foreground";
    case "Seated": return "bg-muted-foreground";
    case "Running Late": return "bg-destructive";
    case "1st Course": return "bg-purple-500";
    case "2nd Course": return "bg-warning";
    case "3rd Course": return "bg-primary";
    case "Dessert": return "bg-pink-500";
    case "Partially Seated": return "bg-success";
    case "Served": return "bg-info";
    case "Paid": return "bg-emerald-500";
    default: return "bg-muted-foreground";
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

  return (
    <div className="flex flex-col h-full bg-background p-2 pb-2">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-3">
        {/* Collapsible Controls */}
        {isControlsOpen ? (
          <div className="flex items-center gap-1.5 bg-accent rounded-full pl-1.5 pr-1 py-1">
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
              className="flex items-center justify-center rounded-full p-1.5 hover:opacity-90 transition-opacity bg-primary text-primary-foreground"
            >
              {viewMode === "grid" ? (
                <Grid className="w-4 h-4" />
              ) : viewMode === "list" ? (
                <List className="w-4 h-4" />
              ) : (
                <LayoutList className="w-4 h-4" />
              )}
            </button>

            {/* Users Button */}
            <button className="flex items-center justify-center bg-card rounded-full p-1.5 hover:bg-accent transition-colors">
              <Users className="w-4 h-4 text-foreground" />
            </button>

            {/* Dining Area Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:opacity-90 transition-opacity bg-secondary text-secondary-foreground"
                >
                  <span className="text-xs font-medium">{selectedArea}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border-border">
                {diningAreas.map((area) => (
                  <DropdownMenuItem
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`text-popover-foreground hover:bg-accent cursor-pointer ${
                      selectedArea === area ? "bg-accent" : ""
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
                    ? "bg-primary text-primary-foreground"
                    : "glass text-foreground hover:bg-accent"
                }`}
              >
                <span>{filter}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                  activeFilter === filter ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {filterCounts[filter] || 0}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>

      {/* Tables Grid/List/Compact View */}
      <ScrollArea className="flex-1">
        {viewMode === "compact" ? (
          /* Compact List View */
          <div className="flex flex-col gap-1">
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
                  className={`bg-card rounded-lg px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-accent transition-all border ${
                    selectedTable === table.id 
                      ? "border-primary" 
                      : "border-border"
                  }`}
                >
                  {/* Table Number */}
                  <span className="text-lg font-bold text-foreground w-10">{table.id}</span>
                  
                  {/* Seat Dots */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: table.seats }).map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    ))}
                  </div>
                  
                  {/* Seats Count */}
                  <span className="text-muted-foreground text-xs">{table.seats}S</span>
                  
                  {/* Time */}
                  <span className="text-muted-foreground text-xs flex-1">{table.time || "-"}</span>
                  
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
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-foreground bg-muted rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`px-2 py-0.5 rounded border border-border ${config.bgClass}`}>
                      <span className={`text-xs font-medium ${config.colorClass}`}>
                        {table.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : viewMode === "list" ? (
          /* List View - 2 columns */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  className={`bg-card rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-accent transition-all border-2 ${
                    selectedTable === table.id 
                      ? "border-primary ring-2 ring-primary/30" 
                      : "border-border"
                  }`}
                >
                  {/* Table Number */}
                  <span className="text-2xl font-bold text-foreground">{table.id}</span>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: table.seats }).map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        ))}
                      </div>
                      <span className="text-muted-foreground text-xs">{table.seats} Seats</span>
                      {table.time && <span className="text-muted-foreground text-xs">{table.time}</span>}
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
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-foreground bg-muted rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`px-3 py-1 rounded-md border border-border ${config.bgClass}`}>
                      <span className={`text-xs font-medium ${config.colorClass}`}>
                        {table.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
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
              };

              return (
                <div
                  key={`${table.id}-${index}`}
                  className="relative"
                >
                  <div
                    onClick={handleTableClick}
                    className={`bg-card rounded-xl p-3 flex flex-col items-center cursor-pointer hover:bg-accent transition-all border-2 ${
                      selectedTable === table.id 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-border"
                    }`}
                  >
                    {/* Table Number */}
                    <span className="text-3xl font-bold text-foreground mb-1">{table.id}</span>
                    
                    {/* Seats */}
                    <span className="text-muted-foreground text-sm mb-2">{table.seats} Seats</span>
                    
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
                          <span className="text-muted-foreground text-xs">{table.time}</span>
                        )}
                      </div>
                      
                      {/* Status Label - Shows guest numbers when Available table is clicked */}
                      {guestDropdownTable === table.id && table.status === "Available" ? (
                        <div className="w-full flex justify-center gap-1 py-1 px-2 rounded-md border border-border bg-muted">
                          {Array.from({ length: table.seats }).map((_, i) => (
                            <button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGuestSelect(i + 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center text-xs font-bold text-foreground bg-secondary rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={`w-full text-center py-1 rounded-md border border-border ${config.bgClass}`}>
                          <span className={`text-xs font-medium ${config.colorClass}`}>
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
