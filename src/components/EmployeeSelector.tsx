import { useState, useRef } from "react";
import { User, LogIn, LogOut } from "lucide-react";

export interface Employee {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  pin: string;
  role?: string;
}

type ClockStatus = { [employeeId: string]: { clockedIn: boolean; clockInTime?: string } };

interface EmployeeSelectorProps {
  employees: Employee[];
  onSelect: (employee: Employee) => void;
  selectedId?: string;
  clockStatus?: ClockStatus;
  onClockAction?: (employee: Employee, action: "clockIn" | "clockOut") => void;
}

export const EmployeeSelector = ({ 
  employees, 
  onSelect, 
  selectedId,
  clockStatus = {},
  onClockAction
}: EmployeeSelectorProps) => {
  const [showClockMenu, setShowClockMenu] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (employee: Employee) => {
    longPressTimer.current = setTimeout(() => {
      setShowClockMenu(employee.id);
    }, 500);
  };

  const handlePointerUp = (employee: Employee) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!showClockMenu) {
      onSelect(employee);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClockAction = (employee: Employee, action: "clockIn" | "clockOut") => {
    setShowClockMenu(null);
    onClockAction?.(employee, action);
  };

  const isClockedIn = (employeeId: string) => clockStatus[employeeId]?.clockedIn ?? false;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-h-[50vh] overflow-y-auto p-1">
      {employees.map((employee) => (
        <div key={employee.id} className="relative">
          <button
            onPointerDown={() => handlePointerDown(employee)}
            onPointerUp={() => handlePointerUp(employee)}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowClockMenu(employee.id);
            }}
            className={`employee-card w-full flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl ${
              selectedId === employee.id ? "employee-card-selected" : ""
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-foreground/20 to-foreground/5 flex items-center justify-center border border-foreground/10 overflow-hidden">
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg sm:text-xl font-semibold text-foreground/80">
                    {employee.initials}
                  </span>
                )}
              </div>
              
              {/* Clock status indicator */}
              {isClockedIn(employee.id) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {/* Name */}
            <div className="text-center">
              <p className="text-sm sm:text-base font-medium text-foreground truncate max-w-[100px]">
                {employee.name}
              </p>
              {employee.role && (
                <p className="text-xs text-foreground/50 mt-0.5">{employee.role}</p>
              )}
              {isClockedIn(employee.id) && (
                <p className="text-xs text-green-400 mt-0.5">Clocked In</p>
              )}
            </div>
          </button>

          {/* Clock In/Out Menu */}
          {showClockMenu === employee.id && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowClockMenu(null)}
              />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-background/95 backdrop-blur-xl rounded-xl border border-foreground/10 shadow-xl overflow-hidden min-w-[140px]">
                {!isClockedIn(employee.id) ? (
                  <button
                    onClick={() => handleClockAction(employee, "clockIn")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-green-400 hover:bg-foreground/5 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Clock In
                  </button>
                ) : (
                  <button
                    onClick={() => handleClockAction(employee, "clockOut")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-orange-400 hover:bg-foreground/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Clock Out
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowClockMenu(null);
                    onSelect(employee);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground/70 hover:bg-foreground/5 transition-colors border-t border-foreground/10"
                >
                  <User className="w-4 h-4" />
                  Login
                </button>
              </div>
            </>
          )}
        </div>
      ))}

    </div>
  );
};
