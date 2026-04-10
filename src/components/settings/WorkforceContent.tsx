import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";
import workforceIcon from "@/assets/icons/settings-workforce.png";
import employeeIcon from "@/assets/icons/employee-icon.png";
import shiftIcon from "@/assets/icons/shift-icon.png";
import scheduleIcon from "@/assets/icons/scheduled.svg";

interface WorkforceContentProps {
  showHeader?: boolean;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
  onAIClick?: () => void;
}

const WorkforceContent = ({
  showHeader = true,
  onNavigate,
  onBack,
  onAIClick,
}: WorkforceContentProps) => {
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const [showMore, setShowMore] = useState(false);

  const options = [
    {
      icon: employeeIcon,
      iconBgColor: "#1A237E",
      label: "Employee",
      description: "Manage employee profiles, roles, permissions, and contact details.",
      onClick: () => onNavigate?.("/settings/workforce/employee"),
    },
    {
      icon: shiftIcon,
      iconBgColor: "#0D47A1",
      label: "Shift",
      description: "Create and manage employee shifts, schedules, and clock-in/out records.",
      onClick: () => onNavigate?.("/settings/workforce/shift"),
    },
    {
      icon: scheduleIcon,
      iconBgColor: "#4A148C",
      label: "Schedule Information",
      description: "View and manage workforce scheduling details, availability, and time-off requests.",
      onClick: () => onNavigate?.("/settings/workforce/schedule-information"),
    },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className={`${showHeader ? "pt-0" : "pt-0"} px-6 pb-28`}>
        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-start">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: getIconBgColor("#800080") }}
          >
            <img src={workforceIcon} alt="Workforce" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Workforce</h1>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            {showMore
              ? "The ultimate tool for efficient workforce management. Access and track employee clock-in and clock-out times, create and edit schedules effortlessly, and keep essential employee information up-to-date. Simplify your operations and enhance productivity with ease."
              : "The ultimate tool for efficient workforce management. Access and track employee clock-in and clock-out times, create and edit schedules effortlessly."}
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-blue-400 ml-1 text-base"
            >
              {showMore ? "Learn less" : "Learn more..."}
            </button>
          </p>
        </div>


        {options.map((option, index) => (
          <div key={option.label}>
            <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
              <button
                onClick={option.onClick}
                className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 active:scale-[0.98] transition-all duration-150"
              >
                <div className="flex items-center gap-4">
                  <SettingsIcon bgColor={option.iconBgColor} iconSrc={option.icon} iconAlt={option.label} />
                  <span className="text-foreground text-lg font-medium">{option.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 px-1 mb-4">{option.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkforceContent;
