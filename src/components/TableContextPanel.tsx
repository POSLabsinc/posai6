import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Clock, Users, MapPin, User, Armchair, Eye, 
  ShoppingCart, Plus, ArrowRightLeft, Split, Percent, Printer,
  Pencil, MessageSquare, Move, UserX, XCircle, RefreshCw,
  UsersRound, Merge, Lock, Gift, CreditCard, Phone, ChefHat,
  Bell, CheckCircle2
} from "lucide-react";
import type { Reservation } from "@/components/ReservationsPanel";

// Table type matching TableMapPanel
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

// Status config for table statuses
const tableStatusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  "Available": { color: "text-emerald-400", bgColor: "bg-emerald-500/15", label: "Available" },
  "Ordering": { color: "text-purple-400", bgColor: "bg-purple-500/15", label: "Ordering" },
  "Ordered": { color: "text-orange-400", bgColor: "bg-orange-500/15", label: "Ordered" },
  "Reserved": { color: "text-neutral-400", bgColor: "bg-neutral-500/15", label: "Reserved" },
  "Seated": { color: "text-blue-400", bgColor: "bg-blue-500/15", label: "Seated" },
  "Running Late": { color: "text-red-400", bgColor: "bg-red-500/15", label: "Late" },
  "1st Course": { color: "text-purple-400", bgColor: "bg-purple-500/15", label: "1st Course" },
  "3rd Course": { color: "text-orange-400", bgColor: "bg-orange-500/15", label: "3rd Course" },
  "Dessert": { color: "text-pink-400", bgColor: "bg-pink-500/15", label: "Dessert" },
  "Partially Seated": { color: "text-green-400", bgColor: "bg-green-500/15", label: "Partially Seated" },
  "Served": { color: "text-sky-400", bgColor: "bg-sky-500/15", label: "Served" },
  "Blocked": { color: "text-red-400", bgColor: "bg-red-500/15", label: "Blocked" },
  "Ready": { color: "text-emerald-400", bgColor: "bg-emerald-500/15", label: "Ready" },
};

// Get primary CTA based on status
const getPrimaryCTA = (status: string): { label: string; icon: React.ElementType; className: string } | null => {
  switch (status) {
    case "Reserved": return { label: "Seat Guest", icon: Armchair, className: "bg-emerald-600 hover:bg-emerald-500" };
    case "Seated": return { label: "Start Order", icon: ShoppingCart, className: "bg-blue-600 hover:bg-blue-500" };
    case "Ordering": 
    case "Ordered": return { label: "View Order", icon: Eye, className: "bg-orange-600 hover:bg-orange-500" };
    case "Ready": return { label: "Mark Served", icon: CheckCircle2, className: "bg-emerald-600 hover:bg-emerald-500" };
    case "Running Late": return { label: "Resolve", icon: Bell, className: "bg-red-600 hover:bg-red-500" };
    case "Available": return { label: "Seat Walk-In", icon: Armchair, className: "bg-emerald-600 hover:bg-emerald-500" };
    default: return { label: "View Order", icon: Eye, className: "bg-blue-600 hover:bg-blue-500" };
  }
};

interface TableContextPanelProps {
  table: TableType;
  linkedReservation?: Reservation | null;
  onBack: () => void;
  onAction?: (action: string, tableId: string) => void;
}

const ActionButton = ({ icon: Icon, label, onClick, iconColor = "text-neutral-400" }: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  iconColor?: string;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors rounded-lg"
  >
    <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
    <span className="text-sm">{label}</span>
  </button>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 pt-4 pb-1.5">
    <h4 className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest">{title}</h4>
  </div>
);

const TableContextPanel = ({ table, linkedReservation, onBack, onAction }: TableContextPanelProps) => {
  const config = tableStatusConfig[table.status] || tableStatusConfig["Available"];
  const primaryCTA = getPrimaryCTA(table.status);
  const isOccupied = !["Available", "Reserved", "Blocked"].includes(table.status);
  const hasReservation = !!linkedReservation;

  const handleAction = (action: string) => {
    onAction?.(action, table.id);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900/50 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-3 text-neutral-400 hover:text-white transition-colors border-b border-neutral-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Reservations</span>
      </button>

      {/* Header Section */}
      <div className="px-5 py-4 border-b border-neutral-800">
        {/* Table Name + Status */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-xl font-bold">Table {table.id}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color} border border-current/20`}>
            {config.label}
          </span>
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-300">{table.guests}/{table.seats} Guests</span>
          </div>
          {table.time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-neutral-300">{table.time}</span>
            </div>
          )}
        </div>

        {/* Server (mock) */}
        <div className="flex items-center gap-1.5 mt-2 text-sm">
          <User className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-neutral-400">Server:</span>
          <span className="text-neutral-300">Unassigned</span>
        </div>

        {/* Linked Reservation Info */}
        {hasReservation && linkedReservation && (
          <div className="mt-3 p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/50 space-y-1.5">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-white text-sm font-medium">{linkedReservation.guestName}</span>
            </div>
            {linkedReservation.occasion && (
              <div className="flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-pink-400 text-xs font-medium">{linkedReservation.occasion}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
              <span className={`text-xs font-medium ${linkedReservation.depositPaid ? "text-emerald-400" : linkedReservation.depositRequested ? "text-amber-400" : "text-neutral-500"}`}>
                {linkedReservation.depositPaid ? "Deposit Paid" : linkedReservation.depositRequested ? "Deposit Pending" : "No Deposit"}
              </span>
            </div>
            {linkedReservation.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-neutral-300 text-xs">{linkedReservation.phone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary CTA */}
      {primaryCTA && (
        <div className="px-4 py-3 border-b border-neutral-800">
          <button
            onClick={() => handleAction(primaryCTA.label.toLowerCase().replace(/\s/g, '-'))}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-colors ${primaryCTA.className}`}
          >
            <primaryCTA.icon className="w-5 h-5" />
            {primaryCTA.label}
          </button>
        </div>
      )}

      {/* Scrollable Action Sections */}
      <ScrollArea className="flex-1">
        <div className="pb-6">
          {/* Order Actions */}
          {isOccupied && (
            <>
              <SectionHeader title="Order Actions" />
              <div className="px-2">
                <ActionButton icon={Plus} label="Add Items" iconColor="text-emerald-400" onClick={() => handleAction('add-items')} />
                <ActionButton icon={ArrowRightLeft} label="Transfer Items" iconColor="text-blue-400" onClick={() => handleAction('transfer-items')} />
                <ActionButton icon={Move} label="Transfer Entire Order" iconColor="text-blue-400" onClick={() => handleAction('transfer-order')} />
                <ActionButton icon={Split} label="Split Bill" iconColor="text-amber-400" onClick={() => handleAction('split-bill')} />
                <ActionButton icon={Percent} label="Apply Discount" iconColor="text-purple-400" onClick={() => handleAction('apply-discount')} />
                <ActionButton icon={Printer} label="Print Bill" iconColor="text-neutral-400" onClick={() => handleAction('print-bill')} />
              </div>
            </>
          )}

          {/* Reservation Actions */}
          {hasReservation && (
            <>
              <SectionHeader title="Reservation Actions" />
              <div className="px-2">
                <ActionButton icon={Pencil} label="Edit Reservation" iconColor="text-orange-400" onClick={() => handleAction('edit-reservation')} />
                <ActionButton icon={MessageSquare} label="Message Guest" iconColor="text-blue-400" onClick={() => handleAction('message-guest')} />
                <ActionButton icon={Move} label="Move Table" iconColor="text-cyan-400" onClick={() => handleAction('move-table')} />
                <ActionButton icon={UserX} label="Mark No Show" iconColor="text-amber-400" onClick={() => handleAction('mark-no-show')} />
                <ActionButton icon={XCircle} label="Cancel Reservation" iconColor="text-red-400" onClick={() => handleAction('cancel-reservation')} />
              </div>
            </>
          )}

          {/* Table Actions */}
          <SectionHeader title="Table Actions" />
          <div className="px-2">
            <ActionButton icon={RefreshCw} label="Change Table" iconColor="text-cyan-400" onClick={() => handleAction('change-table')} />
            <ActionButton icon={UsersRound} label="Update Guest Count" iconColor="text-blue-400" onClick={() => handleAction('update-guests')} />
            <ActionButton icon={Merge} label="Merge Tables" iconColor="text-purple-400" onClick={() => handleAction('merge-tables')} />
            <ActionButton icon={Lock} label="Block Table" iconColor="text-red-400" onClick={() => handleAction('block-table')} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TableContextPanel;
