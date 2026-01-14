import { useState, useMemo } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IOSTimePicker } from "@/components/ui/ios-time-picker";
import { formatPhoneNumber } from "@/lib/utils";

export interface CustomOrderGuestData {
  guestName: string;
  phoneNumber: string;
  email: string;
  notes: string;
  orderType: string;
  orderDescription: string;
  specialInstructions: string;
  priority: "Normal" | "Rush" | "VIP";
  estimatedCompletionTime: string;
}

interface CustomOrderGuestFormProps {
  onSave: (data: CustomOrderGuestData) => void;
  onClose: () => void;
  initialData?: CustomOrderGuestData | null;
}

// Mock guest data for search
const mockGuests = [
  { name: "John Smith", phone: "(555) 123-4567", email: "john@example.com" },
  { name: "Jane Doe", phone: "(555) 987-6543", email: "jane@example.com" },
  { name: "Mike Johnson", phone: "(555) 456-7890", email: "mike@example.com" },
  { name: "Sarah Williams", phone: "(555) 321-0987", email: "sarah@example.com" },
];

const CustomOrderGuestForm = ({ onSave, onClose, initialData }: CustomOrderGuestFormProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [guestName, setGuestName] = useState(initialData?.guestName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [orderType, setOrderType] = useState(initialData?.orderType || "");
  const [orderDescription, setOrderDescription] = useState(initialData?.orderDescription || "");
  const [specialInstructions, setSpecialInstructions] = useState(initialData?.specialInstructions || "");
  const [priority, setPriority] = useState<"Normal" | "Rush" | "VIP">(initialData?.priority || "Normal");
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState(initialData?.estimatedCompletionTime || "");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return mockGuests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(query) ||
        guest.phone.replace(/\D/g, "").includes(query.replace(/\D/g, ""))
    );
  }, [searchQuery]);

  const handleSelectGuest = (guest: typeof mockGuests[0]) => {
    setGuestName(guest.name);
    setPhoneNumber(guest.phone);
    setEmail(guest.email);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleNotesChange = (value: string) => {
    const words = countWords(value);
    if (words <= 70) {
      setNotes(value);
    }
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return "Select Time";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "Rush": return "text-yellow-400";
      case "VIP": return "text-orange-400";
      default: return "text-white";
    }
  };

  const getPriorityBadgeStyle = (p: string) => {
    switch (p) {
      case "Rush": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "VIP": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-white/10 text-white/70 border-white/20";
    }
  };

  const isFormValid = guestName.trim() !== "" && phoneNumber.trim() !== "" && orderDescription.trim() !== "";

  const handleSave = () => {
    if (!isFormValid) return;
    
    onSave({
      guestName,
      phoneNumber,
      email,
      notes,
      orderType,
      orderDescription,
      specialInstructions,
      priority,
      estimatedCompletionTime
    });
  };

  return (
    <div 
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{ background: 'rgba(117, 117, 117, 0.3)' }}
    >
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Custom Order Information</h2>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search by Guest Name or Phone Number"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
              {searchResults.map((guest, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectGuest(guest)}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-700 text-sm text-white flex flex-col"
                >
                  <span className="font-medium">{guest.name}</span>
                  <span className="text-xs text-muted-foreground">{guest.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order Type & Priority Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-white/70 mb-1 block">Order Type Label</label>
            <Input
              placeholder="e.g., Catering, Custom Cake"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">Priority</label>
            <div className="relative">
              <button
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md border ${getPriorityBadgeStyle(priority)}`}
              >
                <span className={getPriorityColor(priority)}>{priority}</span>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>
              {showPriorityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-50">
                  {(["Normal", "Rush", "VIP"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPriority(p);
                        setShowPriorityDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-white/10 first:rounded-t-md last:rounded-b-md ${getPriorityColor(p)}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Guest Name */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Guest Name *</label>
          <Input
            placeholder="Enter guest name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Phone Number *</label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-white/10 border border-white/20">
              <span className="text-lg">🇺🇸</span>
              <span className="text-white/70 text-sm">+1</span>
            </div>
            <Input
              placeholder="(XXX) XXX-XXXX"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Email</label>
          <Input
            type="email"
            placeholder="guest@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        {/* Order Description */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Order Description *</label>
          <Textarea
            placeholder="Describe the custom order in detail..."
            value={orderDescription}
            onChange={(e) => setOrderDescription(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px] resize-none"
          />
        </div>

        {/* Special Instructions */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Special Instructions</label>
          <Textarea
            placeholder="Any special handling or preparation instructions..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[80px] resize-none"
          />
        </div>

        {/* Estimated Completion Time */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Estimated Completion Time (Optional)</label>
          <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
            <PopoverTrigger asChild>
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              >
                <span className={estimatedCompletionTime ? "text-white" : "text-white/40"}>
                  {formatTimeDisplay(estimatedCompletionTime)}
                </span>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0 bg-zinc-900 border border-zinc-700 shadow-xl rounded-2xl pointer-events-auto" align="start" sideOffset={8}>
              <IOSTimePicker
                value={estimatedCompletionTime}
                onChange={(val) => {
                  setEstimatedCompletionTime(val);
                  setShowTimePicker(false);
                }}
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Additional Notes</label>
          <Textarea
            placeholder="Add any additional notes..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[80px] resize-none"
          />
          <div className="text-xs text-white/40 text-right mt-1">
            {countWords(notes)}/70 Words
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={!isFormValid}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isFormValid
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          Save Custom Order
        </button>
      </div>
    </div>
  );
};

export default CustomOrderGuestForm;
