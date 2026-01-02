import { useState, useMemo } from "react";
import { Search, X, MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface BanquetGuestFormProps {
  onSave: (data: BanquetGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export interface BanquetGuestData {
  guestName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  numberOfGuests: string;
  venue: string;
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

// Mock venue suggestions
const mockVenueSuggestions = [
  { id: 1, name: "Grand Ballroom", capacity: "200 guests" },
  { id: 2, name: "Garden Terrace", capacity: "100 guests" },
  { id: 3, name: "Private Dining Room", capacity: "50 guests" },
  { id: 4, name: "Rooftop Lounge", capacity: "75 guests" },
];

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const BanquetGuestForm = ({ onSave, onCancel, onClose }: BanquetGuestFormProps) => {
  const [formData, setFormData] = useState<BanquetGuestData>({
    guestName: "",
    eventType: "",
    eventDate: "",
    eventTime: "",
    numberOfGuests: "",
    venue: "",
    phoneNumber: "",
    email: "",
    notes: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [venueSearchQuery, setVenueSearchQuery] = useState("");
  const [showVenueResults, setShowVenueResults] = useState(false);
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

  const venueResults = useMemo(() => {
    if (!venueSearchQuery.trim()) return [];
    const query = venueSearchQuery.toLowerCase();
    return mockVenueSuggestions.filter(
      (venue) => venue.name.toLowerCase().includes(query)
    );
  }, [venueSearchQuery]);

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

  const handleSelectVenue = (venue: typeof mockVenueSuggestions[0]) => {
    setFormData((prev) => ({
      ...prev,
      venue: venue.name,
    }));
    setVenueSearchQuery(venue.name);
    setShowVenueResults(false);
  };

  const handleLocateVenue = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    toast.info("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            const venueName = data.address?.amenity || data.address?.building || "Current Location";
            setFormData((prev) => ({
              ...prev,
              venue: venueName,
            }));
            setVenueSearchQuery(venueName);
            toast.success("Location found!");
          } else {
            setFormData((prev) => ({
              ...prev,
              venue: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            }));
            setVenueSearchQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          setFormData((prev) => ({
            ...prev,
            venue: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));
          setVenueSearchQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information unavailable");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out");
            break;
          default:
            toast.error("Unable to get location");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleInputChange = (field: keyof BanquetGuestData, value: string) => {
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
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            type="date"
            value={formData.eventDate}
            onChange={(e) => handleInputChange("eventDate", e.target.value)}
            className="pl-9 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Time and Number of Guests */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            type="time"
            value={formData.eventTime}
            onChange={(e) => handleInputChange("eventTime", e.target.value)}
            className="pl-9 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
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

      {/* Venue Search */}
      <div className="relative mb-3">
        <Input
          placeholder="Search for a location or venue"
          value={venueSearchQuery}
          onChange={(e) => {
            setVenueSearchQuery(e.target.value);
            handleInputChange("venue", e.target.value);
            setShowVenueResults(true);
          }}
          onFocus={() => setShowVenueResults(true)}
          className="pr-10 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={handleLocateVenue}
          disabled={isLocating}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <MapPin className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        {showVenueResults && venueResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
            {venueResults.map((venue) => (
              <button
                key={venue.id}
                onClick={() => handleSelectVenue(venue)}
                className="w-full px-3 py-2 text-left hover:bg-neutral-700 text-sm text-white flex flex-col"
              >
                <span className="font-medium">{venue.name}</span>
                <span className="text-xs text-muted-foreground">{venue.capacity}</span>
              </button>
            ))}
          </div>
        )}
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
