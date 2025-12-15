import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";

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
  "Dessert": { color: "text-orange-500", bgColor: "bg-neutral-800" },
  "Partially Seated": { color: "text-green-400", bgColor: "bg-neutral-800" },
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
    case "Dessert": return "bg-orange-500";
    case "Partially Seated": return "bg-green-500";
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
  { id: "T12", seats: 5, status: "Partially Seated", time: "36M" },
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
  { id: "T23", seats: 5, status: "Partially Seated", time: "18M" },
  { id: "T24", seats: 5, status: "Partially Seated", time: "36M" },
];

// Filter categories with counts
const getFilterCounts = () => {
  const counts: Record<string, number> = { "All": tables.length };
  tables.forEach(table => {
    counts[table.status] = (counts[table.status] || 0) + 1;
  });
  return counts;
};

const TableOrder = () => {
  const [activeFilter, setActiveFilter] = useState("All");
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
        {/* Room Selector */}
        <div className="flex items-center gap-2 bg-neutral-800 rounded-full px-4 py-2">
          <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
            <div className="bg-white rounded-[1px]" />
            <div className="bg-white rounded-[1px]" />
            <div className="bg-white rounded-[1px]" />
            <div className="bg-white rounded-[1px]" />
          </div>
          <Users className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Main Dining Room</span>
        </div>

        {/* Filter Tabs */}
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? "bg-neutral-700 text-white"
                    : "bg-transparent text-gray-400 hover:text-white"
                }`}
              >
                <span>{filter}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  activeFilter === filter ? "bg-neutral-600" : "bg-neutral-800"
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
            
            return (
              <div
                key={`${table.id}-${index}`}
                className="bg-neutral-900 rounded-xl p-3 flex flex-col items-center cursor-pointer hover:bg-neutral-800 transition-colors border border-neutral-800"
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
            );
          })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export default TableOrder;
