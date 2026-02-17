import { useState } from "react";
import { Search, Mic } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import selectAllIcon from "@/assets/icons/select-all.png";
import unselectAllIcon from "@/assets/icons/unselect-all.png";

interface CopyScheduleSheetProps {
  isOpen: boolean;
  onClose: (selectedDays: string[]) => void;
  sourceDay: string;
}

const CopyScheduleSheet = ({
  isOpen,
  onClose,
  sourceDay,
}: CopyScheduleSheetProps) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Filter out the source day and apply search
  const filteredDays = allDays
    .filter(day => day !== sourceDay)
    .filter(day => day.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSelectAll = () => {
    if (selectedDays.length === filteredDays.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays([...filteredDays]);
    }
  };

  const handleClose = () => {
    const result = [...selectedDays];
    setSelectedDays([]);
    setSearchQuery("");
    onClose(result);
  };

  if (!isOpen) return null;

  // Desktop/Tablet: Centered popup
  if (!isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-md bg-neutral-900 rounded-2xl animate-in zoom-in-95 duration-200 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-neutral-600 rounded-full" />
          </div>

          {/* Title */}
          <div className="px-4 pb-4">
            <p className="text-neutral-400 text-base text-center">
              To copy schedule please select days
            </p>
          </div>

          {/* Search Bar Row with Select All */}
          <div className="flex items-center gap-3 px-4 pb-4">
            <div className="flex-1 flex items-center gap-3 bg-neutral-800 rounded-full px-4 py-2.5">
              <Search className="w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-base"
              />
              <Mic className="w-5 h-5 text-neutral-500" />
            </div>
            <button
              onClick={handleSelectAll}
              className="p-1 active:opacity-70"
              aria-label={selectedDays.length === filteredDays.length ? "Unselect all days" : "Select all days"}
            >
              <img 
                src={selectedDays.length === filteredDays.length ? unselectAllIcon : selectAllIcon} 
                alt={selectedDays.length === filteredDays.length ? "Unselect All" : "Select All"} 
                className="w-6 h-6" 
              />
            </button>
          </div>

          {/* Days List */}
          <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-6 overflow-hidden">
            {filteredDays.map((day, index) => (
              <div key={day}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-full text-left px-4 py-4 text-base font-medium transition-colors active:opacity-70 ${
                    selectedDays.includes(day) 
                      ? "text-foreground bg-neutral-700/30" 
                      : "text-foreground"
                  }`}
                >
                  {day}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mobile: Bottom sheet
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 rounded-t-3xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-neutral-600 rounded-full" />
        </div>

        {/* Title */}
        <div className="px-4 pb-4">
          <p className="text-neutral-400 text-base text-center">
            To copy schedule please select days
          </p>
        </div>

        {/* Search Bar Row with Select All */}
        <div className="flex items-center gap-3 px-4 pb-4">
          <div className="flex-1 flex items-center gap-3 bg-neutral-800 rounded-full px-4 py-2.5">
            <Search className="w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-base"
            />
            <Mic className="w-5 h-5 text-neutral-500" />
          </div>
          <button
            onClick={handleSelectAll}
            className="p-1 active:opacity-70"
            aria-label={selectedDays.length === filteredDays.length ? "Unselect all days" : "Select all days"}
          >
            <img 
              src={selectedDays.length === filteredDays.length ? unselectAllIcon : selectAllIcon} 
              alt={selectedDays.length === filteredDays.length ? "Unselect All" : "Select All"} 
              className="w-6 h-6" 
            />
          </button>
        </div>

        {/* Days List */}
        <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-8 overflow-hidden">
          {filteredDays.map((day, index) => (
            <div key={day}>
              {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
              <button
                onClick={() => toggleDay(day)}
                className={`w-full text-left px-4 py-4 text-base font-medium transition-colors active:opacity-70 ${
                  selectedDays.includes(day) 
                    ? "text-foreground bg-neutral-700/30" 
                    : "text-foreground"
                }`}
              >
                {day}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { CopyScheduleSheet };
