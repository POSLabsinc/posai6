import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Plus, SlidersHorizontal, Archive, Mic, Check } from "lucide-react";
import { useEmployees, useArchiveEmployee } from "@/hooks/use-employees";
import EmployeeExpanded from "@/components/settings/EmployeeExpanded";
import SwipeableSettingsItem from "./SwipeableSettingsItem";
import { toast } from "sonner";

interface EmployeeContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const EmployeeContent = ({
  showHeader = true,
  onBack,
  onAIClick,
}: EmployeeContentProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const selectedDate = new Date();

  const { data: employees = [], isLoading } = useEmployees(showArchived);
  const archiveEmployee = useArchiveEmployee();

  const handleArchive = (employee: { id: string; full_name: string; is_archived: boolean }) => {
    const archive = !employee.is_archived;
    archiveEmployee.mutate(
      { employeeId: employee.id, archive },
      {
        onSuccess: () => {
          toast.success(archive ? `${employee.full_name} archived` : `${employee.full_name} restored`);
        },
      }
    );
  };

  const roles = ["Server", "Manager", "Host", "Admin"];

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const filteredEmployees = employees
    .filter((e) => {
      if (selectedRoles.length > 0 && !selectedRoles.includes(e.role)) return false;
      if (searchQuery && !e.full_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => sortAsc ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name));

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className="px-4 pb-28">
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between pt-4 pb-2 px-0">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
                aria-label="Back"
              >
                <ChevronLeft className="w-6 h-6 text-foreground" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Employees</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/settings/workforce/employee/add")}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <Plus className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <SlidersHorizontal className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Role filter dropdown */}
        {showRoleDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
            <div className="relative z-50">
              <div className="absolute right-0 top-0 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-xl py-2 w-52">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm text-foreground hover:bg-neutral-700/60 transition-colors"
                  >
                    <span>{role}</span>
                    {selectedRoles.includes(role) && <Check className="w-4 h-4 text-foreground" />}
                  </button>
                ))}
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm text-foreground hover:bg-neutral-700/60 transition-colors border-t border-neutral-700/50"
                >
                  <span>Show Archived</span>
                  {showArchived && <Check className="w-4 h-4 text-foreground" />}
                </button>
                {selectedRoles.length > 0 && (
                  <button
                    onClick={() => { setSelectedRoles([]); setShowRoleDropdown(false); }}
                    className="w-full px-4 py-3 text-sm text-neutral-500 hover:bg-neutral-700/60 transition-colors text-left border-t border-neutral-700/50 mt-1"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Search bar */}
        <div className="mt-3 mb-5">
          <div className="rounded-full bg-neutral-800/60 px-4 py-3 flex items-center gap-3">
            <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Name or Role"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-[15px]"
            />
            <Mic className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </div>

        {/* Employee list */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Loading employees...</p>
          </div>
        ) : (
          <div>
            {(() => {
              const grouped: Record<string, typeof filteredEmployees> = {};
              filteredEmployees.forEach((emp) => {
                const letter = emp.full_name.charAt(0).toUpperCase();
                if (!grouped[letter]) grouped[letter] = [];
                grouped[letter].push(emp);
              });
              const letters = Object.keys(grouped).sort();

              return letters.map((letter) => (
                <div key={letter}>
                  <div className="px-1 pt-5 pb-2">
                    <span className="text-xs font-semibold text-muted-foreground">{letter}</span>
                  </div>
                  <div className="divide-y divide-neutral-800/60">
                    {grouped[letter].map((employee) => {
                      const isExpanded = expandedEmployee === employee.id;
                      const statusLabel = employee.is_archived ? "Archived" : "Working";
                      const statusStyles = employee.is_archived
                        ? "bg-neutral-700 text-neutral-300"
                        : "bg-neutral-900 text-foreground";

                      return (
                        <SwipeableSettingsItem
                          key={employee.id}
                          onTap={() => setExpandedEmployee(isExpanded ? null : employee.id)}
                          onArchive={() => handleArchive(employee)}
                          isArchived={employee.is_archived}
                        >
                          <div className="overflow-hidden transition-all duration-300">
                            <div className="flex items-center justify-between w-full py-3.5 px-1">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <img
                                  src={employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name)}&background=2a2a2a&color=fff&size=44&font-size=0.4&bold=true`}
                                  alt={employee.full_name}
                                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="text-left min-w-0">
                                  <p className="text-foreground text-sm font-semibold truncate">
                                    {employee.full_name}
                                    <span className="text-muted-foreground font-normal"> • {employee.role}</span>
                                  </p>
                                  <p className="text-muted-foreground text-xs mt-0.5">
                                    {employee.phone || employee.email || "No contact info"}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-[11px] font-semibold px-3 py-1 rounded-md flex-shrink-0 ml-2 ${statusStyles}`}>
                                {statusLabel}
                              </span>
                            </div>

                            {isExpanded && (
                              <EmployeeExpanded employee={employee} selectedDate={selectedDate} />
                            )}
                          </div>
                        </SwipeableSettingsItem>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {!isLoading && filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeContent;
