import { useState, useMemo } from "react";
import { Search, X, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { IOSTimePicker } from "@/components/ui/ios-time-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BanquetGuestFormProps {
  onSave: (data: BanquetGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
  initialData?: BanquetGuestData | null;
}

export interface BanquetGuestData {
  guestName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  numberOfGuests: string;
  venue: string;
  address: {
    street: string;
    apt: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phoneNumber: string;
  email: string;
  notes: string;
}

const eventTypes = [
  "Birthday Party",
  "Wedding Reception",
  "Corporate Event",
  "Anniversary",
  "Graduation Party",
  "Baby Shower",
  "Engagement Party",
  "Retirement Party",
  "Holiday Party",
  "Other"
];

// Mock guest data for search
const mockGuests = [
  { name: "John Smith", phone: "(555) 123-4567", email: "john@example.com" },
  { name: "Jane Doe", phone: "(555) 987-6543", email: "jane@example.com" },
  { name: "Mike Johnson", phone: "(555) 456-7890", email: "mike@example.com" },
  { name: "Sarah Williams", phone: "(555) 321-0987", email: "sarah@example.com" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const BanquetGuestForm = ({ onSave, onCancel, onClose, initialData }: BanquetGuestFormProps) => {
  const [formData, setFormData] = useState<BanquetGuestData>({
    guestName: initialData?.guestName || "",
    eventType: initialData?.eventType || "",
    eventDate: initialData?.eventDate || "",
    eventTime: initialData?.eventTime || "",
    numberOfGuests: initialData?.numberOfGuests || "",
    venue: initialData?.venue || "",
    address: initialData?.address || {
      street: "",
      apt: "",
      city: "",
      state: "",
      zipCode: "",
    },
    phoneNumber: initialData?.phoneNumber ? formatPhoneNumber(initialData.phoneNumber) : "",
    email: initialData?.email || "",
    notes: initialData?.notes || "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const maxNotes = 70;

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
    setFormData((prev) => ({
      ...prev,
      guestName: guest.name,
      phoneNumber: guest.phone,
      email: guest.email,
    }));
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleAddressChange = (field: keyof BanquetGuestData["address"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleInputChange = (field: keyof Omit<BanquetGuestData, 'address'>, value: string) => {
    if (field === "notes" && value.length > maxNotes) return;
    if (field === "phoneNumber") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (formData.guestName && formData.eventType) {
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
      onSave({
        ...formData,
        phoneNumber: cleanPhoneNumber,
      });
    }
  };

  const wordCount = formData.notes.split(/\s+/).filter(Boolean).length;

  return (
    <div className="p-4 border-b border-sidebar-border" style={{
      background: 'rgba(117, 117, 117, 0.3)',
    }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Guest Information</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {/* Search Field */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Guest Name or Number"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          className="pl-9 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
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

      {/* Event Type and Date */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-sm h-9 text-foreground">
              <SelectValue placeholder="Event Type*" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type} className="text-white hover:bg-neutral-700">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 w-full h-9 px-3 rounded-md border bg-white/10 border-white/20 text-sm text-foreground cursor-pointer hover:bg-white/15 transition-colors",
                !formData.eventDate && "text-muted-foreground"
              )}
            >
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {formData.eventDate 
                  ? format(new Date(formData.eventDate), "MMM d, yyyy")
                  : "Select Date"
                }
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-xl rounded-2xl" align="start" sideOffset={8}>
            <CalendarComponent
              mode="single"
              selected={formData.eventDate ? new Date(formData.eventDate) : undefined}
              onSelect={(date) => {
                if (date) {
                  handleInputChange("eventDate", format(date, "yyyy-MM-dd"));
                  setDatePickerOpen(false);
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto bg-white rounded-2xl"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-semibold text-gray-900",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal text-gray-900 hover:bg-gray-100 rounded-full inline-flex items-center justify-center cursor-pointer",
                day_range_end: "day-range-end",
                day_selected: "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-500 focus:text-white rounded-full",
                day_today: "bg-gray-100 text-gray-900",
                day_outside: "text-gray-300 opacity-50",
                day_disabled: "text-gray-300 opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time and Number of Guests */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 w-full h-9 px-3 rounded-md border bg-white/10 border-white/20 text-sm text-foreground cursor-pointer hover:bg-white/15 transition-colors",
                !formData.eventTime && "text-muted-foreground"
              )}
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {formData.eventTime 
                  ? (() => {
                      const [h, m] = formData.eventTime.split(":").map(Number);
                      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      const period = h >= 12 ? "PM" : "AM";
                      return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
                    })()
                  : "Select Time"
                }
              </span>
            </button>
        </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0 bg-zinc-900 border border-zinc-700 shadow-xl rounded-2xl" align="start" sideOffset={8}>
            <IOSTimePicker
              value={formData.eventTime || "09:00"}
              onChange={(time) => handleInputChange("eventTime", time)}
              className="p-3"
            />
          </PopoverContent>
        </Popover>
        <div>
          <Input
            type="number"
            placeholder="Enter number of guests*"
            value={formData.numberOfGuests}
            onChange={(e) => handleInputChange("numberOfGuests", e.target.value)}
            className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Venue Name */}
      <div className="mb-3">
        <Input
          placeholder="Venue Name"
          value={formData.venue}
          onChange={(e) => handleInputChange("venue", e.target.value)}
          className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Address Section - USA Format */}
      <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">Venue Address</h4>
        
        {/* Address Line 1 */}
        <Input
          placeholder="Address Line 1*"
          value={formData.address.street}
          onChange={(e) => handleAddressChange("street", e.target.value)}
          className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
        />
        
        {/* Address Line 2 */}
        <Input
          placeholder="Address Line 2 (Apt, Suite, etc.)"
          value={formData.address.apt}
          onChange={(e) => handleAddressChange("apt", e.target.value)}
          className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
        />
        
        {/* City and State */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="City*"
            value={formData.address.city}
            onChange={(e) => handleAddressChange("city", e.target.value)}
            className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
          />
          <Select
            value={formData.address.state}
            onValueChange={(value) => handleAddressChange("state", value)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-sm h-9 text-foreground">
              <SelectValue placeholder="State*" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700 max-h-60">
              {US_STATES.map((state) => (
                <SelectItem key={state} value={state} className="text-white hover:bg-neutral-700">
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* ZIP Code */}
        <Input
          placeholder="ZIP Code*"
          value={formData.address.zipCode}
          onChange={(e) => handleAddressChange("zipCode", e.target.value)}
          className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground w-1/2"
        />
      </div>

      {/* Guest Name and Phone Number */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Guest Name*"
            value={formData.guestName}
            onChange={(e) => handleInputChange("guestName", e.target.value)}
            className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-md h-9">
          <span className="text-lg">🇺🇸</span>
          <span className="text-xs text-muted-foreground">+1</span>
        </div>
        <Input
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          className="flex-1 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Email */}
      <div className="mb-3">
        <Input
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Notes */}
      <div className="mb-3 relative">
        <textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-md text-sm p-2 text-foreground placeholder:text-muted-foreground resize-none h-16 outline-none focus:border-primary"
        />
        <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
          {wordCount}/{maxNotes} Words
        </span>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!formData.guestName || !formData.eventType}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9"
      >
        Save
      </Button>
    </div>
  );
};

export default BanquetGuestForm;
