import { useState } from "react";
import { Search, Mic } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import selectAllIcon from "@/assets/icons/select-all.png";
import unselectAllIcon from "@/assets/icons/unselect-all.png";

interface OrderTypeSheetProps {
  isOpen: boolean;
  onClose: (selectedTypes: string[]) => void;
  initialSelected?: string[];
}

const OrderTypeSheet = ({
  isOpen,
  onClose,
  initialSelected = [],
}: OrderTypeSheetProps) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialSelected);

  const allOrderTypes = ["All Orders", "Dine-In Only", "Delivery Only", "Takeout Only"];
  
  // Apply search filter
  const filteredTypes = allOrderTypes.filter(type => 
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === filteredTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes([...filteredTypes]);
    }
  };

  const handleClose = () => {
    const result = [...selectedTypes];
    setSelectedTypes([]);
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
              Select order types to apply
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
              aria-label={selectedTypes.length === filteredTypes.length ? "Unselect all types" : "Select all types"}
            >
              <img 
                src={selectedTypes.length === filteredTypes.length ? unselectAllIcon : selectAllIcon} 
                alt={selectedTypes.length === filteredTypes.length ? "Unselect All" : "Select All"} 
                className="w-6 h-6" 
              />
            </button>
          </div>

          {/* Types List */}
          <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-6 overflow-hidden">
            {filteredTypes.map((type, index) => (
              <div key={type}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <button
                  onClick={() => toggleType(type)}
                  className={`w-full text-left px-4 py-4 text-base font-medium transition-colors active:opacity-70 ${
                    selectedTypes.includes(type) 
                      ? "text-foreground bg-neutral-700/30" 
                      : "text-foreground"
                  }`}
                >
                  {type}
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
            Select order types to apply
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
            aria-label={selectedTypes.length === filteredTypes.length ? "Unselect all types" : "Select all types"}
          >
            <img 
              src={selectedTypes.length === filteredTypes.length ? unselectAllIcon : selectAllIcon} 
              alt={selectedTypes.length === filteredTypes.length ? "Unselect All" : "Select All"} 
              className="w-6 h-6" 
            />
          </button>
        </div>

        {/* Types List */}
        <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-8 overflow-hidden">
          {filteredTypes.map((type, index) => (
            <div key={type}>
              {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
              <button
                onClick={() => toggleType(type)}
                className={`w-full text-left px-4 py-4 text-base font-medium transition-colors active:opacity-70 ${
                  selectedTypes.includes(type) 
                    ? "text-foreground bg-neutral-700/30" 
                    : "text-foreground"
                }`}
              >
                {type}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { OrderTypeSheet };
