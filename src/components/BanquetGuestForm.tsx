import { useState, useMemo } from "react";
import { Search, X, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { IOSTimePicker } from "@/components/ui/ios-time-picker";
import { format } from "date-fns";
import { cn, formatPhoneNumber } from "@/lib/utils";

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

  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const isFormValid = formData.guestName && formData.eventType;

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden bg-neutral-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 md:border-b-0">
        <h2 className="text-lg font-semibold text-white">Banquet Guest Information</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Search by Guest Name or Phone Number"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-neutral-500 mb-1 block">Event Type *</label>
            <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue placeholder="Select event type" />
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
          <div>
            <label className="text-sm text-neutral-500 mb-1 block">Event Date</label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 w-full h-10 px-3 rounded-md border bg-neutral-800 border-neutral-700 text-sm text-white cursor-pointer hover:bg-neutral-700 transition-colors",
                    !formData.eventDate && "text-neutral-500"
                  )}
                >
                  <Calendar className="w-4 h-4 text-neutral-500" />
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
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Time and Number of Guests */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-neutral-500 mb-1 block">Event Time</label>
            <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 w-full h-10 px-3 rounded-md border bg-neutral-800 border-neutral-700 text-sm text-white cursor-pointer hover:bg-neutral-700 transition-colors",
                    !formData.eventTime && "text-neutral-500"
                  )}
                >
                  <Clock className="w-4 h-4 text-neutral-500" />
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
              <PopoverContent 
                className="w-[200px] p-2 bg-zinc-900 border border-zinc-700 shadow-xl rounded-2xl pointer-events-auto" 
                align="start" 
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <IOSTimePicker
                  value={formData.eventTime || "09:00"}
                  onChange={(time) => handleInputChange("eventTime", time)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm text-neutral-500 mb-1 block">Number of Guests</label>
            <Input
              type="number"
              placeholder="Enter number"
              value={formData.numberOfGuests}
              onChange={(e) => handleInputChange("numberOfGuests", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Guest Name */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Guest Name *</label>
          <Input
            placeholder="Enter guest name"
            value={formData.guestName}
            onChange={(e) => handleInputChange("guestName", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Venue Name */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Venue Name</label>
          <Input
            placeholder="Enter venue name"
            value={formData.venue}
            onChange={(e) => handleInputChange("venue", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Address Section */}
        <div className="space-y-3 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
          <h4 className="text-sm font-medium text-white/90">Venue Address</h4>
          
          <Input
            placeholder="Address Line 1"
            value={formData.address.street}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
          
          <Input
            placeholder="Address Line 2 (Apt, Suite, etc.)"
            value={formData.address.apt}
            onChange={(e) => handleAddressChange("apt", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="City"
              value={formData.address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
            <Select
              value={formData.address.state}
              onValueChange={(value) => handleAddressChange("state", value)}
            >
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue placeholder="State" />
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
          
          <Input
            placeholder="ZIP Code"
            value={formData.address.zipCode}
            onChange={(e) => handleAddressChange("zipCode", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 w-1/2"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Phone Number</label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700">
              <span className="text-lg">🇺🇸</span>
              <span className="text-neutral-400 text-sm">+1</span>
            </div>
            <Input
              placeholder="(XXX) XXX-XXXX"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Email</label>
          <Input
            type="email"
            placeholder="guest@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Notes</label>
          <textarea
            placeholder="Add any special instructions..."
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md text-sm p-3 text-white placeholder:text-neutral-500 resize-none min-h-[80px] outline-none focus:border-primary"
          />
          <div className="text-xs text-neutral-500 text-right mt-1">
            {countWords(formData.notes)}/70 Words
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={handleSave}
          disabled={!isFormValid}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isFormValid
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          Save Banquet Info
        </button>
      </div>
    </div>
  );
};

export default BanquetGuestForm;