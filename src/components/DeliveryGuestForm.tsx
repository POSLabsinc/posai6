import { useState, useMemo } from "react";
import { Search, X, Home, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
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
    if (!formData.address) {
      initializeAddressFields();
    }
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

  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

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

  const isFormValid = formData.guestName && formData.phoneNumber && formData.address?.address1;

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden bg-neutral-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 md:border-b-0">
        <h2 className="text-lg font-semibold text-white">Delivery Guest Information</h2>
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

        {/* Guest Name */}
        <div>
          <label className="text-sm text-neutral-400 mb-1 block">Guest Name *</label>
          <Input
            placeholder="Enter guest name"
            value={formData.guestName}
            onChange={(e) => handleInputChange("guestName", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm text-neutral-400 mb-1 block">Phone Number *</label>
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
          <label className="text-sm text-neutral-400 mb-1 block">Email</label>
          <Input
            type="email"
            placeholder="guest@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Address Search Field */}
        <div className="relative">
          <label className="text-sm text-neutral-400 mb-1 block">Search Address</label>
          <Search className="absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Search for an address..."
            value={addressSearchQuery}
            onChange={(e) => {
              setAddressSearchQuery(e.target.value);
              setShowAddressSuggestions(true);
            }}
            onFocus={() => setShowAddressSuggestions(true)}
            className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
          
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

        {/* Address Fields */}
        <div className="space-y-3 p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium text-white">Delivery Address</span>
            </div>
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
            >
              {isLocating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
              <span>Use Current</span>
            </button>
          </div>
          
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Street Address *</label>
            <Input
              placeholder="123 Main Street"
              value={formData.address?.address1 || ""}
              onChange={(e) => handleAddressFieldChange('address1', e.target.value)}
              className="bg-neutral-900 border-neutral-600 text-white placeholder:text-neutral-500"
            />
          </div>
          
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Apt, Suite, Unit (Optional)</label>
            <Input
              placeholder="Apt 4B"
              value={formData.address?.address2 || ""}
              onChange={(e) => handleAddressFieldChange('address2', e.target.value)}
              className="bg-neutral-900 border-neutral-600 text-white placeholder:text-neutral-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">City *</label>
              <Input
                placeholder="New York"
                value={formData.address?.city || ""}
                onChange={(e) => handleAddressFieldChange('city', e.target.value)}
                className="bg-neutral-900 border-neutral-600 text-white placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">State *</label>
              <Input
                placeholder="NY"
                value={formData.address?.state || ""}
                onChange={(e) => handleAddressFieldChange('state', e.target.value)}
                className="bg-neutral-900 border-neutral-600 text-white placeholder:text-neutral-500"
              />
            </div>
          </div>
          
          <div className="w-1/2">
            <label className="text-xs text-neutral-500 mb-1 block">ZIP Code *</label>
            <Input
              placeholder="10001"
              value={formData.address?.zip || ""}
              onChange={(e) => handleAddressFieldChange('zip', e.target.value)}
              className="bg-neutral-900 border-neutral-600 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-neutral-400 mb-1 block">Delivery Notes</label>
          <textarea
            placeholder="Add any special delivery instructions..."
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
              : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
          }`}
        >
          Save Delivery Info
        </button>
      </div>
    </div>
  );
};

export default DeliveryGuestForm;