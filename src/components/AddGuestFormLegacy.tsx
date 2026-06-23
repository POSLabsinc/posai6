import { useState, useRef, useCallback } from "react";
import { X, Camera, MapPin, Calendar as CalendarIcon, ChevronDown, ChevronUp, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn, formatPhoneNumber } from "@/lib/utils";
import addGuestIcon from "@/assets/icons/add-guest.svg";

export interface LegacyGuestFormData {
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

interface VehicleEntry {
  vehicleType: string;
  vehicleColor: string;
  vehicleBrand: string;
  licensePlate: string;
}

interface Props {
  onClose: () => void;
  onSave: (data: LegacyGuestFormData) => void;
}

const vehicleTypes = ["Sedan", "SUV", "Truck", "Van", "Coupe", "Hatchback", "Convertible", "Wagon"];
const vehicleColors = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Brown", "Beige", "Gold"];
const vehicleBrands: Record<string, string[]> = {
  Sedan: ["Toyota", "Honda", "BMW", "Mercedes-Benz", "Audi", "Lexus", "Nissan", "Ford"],
  SUV: ["Toyota", "Honda", "BMW", "Mercedes-Benz", "Audi", "Lexus", "Jeep", "Ford", "Chevrolet"],
  Truck: ["Ford", "Chevrolet", "Ram", "Toyota", "GMC", "Nissan"],
  Van: ["Honda", "Toyota", "Chrysler", "Kia", "Ford"],
  Coupe: ["BMW", "Mercedes-Benz", "Audi", "Ford", "Chevrolet", "Dodge"],
  Hatchback: ["Honda", "Toyota", "Volkswagen", "Mazda", "Ford"],
  Convertible: ["BMW", "Mercedes-Benz", "Porsche", "Ford", "Chevrolet", "Mazda"],
  Wagon: ["Volvo", "Audi", "BMW", "Mercedes-Benz", "Subaru"],
};

const inputCls =
  "w-full h-11 px-3 text-sm bg-[#2a2a2a] border border-white/5 rounded-xl text-foreground placeholder:text-neutral-500 outline-none focus:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.4)]";

const labelCls = "text-[13px] font-medium text-neutral-200 mb-2 block";

const AddGuestFormLegacy = ({ onClose, onSave }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<LegacyGuestFormData>({
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

  const [vehicle, setVehicle] = useState<VehicleEntry>({
    vehicleType: "",
    vehicleColor: "",
    vehicleBrand: "",
    licensePlate: "",
  });

  const update = useCallback(<K extends keyof LegacyGuestFormData>(field: K, value: LegacyGuestFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => update("profilePhoto", reader.result as string);
      reader.readAsDataURL(file);
    }
    setPhotoMenuOpen(false);
  };

  const isValid = form.firstName && form.lastName && form.email && form.phoneNumber;

  const handleSave = async () => {
    if (isSaving) return;
    if (!isValid) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSaving(true);
    try {
      const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
      const initials = `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase();
      const vehicles = vehicle.licensePlate || vehicle.vehicleBrand ? [vehicle] : form.vehicles;
      const vehicleStr = vehicles
        .map((v) => [v.vehicleColor, v.vehicleBrand, v.vehicleType].filter(Boolean).join(" "))
        .filter(Boolean)
        .join(", ");
      const plates = vehicles
        .map((v) => v.licensePlate)
        .filter(Boolean)
        .join(", ");

      const row: Record<string, any> = {
        name: fullName,
        middle_name: form.middleName || "",
        email: form.email,
        phone: form.phoneNumber,
        since: form.customerSince || "",
        birthday: form.dateOfBirth || "",
        anniversary: form.anniversary || "",
        address: form.address || "",
        vehicle: vehicleStr,
        license_plate: plates,
        avatar_url: form.profilePhoto || null,
        initials,
        is_archived: false,
        notes_general: "",
      };
      const { error } = await (supabase as any).from("guests").insert(row);
      if (error) {
        console.error("Failed to save guest:", error);
        toast.error("Failed to save guest.");
        setIsSaving(false);
        return;
      }
      toast.success("Guest saved successfully!");
      onSave({ ...form, vehicles });
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const DateField = ({
    value,
    onChange,
    fromYear,
    toYear,
    disableFuture,
  }: {
    value: string;
    onChange: (v: string) => void;
    fromYear: number;
    toYear: number;
    disableFuture?: boolean;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn(inputCls, "flex items-center gap-2 text-left")}>
          <CalendarIcon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <span className={value ? "text-foreground" : "text-neutral-500"}>{value || "MM/DD/YYYY"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-800 border-white/10" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onChange(date ? format(date, "MM/dd/yyyy") : "")}
          disabled={disableFuture ? (d) => d > new Date() : undefined}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
          captionLayout="dropdown-buttons"
          fromYear={fromYear}
          toYear={toYear}
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex flex-col h-full bg-[#1c1c1e] overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0 bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="flex items-center gap-2">
          <img src={addGuestIcon} alt="" className="w-5 h-5" />
          <h2 className="text-[15px] font-semibold text-foreground">Add Guest</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-4 h-4 text-foreground/70" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4" style={{ scrollbarWidth: "none" }}>
        {/* Profile Photo */}
        <div className="flex flex-col items-center pt-1">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          <Popover open={photoMenuOpen} onOpenChange={setPhotoMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-600 flex items-center justify-center overflow-hidden hover:border-neutral-500 transition-colors"
              >
                {form.profilePhoto ? (
                  <img src={form.profilePhoto} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Camera className="w-5 h-5 text-neutral-500" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1 bg-neutral-800 border-white/10" align="center">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setPhotoMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-foreground text-sm hover:bg-white/10 rounded transition-colors"
              >
                <Camera className="w-4 h-4" /> Upload
              </button>
            </PopoverContent>
          </Popover>
          <span className="text-xs text-neutral-400 mt-2">Profile Photo</span>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Enter first name"
              className={inputCls}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>Middle Name</label>
            <input
              type="text"
              value={form.middleName}
              onChange={(e) => update("middleName", e.target.value)}
              placeholder="Enter middle name"
              className={inputCls}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Enter last name"
              className={inputCls}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Enter email"
              className={inputCls}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                update("phoneNumber", formatPhoneNumber(digits));
              }}
              placeholder="(XXX) XXX-XXXX"
              className={inputCls}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>Customer Since</label>
            <DateField
              value={form.customerSince}
              onChange={(v) => update("customerSince", v)}
              fromYear={1950}
              toYear={new Date().getFullYear()}
            />
          </div>
          <div>
            <label className={labelCls}>Date of Birth</label>
            <DateField
              value={form.dateOfBirth}
              onChange={(v) => update("dateOfBirth", v)}
              fromYear={1920}
              toYear={new Date().getFullYear()}
              disableFuture
            />
          </div>
          <div>
            <label className={labelCls}>Anniversary</label>
            <DateField
              value={form.anniversary}
              onChange={(v) => update("anniversary", v)}
              fromYear={1950}
              toYear={new Date().getFullYear() + 5}
            />
          </div>
        </div>

        {/* Address full width */}
        <div>
          <label className={labelCls}>Address</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Search for an address..."
              className={cn(inputCls, "pl-9")}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Add vehicle details */}
        <div>
          <button
            type="button"
            onClick={() => setShowVehicleDetails((s) => !s)}
            className="flex items-center gap-2 text-sm text-foreground hover:text-foreground/80 transition-colors"
          >
            <Car className="w-4 h-4 text-neutral-400" />
            <span className="font-medium">Add vehicle details</span>
            {showVehicleDetails ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>
          {showVehicleDetails && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>License Plate</label>
                <input
                  type="text"
                  value={vehicle.licensePlate}
                  onChange={(e) => setVehicle((v) => ({ ...v, licensePlate: e.target.value.toUpperCase() }))}
                  placeholder="Enter plate"
                  className={cn(inputCls, "uppercase")}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelCls}>Vehicle Type</label>
                <Select value={vehicle.vehicleType} onValueChange={(v) => setVehicle((s) => ({ ...s, vehicleType: v, vehicleBrand: "" }))}>
                  <SelectTrigger className="bg-neutral-900/60 border-white/10 text-foreground text-sm rounded-lg h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-white/10">
                    {vehicleTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-foreground">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <Select value={vehicle.vehicleColor} onValueChange={(v) => setVehicle((s) => ({ ...s, vehicleColor: v }))}>
                  <SelectTrigger className="bg-neutral-900/60 border-white/10 text-foreground text-sm rounded-lg h-10">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-white/10">
                    {vehicleColors.map((c) => (
                      <SelectItem key={c} value={c} className="text-foreground">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelCls}>Brand</label>
                <Select
                  value={vehicle.vehicleBrand}
                  onValueChange={(v) => setVehicle((s) => ({ ...s, vehicleBrand: v }))}
                  disabled={!vehicle.vehicleType}
                >
                  <SelectTrigger className="bg-neutral-900/60 border-white/10 text-foreground text-sm rounded-lg h-10 disabled:opacity-50">
                    <SelectValue placeholder={vehicle.vehicleType ? "Select brand" : "Select type first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-white/10">
                    {(vehicle.vehicleType && vehicleBrands[vehicle.vehicleType] || []).map((b) => (
                      <SelectItem key={b} value={b} className="text-foreground">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-5 py-4 border-t border-white/[0.06] flex-shrink-0 bg-gradient-to-t from-black/30 to-transparent">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 h-11 bg-[#2a2a2a] border-white/[0.08] text-foreground hover:bg-[#333] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.4)]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !isValid}
          className="flex-1 h-11 bg-[#2a2a2a] text-foreground hover:bg-[#333] rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.4)] disabled:opacity-100 disabled:text-neutral-400"
        >
          {isSaving ? "Saving..." : "Save Guest"}
        </Button>
      </div>
    </div>
  );
};

export default AddGuestFormLegacy;
