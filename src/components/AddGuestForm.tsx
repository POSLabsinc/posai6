import { useState } from "react";
import { X, Camera, Car, ChevronDown, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import addGuestIcon from "@/assets/icons/add-guest.svg";

interface AddGuestFormProps {
  onClose: () => void;
  onSave: (guestData: GuestFormData) => void;
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
  vehicleDetails: string;
  profilePhoto: string | null;
}

const AddGuestForm = ({ onClose, onSave }: AddGuestFormProps) => {
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
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
    vehicleDetails: "",
    profilePhoto: null,
  });

  const handleInputChange = (field: keyof GuestFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (formData.firstName && formData.lastName && formData.email && formData.phoneNumber) {
      onSave(formData);
      onClose();
    }
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.phoneNumber;

  return (
    <div className="absolute inset-0 z-50 flex flex-col rounded-lg overflow-hidden" style={{ background: '#2A2A2A' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={addGuestIcon} alt="" className="w-5 h-5" />
          <span className="text-white font-semibold text-base">Add Guest</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-transparent hover:border-white/50 transition-colors cursor-pointer">
              <Camera className="w-6 h-6 text-white/50" />
            </div>
            <span className="text-white/50 text-xs">Profile Photo</span>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white text-xs mb-1.5 block">
                First Name <span className="text-primary">*</span>
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg"
              />
            </div>
            <div>
              <label className="text-white text-xs mb-1.5 block">Middle Name</label>
              <Input
                value={formData.middleName}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
                placeholder="Enter middle name"
                className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg"
              />
            </div>
          </div>

          {/* Last Name & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white text-xs mb-1.5 block">
                Last Name <span className="text-primary">*</span>
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg"
              />
            </div>
            <div>
              <label className="text-white text-xs mb-1.5 block">
                Email <span className="text-primary">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email"
                className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg"
              />
            </div>
          </div>

          {/* Phone & Customer Since */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white text-xs mb-1.5 block">
                Phone Number <span className="text-primary">*</span>
              </label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                placeholder="(XXX) XXX-XXXX"
                className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg"
              />
            </div>
            <div>
              <label className="text-white text-xs mb-1.5 block">Customer Since</label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.customerSince}
                  onChange={(e) => handleInputChange("customerSince", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg pl-9"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
            </div>
          </div>

          {/* Date of Birth & Anniversary */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white text-xs mb-1.5 block">Date of Birth</label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg pl-9"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
            </div>
            <div>
              <label className="text-white text-xs mb-1.5 block">Anniversary</label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.anniversary}
                  onChange={(e) => handleInputChange("anniversary", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg pl-9"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-white text-xs mb-1.5 block">Address</label>
            <div className="relative">
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Search for an address..."
                className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg pl-9 pr-9"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Add Vehicle Details */}
          <button
            onClick={() => setShowVehicleDetails(!showVehicleDetails)}
            className="flex items-center gap-2 text-primary text-sm hover:text-primary/80 transition-colors"
          >
            <Car className="w-4 h-4" />
            <span>Add vehicle details</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showVehicleDetails ? 'rotate-180' : ''}`} />
          </button>

          {showVehicleDetails && (
            <div>
              <Input
                value={formData.vehicleDetails}
                onChange={(e) => handleInputChange("vehicleDetails", e.target.value)}
                placeholder="Enter vehicle details..."
                className="bg-[#3A3A3A] border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg"
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Buttons */}
      <div className="p-4 border-t border-white/10 flex gap-3 flex-shrink-0">
        <Button
          onClick={onClose}
          variant="secondary"
          className="flex-1 h-11 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white border-0 rounded-lg font-medium"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isFormValid}
          className="flex-1 h-11 bg-[#1A1A1A] hover:bg-[#252525] text-white disabled:opacity-40 disabled:text-white/50 border-0 rounded-lg font-medium"
        >
          Save Guest
        </Button>
      </div>
    </div>
  );
};

export default AddGuestForm;
