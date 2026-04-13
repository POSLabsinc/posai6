import { useState, useRef } from "react";
import { X, Camera, ChevronLeft, MapPin, Calendar as CalendarIcon, Upload, Plus, Trash2, ChevronRight, Car, ChevronUp, ChevronDown, Crosshair, Home } from "lucide-react";
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
import { useAppearance } from "@/contexts/AppearanceContext";

interface AddGuestFormProps {
  onClose: () => void;
  onSave: (guestData: GuestFormData) => void;
  hideHeader?: boolean;
  onBack?: () => void;
  compact?: boolean;
}

interface VehicleEntry {
  vehicleType: string;
  vehicleColor: string;
  vehicleBrand: string;
  licensePlate: string;
}

interface AddressEntry {
  id: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isEditing?: boolean;
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
  note: string;
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

const NOTE_MAX = 250;

const AddGuestForm = ({ onClose, onSave, hideHeader, onBack, compact }: AddGuestFormProps) => {
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleEditIndex, setVehicleEditIndex] = useState<number | null>(null);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getIconBgColor } = useAppearance();
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
    vehicles: [],
    profilePhoto: null,
    note: "",
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
    if (field === "note") {
      if (value.length > NOTE_MAX) return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Address helpers
  const handleAddressSearch = (query: string) => {
    setAddressSearch(query);
    if (query.length > 2) {
      // Simulated suggestions - replace with Google Places API when key is available
      setAddressSuggestions([
        `${query}, New York, NY 10001`,
        `${query}, Los Angeles, CA 90001`,
        `${query}, Chicago, IL 60601`,
        `${query}, Houston, TX 77001`,
      ]);
    } else {
      setAddressSuggestions([]);
    }
  };

  const parseAddressString = (addr: string): AddressEntry => {
    const parts = addr.split(", ").map(s => s.trim());
    const stateZip = (parts[2] || "").split(" ");
    return {
      id: crypto.randomUUID(),
      street: parts[0] || "",
      apt: "",
      city: parts[1] || "",
      state: stateZip[0] || "",
      zip: stateZip[1] || "",
      phone: "",
      isEditing: false,
    };
  };

  const handleSelectAddress = (addr: string) => {
    const entry = parseAddressString(addr);
    setAddresses(prev => [...prev, entry]);
    setAddressSearch("");
    setAddressSuggestions([]);
    syncAddressToForm([...addresses, entry]);
  };

  const handleRemoveAddress = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    syncAddressToForm(updated);
  };

  const handleEditAddress = (id: string) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, isEditing: true } : a));
  };

  const handleUpdateAddress = (id: string, field: keyof AddressEntry, value: string) => {
    setAddresses(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, [field]: value } : a);
      syncAddressToForm(updated);
      return updated;
    });
  };

  const handleSaveAddressEdit = (id: string) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, isEditing: false } : a));
  };

  const syncAddressToForm = (addrs: AddressEntry[]) => {
    const fullAddr = addrs.map(a => [a.street, a.apt, a.city, a.state, a.zip].filter(Boolean).join(", ")).join(" | ");
    setFormData(prev => ({ ...prev, address: fullAddr }));
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
        notes_general: formData.note || "",
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

  // iOS-style row component
  const FormRow = ({ label, value, placeholder, onClick, children }: {
    label: string;
    value?: string;
    placeholder?: string;
    onClick?: () => void;
    children?: React.ReactNode;
  }) => (
    <div
      className="flex items-center justify-between px-4 py-3 min-h-[44px] cursor-pointer"
      onClick={onClick}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children ? children : (
        <div className="flex items-center gap-1">
          <span className={`text-sm ${value ? 'text-foreground' : 'text-neutral-500'}`}>
            {value || placeholder || ''}
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>
      )}
    </div>
  );

  const Divider = () => <div className="h-px bg-white/5 mx-4" />;

  // Date picker row
  const DateRow = ({ label, value, field, fromYear, toYear, disableFuture }: {
    label: string;
    value: string;
    field: keyof GuestFormData;
    fromYear: number;
    toYear: number;
    disableFuture?: boolean;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center justify-between px-4 py-3 min-h-[44px] cursor-pointer">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <div className="flex items-center gap-1">
            <span className={`text-sm ${value ? 'text-foreground' : 'text-neutral-500'}`}>
              {value || "MM / DD / YYYY"}
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-800 border-white/10" align="end">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => handleInputChange(field, date ? format(date, "MM/dd/yyyy") : "")}
          disabled={disableFuture ? (date) => date > new Date() : undefined}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
          captionLayout="dropdown-buttons"
          fromYear={fromYear}
          toYear={toYear}
        />
      </PopoverContent>
    </Popover>
  );

  // Input row (inline editing) - fixed to stop propagation and work properly
  const InputRow = ({ label, value, field, placeholder, type, required }: {
    label: string;
    value: string;
    field: keyof GuestFormData;
    placeholder: string;
    type?: string;
    required?: boolean;
  }) => (
    <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
      <span className="text-sm font-medium text-foreground whitespace-nowrap mr-4">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => {
          e.stopPropagation();
          handleInputChange(field, e.target.value);
        }}
        onFocus={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder}
        className="text-sm text-right bg-transparent outline-none text-foreground placeholder:text-neutral-500 w-full max-w-[60%]"
        autoComplete="off"
      />
    </div>
  );

  // Vehicle card component
  const VehicleCard = ({ vehicle, index }: { vehicle: VehicleEntry; index: number }) => {
    const isEditing = vehicleEditIndex === index;
    const displayText = [vehicle.vehicleColor, vehicle.vehicleBrand, vehicle.vehicleType].filter(Boolean).join(" ");

    if (isEditing) {
      return (
        <div className="bg-white dark:bg-neutral-800/60 rounded-2xl overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Edit Vehicle {index + 1}</span>
            <button onClick={() => setVehicleEditIndex(null)} className="text-xs text-primary hover:text-primary/80 font-medium">Done</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Type</label>
              <Select value={vehicle.vehicleType} onValueChange={(v) => handleVehicleChange(index, "vehicleType", v)}>
                <SelectTrigger className="bg-neutral-100 dark:bg-neutral-700/50 border-0 text-foreground text-sm rounded-xl h-10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-white/10">
                  {vehicleTypes.map(t => <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Color</label>
              <Select value={vehicle.vehicleColor} onValueChange={(v) => handleVehicleChange(index, "vehicleColor", v)}>
                <SelectTrigger className="bg-neutral-100 dark:bg-neutral-700/50 border-0 text-foreground text-sm rounded-xl h-10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-white/10">
                  {vehicleColors.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Brand</label>
              <Select value={vehicle.vehicleBrand} onValueChange={(v) => handleVehicleChange(index, "vehicleBrand", v)} disabled={!vehicle.vehicleType}>
                <SelectTrigger className="bg-neutral-100 dark:bg-neutral-700/50 border-0 text-foreground text-sm rounded-xl h-10 disabled:opacity-50">
                  <SelectValue placeholder={vehicle.vehicleType ? "Select" : "Type first"} />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-white/10">
                  {(vehicle.vehicleType && vehicleBrands[vehicle.vehicleType] || []).map(b => <SelectItem key={b} value={b} className="text-foreground">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">License Plate</label>
              <input
                value={vehicle.licensePlate}
                onChange={(e) => handleVehicleChange(index, "licensePlate", e.target.value.toUpperCase())}
                placeholder="Enter"
                className="w-full h-10 px-3 text-sm bg-neutral-100 dark:bg-neutral-700/50 rounded-xl text-foreground placeholder:text-neutral-500 outline-none uppercase"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-neutral-800/60 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Car className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-relaxed">{displayText || "No details"}</p>
            {vehicle.licensePlate && <p className="text-xs text-neutral-400 mt-1">Plate: {vehicle.licensePlate}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setVehicleEditIndex(index)} className="text-xs text-primary hover:text-primary/80 font-medium">Edit</button>
            <button onClick={() => handleRemoveVehicle(index)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    );
  };

  // Address card component
  const AddressCard = ({ addr }: { addr: AddressEntry }) => {
    if (addr.isEditing) {
      return (
        <div className="bg-white dark:bg-neutral-800/60 rounded-2xl overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Edit Address</span>
            <button onClick={() => handleSaveAddressEdit(addr.id)} className="text-xs text-primary hover:text-primary/80 font-medium">Done</button>
          </div>
          {[
            { label: "Street", field: "street" as const, value: addr.street, placeholder: "Street address", required: true },
            { label: "Apt/Suite", field: "apt" as const, value: addr.apt, placeholder: "Optional" },
            { label: "City", field: "city" as const, value: addr.city, placeholder: "City", required: true },
            { label: "State", field: "state" as const, value: addr.state, placeholder: "State", required: true },
            { label: "ZIP", field: "zip" as const, value: addr.zip, placeholder: "ZIP Code", required: true },
            { label: "Phone", field: "phone" as const, value: addr.phone, placeholder: "+1 (XXX) XXX-XXXX" },
          ].map((f, i) => (
            <div key={f.field}>
              {i > 0 && <div className="h-px bg-white/5" />}
              <div className="flex items-center justify-between py-2 min-h-[40px]">
                <span className="text-sm font-medium text-foreground whitespace-nowrap mr-4">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </span>
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => { e.stopPropagation(); handleUpdateAddress(addr.id, f.field, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder={f.placeholder}
                  className="text-sm text-right bg-transparent outline-none text-foreground placeholder:text-neutral-500 w-full max-w-[60%]"
                  autoComplete="off"
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    const displayAddr = [addr.street, addr.apt, addr.city, [addr.state, addr.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    return (
      <div className="bg-white dark:bg-neutral-800/60 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-relaxed">{displayAddr}</p>
            {addr.phone && <p className="text-xs text-neutral-400 mt-1">{addr.phone}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => handleEditAddress(addr.id)} className="text-xs text-primary hover:text-primary/80 font-medium">Edit</button>
            <button onClick={() => handleRemoveAddress(addr.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F0F0] dark:bg-background overflow-hidden">
      {/* Back Header - arrow only, no text */}
      {hideHeader && onBack && (
        <div className="flex items-center h-12 px-4 flex-shrink-0">
          <button
            onClick={handleBack}
            className="flex items-center text-foreground hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Fixed Header (non-embedded mode) */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src={addGuestIcon} alt="" className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-foreground">Add Guest</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground/70" />
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Info Header Card */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-neutral-800/60 rounded-2xl p-5 flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: getIconBgColor('#F9900E') }}
            >
              <img src={addGuestIcon} alt="" className="w-6 h-6 object-contain" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">New Guest</h3>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
              Guests will only be added to your guestbook if required fields (Name, Email, or Phone) are completed. Otherwise, only the customer name will be used as a generic guest name for the order.
            </p>
          </div>
        </div>

        {/* Profile Photo + Form Fields */}
        <div className="px-4 py-4">
          <div className="flex gap-5">
            {/* Avatar */}
            <div className="flex flex-col items-center flex-shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Popover open={photoMenuOpen} onOpenChange={setPhotoMenuOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden cursor-pointer">
                      {formData.profilePhoto ? (
                        <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <path d="M20 20c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zm0 4c-5.34 0-16 2.68-16 8v4h32v-4c0-5.32-10.66-8-16-8z" fill="currentColor" className="text-neutral-400 dark:text-neutral-500" />
                        </svg>
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-neutral-600 border-2 border-[#F0F0F0] dark:border-background flex items-center justify-center shadow-sm">
                      <Camera className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                    </button>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1 bg-neutral-800 border-white/10" align="center">
                  <button
                    onClick={handleCameraCapture}
                    className="flex items-center gap-2 w-full px-3 py-2 text-foreground text-sm hover:bg-white/10 rounded transition-colors"
                  >
                    <Camera className="w-4 h-4" /> Camera
                  </button>
                  <button
                    onClick={handleUploadFromSystem}
                    className="flex items-center gap-2 w-full px-3 py-2 text-foreground text-sm hover:bg-white/10 rounded transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                </PopoverContent>
              </Popover>
            </div>

            {/* Two column iOS-style card groups */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-w-0">
              {/* Left Card - Contact Info */}
              <div className="bg-white dark:bg-neutral-800/60 rounded-2xl overflow-hidden">
                <InputRow label="First Name" value={formData.firstName} field="firstName" placeholder="Enter" required />
                <Divider />
                <InputRow label="Last Name" value={formData.lastName} field="lastName" placeholder="Enter" required />
                <Divider />
                <InputRow label="Phone Number" value={formData.phoneNumber} field="phoneNumber" placeholder="+1 (XXX) XXX-XXXX" type="tel" required />
                <Divider />
                <InputRow label="Email" value={formData.email} field="email" placeholder="email@example.com" type="email" required />
              </div>

              {/* Right Card - Dates */}
              <div className="bg-white dark:bg-neutral-800/60 rounded-2xl overflow-hidden">
                <DateRow label="Date of Birth" value={formData.dateOfBirth} field="dateOfBirth" fromYear={1920} toYear={new Date().getFullYear()} disableFuture />
                <Divider />
                <DateRow label="Customer Since" value={formData.customerSince} field="customerSince" fromYear={1950} toYear={new Date().getFullYear()} />
                <Divider />
                <DateRow label="Anniversary" value={formData.anniversary} field="anniversary" fromYear={1950} toYear={new Date().getFullYear() + 5} />
              </div>
            </div>
          </div>
        </div>

        {/* Note Section */}
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-1">Note</p>
          <div className="bg-white dark:bg-neutral-800/60 rounded-2xl overflow-hidden">
            <div className="relative">
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
                placeholder="Optional"
                maxLength={NOTE_MAX}
                rows={2}
                className="w-full px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-neutral-500 outline-none resize-none"
              />
              <span className="absolute bottom-2 right-4 text-xs text-neutral-500">
                {NOTE_MAX - (formData.note?.length || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Address Section - always visible */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Address</p>
          </div>
          {/* Search Bar */}
          <div className="relative mb-3">
            <div className="flex items-center bg-white dark:bg-neutral-800/60 rounded-2xl px-4 py-3">
              <MapPin className="w-4 h-4 text-neutral-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={addressSearch}
                onChange={(e) => { e.stopPropagation(); handleAddressSearch(e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Search for an address..."
                className="text-sm bg-transparent outline-none text-foreground placeholder:text-neutral-500 w-full"
                autoComplete="off"
              />
              {addressSearch && (
                <button onClick={() => { setAddressSearch(""); setAddressSuggestions([]); }} className="ml-2">
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>
            {addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 rounded-xl border border-white/10 overflow-hidden z-10 shadow-lg">
                {addressSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAddress(suggestion)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-foreground hover:bg-white/10 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Address Cards */}
          {addresses.length > 0 && (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <AddressCard key={addr.id} addr={addr} />
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Section - cards for saved vehicles */}
        {formData.vehicles.some(v => v.vehicleType || v.vehicleColor || v.vehicleBrand || v.licensePlate) && !showVehicleForm && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Vehicles</p>
            </div>
            <div className="space-y-3">
              {formData.vehicles.map((vehicle, index) => (
                <VehicleCard key={index} vehicle={vehicle} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Vehicle Form (for adding new) */}
        {showVehicleForm && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">New Vehicle</p>
              <button
                onClick={() => setShowVehicleForm(false)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Cancel
              </button>
            </div>
            <div className="bg-white dark:bg-neutral-800/60 rounded-2xl overflow-hidden p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Type</label>
                  <Select value={formData.vehicles[formData.vehicles.length - 1]?.vehicleType || ""} onValueChange={(v) => handleVehicleChange(formData.vehicles.length - 1, "vehicleType", v)}>
                    <SelectTrigger className="bg-neutral-100 dark:bg-neutral-700/50 border-0 text-foreground text-sm rounded-xl h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-white/10">
                      {vehicleTypes.map(t => <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Color</label>
                  <Select value={formData.vehicles[formData.vehicles.length - 1]?.vehicleColor || ""} onValueChange={(v) => handleVehicleChange(formData.vehicles.length - 1, "vehicleColor", v)}>
                    <SelectTrigger className="bg-neutral-100 dark:bg-neutral-700/50 border-0 text-foreground text-sm rounded-xl h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-white/10">
                      {vehicleColors.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Brand</label>
                  <Select value={formData.vehicles[formData.vehicles.length - 1]?.vehicleBrand || ""} onValueChange={(v) => handleVehicleChange(formData.vehicles.length - 1, "vehicleBrand", v)} disabled={!formData.vehicles[formData.vehicles.length - 1]?.vehicleType}>
                    <SelectTrigger className="bg-neutral-100 dark:bg-neutral-700/50 border-0 text-foreground text-sm rounded-xl h-10 disabled:opacity-50">
                      <SelectValue placeholder={formData.vehicles[formData.vehicles.length - 1]?.vehicleType ? "Select" : "Type first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-white/10">
                      {(formData.vehicles[formData.vehicles.length - 1]?.vehicleType && vehicleBrands[formData.vehicles[formData.vehicles.length - 1].vehicleType] || []).map(b => <SelectItem key={b} value={b} className="text-foreground">{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">License Plate</label>
                  <input
                    value={formData.vehicles[formData.vehicles.length - 1]?.licensePlate || ""}
                    onChange={(e) => handleVehicleChange(formData.vehicles.length - 1, "licensePlate", e.target.value.toUpperCase())}
                    placeholder="Enter"
                    className="w-full h-10 px-3 text-sm bg-neutral-100 dark:bg-neutral-700/50 rounded-xl text-foreground placeholder:text-neutral-500 outline-none uppercase"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowVehicleForm(false)}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Save Vehicle
              </button>
            </div>
          </div>
        )}

        {/* Add Vehicle Button */}
        <div className="px-4 pb-6">
          {!showVehicleForm && (
            <button
              onClick={() => {
                handleAddVehicle();
                setShowVehicleForm(true);
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-neutral-900 dark:bg-neutral-800 text-foreground rounded-2xl text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <Car className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer buttons for compact/order mode */}
      {compact && (
        <div className="flex gap-3 p-4 border-t border-white/10 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-white/10 border-white/20 text-foreground hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !isFormValid}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Guest"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AddGuestForm;
