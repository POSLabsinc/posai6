import { useState, useMemo } from "react";
import { Search, X, ChevronRight, ChevronDown, Home, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DeliveryGuestFormProps {
  onSave: (data: DeliveryGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export interface DeliveryGuestData {
  guestName: string;
  phoneNumber: string;
  email: string;
  address: AddressData;
  notes: string;
}

interface AddressData {
  label: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

// Mock guest data for search
const mockGuests = [
  { name: "John Smith", phone: "(555) 123-4567", email: "john@example.com", address: "123 Main St, New York, NY 10001" },
  { name: "Jane Doe", phone: "(555) 987-6543", email: "jane@example.com", address: "456 Oak Ave, Brooklyn, NY 11201" },
  { name: "Mike Johnson", phone: "(555) 456-7890", email: "mike@example.com", address: "789 Pine Rd, Queens, NY 11375" },
  { name: "Sarah Williams", phone: "(555) 321-0987", email: "sarah@example.com", address: "321 Elm Blvd, Bronx, NY 10453" },
  { name: "Alexander Johnson", phone: "(897) 654-3210", email: "alexander.johnson@gmail.com", address: "555 Park Ave, Manhattan, NY 10022" },
];

// Mock address suggestions for autocomplete
const mockAddressSuggestions = [
  { label: "Office", address1: "123 Main Street", city: "Los Angeles", state: "California", zip: "90001", country: "USA" },
  { label: "Home", address1: "Main Street 123", city: "Los Angeles", state: "California", zip: "90001", country: "United States" },
  { label: "Work", address1: "456 Main Avenue", city: "Los Angeles", state: "California", zip: "90002", country: "USA" },
  { label: "Other", address1: "789 Main Boulevard", city: "Los Angeles", state: "California", zip: "90003", country: "USA" },
];

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const DeliveryGuestForm = ({ onSave, onCancel, onClose }: DeliveryGuestFormProps) => {
  const [formData, setFormData] = useState<Omit<DeliveryGuestData, 'address'> & { address: AddressData | null }>({
    guestName: "",
    phoneNumber: "",
    email: "",
    address: null,
    notes: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

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

  const addressSuggestions = useMemo(() => {
    if (!addressSearchQuery.trim()) return [];
    const query = addressSearchQuery.toLowerCase();
    return mockAddressSuggestions.filter(
      (addr) =>
        addr.address1.toLowerCase().includes(query) ||
        addr.city.toLowerCase().includes(query)
    );
  }, [addressSearchQuery]);

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

  const handleSelectAddress = (suggestion: typeof mockAddressSuggestions[0]) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        label: suggestion.label,
        address1: suggestion.address1,
        address2: "",
        city: suggestion.city,
        state: suggestion.state,
        zip: suggestion.zip,
        fullAddress: `${suggestion.address1}, ${suggestion.city} ${suggestion.state}, ${suggestion.zip} ${suggestion.country}`,
      },
    }));
    setAddressSearchQuery("");
    setShowAddressSuggestions(false);
  };

  const handleInputChange = (field: keyof Omit<DeliveryGuestData, 'address'>, value: string) => {
    if (field === "notes" && value.length > maxNotes) return;
    if (field === "phoneNumber") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressFieldChange = (field: keyof AddressData, value: string) => {
    if (!formData.address) return;
    setFormData((prev) => ({
      ...prev,
      address: prev.address ? {
        ...prev.address,
        [field]: value,
        fullAddress: field === 'address1' || field === 'city' || field === 'state' || field === 'zip'
          ? `${field === 'address1' ? value : prev.address.address1}, ${field === 'city' ? value : prev.address.city} ${field === 'state' ? value : prev.address.state}, ${field === 'zip' ? value : prev.address.zip}`
          : prev.address.fullAddress,
      } : null,
    }));
  };

  const clearAddressField = (field: keyof AddressData) => {
    if (!formData.address) return;
    handleAddressFieldChange(field, "");
  };

  const handleSave = () => {
    if (formData.guestName && formData.phoneNumber && formData.address) {
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
      onSave({
        ...formData,
        phoneNumber: cleanPhoneNumber,
        address: formData.address,
      });
    }
  };

  const removeAddress = () => {
    setFormData((prev) => ({ ...prev, address: null }));
    setIsAddressExpanded(false);
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

      {/* Guest Name and Phone Number */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Input
            placeholder="Guest Name*"
            value={formData.guestName}
            onChange={(e) => handleInputChange("guestName", e.target.value)}
            className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-md h-9">
            <span className="text-lg">🇺🇸</span>
            <span className="text-xs text-muted-foreground">+1</span>
          </div>
          <Input
            placeholder="Phone*"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            className="flex-1 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
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

      {/* Address Search Field - Always visible */}
      <div className="mb-3 relative">
        <Input
          placeholder="Search for an address..."
          value={addressSearchQuery}
          onChange={(e) => {
            setAddressSearchQuery(e.target.value);
            setShowAddressSuggestions(true);
          }}
          onFocus={() => setShowAddressSuggestions(true)}
          className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground pr-10"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center border border-white/30 rounded">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        
        {/* Address Suggestions Dropdown */}
        {showAddressSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
            {addressSuggestions.map((addr, index) => (
              <button
                key={index}
                onClick={() => handleSelectAddress(addr)}
                className="w-full px-3 py-2 text-left hover:bg-neutral-100 text-sm text-neutral-800 border-b border-neutral-100 last:border-0"
              >
                <span>{addr.address1}, {addr.city} {addr.state}, {addr.zip} {addr.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Address Display */}
      {formData.address && (
        <div className="mb-3">
          {/* Collapsed Address Display */}
          <div 
            className="bg-white/10 border border-white/20 rounded-md overflow-hidden"
          >
            <button
              onClick={() => setIsAddressExpanded(!isAddressExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{formData.address.label}</span>
                <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {formData.address.address1}, {formData.address.city} {formData.address.state}...
                </span>
              </div>
              {isAddressExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            {/* Expanded Address Details */}
            {isAddressExpanded && (
              <div className="px-3 pb-3 pt-1 border-t border-white/10">
                {/* Label */}
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{formData.address.label}</span>
                  <button
                    onClick={() => setIsAddressExpanded(false)}
                    className="ml-auto"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Address 1 */}
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Address 1</span>
                    <span className="text-sm text-foreground">{formData.address.address1}</span>
                  </div>
                  <button
                    onClick={() => clearAddressField('address1')}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Address 2 */}
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Address 2</span>
                    {formData.address.address2 ? (
                      <span className="text-sm text-foreground">{formData.address.address2}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Optional</span>
                    )}
                  </div>
                  <button
                    onClick={() => clearAddressField('address2')}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                
                {/* City */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">City</span>
                    <span className="text-sm text-foreground">{formData.address.city}</span>
                  </div>
                  <button
                    onClick={() => clearAddressField('city')}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>

                {/* Remove Address Button */}
                <button
                  onClick={removeAddress}
                  className="w-full mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove Address
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
        disabled={!formData.guestName || !formData.phoneNumber || !formData.address}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9"
      >
        Save
      </Button>
    </div>
  );
};

export default DeliveryGuestForm;
