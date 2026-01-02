import { useState, useMemo } from "react";
import { Search, X, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DriveThruGuestFormProps {
  onSave: (data: DriveThruGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export interface DriveThruGuestData {
  guestName: string;
  phoneNumber: string;
  email: string;
  notes: string;
  vehicleType: string;
  vehicleColor: string;
  vehicleBrand: string;
  licensePlate: string;
}

// Mock guest data for search
const mockGuests = [
  { name: "John Smith", phone: "(555) 123-4567", email: "john@example.com" },
  { name: "Jane Doe", phone: "(555) 987-6543", email: "jane@example.com" },
  { name: "Mike Johnson", phone: "(555) 456-7890", email: "mike@example.com" },
  { name: "Sarah Williams", phone: "(555) 321-0987", email: "sarah@example.com" },
];

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const vehicleTypes = ["Sedan", "SUV", "Truck", "Van", "Coupe", "Hatchback", "Convertible", "Wagon"];
const vehicleColors = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Yellow", "Orange", "Brown"];

const DriveThruGuestForm = ({ onSave, onCancel, onClose }: DriveThruGuestFormProps) => {
  const [formData, setFormData] = useState<DriveThruGuestData>({
    guestName: "",
    phoneNumber: "",
    email: "",
    notes: "",
    vehicleType: "",
    vehicleColor: "",
    vehicleBrand: "",
    licensePlate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showVehicleInfo, setShowVehicleInfo] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(false);

  // Check if vehicle info is complete enough to save
  const hasVehicleInfo = formData.vehicleBrand || formData.licensePlate || formData.vehicleColor;

  const handleSaveVehicle = () => {
    if (hasVehicleInfo) {
      setVehicleSaved(true);
      setShowVehicleInfo(false);
    }
  };

  const handleEditVehicle = () => {
    setVehicleSaved(false);
    setShowVehicleInfo(true);
  };

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

  const handleInputChange = (field: keyof DriveThruGuestData, value: string) => {
    if (field === "notes" && value.length > maxNotes) return;
    if (field === "phoneNumber") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (formData.guestName) {
      // Strip formatting from phone number - only pass digits
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
      {/* Guest Information Header */}
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

      {/* Vehicle Information Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Vehicle Information</h3>
        <button
          type="button"
          onClick={() => vehicleSaved ? handleEditVehicle() : setShowVehicleInfo(!showVehicleInfo)}
          className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
        >
          <Car className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Vehicle Info Saved Display */}
      {vehicleSaved && hasVehicleInfo && !showVehicleInfo && (
        <div 
          className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={handleEditVehicle}
        >
          <div className="p-2 bg-white/10 rounded">
            <Car className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {formData.vehicleBrand}{formData.vehicleType ? ` (${formData.vehicleType})` : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              {[formData.licensePlate, formData.vehicleColor].filter(Boolean).join(' | ')}
            </span>
          </div>
        </div>
      )}

      {/* Vehicle Information Fields - Collapsible */}
      {showVehicleInfo && (
        <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Vehicle Type*</label>
              <Select
                value={formData.vehicleType}
                onValueChange={(value) => handleInputChange("vehicleType", value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-sm h-9 text-foreground">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Color*</label>
              <Select
                value={formData.vehicleColor}
                onValueChange={(value) => handleInputChange("vehicleColor", value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-sm h-9 text-foreground">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleColors.map((color) => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Brand</label>
              <Input
                placeholder="Optional"
                value={formData.vehicleBrand}
                onChange={(e) => handleInputChange("vehicleBrand", e.target.value)}
                className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">License Plate</label>
              <Input
                placeholder="Optional"
                value={formData.licensePlate}
                onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowVehicleInfo(false)}
              className="flex-1 h-8 text-xs bg-white/5 border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveVehicle}
              disabled={!hasVehicleInfo}
              className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90"
            >
              Save Vehicle
            </Button>
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-md h-9 shrink-0">
            <span className="text-base">🇺🇸</span>
            <span className="text-xs text-muted-foreground">+1</span>
          </div>
          <Input
            placeholder="Phone Number*"
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
        disabled={!formData.guestName}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9"
      >
        Save
      </Button>
    </div>
  );
};

export default DriveThruGuestForm;
