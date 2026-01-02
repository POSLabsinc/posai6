import { useState } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IOSTimePicker } from "@/components/ui/ios-time-picker";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [guestName, setGuestName] = useState(initialData?.guestName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");
  const [callbackNumber, setCallbackNumber] = useState(initialData?.callbackNumber || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [orderFulfillmentType, setOrderFulfillmentType] = useState<"Pickup" | "Delivery">(
    initialData?.orderFulfillmentType || "Pickup"
  );
  const [pickupTime, setPickupTime] = useState(initialData?.pickupTime || "");
  const [showFulfillmentDropdown, setShowFulfillmentDropdown] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Address fields for delivery
  const [street, setStreet] = useState(initialData?.address?.street || "");
  const [apt, setApt] = useState(initialData?.address?.apt || "");
  const [city, setCity] = useState(initialData?.address?.city || "");
  const [state, setState] = useState(initialData?.address?.state || "");
  const [zipCode, setZipCode] = useState(initialData?.address?.zipCode || "");

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

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

  const formatTimeDisplay = (time: string) => {
    if (!time) return "Select Time";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isFormValid = guestName.trim() !== "" && phoneNumber.trim() !== "";

  const handleSave = () => {
    if (!isFormValid) return;
    
    const fullAddress = orderFulfillmentType === "Delivery" 
      ? `${street}${apt ? `, ${apt}` : ""}, ${city}, ${state} ${zipCode}`.trim()
      : "";

    onSave({
      guestName,
      phoneNumber,
      callbackNumber,
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

  return (
    <div 
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{ background: 'rgba(117, 117, 117, 0.3)' }}
    >
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Phone-In Guest Information</h2>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
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
              onChange={(e) => handlePhoneChange(e.target.value, setPhoneNumber)}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Callback Number */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Callback Number (Optional)</label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-white/10 border border-white/20">
              <span className="text-lg">🇺🇸</span>
              <span className="text-white/70 text-sm">+1</span>
            </div>
            <Input
              placeholder="(XXX) XXX-XXXX"
              value={callbackNumber}
              onChange={(e) => handlePhoneChange(e.target.value, setCallbackNumber)}
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

        {/* Order Fulfillment Type */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Order Fulfillment Type</label>
          <div className="relative">
            <button
              onClick={() => setShowFulfillmentDropdown(!showFulfillmentDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
            >
              <span>{orderFulfillmentType}</span>
              <ChevronDown className="w-4 h-4 text-white/70" />
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
          <label className="text-sm text-white/70 mb-1 block">
            {orderFulfillmentType === "Pickup" ? "Pickup Time" : "Delivery Time"} (Optional)
          </label>
          <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
            <PopoverTrigger asChild>
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              >
                <span className={pickupTime ? "text-white" : "text-white/40"}>
                  {formatTimeDisplay(pickupTime)}
                </span>
                <ChevronDown className="w-4 h-4 text-white/70" />
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
          <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-white/90">Delivery Address</h3>
            
            <div>
              <label className="text-xs text-white/60 mb-1 block">Street Address</label>
              <Input
                placeholder="123 Main Street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 mb-1 block">Apt/Suite/Unit</label>
              <Input
                placeholder="Apt 4B"
                value={apt}
                onChange={(e) => setApt(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-white/60 mb-1 block">City</label>
                <Input
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">State</label>
                <Input
                  placeholder="CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Zip Code</label>
                <Input
                  placeholder="90210"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Notes</label>
          <Textarea
            placeholder="Add any special instructions..."
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
          Save Guest Info
        </button>
      </div>
    </div>
  );
};

export default PhoneInGuestForm;
