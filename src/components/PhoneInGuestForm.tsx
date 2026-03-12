import { useState } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IOSTimePicker } from "@/components/ui/ios-time-picker";
import { formatPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from "@/lib/utils";
import { Customer } from "@/services/customerService";
import { useCustomerSearch, usePhoneConflict } from "@/hooks/useCustomerSearch";
import PhoneConflictDialog from "@/components/PhoneConflictDialog";

export interface PhoneInGuestData {
  guestName: string;
  phoneNumber: string;
  callbackNumber: string;
  email: string;
  notes: string;
  orderFulfillmentType: "Pickup" | "Delivery";
  pickupTime: string;
  address?: {
    street: string;
    apt: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
}

interface PhoneInGuestFormProps {
  onSave: (data: PhoneInGuestData) => void;
  onClose: () => void;
  initialData?: PhoneInGuestData | null;
}

const PhoneInGuestForm = ({ onSave, onClose, initialData }: PhoneInGuestFormProps) => {
  const { searchQuery, setSearchQuery, searchResults, showSearchResults, setShowSearchResults } = useCustomerSearch();
  const [guestName, setGuestName] = useState(initialData?.guestName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");
  const [callbackNumber, setCallbackNumber] = useState(initialData?.callbackNumber || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [orderFulfillmentType, setOrderFulfillmentType] = useState<"Pickup" | "Delivery">(
    initialData?.orderFulfillmentType || "Pickup"
  );
  const [pickupTime, setPickupTime] = useState(initialData?.pickupTime || "12:00");
  const [showFulfillmentDropdown, setShowFulfillmentDropdown] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [street, setStreet] = useState(initialData?.address?.street || "");
  const [apt, setApt] = useState(initialData?.address?.apt || "");
  const [city, setCity] = useState(initialData?.address?.city || "");
  const [state, setState] = useState(initialData?.address?.state || "");
  const [zipCode, setZipCode] = useState(initialData?.address?.zipCode || "");

  const { showConflictDialog, setShowConflictDialog, conflictCustomer, clearConflict } = usePhoneConflict(phoneNumber, guestName);

  const handlePhoneChange = (value: string, setter: (val: string) => void) => {
    const formatted = formatPhoneNumber(value);
    setter(formatted);
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


  const handleSelectGuest = (guest: Customer) => {
    setGuestName(guest.name);
    setPhoneNumber(guest.phone);
    setEmail(guest.email || "");
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return "Select Time";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const phoneError = getPhoneValidationError(phoneNumber);
  const callbackPhoneError = getPhoneValidationError(callbackNumber);
  const isFormValid = guestName.trim() !== "" && isValidPhoneNumber(phoneNumber);

  const handleSave = () => {
    if (!isFormValid) return;
    
    const fullAddress = orderFulfillmentType === "Delivery" 
      ? `${street}${apt ? `, ${apt}` : ""}, ${city}, ${state} ${zipCode}`.trim()
      : "";

    onSave({
      guestName,
      phoneNumber: phoneNumber.replace(/\D/g, ""),
      callbackNumber: callbackNumber.replace(/\D/g, ""),
      email,
      notes,
      orderFulfillmentType,
      pickupTime,
      address: orderFulfillmentType === "Delivery" ? {
        street,
        apt,
        city,
        state,
        zipCode,
        fullAddress
      } : undefined
    });
  };

  const handleUseExisting = () => {
    if (conflictCustomer) {
      setGuestName(conflictCustomer.name);
      setEmail(conflictCustomer.email || email);
    }
    clearConflict();
  };
  const handleUpdateName = () => clearConflict();
  const handleAddFamilyMember = () => clearConflict();
  const handleCreateNew = () => {
    setPhoneNumber("");
    clearConflict();
  };

  return (
    <div className="flex flex-col h-full rounded-b-lg overflow-hidden bg-neutral-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 md:border-b-0">
        <h2 className="text-lg font-semibold text-white">Phone-In Guest Information</h2>
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

        {/* Guest Name */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Guest Name *</label>
          <Input
            placeholder="Enter guest name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Phone Number *</label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700">
              <span className="text-lg">🇺🇸</span>
              <span className="text-neutral-400 text-sm">+1</span>
            </div>
            <Input
              placeholder="(XXX) XXX-XXXX"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value, setPhoneNumber)}
              className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Callback Number */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Callback Number (Optional)</label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700">
              <span className="text-lg">🇺🇸</span>
              <span className="text-neutral-400 text-sm">+1</span>
            </div>
            <Input
              placeholder="(XXX) XXX-XXXX"
              value={callbackNumber}
              onChange={(e) => handlePhoneChange(e.target.value, setCallbackNumber)}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Order Fulfillment Type */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Order Fulfillment Type</label>
          <div className="relative">
            <button
              onClick={() => setShowFulfillmentDropdown(!showFulfillmentDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white"
            >
              <span>{orderFulfillmentType}</span>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>
            {showFulfillmentDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-50">
                {["Pickup", "Delivery"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setOrderFulfillmentType(type as "Pickup" | "Delivery");
                      setShowFulfillmentDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-white hover:bg-white/10 first:rounded-t-md last:rounded-b-md"
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pickup Time */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">
            {orderFulfillmentType === "Pickup" ? "Pickup Time" : "Delivery Time"} (Optional)
          </label>
          <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
            <PopoverTrigger asChild>
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white"
              >
                <span className={pickupTime ? "text-white" : "text-neutral-500"}>
                  {formatTimeDisplay(pickupTime)}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0 bg-zinc-900 border border-zinc-700 shadow-xl rounded-2xl pointer-events-auto" align="start" sideOffset={8}>
              <IOSTimePicker
                value={pickupTime}
                onChange={(val) => {
                  setPickupTime(val);
                  setShowTimePicker(false);
                }}
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Delivery Address Fields */}
        {orderFulfillmentType === "Delivery" && (
          <div className="space-y-3 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <h3 className="text-sm font-medium text-white/90">Delivery Address</h3>
            
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Street Address</label>
              <Input
                placeholder="123 Main Street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Apt/Suite/Unit</label>
              <Input
                placeholder="Apt 4B"
                value={apt}
                onChange={(e) => setApt(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">City</label>
                <Input
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">State</label>
                <Input
                  placeholder="CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Zip Code</label>
                <Input
                  placeholder="90210"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-sm text-neutral-500 mb-1 block">Notes</label>
          <Textarea
            placeholder="Add any special instructions..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 min-h-[80px] resize-none"
          />
          <div className="text-xs text-neutral-500 text-right mt-1">
            {countWords(notes)}/70 Words
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
          Save Guest Info
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
        newName={guestName}
        onUseExisting={handleUseExisting}
        onUpdateName={handleUpdateName}
        onAddFamilyMember={handleAddFamilyMember}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
};

export default PhoneInGuestForm;
