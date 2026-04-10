import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Plus, ArrowDownAZ, Calendar as CalendarIcon, Archive, Mic, Check, Clock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { CompactWheelDatePicker } from "@/components/ui/compact-wheel-date-picker";
import { useEmployees, useArchiveEmployee, useAllEmployeeShiftsForDate } from "@/hooks/use-employees";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showArchived, setShowArchived] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useEmployees(showArchived);
  const { data: allShifts = [] } = useAllEmployeeShiftsForDate(selectedDate);
  const archiveEmployee = useArchiveEmployee();

  // Build a map of employeeId -> shift for selected date
  const shiftMap = useMemo(() => {
    const map: Record<string, typeof allShifts[0]> = {};
    allShifts.forEach((s) => { map[s.employee_id] = s; });
    return map;
  }, [allShifts]);

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
          <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-0">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Employees</h1>
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
            <p className="text-neutral-500 text-sm">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeContent;
