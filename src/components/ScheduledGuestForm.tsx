import React, { useState, useMemo } from "react";
import { Search, X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IOSTimePicker } from "@/components/ui/ios-time-picker";
import { format, addDays } from "date-fns";

export interface ScheduledGuestData {
  guestName: string;
  phoneNumber: string;
  email: string;
  notes: string;
  scheduledDate: Date | null;
  scheduledTime: string;
  orderFulfillmentType: "Pickup" | "Delivery";
  address?: {
    street: string;
    apt: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
}

interface ScheduledGuestFormProps {
  onSave: (data: ScheduledGuestData) => void;
  onCancel?: () => void;
  onClose: () => void;
  initialData?: ScheduledGuestData | null;
}

const mockGuests = [
  { name: "John Smith", phone: "(555) 123-4567", email: "john@email.com" },
  { name: "Jane Doe", phone: "(555) 234-5678", email: "jane@email.com" },
  { name: "Bob Wilson", phone: "(555) 345-6789", email: "bob@email.com" },
  { name: "Alice Brown", phone: "(555) 456-7890", email: "alice@email.com" },
];

const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers.length > 0 ? `(${numbers}` : "";
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

const getCurrentTimeRounded = (): string => {
  const now = new Date();
  const minutes = Math.ceil(now.getMinutes() / 15) * 15;
  now.setMinutes(minutes);
  now.setSeconds(0);
  const hours = now.getHours().toString().padStart(2, '0');
  const mins = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const ScheduledGuestForm: React.FC<ScheduledGuestFormProps> = ({
  onSave,
  onCancel,
  onClose,
  initialData,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<ScheduledGuestData>(
    initialData || {
      guestName: "",
      phoneNumber: "",
      email: "",
      notes: "",
      scheduledDate: addDays(new Date(), 1),
      scheduledTime: getCurrentTimeRounded(),
      orderFulfillmentType: "Pickup",
      address: {
        street: "",
        apt: "",
        city: "",
        state: "",
        zipCode: "",
        fullAddress: "",
      },
    }
  );
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return mockGuests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(query) ||
        guest.phone.includes(query)
    );
  }, [searchQuery]);

  const handleSelectGuest = (guest: (typeof mockGuests)[0]) => {
    setFormData((prev) => ({
      ...prev,
      guestName: guest.name,
      phoneNumber: guest.phone,
      email: guest.email,
    }));
    setSearchQuery("");
  };

  const handleInputChange = (
    field: keyof ScheduledGuestData,
    value: string
  ) => {
    if (field === "phoneNumber") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
    } else if (field === "notes") {
      const words = value.split(/\s+/).filter((w) => w.length > 0);
      if (words.length <= 70) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address!,
        [field]: value,
        fullAddress: field === "street" 
          ? `${value}, ${prev.address?.city || ""}, ${prev.address?.state || ""} ${prev.address?.zipCode || ""}`
          : `${prev.address?.street || ""}, ${field === "city" ? value : prev.address?.city || ""}, ${field === "state" ? value : prev.address?.state || ""} ${field === "zipCode" ? value : prev.address?.zipCode || ""}`,
      },
    }));
  };

  const handleSave = () => {
    if (formData.guestName && formData.scheduledDate && formData.scheduledTime) {
      const cleanedData = {
        ...formData,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
      };
      onSave(cleanedData);
    }
  };

  const wordCount = formData.notes
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const isFormValid = formData.guestName && formData.scheduledDate && formData.scheduledTime;

  return (
    <div className="flex flex-col bg-white/5 rounded-xl border border-white/10 max-h-[calc(100vh-200px)]">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <h3 className="text-white font-medium text-lg">Scheduled Order</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search by guest name or phone number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-white/20 rounded-lg overflow-hidden z-10">
            {searchResults.map((guest, index) => (
              <button
                key={index}
                onClick={() => handleSelectGuest(guest)}
                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors"
              >
                <div className="text-white font-medium">{guest.name}</div>
                <div className="text-white/60 text-sm">{guest.phone}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guest Name */}
      <div>
        <label className="text-white/60 text-sm mb-1 block">
          Guest Name <span className="text-red-400">*</span>
        </label>
        <Input
          placeholder="Enter guest name"
          value={formData.guestName}
          onChange={(e) => handleInputChange("guestName", e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </div>

      {/* Schedule Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        {/* Date Picker */}
        <div>
          <label className="text-white/60 text-sm mb-1 block">
            Scheduled Date <span className="text-red-400">*</span>
          </label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-white/60" />
                {formData.scheduledDate ? (
                  format(formData.scheduledDate, "EEE, MMM d, yyyy")
                ) : (
                  <span className="text-white/40">Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/20 pointer-events-auto" align="start">
              <Calendar
                mode="single"
                selected={formData.scheduledDate || undefined}
                onSelect={(date) => {
                  setFormData((prev) => ({ ...prev, scheduledDate: date || null }));
                  setDateOpen(false);
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="bg-zinc-900 text-white pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Picker */}
        <div>
          <label className="text-white/60 text-sm mb-1 block">
            Scheduled Time <span className="text-red-400">*</span>
          </label>
          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <Clock className="mr-2 h-4 w-4 text-white/60" />
                {formData.scheduledTime ? (
                  formatTime12Hour(formData.scheduledTime)
                ) : (
                  <span className="text-white/40">Pick a time</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0 bg-zinc-900 border border-zinc-700 shadow-xl rounded-2xl pointer-events-auto" align="start" sideOffset={8}>
              <IOSTimePicker
                value={formData.scheduledTime}
                onChange={(time) => {
                  setFormData((prev) => ({ ...prev, scheduledTime: time }));
                }}
                className="p-3"
              />
              <div className="p-2 border-t border-white/10">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setTimeOpen(false)}
                >
                  Confirm
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Order Type Selection */}
      <div>
        <label className="text-white/60 text-sm mb-1 block">Order Type</label>
        <Select
          value={formData.orderFulfillmentType}
          onValueChange={(value: "Pickup" | "Delivery") =>
            setFormData((prev) => ({ ...prev, orderFulfillmentType: value }))
          }
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-white/20">
            <SelectItem value="Pickup" className="text-white hover:bg-white/10">
              Pickup
            </SelectItem>
            <SelectItem value="Delivery" className="text-white hover:bg-white/10">
              Delivery
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delivery Address (conditional) */}
      {formData.orderFulfillmentType === "Delivery" && (
        <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white/80 text-sm font-medium">Delivery Address</h4>
          
          {/* Address Line 1 */}
          <Input
            placeholder="Address Line 1*"
            value={formData.address?.street || ""}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 text-sm"
          />
          
          {/* Address Line 2 */}
          <Input
            placeholder="Address Line 2 (Apt, Suite, etc.)"
            value={formData.address?.apt || ""}
            onChange={(e) => handleAddressChange("apt", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 text-sm"
          />
          
          {/* City and State */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="City*"
              value={formData.address?.city || ""}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 text-sm"
            />
            <Select
              value={formData.address?.state || ""}
              onValueChange={(value) => handleAddressChange("state", value)}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-sm">
                <SelectValue placeholder="State*" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-white/20 max-h-60">
                {["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"].map((state) => (
                  <SelectItem key={state} value={state} className="text-white hover:bg-white/10">
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* ZIP Code */}
          <Input
            placeholder="ZIP Code*"
            value={formData.address?.zipCode || ""}
            onChange={(e) => handleAddressChange("zipCode", e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 text-sm w-1/2"
          />
        </div>
      )}

      {/* Phone Number */}
      <div>
        <label className="text-white/60 text-sm mb-1 block">Phone Number</label>
        <Input
          placeholder="(555) 123-4567"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-white/60 text-sm mb-1 block">Email</label>
        <Input
          placeholder="guest@email.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-white/60 text-sm mb-1 block">Notes</label>
        <textarea
          placeholder="Add any special instructions..."
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          className="w-full h-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 resize-none"
        />
        <div className="text-right text-white/40 text-xs mt-1">
          {wordCount}/70 Words
        </div>
      </div>
      </div>

      {/* Fixed Footer */}
      <div className="pt-4 pb-6 px-4 flex-shrink-0">
        <Button
          onClick={handleSave}
          disabled={!isFormValid}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-lg font-medium"
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default ScheduledGuestForm;
