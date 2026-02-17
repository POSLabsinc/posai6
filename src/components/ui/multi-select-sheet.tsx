import { useState, useEffect } from "react";
import { Search, Mic } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import selectAllIcon from "@/assets/icons/select-all.png";
import unselectAllIcon from "@/assets/icons/unselect-all.png";

interface MultiSelectSheetProps {
  isOpen: boolean;
  onClose: (selectedItems: string[]) => void;
  initialSelected?: string[];
  options: string[];
  title: string;
  singleSelect?: boolean;
}

const MultiSelectSheet = ({
  isOpen,
  onClose,
  initialSelected = [],
  options,
  title,
  singleSelect = false,
}: MultiSelectSheetProps) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelected);

  // Sync with initialSelected when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems(initialSelected);
    }
  }, [isOpen, initialSelected]);

  // Apply search filter
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleItem = (item: string) => {
    if (singleSelect) {
      setSearchQuery("");
      onClose([item]);
      return;
    }
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredOptions.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredOptions]);
    }
  };

  const handleClose = () => {
    const result = [...selectedItems];
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
              {title}
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
            {!singleSelect && (
              <button
                onClick={handleSelectAll}
                className="p-1 active:opacity-70"
                aria-label={selectedItems.length === filteredOptions.length ? "Unselect all" : "Select all"}
              >
                <img
                  src={selectedItems.length === filteredOptions.length ? unselectAllIcon : selectAllIcon}
                  alt={selectedItems.length === filteredOptions.length ? "Unselect All" : "Select All"}
                  className="w-6 h-6"
                />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-6 overflow-hidden max-h-[300px] overflow-y-auto scrollbar-hide">
            {filteredOptions.map((option, index) => (
              <div key={option}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <button
                  onClick={() => toggleItem(option)}
                  className={`w-full text-left px-4 py-4 text-base font-medium transition-colors active:opacity-70 ${
                    selectedItems.includes(option)
                      ? "text-foreground bg-neutral-700/30"
                      : "text-foreground"
                  }`}
                >
                  {option}
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
            {title}
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
            {!singleSelect && (
              <button
                onClick={handleSelectAll}
                className="p-1 active:opacity-70"
                aria-label={selectedItems.length === filteredOptions.length ? "Unselect all" : "Select all"}
              >
                <img
                  src={selectedItems.length === filteredOptions.length ? unselectAllIcon : selectAllIcon}
                  alt={selectedItems.length === filteredOptions.length ? "Unselect All" : "Select All"}
                  className="w-6 h-6"
                />
              </button>
            )}
        </div>

        {/* Options List */}
        <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-8 overflow-hidden max-h-[40vh] overflow-y-auto scrollbar-hide">
          {filteredOptions.map((option, index) => (
            <div key={option}>
              {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
              <button
                onClick={() => toggleItem(option)}
                className={`w-full text-left px-4 py-4 text-base font-medium transition-colors active:opacity-70 ${
                  selectedItems.includes(option)
                    ? "text-foreground bg-neutral-700/30"
                    : "text-foreground"
                }`}
              >
                {option}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { MultiSelectSheet };
