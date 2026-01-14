import { useState, useMemo } from "react";
import { Search, X, ChevronRight, ChevronDown, Home, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";

interface DeliveryGuestFormProps {
  onSave: (data: DeliveryGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
  initialData?: DeliveryGuestData | null;
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

const DeliveryGuestForm = ({ onSave, onCancel, onClose, initialData }: DeliveryGuestFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<DeliveryGuestData, 'address'> & { address: AddressData | null }>({
    guestName: initialData?.guestName || "",
    phoneNumber: initialData?.phoneNumber ? formatPhoneNumber(initialData.phoneNumber) : "",
    email: initialData?.email || "",
    address: initialData?.address || null,
    notes: initialData?.notes || "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding API to get address from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            
            const address1 = [address.house_number, address.road].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || '';
            const city = address.city || address.town || address.village || address.municipality || '';
            const state = address.state || '';
            const zip = address.postcode || '';
            
            setFormData((prev) => ({
              ...prev,
              address: {
                label: "Current Location",
                address1: address1,
                address2: "",
                city: city,
                state: state,
                zip: zip,
                fullAddress: data.display_name || `${address1}, ${city} ${state}, ${zip}`,
              },
            }));
            
            toast({
              title: "Location found",
              description: "Your current address has been added.",
            });
          } else {
            throw new Error("Failed to fetch address");
          }
        } catch (error) {
          // Fallback: Set coordinates as address
          setFormData((prev) => ({
            ...prev,
            address: {
              label: "Current Location",
              address1: `Lat: ${latitude.toFixed(6)}`,
              address2: `Lng: ${longitude.toFixed(6)}`,
              city: "",
              state: "",
              zip: "",
              fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            },
          }));
          
          toast({
            title: "Location found",
            description: "Coordinates captured. Please enter the full address manually.",
          });
        }
        
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = "Unable to retrieve your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const wordCount = formData.notes.split(/\s+/).filter(Boolean).length;

  // Initialize address fields if not set
  const initializeAddressFields = () => {
    if (!formData.address) {
      setFormData((prev) => ({
        ...prev,
        address: {
          label: "",
          address1: "",
          address2: "",
          city: "",
          state: "",
          zip: "",
          fullAddress: "",
        },
      }));
    }
  };

  // Call on mount to ensure address fields are available
  useState(() => {
    if (!formData.address) {
      initializeAddressFields();
    }
  });

  return (
    <div className="p-4 border-b border-sidebar-border flex flex-col" style={{
      background: 'rgba(117, 117, 117, 0.3)',
      maxHeight: '100%',
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
      
      {/* Scrollable Content */}
      <div className="overflow-y-auto pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: 'calc(100vh - 280px)' }}>
        <style>{`.delivery-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="delivery-scroll">
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

          {/* Guest Name */}
          <div className="mb-3">
            <Input
              placeholder="Guest Name*"
              value={formData.guestName}
              onChange={(e) => handleInputChange("guestName", e.target.value)}
              className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Phone Number */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center gap-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-md h-9 flex-shrink-0">
              <span className="text-lg">🇺🇸</span>
              <span className="text-xs text-muted-foreground">+1</span>
            </div>
            <Input
              placeholder="Phone Number*"
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

          {/* Address Search Field */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for an address..."
              value={addressSearchQuery}
              onChange={(e) => {
                setAddressSearchQuery(e.target.value);
                setShowAddressSuggestions(true);
              }}
              onFocus={() => setShowAddressSuggestions(true)}
              className="pl-9 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
            />
            
            {/* Address Suggestions Dropdown */}
            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {addressSuggestions.map((addr, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAddress(addr)}
                    className="w-full px-3 py-2 text-left hover:bg-neutral-700 text-sm text-white border-b border-neutral-700 last:border-0"
                  >
                    <span>{addr.address1}, {addr.city} {addr.state}, {addr.zip}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Address Fields - US Format (Always Visible) */}
          <div className="mb-3 bg-white/10 border border-white/20 rounded-md p-3 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Delivery Address</span>
            </div>
            
            {/* Street Address */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Street Address*</label>
              <Input
                placeholder="123 Main Street"
                value={formData.address?.address1 || ""}
                onChange={(e) => {
                  if (!formData.address) initializeAddressFields();
                  handleAddressFieldChange('address1', e.target.value);
                }}
                className="bg-white/5 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            {/* Apt/Suite/Unit */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Apt, Suite, Unit (Optional)</label>
              <Input
                placeholder="Apt 4B"
                value={formData.address?.address2 || ""}
                onChange={(e) => {
                  if (!formData.address) initializeAddressFields();
                  handleAddressFieldChange('address2', e.target.value);
                }}
                className="bg-white/5 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            {/* City */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">City*</label>
              <Input
                placeholder="New York"
                value={formData.address?.city || ""}
                onChange={(e) => {
                  if (!formData.address) initializeAddressFields();
                  handleAddressFieldChange('city', e.target.value);
                }}
                className="bg-white/5 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            {/* State and ZIP in one row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">State*</label>
                <Input
                  placeholder="NY"
                  value={formData.address?.state || ""}
                  onChange={(e) => {
                    if (!formData.address) initializeAddressFields();
                    handleAddressFieldChange('state', e.target.value);
                  }}
                  className="bg-white/5 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ZIP Code*</label>
                <Input
                  placeholder="10001"
                  value={formData.address?.zip || ""}
                  onChange={(e) => {
                    if (!formData.address) initializeAddressFields();
                    handleAddressFieldChange('zip', e.target.value);
                  }}
                  className="bg-white/5 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-3 relative">
            <textarea
              placeholder="Delivery Notes (e.g., ring doorbell, leave at door)"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-md text-sm p-2 text-foreground placeholder:text-muted-foreground resize-none h-16 outline-none focus:border-primary"
            />
            <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
              {wordCount}/{maxNotes} Words
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 pb-6 flex-shrink-0">
        <Button
          onClick={handleSave}
          disabled={!formData.guestName || !formData.phoneNumber || !formData.address?.address1 || !formData.address?.city || !formData.address?.state || !formData.address?.zip}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-lg font-medium"
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default DeliveryGuestForm;
