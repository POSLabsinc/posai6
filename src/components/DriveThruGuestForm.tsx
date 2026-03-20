import { useState, useRef } from "react";
import { Search, X, Car, Pencil, Trash2, Plus } from "lucide-react";
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

interface DriveThruGuestFormProps {
  onSave: (data: DriveThruGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
  initialData?: DriveThruGuestData | null;
}

export interface VehicleInfo {
  vehicleType: string;
  vehicleColor: string;
  vehicleBrand: string;
  licensePlate: string;
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
  vehicles?: VehicleInfo[];
}

const vehicleTypes = ["Sedan", "SUV", "Truck", "Van", "Coupe", "Hatchback", "Convertible", "Wagon"];
const vehicleColors = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Yellow", "Orange", "Brown"];

const emptyVehicle: VehicleInfo = { vehicleType: "", vehicleColor: "", vehicleBrand: "", licensePlate: "" };

const DriveThruGuestForm = ({ onSave, onCancel, onClose, initialData }: DriveThruGuestFormProps) => {
  // Migrate legacy single vehicle to vehicles array
  const initVehicles = (): VehicleInfo[] => {
    if (initialData?.vehicles && initialData.vehicles.length > 0) return initialData.vehicles;
    if (initialData?.vehicleBrand || initialData?.licensePlate || initialData?.vehicleColor || initialData?.vehicleType) {
      return [{
        vehicleType: initialData.vehicleType || "",
        vehicleColor: initialData.vehicleColor || "",
        vehicleBrand: initialData.vehicleBrand || "",
        licensePlate: initialData.licensePlate || "",
      }];
    }
    return [];
  };

  const [formData, setFormData] = useState({
    guestName: initialData?.guestName || "",
    phoneNumber: initialData?.phoneNumber ? formatPhoneNumber(initialData.phoneNumber) : "",
    email: initialData?.email || "",
    notes: initialData?.notes || "",
  });

  const [vehicles, setVehicles] = useState<VehicleInfo[]>(initVehicles());
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<VehicleInfo>({ ...emptyVehicle });
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { searchQuery, setSearchQuery, searchResults, showSearchResults, setShowSearchResults } = useCustomerSearch();
  const { showConflictDialog, setShowConflictDialog, conflictCustomer, setConflictCustomer, clearConflict } = usePhoneConflict(formData.phoneNumber, formData.guestName);

  // Swipe state per vehicle
  const [swipeStates, setSwipeStates] = useState<Record<number, number>>({});
  const [swipingIndex, setSwipingIndex] = useState<number | null>(null);
  const swipeStartX = useRef(0);
  const swipeThreshold = -80;

  const handleAddVehicle = () => {
    setEditingVehicle({ ...emptyVehicle });
    setEditingVehicleIndex(null);
    setIsAddingNew(true);
  };

  const handleEditVehicle = (index: number) => {
    setEditingVehicle({ ...vehicles[index] });
    setEditingVehicleIndex(index);
    setIsAddingNew(true);
    setSwipeStates(prev => ({ ...prev, [index]: 0 }));
  };

  const handleDeleteVehicle = (index: number) => {
    setVehicles(prev => prev.filter((_, i) => i !== index));
    setSwipeStates(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleSaveVehicle = () => {
    const hasInfo = editingVehicle.vehicleBrand || editingVehicle.licensePlate || editingVehicle.vehicleColor || editingVehicle.vehicleType;
    if (!hasInfo) return;

    if (editingVehicleIndex !== null) {
      setVehicles(prev => prev.map((v, i) => i === editingVehicleIndex ? { ...editingVehicle } : v));
    } else {
      setVehicles(prev => [...prev, { ...editingVehicle }]);
    }
    setIsAddingNew(false);
    setEditingVehicleIndex(null);
    setEditingVehicle({ ...emptyVehicle });
  };

  const handleCancelVehicleEdit = () => {
    setIsAddingNew(false);
    setEditingVehicleIndex(null);
    setEditingVehicle({ ...emptyVehicle });
  };

  const handleVehicleFieldChange = (field: keyof VehicleInfo, value: string) => {
    setEditingVehicle(prev => ({ ...prev, [field]: value }));
  };

  // Swipe handlers
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    setSwipingIndex(index);
  };
  const handleTouchMove = (index: number, e: React.TouchEvent) => {
    if (swipingIndex !== index) return;
    const diff = e.touches[0].clientX - swipeStartX.current;
    setSwipeStates(prev => ({ ...prev, [index]: Math.max(swipeThreshold, Math.min(0, diff)) }));
  };
  const handleTouchEnd = (index: number) => {
    setSwipingIndex(null);
    const x = swipeStates[index] || 0;
    setSwipeStates(prev => ({ ...prev, [index]: x < swipeThreshold / 2 ? swipeThreshold : 0 }));
  };
  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    swipeStartX.current = e.clientX;
    setSwipingIndex(index);
  };
  const handleMouseMove = (index: number, e: React.MouseEvent) => {
    if (swipingIndex !== index) return;
    const diff = e.clientX - swipeStartX.current;
    setSwipeStates(prev => ({ ...prev, [index]: Math.max(swipeThreshold, Math.min(0, diff)) }));
  };
  const handleMouseUp = (index: number) => {
    setSwipingIndex(null);
    const x = swipeStates[index] || 0;
    setSwipeStates(prev => ({ ...prev, [index]: x < swipeThreshold / 2 ? swipeThreshold : 0 }));
  };
  const handleMouseLeave = (index: number) => {
    if (swipingIndex === index) {
      setSwipingIndex(null);
      const x = swipeStates[index] || 0;
      setSwipeStates(prev => ({ ...prev, [index]: x < swipeThreshold / 2 ? swipeThreshold : 0 }));
    }
  };

  const maxNotes = 70;

  const handleSelectGuest = (guest: Customer) => {
    setFormData(prev => ({
      ...prev,
      guestName: guest.name,
      phoneNumber: guest.phone,
      email: guest.email || "",
    }));
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === "notes" && value.length > maxNotes) return;
    if (field === "phoneNumber") {
      setFormData(prev => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const phoneValid = !formData.phoneNumber || isValidPhoneNumber(formData.phoneNumber);
    if (formData.guestName && phoneValid) {
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
      const primaryVehicle = vehicles[0] || emptyVehicle;
      onSave({
        ...formData,
        phoneNumber: cleanPhoneNumber,
        vehicleType: primaryVehicle.vehicleType,
        vehicleColor: primaryVehicle.vehicleColor,
        vehicleBrand: primaryVehicle.vehicleBrand,
        licensePlate: primaryVehicle.licensePlate,
        vehicles,
      });
    }
  };

  const phoneError = getPhoneValidationError(formData.phoneNumber);

  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleUseExisting = () => {
    if (conflictCustomer) {
      setFormData(prev => ({ ...prev, guestName: conflictCustomer.name, email: conflictCustomer.email || prev.email }));
    }
    clearConflict();
  };
  const handleUpdateName = () => clearConflict();
  const handleAddFamilyMember = () => clearConflict();
  const handleCreateNew = () => {
    setFormData(prev => ({ ...prev, phoneNumber: "" }));
    clearConflict();
  };

  const isFormValid = formData.guestName;
  const hasEditingVehicleInfo = editingVehicle.vehicleBrand || editingVehicle.licensePlate || editingVehicle.vehicleColor || editingVehicle.vehicleType;

  return (
    <div className="flex flex-col h-full rounded-b-lg overflow-hidden bg-neutral-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 md:border-b-0">
        <h2 className="text-lg font-semibold text-white">Drive-Thru Guest Information</h2>
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
          <label className="text-sm text-neutral-500 mb-1 block">Guest Name *</label>
          <Input
            placeholder="Enter guest name"
            value={formData.guestName}
            onChange={(e) => handleInputChange("guestName", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

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
            type="email"
            placeholder="guest@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Vehicle Information Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">
            Vehicles {vehicles.length > 0 && <span className="text-neutral-400">({vehicles.length})</span>}
          </h3>
          {!isAddingNew && (
            <button
              type="button"
              onClick={handleAddVehicle}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors text-xs text-neutral-300"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Vehicle
            </button>
          )}
        </div>

        {/* Saved Vehicles List */}
        {vehicles.map((vehicle, index) => {
          // Skip showing the card if currently editing this index
          if (editingVehicleIndex === index && isAddingNew) return null;
          const swipeX = swipeStates[index] || 0;
          return (
            <div key={index} className="relative overflow-hidden rounded-lg">
              <div 
                className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2"
                style={{
                  opacity: swipeX < 0 ? 1 : 0,
                  pointerEvents: swipeX < swipeThreshold / 2 ? 'auto' : 'none',
                }}
              >
                <button
                  onClick={() => handleEditVehicle(index)}
                  className="w-8 h-8 flex items-center justify-center bg-muted/50 rounded-full hover:bg-muted transition-colors"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDeleteVehicle(index)}
                  className="w-8 h-8 flex items-center justify-center bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
              
              <div 
                className="relative p-3 bg-neutral-800/50 rounded-lg border border-neutral-700 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
                style={{
                  transform: `translateX(${swipeX}px)`,
                  transition: swipingIndex === index ? "none" : "transform 0.2s ease-out",
                }}
                onTouchStart={(e) => handleTouchStart(index, e)}
                onTouchMove={(e) => handleTouchMove(index, e)}
                onTouchEnd={() => handleTouchEnd(index)}
                onMouseDown={(e) => handleMouseDown(index, e)}
                onMouseMove={(e) => handleMouseMove(index, e)}
                onMouseUp={() => handleMouseUp(index)}
                onMouseLeave={() => handleMouseLeave(index)}
              >
                <div className="p-2 bg-neutral-800 rounded">
                  <Car className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {vehicle.vehicleBrand}{vehicle.vehicleType ? ` (${vehicle.vehicleType})` : ''}
                    {!vehicle.vehicleBrand && vehicle.vehicleType ? vehicle.vehicleType : ''}
                  </span>
                  <span className="text-xs text-white/60 truncate">
                    {[vehicle.licensePlate, vehicle.vehicleColor].filter(Boolean).join(' | ')}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 uppercase shrink-0">
                  {index === 0 ? "Primary" : `#${index + 1}`}
                </span>
              </div>
            </div>
          );
        })}

        {/* Vehicle Add/Edit Form */}
        {isAddingNew && (
          <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                {editingVehicleIndex !== null ? "Edit Vehicle" : "New Vehicle"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Vehicle Type</label>
                <Select
                  value={editingVehicle.vehicleType}
                  onValueChange={(value) => handleVehicleFieldChange("vehicleType", value)}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
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
                  value={editingVehicle.vehicleColor}
                  onValueChange={(value) => handleVehicleFieldChange("vehicleColor", value)}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
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
                  value={editingVehicle.vehicleBrand}
                  onChange={(e) => handleVehicleFieldChange("vehicleBrand", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">License Plate</label>
                <Input
                  placeholder="Enter plate"
                  value={editingVehicle.licensePlate}
                  onChange={(e) => handleVehicleFieldChange("licensePlate", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelVehicleEdit}
                className="flex-1 h-9 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveVehicle}
                disabled={!hasEditingVehicleInfo}
                className="flex-1 h-9 bg-primary hover:bg-primary/90"
              >
                {editingVehicleIndex !== null ? "Update Vehicle" : "Save Vehicle"}
              </Button>
            </div>
          </div>
        )}

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
          Save Guest Info
        </button>
      </div>

      {/* Phone Conflict Dialog */}
      <PhoneConflictDialog
        isOpen={showConflictDialog}
        onClose={() => {
          setShowConflictDialog(false);
          clearConflict();
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

export default DriveThruGuestForm;
