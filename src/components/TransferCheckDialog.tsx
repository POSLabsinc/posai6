import { useState, useMemo } from "react";
import { Search, Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { staffList, StaffMember } from "@/data/staff";

interface TransferCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentServer: string;
  onTransfer: (newServerName: string) => void;
}

// Generate a consistent color based on initials
const getAvatarColor = (initials: string) => {
  const colors = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-purple-600",
    "bg-rose-600",
    "bg-cyan-600",
    "bg-orange-600",
  ];
  const index = initials.charCodeAt(0) % colors.length;
  return colors[index];
};

export function TransferCheckDialog({
  isOpen,
  onClose,
  currentServer,
  onTransfer,
}: TransferCheckDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<StaffMember | null>(null);

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const query = searchQuery.toLowerCase();
    return staffList.filter(
      (staff) =>
        staff.name.toLowerCase().includes(query) ||
        staff.initials.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Handle update button click
  const handleUpdate = () => {
    if (selectedEmployee) {
      onTransfer(selectedEmployee.name);
      setSearchQuery("");
      setSelectedEmployee(null);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    setSearchQuery("");
    setSelectedEmployee(null);
    onClose();
  };

  // Reset state when dialog opens
  const handleEmployeeSelect = (employee: StaffMember) => {
    // Don't allow selecting current owner
    if (employee.name === currentServer) return;
    setSelectedEmployee(employee);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
          <button
            onClick={handleCancel}
            className="text-neutral-400 hover:text-white transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <h2 className="text-white font-semibold text-base">Transfer Check</h2>
          <button
            onClick={handleUpdate}
            disabled={!selectedEmployee}
            className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
              selectedEmployee
                ? "bg-neutral-700 text-white hover:bg-neutral-600"
                : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
            }`}
          >
            Update
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Helper Text */}
        <div className="px-4 pb-2">
          <p className="text-neutral-400 text-sm">
            Select an employee to transfer the ordering check
          </p>
        </div>

        {/* Employee List */}
        <ScrollArea className="h-[300px]">
          <div className="px-4 pb-4 space-y-2">
            {filteredStaff.map((employee) => {
              const isCurrentOwner = employee.name === currentServer;
              const isSelected = selectedEmployee?.id === employee.id;

              return (
                <button
                  key={employee.id}
                  onClick={() => handleEmployeeSelect(employee)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isCurrentOwner
                      ? "bg-neutral-800/50 cursor-default"
                      : isSelected
                      ? "bg-neutral-700 ring-1 ring-green-500/50"
                      : "bg-neutral-800/50 hover:bg-neutral-700"
                  }`}
                >
                  {/* Avatar/Initials */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                      employee.initials
                    )}`}
                  >
                    {employee.initials}
                  </div>

                  {/* Name */}
                  <span className="text-white font-medium text-sm flex-1 text-left">
                    {employee.name}
                  </span>

                  {/* Current Owner or Selected indicator */}
                  {isCurrentOwner ? (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 text-xs">Current Owner</span>
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                    </div>
                  ) : isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : null}
                </button>
              );
            })}

            {filteredStaff.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                No employees found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
