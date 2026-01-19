import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Grid, List, ChevronDown, Circle, Clock, MapPin, RotateCcw, Merge, Link, Unlink, ArrowUpDown, Eye, UserPlus, Armchair, X, Settings, Plus, Trash2, GripVertical, Pencil, FolderOpen, Save, Check, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSeparator,
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
import OrderLayoutTemplate from "@/components/OrderLayoutTemplate";

// Import icons
import burgerOpenIcon from "@/assets/icons/burger-open.png";
import burgerCloseIcon from "@/assets/icons/burger-close.png";
import chairIcon from "@/assets/icons/chair-icon.png";

// Mock orders for each table (for the merge flow display)
const tableOrdersMap: Record<string, { id: string; name: string; table: string; amount: string; partySize: number; time: string; status: string; timer: string; server: string; check: string; revenueCenter: string; paymentType: string; phone?: string }> = {
  "T1": { id: "1", name: "Amanda White", table: "T1", amount: "$156.00", partySize: 5, time: "7:00 PM", status: "UNPAID", timer: "1:30 Hrs", server: "Dustin H", check: "123491", revenueCenter: "Private Room", paymentType: "--", phone: "(415) 555-6789" },
  "T2": { id: "2", name: "Sarah Kim", table: "T2", amount: "$72.00", partySize: 3, time: "7:30 PM", status: "ORDERING", timer: "00:25", server: "Mia Jones", check: "--", revenueCenter: "FF Balcony", paymentType: "--", phone: "(415) 555-1234" },
  "T3": { id: "3", name: "Emily Wilson", table: "T3", amount: "$54.00", partySize: 2, time: "8:15 PM", status: "ORDERING", timer: "00:20", server: "Alex M", check: "--", revenueCenter: "Patio", paymentType: "--", phone: "(415) 555-2345" },
  "T4": { id: "4", name: "Reserved Guest", table: "T4", amount: "$0.00", partySize: 4, time: "7:30 PM", status: "RESERVED", timer: "--", server: "--", check: "--", revenueCenter: "Main", paymentType: "--", phone: "" },
  "T5": { id: "5", name: "Williams", table: "T5", amount: "$120.75", partySize: 4, time: "7:30 PM", status: "ORDERED", timer: "2:10 Hrs", server: "Dustin H", check: "1236", revenueCenter: "Patio", paymentType: "--", phone: "" },
  "T6": { id: "6", name: "Brown", table: "T6", amount: "$65.50", partySize: 2, time: "7:15 PM", status: "PREPARING", timer: "2:30 Hrs", server: "Mia J", check: "1237", revenueCenter: "Main", paymentType: "Card", phone: "" },
  "T7": { id: "7", name: "James Brown", table: "T7", amount: "$62.00", partySize: 4, time: "7:45 PM", status: "1ST COURSE", timer: "0:35 Hrs", server: "Dustin H", check: "123489", revenueCenter: "Online", paymentType: "--", phone: "(415) 555-3456" },
  "T8": { id: "8", name: "Lisa Garcia", table: "T8", amount: "$54.00", partySize: 3, time: "7:50 PM", status: "2ND COURSE", timer: "0:50 Hrs", server: "Mia Jones", check: "123490", revenueCenter: "Main Dining", paymentType: "--", phone: "(415) 555-4567" },
};

// Helper to get order for a table
const getTableOrder = (tableId: string) => tableOrdersMap[tableId] || null;

// Helper to convert table order to OrderLayoutTemplate format
const toOrderTemplateData = (order: typeof tableOrdersMap[string]) => ({
  id: Number(order.id),
  name: order.name,
  table: order.table,
  amount: order.amount,
  partySize: order.partySize,
  time: order.time,
  status: order.status,
  timer: order.timer || "00:00",
  server: order.server,
  check: order.check || "--",
  revenueCenter: order.revenueCenter,
  paymentType: order.paymentType || "--",
  phone: order.phone,
});

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

// Default table data with x, y positions for map view
const defaultTables: TableType[] = [
  { id: "T1", seats: 12, status: "Available", time: "", shape: "circle", occupiedSeats: [], guests: 0, x: 80, y: 60 },
  { id: "T2", seats: 5, status: "Ordering", time: "25M", shape: "square", occupiedSeats: [1, 2], guests: 2, x: 280, y: 80 },
  { id: "T3", seats: 4, status: "Ordered", time: "2H 25M", shape: "circle", occupiedSeats: [1, 2, 3], guests: 3, x: 480, y: 50 },
  { id: "T4", seats: 3, status: "Reserved", time: "2H 25M", shape: "square", occupiedSeats: [], guests: 0, x: 680, y: 90 },
  { id: "T5", seats: 4, status: "Seated", time: "25M", shape: "circle", occupiedSeats: [1, 3], guests: 2, x: 120, y: 220 },
  { id: "T6", seats: 2, status: "Running Late", time: "45M", shape: "square", occupiedSeats: [], guests: 0, x: 320, y: 200 },
  { id: "T7", seats: 5, status: "1st Course", time: "12M", shape: "circle", occupiedSeats: [1, 2, 3, 4, 5], guests: 5, x: 520, y: 240 },
  { id: "T8", seats: 4, status: "2nd Course", time: "13M", shape: "square", occupiedSeats: [1, 2, 3, 4], guests: 4, x: 720, y: 220 },
  { id: "T9", seats: 3, status: "3rd Course", time: "14M", shape: "circle", occupiedSeats: [1, 2, 3], guests: 3, x: 80, y: 380 },
  { id: "T10", seats: 4, status: "Dessert", time: "16M", shape: "square", occupiedSeats: [1, 2], guests: 2, x: 280, y: 360 },
  { id: "T11", seats: 5, status: "Partially Seated", time: "18M", shape: "circle", occupiedSeats: [1, 3, 5], guests: 3, x: 480, y: 400 },
  { id: "T12", seats: 5, status: "Served", time: "36M", shape: "square", occupiedSeats: [1, 2, 3, 4, 5], guests: 5, x: 680, y: 380 },
  { id: "T13", seats: 6, status: "Available", time: "", shape: "circle", occupiedSeats: [], guests: 0, x: 120, y: 540 },
  { id: "T14", seats: 5, status: "Ordering", time: "25M", shape: "square", occupiedSeats: [1, 2, 3], guests: 3, x: 320, y: 520 },
  { id: "T15", seats: 4, status: "Ordered", time: "2H 25M", shape: "circle", occupiedSeats: [1, 2, 3, 4], guests: 4, x: 520, y: 560 },
  { id: "T16", seats: 3, status: "Reserved", time: "2H 25M", shape: "square", occupiedSeats: [], guests: 0, x: 720, y: 540 },
  { id: "T17", seats: 4, status: "Seated", time: "25M", shape: "circle", occupiedSeats: [1, 2], guests: 2, x: 880, y: 60 },
  { id: "T18", seats: 2, status: "Running Late", time: "45M", shape: "square", occupiedSeats: [], guests: 0, x: 880, y: 220 },
  { id: "T19", seats: 5, status: "1st Course", time: "12M", shape: "circle", occupiedSeats: [1, 2, 3], guests: 3, x: 880, y: 380 },
  { id: "T20", seats: 4, status: "2nd Course", time: "13M", shape: "square", occupiedSeats: [1, 2, 3, 4], guests: 4, x: 880, y: 540 },
  { id: "T21", seats: 3, status: "3rd Course", time: "14M", shape: "circle", occupiedSeats: [1, 2], guests: 2, x: 1040, y: 140 },
  { id: "T22", seats: 4, status: "Dessert", time: "16M", shape: "square", occupiedSeats: [1, 2, 3], guests: 3, x: 1040, y: 300 },
  { id: "T23", seats: 5, status: "Paid", time: "18M", shape: "circle", occupiedSeats: [1, 2, 3, 4], guests: 4, x: 1040, y: 460 },
  { id: "T24", seats: 5, status: "Served", time: "36M", shape: "square", occupiedSeats: [1, 2, 3, 4, 5], guests: 5, x: 1040, y: 620 },
];

// Merge validation - check if two tables can be merged based on their status
const canMerge = (table1: TableType, table2: TableType): { allowed: boolean; reason: string } => {
  const activeOrderStatuses = ["Ordering", "Ordered", "Unpaid", "1st Course", "2nd Course", "3rd Course", "Dessert", "Served", "Seated"];
  const completedStatuses = ["Paid", "Completed"];
  
  const status1 = table1.status;
  const status2 = table2.status;
  
  if (status1 === "Available" && status2 === "Available") {
    return { allowed: true, reason: "" };
  }
  
  if (activeOrderStatuses.includes(status1) && activeOrderStatuses.includes(status2)) {
    return { allowed: true, reason: "" };
  }
  
  if (completedStatuses.includes(status1) || completedStatuses.includes(status2)) {
    return { allowed: false, reason: "Cannot merge with paid or completed tables" };
  }
  
  if ((status1 === "Available" && activeOrderStatuses.includes(status2)) ||
      (status2 === "Available" && activeOrderStatuses.includes(status1))) {
    return { allowed: false, reason: "Cannot merge available table with table that has an active order" };
  }
  
  if (status1 === "Reserved" || status2 === "Reserved") {
    return { allowed: false, reason: "Cannot merge reserved tables" };
  }
  
  return { allowed: false, reason: "These tables cannot be merged" };
};

// Load saved positions from localStorage or use defaults
const loadSavedPositions = (): TableType[] => {
  try {
    const saved = localStorage.getItem('floorplan-tablePositions');
    if (saved) {
      const parsed = JSON.parse(saved);
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

// Floor area type for customizable areas
type FloorArea = {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  x: number;
  y: number;
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};

// Divider type
type DividerType = {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
};

// Default floor areas
const defaultFloorAreas: FloorArea[] = [
  { id: 'kitchen', name: 'Kitchen', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', x: 4, y: 4, anchor: 'top-left' },
  { id: 'bar', name: 'Bar', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', x: 96, y: 4, anchor: 'top-right' },
  { id: 'patio', name: 'Patio', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', x: 4, y: 96, anchor: 'bottom-left' },
  { id: 'entry', name: 'Entry', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', x: 96, y: 96, anchor: 'bottom-right' },
];

// Default dividers
const defaultDividers: DividerType[] = [
  { id: 'div-h-1', orientation: 'horizontal', position: 45 },
  { id: 'div-v-1', orientation: 'vertical', position: 50 },
];

// Area color presets
const areaColorPresets = [
  { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', name: 'Amber' },
  { color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', name: 'Purple' },
  { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', name: 'Green' },
  { color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', name: 'Blue' },
  { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', name: 'Red' },
  { color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', name: 'Pink' },
  { color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.15)', name: 'Teal' },
  { color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', name: 'Orange' },
];

// Load saved floor areas from localStorage
const loadSavedFloorAreas = (): FloorArea[] => {
  try {
    const saved = localStorage.getItem('floorplan-areas');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading floor areas:', e);
  }
  return defaultFloorAreas;
};

// Load saved dividers from localStorage
const loadSavedDividers = (): DividerType[] => {
  try {
    const saved = localStorage.getItem('floorplan-dividers');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading dividers:', e);
  }
  return defaultDividers;
};

// Floor Plan Template type for saving/loading layouts
type FloorPlanTemplate = {
  id: string;
  name: string;
  createdAt: string;
  tables: TableType[];
  floorAreas: FloorArea[];
  dividers: DividerType[];
};

// Load saved templates from localStorage
const loadSavedTemplates = (): FloorPlanTemplate[] => {
  try {
    const saved = localStorage.getItem('floorplan-templates');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading templates:', e);
  }
  return [];
};

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
  table: TableType; 
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
  table: TableType; 
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

  const chairAngles = Array.from({ length: table.seats }, (_, i) => 
    (360 / table.seats) * i - 90
  );

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ width: containerSize, height: containerSize }}
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
          className={`rounded-full flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110 ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          } ${isMerged ? "ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20" : ""}`}
          style={{ 
            width: tableRadius * 2, 
            height: tableRadius * 2,
            backgroundColor: config.hexBgColor,
            border: `2px solid ${isMerged ? "#22d3ee" : config.hexColor}`,
            boxShadow: isMerged 
              ? `0 4px 20px rgba(34, 211, 238, 0.4)` 
              : `0 4px 20px ${config.hexColor}40`
          }}
        >
          <span className="text-white font-bold text-sm leading-none">{table.id}</span>
          <span 
            className="text-[9px] font-medium mt-0.5"
            style={{ color: isMerged ? "#22d3ee" : config.hexColor }}
          >
            {config.label}
          </span>
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

        {table.time && (
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ 
              backgroundColor: 'rgba(23, 23, 23, 0.95)',
              border: `1px solid ${config.hexColor}50`
            }}
          >
            <Clock className="w-2.5 h-2.5" style={{ color: config.hexColor }} />
            <span className="text-gray-300">{table.time}</span>
          </div>
        )}
      </div>

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
          className={`rounded-lg flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110 ${
            isSelected ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black" : ""
          } ${isMerged ? "ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20" : ""}`}
          style={{ 
            width: tableSize, 
            height: tableSize,
            backgroundColor: config.hexBgColor,
            border: `2px solid ${isMerged ? "#22d3ee" : config.hexColor}`,
            boxShadow: isMerged 
              ? `0 4px 20px rgba(34, 211, 238, 0.4)` 
              : `0 4px 20px ${config.hexColor}40`
          }}
        >
          <span className="text-white font-bold text-sm leading-none">{table.id}</span>
          <span 
            className="text-[9px] font-medium mt-0.5"
            style={{ color: isMerged ? "#22d3ee" : config.hexColor }}
          >
            {config.label}
          </span>
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

        {table.time && (
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ 
              backgroundColor: 'rgba(23, 23, 23, 0.95)',
              border: `1px solid ${config.hexColor}50`
            }}
          >
            <Clock className="w-2.5 h-2.5" style={{ color: config.hexColor }} />
            <span className="text-gray-300">{table.time}</span>
          </div>
        )}
      </div>

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
const StatusLegend = ({ showMerged = false }: { showMerged?: boolean }) => {
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
      {showMerged && (
        <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-neutral-700">
          <Link className="w-3 h-3 text-cyan-400" />
          <span className="text-xs text-gray-400">Merged</span>
        </div>
      )}
    </div>
  );
};

// Connector Line Component between merged tables
const MergeConnectorLine = ({ 
  table1, 
  table2,
}: { 
  table1: TableType; 
  table2: TableType;
}) => {
  const tableCenter = 70;
  const x1 = table1.x + tableCenter;
  const y1 = table1.y + tableCenter;
  const x2 = table2.x + tableCenter;
  const y2 = table2.y + tableCenter;
  
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  const totalSeats = table1.seats + table2.seats;
  const totalGuests = table1.guests + table2.guests;
  
  return (
    <>
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
        
        <circle
          cx={midX}
          cy={midY}
          r="14"
          fill="#171717"
          stroke="#22d3ee"
          strokeWidth="2"
        />
      </svg>
      
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

const TableOrder = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "visual" | "floorplan">("grid");
  const [selectedArea, setSelectedArea] = useState("Main Dining Room");
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [guestDropdownTable, setGuestDropdownTable] = useState<string | null>(null);
  
  // Floorplan-specific state
  const [tablePositions, setTablePositions] = useState<TableType[]>(loadSavedPositions);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Merge functionality state
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [invalidMergeTarget, setInvalidMergeTarget] = useState<{ tableId: string; reason: string } | null>(null);
  const lastShownInvalidTarget = useRef<string | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{ source: string; target: string } | null>(null);
  
  // Unmerge dialog state
  const [showUnmergeDialog, setShowUnmergeDialog] = useState(false);
  const [pendingUnmerge, setPendingUnmerge] = useState<{ table1: string; table2: string } | null>(null);
  
  // Table options popup state
  const [tableOptionsOpen, setTableOptionsOpen] = useState<string | null>(null);
  const [seatEditTable, setSeatEditTable] = useState<string | null>(null);
  const [tempSeats, setTempSeats] = useState<number>(0);
  
  // Customization state
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [floorAreas, setFloorAreas] = useState<FloorArea[]>(loadSavedFloorAreas);
  const [dividers, setDividers] = useState<DividerType[]>(loadSavedDividers);
  const [showManageAreasDialog, setShowManageAreasDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<FloorArea | null>(null);
  const [newAreaName, setNewAreaName] = useState("");
  const [selectedColorPreset, setSelectedColorPreset] = useState(0);
  const [draggingAreaId, setDraggingAreaId] = useState<string | null>(null);
  const [draggingDividerId, setDraggingDividerId] = useState<string | null>(null);
  
  // Template state
  const [templates, setTemplates] = useState<FloorPlanTemplate[]>(loadSavedTemplates);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  
  const MERGE_THRESHOLD = 120;
  const SNAP_OFFSET = 160;
  
  const filterCounts = getFilterCounts(tablePositions);

  // Save floor areas to localStorage when they change
  useEffect(() => {
    localStorage.setItem('floorplan-areas', JSON.stringify(floorAreas));
  }, [floorAreas]);

  // Save dividers to localStorage when they change
  useEffect(() => {
    localStorage.setItem('floorplan-dividers', JSON.stringify(dividers));
  }, [dividers]);

  // Save positions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('floorplan-tablePositions', JSON.stringify(tablePositions));
  }, [tablePositions]);

  // Save templates to localStorage when they change
  useEffect(() => {
    localStorage.setItem('floorplan-templates', JSON.stringify(templates));
  }, [templates]);
  
  // Get merged table pairs
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
  const checkTableOverlap = useCallback((draggedX: number, draggedY: number, draggedId: string): { 
    validTarget: string | null; 
    invalidTarget: { tableId: string; reason: string } | null 
  } => {
    const draggedTable = tablePositions.find(t => t.id === draggedId);
    if (!draggedTable) return { validTarget: null, invalidTarget: null };
    
    for (const table of tablePositions) {
      if (table.id === draggedId) continue;
      if (draggedTable.mergedWith || table.mergedWith) continue;
      
      const distance = Math.sqrt(
        Math.pow(table.x - draggedX, 2) + 
        Math.pow(table.y - draggedY, 2)
      );
      
      if (distance < MERGE_THRESHOLD) {
        const { allowed, reason } = canMerge(draggedTable, table);
        if (allowed) {
          return { validTarget: table.id, invalidTarget: null };
        } else {
          return { validTarget: null, invalidTarget: { tableId: table.id, reason } };
        }
      }
    }
    return { validTarget: null, invalidTarget: null };
  }, [tablePositions]);
  
  // Handle merge confirmation
  const handleConfirmMerge = () => {
    if (!pendingMerge) return;
    
    const { source, target } = pendingMerge;
    const sourceTable = tablePositions.find(t => t.id === source);
    const targetTable = tablePositions.find(t => t.id === target);
    
    if (!sourceTable || !targetTable) return;
    
    const mergeGroupId = `merge-${Date.now()}`;
    
    let newSourceX = targetTable.x + SNAP_OFFSET;
    let newSourceY = targetTable.y;
    
    const angle = Math.atan2(sourceTable.y - targetTable.y, sourceTable.x - targetTable.x);
    newSourceX = targetTable.x + Math.cos(angle) * SNAP_OFFSET;
    newSourceY = targetTable.y + Math.sin(angle) * SNAP_OFFSET;
    
    setTablePositions(prev => prev.map(t => {
      if (t.id === source) {
        return {
          ...t,
          mergedWith: target,
          isMergeSource: true,
          mergeGroupId,
          x: newSourceX,
          y: newSourceY,
          status: "Available",
          guests: 0,
          occupiedSeats: [],
          time: "",
        };
      }
      if (t.id === target) {
        return {
          ...t,
          mergedWith: source,
          isMergeSource: false,
          mergeGroupId,
          guests: sourceTable.guests + targetTable.guests,
          occupiedSeats: [
            ...targetTable.occupiedSeats,
            ...sourceTable.occupiedSeats.map(s => s + targetTable.seats)
          ].slice(0, targetTable.seats + sourceTable.seats),
        };
      }
      return t;
    }));
    
    toast.success(`Tables ${source} and ${target} merged successfully`);
    
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
    setTableOptionsOpen(null);
    
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
    
    let newX = coords.x - containerRect.left - dragOffset.x;
    let newY = coords.y - containerRect.top - dragOffset.y;
    
    const padding = 10;
    const maxX = containerRect.width - 150;
    const maxY = containerRect.height - 150;
    
    newX = Math.max(padding, Math.min(newX, maxX));
    newY = Math.max(padding, Math.min(newY, maxY));
    
    setHasDragged(true);
    
    const draggedTable = tablePositions.find(t => t.id === draggedTableId);
    
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
    
    if (!draggedTable?.mergedWith) {
      const { validTarget, invalidTarget } = checkTableOverlap(newX, newY, draggedTableId);
      setMergeTarget(validTarget);
      setInvalidMergeTarget(invalidTarget);
      
      if (invalidTarget && invalidTarget.tableId !== lastShownInvalidTarget.current) {
        lastShownInvalidTarget.current = invalidTarget.tableId;
        toast.error(`Cannot merge with Table ${invalidTarget.tableId}: ${invalidTarget.reason}`, {
          duration: 2500,
        });
      } else if (!invalidTarget) {
        lastShownInvalidTarget.current = null;
      }
    }
  }, [isDragging, draggedTableId, dragOffset, checkTableOverlap, tablePositions]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    const draggedTable = tablePositions.find(t => t.id === draggedTableId);
    const targetTable = tablePositions.find(t => t.id === mergeTarget);
    
    if (mergeTarget && draggedTableId && !draggedTable?.mergedWith && draggedTable && targetTable) {
      const { allowed, reason } = canMerge(draggedTable, targetTable);
      
      if (allowed) {
        setPendingMerge({ source: draggedTableId, target: mergeTarget });
        setShowMergeDialog(true);
      } else {
        toast.error(reason);
      }
    }
    
    setIsDragging(false);
    setDraggedTableId(null);
    setMergeTarget(null);
    setInvalidMergeTarget(null);
    lastShownInvalidTarget.current = null;
    setTimeout(() => setHasDragged(false), 100);
  }, [mergeTarget, draggedTableId, tablePositions]);

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
    localStorage.removeItem('floorplan-tablePositions');
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

  const handleFloorplanTableClick = (table: TableType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDragged) return;
    
    setGuestDropdownTable(null);
    setTableOptionsOpen(tableOptionsOpen === table.id ? null : table.id);
  };
  
  // Handle view order action
  const handleViewOrder = (tableId: string) => {
    setTableOptionsOpen(null);
    navigate(`/tableorder/${tableId}`);
  };
  
  // Handle add guests action
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

  // Area management functions
  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    const preset = areaColorPresets[selectedColorPreset];
    const newArea: FloorArea = {
      id: `area-${Date.now()}`,
      name: newAreaName.trim(),
      color: preset.color,
      bgColor: preset.bgColor,
      x: 50,
      y: 50,
      anchor: 'top-left'
    };
    setFloorAreas(prev => [...prev, newArea]);
    setNewAreaName("");
    toast.success(`Area "${newArea.name}" added`);
  };

  const handleUpdateArea = (area: FloorArea) => {
    setFloorAreas(prev => prev.map(a => a.id === area.id ? area : a));
    setEditingArea(null);
  };

  const handleDeleteArea = (areaId: string) => {
    const area = floorAreas.find(a => a.id === areaId);
    setFloorAreas(prev => prev.filter(a => a.id !== areaId));
    toast.success(`Area "${area?.name}" deleted`);
  };

  const handleAddDivider = (orientation: 'horizontal' | 'vertical') => {
    const newDivider: DividerType = {
      id: `div-${orientation[0]}-${Date.now()}`,
      orientation,
      position: 50
    };
    setDividers(prev => [...prev, newDivider]);
    toast.success(`${orientation.charAt(0).toUpperCase() + orientation.slice(1)} divider added`);
  };

  const handleDeleteDivider = (dividerId: string) => {
    setDividers(prev => prev.filter(d => d.id !== dividerId));
    toast.success("Divider deleted");
  };

  // Handle area drag
  const handleAreaDragStart = (e: React.MouseEvent | React.TouchEvent, areaId: string) => {
    if (!isCustomizeMode) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingAreaId(areaId);
  };

  // Handle divider drag
  const handleDividerDragStart = (e: React.MouseEvent | React.TouchEvent, dividerId: string) => {
    if (!isCustomizeMode) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingDividerId(dividerId);
  };

  // Handle area/divider drag move
  useEffect(() => {
    if (!draggingAreaId && !draggingDividerId) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const coords = 'touches' in e 
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };

      const percentX = Math.max(2, Math.min(98, ((coords.x - rect.left) / rect.width) * 100));
      const percentY = Math.max(2, Math.min(98, ((coords.y - rect.top) / rect.height) * 100));

      if (draggingAreaId) {
        setFloorAreas(prev => prev.map(a => 
          a.id === draggingAreaId ? { ...a, x: percentX, y: percentY } : a
        ));
      }

      if (draggingDividerId) {
        const divider = dividers.find(d => d.id === draggingDividerId);
        if (divider) {
          const newPos = divider.orientation === 'horizontal' ? percentY : percentX;
          setDividers(prev => prev.map(d => 
            d.id === draggingDividerId ? { ...d, position: newPos } : d
          ));
        }
      }
    };

    const handleEnd = () => {
      setDraggingAreaId(null);
      setDraggingDividerId(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [draggingAreaId, draggingDividerId, dividers]);

  const handleResetLayout = () => {
    setFloorAreas(defaultFloorAreas);
    setDividers(defaultDividers);
    localStorage.removeItem('floorplan-areas');
    localStorage.removeItem('floorplan-dividers');
    toast.success("Floor plan layout reset");
  };

  // Template management functions
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) return;
    
    const newTemplate: FloorPlanTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName.trim(),
      createdAt: new Date().toISOString(),
      tables: tablePositions,
      floorAreas: floorAreas,
      dividers: dividers,
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    setActiveTemplateId(newTemplate.id);
    setNewTemplateName("");
    toast.success(`Template "${newTemplate.name}" saved`);
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    setTablePositions(template.tables);
    setFloorAreas(template.floorAreas);
    setDividers(template.dividers);
    setActiveTemplateId(templateId);
    
    localStorage.setItem('floorplan-tablePositions', JSON.stringify(template.tables));
    localStorage.setItem('floorplan-areas', JSON.stringify(template.floorAreas));
    localStorage.setItem('floorplan-dividers', JSON.stringify(template.dividers));
    
    toast.success(`Loaded template "${template.name}"`);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    if (activeTemplateId === templateId) {
      setActiveTemplateId(null);
    }
    toast.success(`Template "${template?.name}" deleted`);
  };

  const handleRenameTemplate = (templateId: string) => {
    if (!editingTemplateName.trim()) return;
    
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, name: editingTemplateName.trim() } : t
    ));
    setEditingTemplateId(null);
    setEditingTemplateName("");
    toast.success("Template renamed");
  };

  const handleLoadDefaultLayout = () => {
    setTablePositions(defaultTables);
    setFloorAreas(defaultFloorAreas);
    setDividers(defaultDividers);
    setActiveTemplateId(null);
    localStorage.setItem('floorplan-tablePositions', JSON.stringify(defaultTables));
    localStorage.setItem('floorplan-areas', JSON.stringify(defaultFloorAreas));
    localStorage.setItem('floorplan-dividers', JSON.stringify(defaultDividers));
    toast.success("Loaded default layout");
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
              onClick={() => setViewMode(
                viewMode === "grid" ? "list" : 
                viewMode === "list" ? "visual" : 
                viewMode === "visual" ? "floorplan" : "grid"
              )}
              className="flex items-center justify-center rounded-full p-1.5 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              {viewMode === "grid" ? (
                <Grid className="w-4 h-4 text-black" />
              ) : viewMode === "list" ? (
                <List className="w-4 h-4 text-black" />
              ) : viewMode === "visual" ? (
                <Circle className="w-4 h-4 text-black" />
              ) : (
                <MapPin className="w-4 h-4 text-black" />
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

        {/* Floorplan-specific controls */}
        {viewMode === "floorplan" && (
          <>
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

            {/* Customize Layout Button */}
            {isCustomizeMode ? (
              <div className="flex items-center gap-2">
                {/* Templates Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 transition-all">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Templates</span>
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-neutral-800 border-neutral-700 min-w-[200px]">
                    <DropdownMenuItem 
                      onClick={() => setShowTemplatesDialog(true)} 
                      className="text-white hover:bg-neutral-700 cursor-pointer"
                    >
                      <Save className="w-4 h-4 mr-2 text-cyan-400" />
                      Save Current Layout...
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-neutral-700" />
                    <DropdownMenuItem 
                      onClick={handleLoadDefaultLayout}
                      className={`text-white hover:bg-neutral-700 cursor-pointer ${!activeTemplateId ? 'bg-neutral-700/50' : ''}`}
                    >
                      {!activeTemplateId && <Check className="w-4 h-4 mr-2 text-cyan-400" />}
                      {activeTemplateId && <div className="w-4 h-4 mr-2" />}
                      Default Layout
                    </DropdownMenuItem>
                    {templates.map(template => (
                      <DropdownMenuItem 
                        key={template.id}
                        onClick={() => handleLoadTemplate(template.id)}
                        className={`text-white hover:bg-neutral-700 cursor-pointer ${activeTemplateId === template.id ? 'bg-neutral-700/50' : ''}`}
                      >
                        {activeTemplateId === template.id && <Check className="w-4 h-4 mr-2 text-cyan-400" />}
                        {activeTemplateId !== template.id && <FolderOpen className="w-4 h-4 mr-2 text-neutral-400" />}
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                    {templates.length > 0 && (
                      <>
                        <DropdownMenuSeparator className="bg-neutral-700" />
                        <DropdownMenuItem 
                          onClick={() => setShowTemplatesDialog(true)} 
                          className="text-white hover:bg-neutral-700 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 mr-2 text-neutral-400" />
                          Manage Templates...
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <button
                  onClick={() => setShowManageAreasDialog(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manage Areas</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-medium hover:bg-amber-500 transition-all">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Divider</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
                    <DropdownMenuItem onClick={() => handleAddDivider('horizontal')} className="text-white hover:bg-neutral-700 cursor-pointer">
                      Horizontal Divider
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddDivider('vertical')} className="text-white hover:bg-neutral-700 cursor-pointer">
                      Vertical Divider
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  onClick={handleResetLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/80 text-white text-xs font-medium hover:bg-red-500 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Layout</span>
                </button>
                <button
                  onClick={() => setIsCustomizeMode(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)", color: "#000" }}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Exit Customize</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCustomizeMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 text-gray-300 hover:bg-neutral-700 text-xs font-medium transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Customize</span>
              </button>
            )}
          </>
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

              const handleGuestSelectLocal = (guestCount: number) => {
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
                    <div className="flex gap-1 overflow-x-auto max-w-[140px] shrink-0 scrollbar-hide">
                      {Array.from({ length: table.seats }).map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGuestSelectLocal(i + 1);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded hover:bg-orange-500 transition-colors shrink-0"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`px-3 py-1 rounded-md border border-neutral-600 ${config.bgColor} shrink-0`}>
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

                const handleGuestSelectLocal = (guestCount: number) => {
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
                    onGuestSelect={handleGuestSelectLocal}
                    showGuestSelection={guestDropdownTable === table.id && table.status === "Available"}
                  />
                ) : (
                  <SquareTableVisual
                    key={table.id}
                    table={table}
                    onClick={handleTableClick}
                    isSelected={selectedTable === table.id}
                    onGuestSelect={handleGuestSelectLocal}
                    showGuestSelection={guestDropdownTable === table.id && table.status === "Available"}
                  />
                );
              })}
            </div>
            <StatusLegend />
          </div>
        ) : viewMode === "floorplan" ? (
          /* Floor Plan View - Interactive Map */
          <div className="flex flex-col h-full">
            <div 
              ref={mapContainerRef}
              className="flex-1 relative overflow-hidden rounded-xl border-2 bg-neutral-950 border-neutral-800 min-h-[600px]"
              onClick={handleContainerClick}
            >
              {/* Grid background pattern */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(75, 75, 75, 0.4) 1px, transparent 1px)',
                  backgroundSize: '32px 32px'
                }} 
              />

              {/* Dynamic Floor Plan Area Labels */}
              {floorAreas.map((area) => {
                const positionStyle: React.CSSProperties = {
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  transform: area.anchor === 'top-right' ? 'translateX(-100%)' 
                    : area.anchor === 'bottom-left' ? 'translateY(-100%)'
                    : area.anchor === 'bottom-right' ? 'translate(-100%, -100%)'
                    : 'none',
                };

                return (
                  <div
                    key={area.id}
                    className={`absolute flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 z-20 ${
                      isCustomizeMode ? 'cursor-grab active:cursor-grabbing ring-2 ring-white/30' : ''
                    } ${draggingAreaId === area.id ? 'opacity-70 scale-105' : ''}`}
                    style={positionStyle}
                    onMouseDown={(e) => handleAreaDragStart(e, area.id)}
                    onTouchStart={(e) => handleAreaDragStart(e, area.id)}
                  >
                    {isCustomizeMode && (
                      <GripVertical className="w-3 h-3 text-white/50" />
                    )}
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="text-xs font-medium" style={{ color: area.color }}>
                      {area.name}
                    </span>
                    {isCustomizeMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArea(area.id);
                        }}
                        className="ml-1 p-0.5 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Dynamic Divider Lines */}
              {dividers.map((divider) => (
                <div
                  key={divider.id}
                  className={`absolute ${
                    divider.orientation === 'horizontal' 
                      ? 'left-0 right-0 h-px' 
                      : 'top-0 bottom-0 w-px'
                  } bg-gradient-to-${divider.orientation === 'horizontal' ? 'r' : 'b'} from-transparent via-neutral-700/50 to-transparent ${
                    isCustomizeMode ? 'cursor-grab z-30' : ''
                  } ${draggingDividerId === divider.id ? 'via-cyan-500/70' : ''}`}
                  style={
                    divider.orientation === 'horizontal'
                      ? { top: `${divider.position}%` }
                      : { left: `${divider.position}%` }
                  }
                  onMouseDown={(e) => handleDividerDragStart(e, divider.id)}
                  onTouchStart={(e) => handleDividerDragStart(e, divider.id)}
                >
                  {isCustomizeMode && (
                    <div 
                      className={`absolute ${
                        divider.orientation === 'horizontal'
                          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                          : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                      } flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-full border border-neutral-600`}
                    >
                      <GripVertical className="w-3 h-3 text-white/60" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDivider(divider.id);
                        }}
                        className="p-0.5 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Merge connector lines */}
              {mergedPairs.map(({ table1, table2 }) => (
                <MergeConnectorLine
                  key={`${table1.id}-${table2.id}`}
                  table1={table1}
                  table2={table2}
                />
              ))}

              {/* Tables positioned absolutely on the map */}
              <div className="relative w-[1200px] h-[700px]">
                {filteredTables.map((table) => {
                  const isMergeTarget = mergeTarget === table.id;
                  const isInvalidMergeTarget = invalidMergeTarget?.tableId === table.id;
                  const isBeingDragged = draggedTableId === table.id;
                  const isMerged = !!table.mergedWith;
                  const config = statusConfig[table.status] || statusConfig["Available"];
                  
                  return (
                    <Popover 
                      key={table.id} 
                      open={tableOptionsOpen === table.id} 
                      onOpenChange={(open) => {
                        if (!open && seatEditTable === table.id) return;
                        if (!open) {
                          setTableOptionsOpen(null);
                          setSeatEditTable(null);
                        }
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
                                : isInvalidMergeTarget
                                  ? "0 0 30px rgba(239, 68, 68, 0.6)"
                                  : undefined,
                          }}
                          onMouseDown={(e) => handleDragStart(e, table.id)}
                          onTouchStart={(e) => handleDragStart(e, table.id)}
                          onClick={(e) => handleFloorplanTableClick(table, e)}
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
                          
                          {/* Invalid merge target ring */}
                          {isInvalidMergeTarget && (
                            <div className="absolute inset-0 -m-3 rounded-full animate-pulse pointer-events-none">
                              <div className="absolute inset-0 rounded-full border-4 border-red-500/60" />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-red-500 text-white text-xs font-bold whitespace-nowrap">
                                Cannot Merge
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setTempSeats(Math.max(2, tempSeats - 1));
                                  }}
                                  className="w-8 h-8 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-white font-bold">{tempSeats}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setTempSeats(Math.min(12, tempSeats + 1));
                                  }}
                                  className="w-8 h-8 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600"
                                >
                                  +
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    confirmSeatChange();
                                  }}
                                  className="ml-auto px-3 py-1 rounded-lg bg-green-500 text-white text-sm font-medium"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleChangeSeats(table.id);
                              }}
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
            </div>
            
            {/* Status Legend */}
            <div className="mt-3">
              <StatusLegend showMerged={true} />
            </div>
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

              const handleGuestSelectLocal = (guestCount: number) => {
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
                                  handleGuestSelectLocal(i + 1);
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
      
      {/* Merge Confirmation Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-2xl overflow-hidden">
          {pendingMerge && (() => {
            const sourceTable = tablePositions.find(t => t.id === pendingMerge.source);
            const targetTable = tablePositions.find(t => t.id === pendingMerge.target);
            const sourceOrder = getTableOrder(pendingMerge.source);
            const targetOrder = getTableOrder(pendingMerge.target);

            const handleSwapMergeDirection = () => {
              setPendingMerge({
                source: pendingMerge.target,
                target: pendingMerge.source
              });
            };

            return (
              <>
                {/* Grabber */}
                <div className="flex justify-center pt-3 pb-4">
                  <div className="w-10 h-1 bg-white/30 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 px-6 pb-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Merge className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Merge Tables</h3>
                    <p className="text-white/50 text-sm">Combine {sourceTable?.id} → {targetTable?.id}</p>
                  </div>
                </div>

                {/* Merge From Order */}
                <div className="px-6 pb-4">
                  <p className="text-white/60 text-sm mb-2">Merge From</p>
                  {sourceOrder ? (
                    <OrderLayoutTemplate order={toOrderTemplateData(sourceOrder)} />
                  ) : (
                    <div className="rounded-xl border border-neutral-700 p-4 text-center" style={{ backgroundColor: '#1B1C20' }}>
                      <span className="text-white font-bold text-lg">{sourceTable?.id}</span>
                      <p className="text-white/50 text-sm mt-1">
                        {sourceTable?.status === "Available" ? "Available Table" : sourceTable?.status}
                        {sourceTable?.guests ? ` • ${sourceTable.guests} guests` : ""}
                      </p>
                      <p className="text-white/40 text-xs mt-1">{sourceTable?.seats} seats</p>
                    </div>
                  )}
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

                {/* Merge To Order */}
                <div className="px-6 pb-4">
                  <p className="text-white/60 text-sm mb-2">Merge To</p>
                  {targetOrder ? (
                    <OrderLayoutTemplate order={toOrderTemplateData(targetOrder)} />
                  ) : (
                    <div className="rounded-xl border border-neutral-700 p-4 text-center" style={{ backgroundColor: '#1B1C20' }}>
                      <span className="text-white font-bold text-lg">{targetTable?.id}</span>
                      <p className="text-white/50 text-sm mt-1">
                        {targetTable?.status === "Available" ? "Available Table" : targetTable?.status}
                        {targetTable?.guests ? ` • ${targetTable.guests} guests` : ""}
                      </p>
                      <p className="text-white/40 text-xs mt-1">{targetTable?.seats} seats</p>
                    </div>
                  )}
                </div>

                {/* Result Summary */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-center gap-2 text-sm bg-neutral-800/50 rounded-xl py-3">
                    <span className="text-white/50">Combined Result:</span>
                    <span className="text-cyan-400 font-medium">
                      {(sourceTable?.seats || 0) + (targetTable?.seats || 0)} total seats
                    </span>
                    {((sourceTable?.guests || 0) + (targetTable?.guests || 0)) > 0 && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="text-cyan-400 font-medium">
                          {(sourceTable?.guests || 0) + (targetTable?.guests || 0)} guests
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-6 flex gap-3">
                  <button 
                    onClick={handleCancelMerge}
                    className="px-6 py-2.5 rounded-full text-white font-medium text-sm bg-neutral-800 hover:bg-neutral-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmMerge}
                    className="flex-1 py-2.5 rounded-full text-black font-medium text-sm"
                    style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                  >
                    Confirm Merge
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

      {/* Manage Areas Dialog */}
      <Dialog open={showManageAreasDialog} onOpenChange={setShowManageAreasDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md">
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>
          
          <div className="flex items-center gap-3 pb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Manage Areas</h3>
              <p className="text-white/50 text-sm">Add, edit, or remove floor plan areas</p>
            </div>
          </div>

          {/* Add New Area */}
          <div className="space-y-3 pb-4 border-b border-neutral-700">
            <p className="text-white/60 text-sm font-medium">Add New Area</p>
            <div className="flex gap-2">
              <Input
                placeholder="Area name (e.g. VIP Section)"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
              <button
                onClick={handleAddArea}
                disabled={!newAreaName.trim()}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {areaColorPresets.map((preset, index) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedColorPreset(index)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    selectedColorPreset === index ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Existing Areas */}
          <div className="space-y-2 max-h-60 overflow-y-auto py-2">
            <p className="text-white/60 text-sm font-medium">Current Areas</p>
            {floorAreas.length === 0 ? (
              <p className="text-neutral-500 text-sm py-4 text-center">No areas defined</p>
            ) : (
              floorAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800 border border-neutral-700"
                >
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: area.color }}
                  />
                  {editingArea?.id === area.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editingArea.name}
                        onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                        className="flex-1 bg-neutral-700 border-neutral-600 text-white h-8"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateArea(editingArea)}
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingArea(null)}
                        className="px-3 py-1 rounded bg-neutral-600 text-white text-xs font-medium hover:bg-neutral-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-white text-sm">{area.name}</span>
                      <button
                        onClick={() => setEditingArea(area)}
                        className="p-1.5 rounded hover:bg-neutral-700 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteArea(area.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Close Button */}
          <div className="pt-4">
            <button
              onClick={() => setShowManageAreasDialog(false)}
              className="w-full py-2.5 rounded-full text-black font-medium text-sm"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md">
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>
          
          <div className="flex items-center gap-3 pb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Manage Templates</h3>
              <p className="text-white/50 text-sm">Save and switch between floor plan layouts</p>
            </div>
          </div>

          {/* Save Current Layout */}
          <div className="space-y-3 pb-4 border-b border-neutral-700">
            <p className="text-white/60 text-sm font-medium">Save Current Layout</p>
            <div className="flex gap-2">
              <Input
                placeholder="Template name (e.g. Dinner Service)"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAsTemplate()}
                className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
              <button
                onClick={handleSaveAsTemplate}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Existing Templates */}
          <div className="space-y-2 max-h-60 overflow-y-auto py-2">
            <p className="text-white/60 text-sm font-medium">Saved Templates</p>
            
            {/* Default Layout */}
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-neutral-800 ${
                !activeTemplateId 
                  ? 'bg-cyan-500/10 border-cyan-500/50' 
                  : 'bg-neutral-800 border-neutral-700'
              }`}
              onClick={handleLoadDefaultLayout}
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="flex-1">
                <span className="text-white text-sm font-medium">Default Layout</span>
                <p className="text-neutral-500 text-xs">Original floor plan</p>
              </div>
              {!activeTemplateId && <Check className="w-4 h-4 text-cyan-400" />}
            </div>
            
            {templates.map((template) => (
              <div
                key={template.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  activeTemplateId === template.id 
                    ? 'bg-cyan-500/10 border-cyan-500/50' 
                    : 'bg-neutral-800 border-neutral-700'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-neutral-600"
                  onClick={() => handleLoadTemplate(template.id)}
                >
                  <FolderOpen className="w-4 h-4 text-neutral-400" />
                </div>
                {editingTemplateId === template.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editingTemplateName}
                      onChange={(e) => setEditingTemplateName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameTemplate(template.id)}
                      className="flex-1 bg-neutral-700 border-neutral-600 text-white h-8"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameTemplate(template.id)}
                      className="px-3 py-1 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplateId(null);
                        setEditingTemplateName("");
                      }}
                      className="px-3 py-1 rounded bg-neutral-600 text-white text-xs font-medium hover:bg-neutral-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 cursor-pointer" onClick={() => handleLoadTemplate(template.id)}>
                      <span className="text-white text-sm font-medium">{template.name}</span>
                      <p className="text-neutral-500 text-xs">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {activeTemplateId === template.id && <Check className="w-4 h-4 text-cyan-400" />}
                    <button
                      onClick={() => {
                        setEditingTemplateId(template.id);
                        setEditingTemplateName(template.name);
                      }}
                      className="p-1.5 rounded hover:bg-neutral-700 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </>
                )}
              </div>
            ))}
            
            {templates.length === 0 && (
              <p className="text-neutral-500 text-sm py-4 text-center">No saved templates yet</p>
            )}
          </div>

          {/* Close Button */}
          <div className="pt-4">
            <button
              onClick={() => setShowTemplatesDialog(false)}
              className="w-full py-2.5 rounded-full text-black font-medium text-sm"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableOrder;
