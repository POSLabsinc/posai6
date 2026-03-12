import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IOSTimePicker } from "@/components/ui/ios-time-picker";
import { format, addDays } from "date-fns";
import { formatPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from "@/lib/utils";
import { Customer } from "@/services/customerService";
import { useCustomerSearch, usePhoneConflict } from "@/hooks/useCustomerSearch";
import PhoneConflictDialog from "@/components/PhoneConflictDialog";

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
  const { searchQuery, setSearchQuery, searchResults, showSearchResults, setShowSearchResults } = useCustomerSearch();
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

  const { showConflictDialog, setShowConflictDialog, conflictCustomer, setConflictCustomer, clearConflict } = usePhoneConflict(formData.phoneNumber, formData.guestName);

  const handleSelectGuest = (guest: Customer) => {
    setFormData((prev) => ({
      ...prev,
      guestName: guest.name,
      phoneNumber: guest.phone,
      email: guest.email || "",
    }));
    setSearchQuery("");
    setShowSearchResults(false);
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

  const phoneError = getPhoneValidationError(formData.phoneNumber);
  
  const handleSave = () => {
    // Phone is optional for scheduled, but if provided must be valid
    const phoneValid = !formData.phoneNumber || isValidPhoneNumber(formData.phoneNumber);
    if (formData.guestName && formData.scheduledDate && formData.scheduledTime && phoneValid) {
      const cleanedData = {
        ...formData,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
      };
      onSave(cleanedData);
    }
  };

  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  // Conflict resolution handlers
  const handleUseExisting = () => {
    if (conflictCustomer) {
      setFormData((prev) => ({
        ...prev,
        guestName: conflictCustomer.name,
        email: conflictCustomer.email || prev.email,
      }));
    }
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const handleUpdateName = () => {
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const handleAddFamilyMember = () => {
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const handleCreateNew = () => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: "",
    }));
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const isFormValid = formData.guestName && formData.scheduledDate && formData.scheduledTime;

  return (
    <div className="flex flex-col h-full rounded-b-lg overflow-hidden bg-neutral-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 md:border-b-0">
        <h2 className="text-lg font-semibold text-white">Scheduled Order Information</h2>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-neutral-400" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Search */}
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-white/20 rounded-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
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
          <label className="text-sm text-neutral-500 mb-1 block">
            Guest Name <span className="text-red-400">*</span>
          </label>
          <Input
            placeholder="Enter guest name"
            value={formData.guestName}
            onChange={(e) => handleInputChange("guestName", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Schedule Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-neutral-500 mb-1 block">
              Scheduled Date <span className="text-red-400">*</span>
            </label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:text-white overflow-hidden"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <span className="truncate">
                    {formData.scheduledDate ? (
                      format(formData.scheduledDate, "MMM d, yyyy")
                    ) : (
                      <span className="text-neutral-500">Pick a date</span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-900 border-neutral-700 pointer-events-auto" align="start">
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

          <div>
            <label className="text-sm text-neutral-500 mb-1 block">
              Scheduled Time <span className="text-red-400">*</span>
            </label>
            <Popover open={timeOpen} onOpenChange={setTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:text-white"
                >
                  <Clock className="mr-2 h-4 w-4 text-neutral-500" />
                  {formData.scheduledTime ? (
                    formatTime12Hour(formData.scheduledTime)
                  ) : (
                    <span className="text-neutral-500">Pick a time</span>
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
          <label className="text-sm text-neutral-500 mb-1 block">Order Type</label>
          <Select
            value={formData.orderFulfillmentType}
            onValueChange={(value: "Pickup" | "Delivery") =>
              setFormData((prev) => ({ ...prev, orderFulfillmentType: value }))
            }
          >
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-neutral-700">
              <SelectItem value="Pickup" className="text-white hover:bg-neutral-700">
                Pickup
              </SelectItem>
              <SelectItem value="Delivery" className="text-white hover:bg-neutral-700">
                Delivery
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delivery Address (conditional) */}
        {formData.orderFulfillmentType === "Delivery" && (
          <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
            <h4 className="text-sm font-medium text-white/90">Delivery Address</h4>
            
            <Input
              placeholder="Address Line 1*"
              value={formData.address?.street || ""}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
            
            <Input
              placeholder="Address Line 2 (Apt, Suite, etc.)"
              value={formData.address?.apt || ""}
              onChange={(e) => handleAddressChange("apt", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="City*"
                value={formData.address?.city || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
              <Select
                value={formData.address?.state || ""}
                onValueChange={(value) => handleAddressChange("state", value)}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="State*" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-neutral-700 max-h-60">
                  {["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"].map((state) => (
                    <SelectItem key={state} value={state} className="text-white hover:bg-neutral-700">
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Input
              placeholder="ZIP Code*"
              value={formData.address?.zipCode || ""}
              onChange={(e) => handleAddressChange("zipCode", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 w-1/2"
            />
          </div>
        )}

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
          Save Scheduled Order
        </button>
      </div>

      {/* Phone Conflict Dialog */}
      <PhoneConflictDialog
        isOpen={showConflictDialog}
        onClose={() => {
          setShowConflictDialog(false);
          setConflictCustomer(null);
        }}
        existingCustomer={conflictCustomer}
        newName={formData.guestName}
        onUseExisting={handleUseExisting}
        onUpdateName={handleUpdateName}
        onAddFamilyMember={handleAddFamilyMember}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
};

export default ScheduledGuestForm;
