import { useState, useRef } from "react";
import { Search, X, Car, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from "@/lib/utils";
import { Customer } from "@/services/customerService";
import { useCustomerSearch, usePhoneConflict } from "@/hooks/useCustomerSearch";
import PhoneConflictDialog from "@/components/PhoneConflictDialog";

interface CurbSideGuestFormProps {
  onSave: (data: CurbSideGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
  initialData?: CurbSideGuestData | null;
}

export interface CurbSideGuestData {
  guestName: string;
  phoneNumber: string;
  email: string;
  notes: string;
  parkingSpot: string;
  vehicleType: string;
  vehicleColor: string;
  vehicleBrand: string;
  licensePlate: string;
}

const vehicleTypes = ["Sedan", "SUV", "Truck", "Van", "Coupe", "Hatchback", "Convertible", "Wagon"];
const vehicleColors = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Yellow", "Orange", "Brown"];
const parkingSpots = Array.from({ length: 20 }, (_, i) => `Spot ${i + 1}`);

const CurbSideGuestForm = ({ onSave, onCancel, onClose, initialData }: CurbSideGuestFormProps) => {
  const [formData, setFormData] = useState<CurbSideGuestData>({
    guestName: initialData?.guestName || "",
    phoneNumber: initialData?.phoneNumber ? formatPhoneNumber(initialData.phoneNumber) : "",
    email: initialData?.email || "",
    notes: initialData?.notes || "",
    parkingSpot: initialData?.parkingSpot || "",
    vehicleType: initialData?.vehicleType || "",
    vehicleColor: initialData?.vehicleColor || "",
    vehicleBrand: initialData?.vehicleBrand || "",
    licensePlate: initialData?.licensePlate || "",
  });
  const { searchQuery, setSearchQuery, searchResults, showSearchResults, setShowSearchResults } = useCustomerSearch();
  const [showVehicleInfo, setShowVehicleInfo] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(!!(initialData?.vehicleBrand || initialData?.licensePlate || initialData?.vehicleColor));
  
  const [vehicleSwipeX, setVehicleSwipeX] = useState(0);
  const [isVehicleSwiping, setIsVehicleSwiping] = useState(false);
  const vehicleStartX = useRef(0);
  const swipeThreshold = -80;

  const { showConflictDialog, setShowConflictDialog, conflictCustomer, setConflictCustomer, clearConflict } = usePhoneConflict(formData.phoneNumber, formData.guestName);

  const hasVehicleInfo = formData.vehicleBrand || formData.licensePlate || formData.vehicleColor;

  const handleSaveVehicle = () => {
    if (hasVehicleInfo) {
      setVehicleSaved(true);
      setShowVehicleInfo(false);
    }
  };

  const handleEditVehicle = () => {
    setVehicleSwipeX(0);
    setVehicleSaved(false);
    setShowVehicleInfo(true);
  };

  const handleDeleteVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicleType: "",
      vehicleColor: "",
      vehicleBrand: "",
      licensePlate: "",
    }));
    setVehicleSaved(false);
    setVehicleSwipeX(0);
  };

  const handleVehicleTouchStart = (e: React.TouchEvent) => {
    vehicleStartX.current = e.touches[0].clientX;
    setIsVehicleSwiping(true);
  };

  const handleVehicleTouchMove = (e: React.TouchEvent) => {
    if (!isVehicleSwiping) return;
    const diff = e.touches[0].clientX - vehicleStartX.current;
    setVehicleSwipeX(Math.max(swipeThreshold, Math.min(0, diff)));
  };

  const handleVehicleTouchEnd = () => {
    setIsVehicleSwiping(false);
    if (vehicleSwipeX < swipeThreshold / 2) {
      setVehicleSwipeX(swipeThreshold);
    } else {
      setVehicleSwipeX(0);
    }
  };

  const handleVehicleMouseDown = (e: React.MouseEvent) => {
    vehicleStartX.current = e.clientX;
    setIsVehicleSwiping(true);
  };

  const handleVehicleMouseMove = (e: React.MouseEvent) => {
    if (!isVehicleSwiping) return;
    const diff = e.clientX - vehicleStartX.current;
    setVehicleSwipeX(Math.max(swipeThreshold, Math.min(0, diff)));
  };

  const handleVehicleMouseUp = () => {
    setIsVehicleSwiping(false);
    if (vehicleSwipeX < swipeThreshold / 2) {
      setVehicleSwipeX(swipeThreshold);
    } else {
      setVehicleSwipeX(0);
    }
  };

  const handleVehicleMouseLeave = () => {
    if (isVehicleSwiping) {
      setIsVehicleSwiping(false);
      if (vehicleSwipeX < swipeThreshold / 2) {
        setVehicleSwipeX(swipeThreshold);
      } else {
        setVehicleSwipeX(0);
      }
    }
  };

  const maxNotes = 70;

  const maxNotes = 70;

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

  const handleInputChange = (field: keyof CurbSideGuestData, value: string) => {
    if (field === "notes" && value.length > maxNotes) return;
    if (field === "phoneNumber") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Phone is optional for curbside, but if provided must be valid
    const phoneValid = !formData.phoneNumber || isValidPhoneNumber(formData.phoneNumber);
    if (formData.guestName && phoneValid) {
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
      onSave({
        ...formData,
        phoneNumber: cleanPhoneNumber,
      });
    }
  };

  const phoneError = getPhoneValidationError(formData.phoneNumber);

  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleUseExisting = () => {
    if (conflictCustomer) {
      setFormData((prev) => ({ ...prev, guestName: conflictCustomer.name, email: conflictCustomer.email || prev.email }));
    }
    clearConflict();
  };
  const handleUpdateName = () => clearConflict();
  const handleAddFamilyMember = () => clearConflict();
  const handleCreateNew = () => {
    setFormData((prev) => ({ ...prev, phoneNumber: "" }));
    clearConflict();
  };

  const isFormValid = formData.guestName && (!formData.phoneNumber || isValidPhoneNumber(formData.phoneNumber));

  return (
    <div className="flex flex-col h-full rounded-b-lg overflow-hidden bg-neutral-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 md:border-b-0">
        <h2 className="text-lg font-semibold text-white">Curbside Guest Information</h2>
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

        {/* Parking Spot Selection */}
        <div>
          <label className="text-sm text-neutral-400 mb-1 block">Parking Spot</label>
          <Select
            value={formData.parkingSpot}
            onValueChange={(value) => handleInputChange("parkingSpot", value)}
          >
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Select Parking Spot" />
            </SelectTrigger>
            <SelectContent>
              {parkingSpots.map((spot) => (
                <SelectItem key={spot} value={spot}>{spot}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm text-neutral-400 mb-1 block">Phone Number</label>
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

        {/* Vehicle Information Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">Vehicle Information</h3>
          <button
            type="button"
            onClick={() => vehicleSaved ? handleEditVehicle() : setShowVehicleInfo(!showVehicleInfo)}
            className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
          >
            <Car className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Vehicle Info Saved Display - Swipeable */}
        {vehicleSaved && hasVehicleInfo && !showVehicleInfo && (
          <div className="relative overflow-hidden rounded-lg">
            <div 
              className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2"
              style={{
                opacity: vehicleSwipeX < 0 ? 1 : 0,
                pointerEvents: vehicleSwipeX < swipeThreshold / 2 ? 'auto' : 'none',
              }}
            >
              <button
                onClick={handleEditVehicle}
                className="w-8 h-8 flex items-center justify-center bg-muted/50 rounded-full hover:bg-muted transition-colors"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={handleDeleteVehicle}
                className="w-8 h-8 flex items-center justify-center bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
            
            <div 
              className="relative p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
              style={{
                transform: `translateX(${vehicleSwipeX}px)`,
                transition: isVehicleSwiping ? "none" : "transform 0.2s ease-out",
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
              onTouchStart={handleVehicleTouchStart}
              onTouchMove={handleVehicleTouchMove}
              onTouchEnd={handleVehicleTouchEnd}
              onMouseDown={handleVehicleMouseDown}
              onMouseMove={handleVehicleMouseMove}
              onMouseUp={handleVehicleMouseUp}
              onMouseLeave={handleVehicleMouseLeave}
            >
              <div className="p-2 bg-white/10 rounded">
                <Car className="w-5 h-5 text-white/70" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-white">
                  {formData.vehicleBrand}{formData.vehicleType ? ` (${formData.vehicleType})` : ''}
                </span>
                <span className="text-xs text-white/60">
                  {[formData.licensePlate, formData.vehicleColor].filter(Boolean).join(' | ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Information Fields - Collapsible */}
        {showVehicleInfo && (
          <div className="p-3 bg-neutral-800 rounded-lg border border-neutral-700 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Vehicle Type</label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) => handleInputChange("vehicleType", value)}
                >
                  <SelectTrigger className="bg-neutral-900 border-neutral-600 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Color</label>
                <Select
                  value={formData.vehicleColor}
                  onValueChange={(value) => handleInputChange("vehicleColor", value)}
                >
                  <SelectTrigger className="bg-neutral-900 border-neutral-600 text-white">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleColors.map((color) => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Brand</label>
                <Input
                  placeholder="Enter brand"
                  value={formData.vehicleBrand}
                  onChange={(e) => handleInputChange("vehicleBrand", e.target.value)}
                  className="bg-neutral-900 border-neutral-600 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">License Plate</label>
                <Input
                  placeholder="Enter plate"
                  value={formData.licensePlate}
                  onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                  className="bg-neutral-900 border-neutral-600 text-white placeholder:text-neutral-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVehicleInfo(false)}
                className="flex-1 h-9 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveVehicle}
                disabled={!hasVehicleInfo}
                className="flex-1 h-9 bg-primary hover:bg-primary/90"
              >
                Save Vehicle
              </Button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-sm text-neutral-400 mb-1 block">Notes</label>
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
        newName={formData.guestName}
        onUseExisting={handleUseExisting}
        onUpdateName={handleUpdateName}
        onAddFamilyMember={handleAddFamilyMember}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
};

export default CurbSideGuestForm;
