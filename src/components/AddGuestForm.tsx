import { useState, useRef } from "react";
import { X, Camera, Car, ChevronUp, ChevronDown, ChevronLeft, MapPin, Calendar as CalendarIcon, Upload, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, formatPhoneNumber } from "@/lib/utils";
import addGuestIcon from "@/assets/icons/add-guest.svg";

interface AddGuestFormProps {
  onClose: () => void;
  onSave: (guestData: GuestFormData) => void;
  hideHeader?: boolean;
  onBack?: () => void;
}

interface VehicleEntry {
  vehicleType: string;
  vehicleColor: string;
  vehicleBrand: string;
  licensePlate: string;
}

interface GuestFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  customerSince: string;
  dateOfBirth: string;
  anniversary: string;
  address: string;
  vehicles: VehicleEntry[];
  profilePhoto: string | null;
}

const vehicleTypes = ["Sedan", "SUV", "Truck", "Van", "Coupe", "Hatchback", "Convertible", "Wagon"];
const vehicleColors = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Brown", "Beige", "Gold"];
const vehicleBrands: Record<string, string[]> = {
  "Sedan": ["Toyota", "Honda", "BMW", "Mercedes", "Audi", "Lexus", "Nissan", "Ford"],
  "SUV": ["Toyota", "Honda", "BMW", "Mercedes", "Audi", "Lexus", "Jeep", "Ford", "Chevrolet"],
  "Truck": ["Ford", "Chevrolet", "Ram", "Toyota", "GMC", "Nissan"],
  "Van": ["Honda", "Toyota", "Chrysler", "Kia", "Ford"],
  "Coupe": ["BMW", "Mercedes", "Audi", "Ford", "Chevrolet", "Dodge"],
  "Hatchback": ["Honda", "Toyota", "Volkswagen", "Mazda", "Ford"],
  "Convertible": ["BMW", "Mercedes", "Porsche", "Ford", "Chevrolet", "Mazda"],
  "Wagon": ["Volvo", "Audi", "BMW", "Mercedes", "Subaru"],
};

const AddGuestForm = ({ onClose, onSave, hideHeader, onBack }: AddGuestFormProps) => {
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<GuestFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    customerSince: "",
    dateOfBirth: "",
    anniversary: "",
    address: "",
    vehicles: [{ vehicleType: "", vehicleColor: "", vehicleBrand: "", licensePlate: "" }],
    profilePhoto: null,
  });

  const handleAddVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, { vehicleType: "", vehicleColor: "", vehicleBrand: "", licensePlate: "" }],
    }));
  };

  const handleRemoveVehicle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index),
    }));
  };

  const handleVehicleChange = (index: number, field: keyof VehicleEntry, value: string) => {
    setFormData(prev => {
      const vehicles = [...prev.vehicles];
      vehicles[index] = { ...vehicles[index], [field]: value };
      if (field === "vehicleType") vehicles[index].vehicleBrand = "";
      return { ...prev, vehicles };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange("profilePhoto", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    setPhotoMenuOpen(false);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'user');
      fileInputRef.current.click();
    }
    setPhotoMenuOpen(false);
  };

  const handleUploadFromSystem = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
    setPhotoMenuOpen(false);
  };

  const handleInputChange = (field: keyof GuestFormData, value: string) => {
    if (field === "phoneNumber") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const isFormEmpty = !formData.firstName && !formData.lastName && !formData.email && !formData.phoneNumber;
  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.phoneNumber;

  const handleSave = async () => {
    if (isSaving) return;
    if (isFormEmpty) {
      onClose();
      return;
    }
    if (!isFormValid) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ");
      const initials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
      
      // Combine all vehicles into strings
      const vehicleStrs = formData.vehicles
        .filter(v => v.vehicleColor || v.vehicleBrand || v.vehicleType)
        .map(v => [v.vehicleColor, v.vehicleBrand, v.vehicleType].filter(Boolean).join(" "));
      const vehicleStr = vehicleStrs.join(", ");
      const licensePlates = formData.vehicles
        .filter(v => v.licensePlate)
        .map(v => v.licensePlate)
        .join(", ");

      const guestRow: Record<string, any> = {
        name: fullName,
        middle_name: formData.middleName || "",
        email: formData.email,
        phone: formData.phoneNumber,
        since: formData.customerSince || "",
        birthday: formData.dateOfBirth || "",
        anniversary: formData.anniversary || "",
        address: formData.address || "",
        vehicle: vehicleStr,
        license_plate: licensePlates,
        avatar_url: formData.profilePhoto || null,
        initials,
        is_archived: false,
      };

      const { error } = await (supabase as any).from("guests").insert(guestRow);

      if (error) {
        console.error("Failed to save guest:", error);
        toast.error("Failed to save guest. Please try again.");
        setIsSaving(false);
        return;
      }

      toast.success("Guest saved successfully!");
      onSave(formData);
    } catch (err) {
      console.error("Error saving guest:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    handleSave();
    if (onBack) onBack();
    else onClose();
  };

  return (
    <div 
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{ 
        background: '#252525',
        boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Back Header for embedded mode */}
      {hideHeader && onBack && (
        <div className="relative flex items-center h-14 px-4 border-b border-border flex-shrink-0">
          <button
            onClick={handleBack}
            className="absolute left-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="w-full text-center text-base font-semibold text-foreground">Add New Guest</h2>
        </div>
      )}
      {/* Fixed Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src={addGuestIcon} alt="" className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-white">Add Guest</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Profile Photo */}
        <div className="flex flex-col items-center gap-2 py-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <Popover open={photoMenuOpen} onOpenChange={setPhotoMenuOpen}>
            <PopoverTrigger asChild>
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-transparent hover:border-white/50 transition-colors cursor-pointer overflow-hidden">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-white/50" />
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1 bg-neutral-800 border-white/10" align="center">
              <button
                onClick={handleCameraCapture}
                className="flex items-center gap-2 w-full px-3 py-2 text-white text-sm hover:bg-white/10 rounded transition-colors"
              >
                <Camera className="w-4 h-4" />
                Camera
              </button>
              <button
                onClick={handleUploadFromSystem}
                className="flex items-center gap-2 w-full px-3 py-2 text-white text-sm hover:bg-white/10 rounded transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload from system
              </button>
            </PopoverContent>
          </Popover>
          <span className="text-white/50 text-xs">Profile Photo</span>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-white/70 mb-1 block">
              First Name <span className="text-primary">*</span>
            </label>
            <Input
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              placeholder="Enter first name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">Middle Name</label>
            <Input
              value={formData.middleName}
              onChange={(e) => handleInputChange("middleName", e.target.value)}
              placeholder="Enter middle name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">
              Last Name <span className="text-primary">*</span>
            </label>
            <Input
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              placeholder="Enter last name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Email & Phone & Customer Since */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-white/70 mb-1 block">
              Email <span className="text-primary">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">
              Phone Number <span className="text-primary">*</span>
            </label>
            <Input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder="(XXX) XXX-XXXX"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">Customer Since</label>
            <div className="relative">
              <Input
                type="text"
                value={formData.customerSince}
                onChange={(e) => handleInputChange("customerSince", e.target.value)}
                placeholder="MM/DD/YYYY"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-9"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>
        </div>

        {/* Date of Birth, Anniversary & Address */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-white/70 mb-1 block">Date of Birth</label>
            <div className="relative">
              <Input
                type="text"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                placeholder="MM/DD/YYYY"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-9"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">Anniversary</label>
            <div className="relative">
              <Input
                type="text"
                value={formData.anniversary}
                onChange={(e) => handleInputChange("anniversary", e.target.value)}
                placeholder="MM/DD/YYYY"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-9"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1 block">Address</label>
            <div className="relative">
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Search for an address..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-9"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>
        </div>


        {/* Add Vehicle Details */}
        <button
          onClick={() => setShowVehicleDetails(!showVehicleDetails)}
          className="flex items-center gap-2 text-primary text-sm hover:text-primary/80 transition-colors"
        >
          <Car className="w-4 h-4" />
          <span>{showVehicleDetails ? 'Hide vehicle details' : 'Add vehicle details'}</span>
          {showVehicleDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showVehicleDetails && (
          <div className="space-y-4">
            {formData.vehicles.map((vehicle, index) => (
              <div key={index} className="space-y-3 p-3 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60 font-medium">Vehicle {index + 1}</span>
                  {formData.vehicles.length > 1 && (
                    <button
                      onClick={() => handleRemoveVehicle(index)}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Vehicle Type</label>
                    <Select
                      value={vehicle.vehicleType}
                      onValueChange={(value) => handleVehicleChange(index, "vehicleType", value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-white/10">
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type} value={type} className="text-white hover:bg-white/10">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Vehicle Color</label>
                    <Select
                      value={vehicle.vehicleColor}
                      onValueChange={(value) => handleVehicleChange(index, "vehicleColor", value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-white/10">
                        {vehicleColors.map((color) => (
                          <SelectItem key={color} value={color} className="text-white hover:bg-white/10">
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Vehicle Brand</label>
                    <Select
                      value={vehicle.vehicleBrand}
                      onValueChange={(value) => handleVehicleChange(index, "vehicleBrand", value)}
                      disabled={!vehicle.vehicleType}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white disabled:opacity-50">
                        <SelectValue placeholder={vehicle.vehicleType ? "Select brand" : "Select type first"} />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-white/10">
                        {(vehicle.vehicleType && vehicleBrands[vehicle.vehicleType] || []).map((brand) => (
                          <SelectItem key={brand} value={brand} className="text-white hover:bg-white/10">
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">License Plate</label>
                    <Input
                      value={vehicle.licensePlate}
                      onChange={(e) => handleVehicleChange(index, "licensePlate", e.target.value.toUpperCase())}
                      placeholder="Enter license plate"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 uppercase"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddVehicle}
              className="flex items-center gap-2 text-primary text-sm hover:text-primary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add another vehicle</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default AddGuestForm;