import { useState, useRef, useCallback, useEffect } from "react";
import { X, Camera, ChevronLeft, MapPin, Calendar as CalendarIcon, Upload, Plus, Trash2, ChevronRight, Car, ChevronUp, ChevronDown, Crosshair, Home, Briefcase, MoreHorizontal, Phone, Pencil, Truck } from "lucide-react";
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

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", label: "US" },
  { code: "+1", flag: "🇨🇦", label: "CA" },
  { code: "+44", flag: "🇬🇧", label: "UK" },
  { code: "+91", flag: "🇮🇳", label: "IN" },
  { code: "+61", flag: "🇦🇺", label: "AU" },
  { code: "+49", flag: "🇩🇪", label: "DE" },
  { code: "+33", flag: "🇫🇷", label: "FR" },
  { code: "+81", flag: "🇯🇵", label: "JP" },
  { code: "+86", flag: "🇨🇳", label: "CN" },
  { code: "+55", flag: "🇧🇷", label: "BR" },
  { code: "+52", flag: "🇲🇽", label: "MX" },
  { code: "+971", flag: "🇦🇪", label: "AE" },
  { code: "+966", flag: "🇸🇦", label: "SA" },
  { code: "+82", flag: "🇰🇷", label: "KR" },
  { code: "+39", flag: "🇮🇹", label: "IT" },
  { code: "+34", flag: "🇪🇸", label: "ES" },
];

const ADDRESS_LABELS = ["Home", "Work", "Custom"];

const COUNTRIES_LIST = [
  "United States", "Canada", "United Kingdom", "India", "Australia", "Germany",
  "France", "Japan", "China", "Brazil", "Mexico", "United Arab Emirates",
  "Saudi Arabia", "South Korea", "Italy", "Spain", "Netherlands", "Switzerland",
  "Sweden", "Norway", "Denmark", "Finland", "Ireland", "New Zealand",
  "Singapore", "South Africa", "Argentina", "Colombia", "Chile", "Peru",
];

const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const SAMPLE_CITIES = ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","San Francisco","Seattle","Denver","Washington","Nashville","Oklahoma City","El Paso","Boston","Portland","Las Vegas","Memphis","Louisville","Baltimore","Milwaukee"];

const SAMPLE_STREETS = [
  "350 Fifth Avenue", "1600 Pennsylvania Avenue", "221B Baker Street",
  "742 Evergreen Terrace", "1 Infinite Loop", "1060 W Addison Street",
  "200 Park Avenue", "30 Rockefeller Plaza", "233 Broadway",
];

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
  label: string;
  customLabel?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  phoneCountry: typeof COUNTRY_CODES[0];
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
  "Sedan": ["Toyota", "Honda", "BMW", "Mercedes-Benz", "Audi", "Lexus", "Nissan", "Ford"],
  "SUV": ["Toyota", "Honda", "BMW", "Mercedes-Benz", "Audi", "Lexus", "Jeep", "Ford", "Chevrolet"],
  "Truck": ["Ford", "Chevrolet", "Ram", "Toyota", "GMC", "Nissan"],
  "Van": ["Honda", "Toyota", "Chrysler", "Kia", "Ford"],
  "Coupe": ["BMW", "Mercedes-Benz", "Audi", "Ford", "Chevrolet", "Dodge"],
  "Hatchback": ["Honda", "Toyota", "Volkswagen", "Mazda", "Ford"],
  "Convertible": ["BMW", "Mercedes-Benz", "Porsche", "Ford", "Chevrolet", "Mazda"],
  "Wagon": ["Volvo", "Audi", "BMW", "Mercedes-Benz", "Subaru"],
};

const NOTE_MAX = 250;

const getVehicleIcon = (type: string) => {
  switch (type) {
    case "Truck": return <Truck className="w-5 h-5 text-neutral-400" />;
    default: return <Car className="w-5 h-5 text-neutral-400" />;
  }
};

const getLabelIcon = (label: string) => {
  switch (label) {
    case "Home": return <Home className="w-5 h-5 text-neutral-400" />;
    case "Work": return <Briefcase className="w-5 h-5 text-neutral-400" />;
    default: return <MapPin className="w-5 h-5 text-neutral-400" />;
  }
};

// Swipeable card wrapper for revealing edit/delete actions
const SwipeableCard = ({ children, onEdit, onDelete }: { children: React.ReactNode; onEdit: () => void; onDelete: () => void }) => {
  const [swipeX, setSwipeX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = startX.current - e.touches[0].clientX;
    if (diff > 0) setSwipeX(Math.min(diff, 80));
    else setSwipeX(0);
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    setSwipeX(swipeX > 40 ? 80 : 0);
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const diff = startX.current - e.clientX;
    if (diff > 0) setSwipeX(Math.min(diff, 80));
    else setSwipeX(0);
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    setSwipeX(swipeX > 40 ? 80 : 0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-700">
      {/* Action buttons behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch z-0">
        <button onClick={onEdit} className="w-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 transition-colors">
          <Pencil className="w-4 h-4 text-white" />
        </button>
        <button onClick={onDelete} className="w-10 flex items-center justify-center bg-red-600 hover:bg-red-500 transition-colors">
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </div>
      {/* Foreground content */}
      <div
        className="relative z-10 bg-neutral-800/60 transition-transform"
        style={{ transform: `translateX(-${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (isDragging.current) { isDragging.current = false; setSwipeX(swipeX > 40 ? 80 : 0); } }}
      >
        {children}
      </div>
    </div>
  );
};

const AddGuestForm = ({ onClose, onSave, hideHeader, onBack, compact }: AddGuestFormProps) => {
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getIconBgColor } = useAppearance();

  const [vehicleExpandedIndex, setVehicleExpandedIndex] = useState<number | null>(null);
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<VehicleEntry>({ vehicleType: "", vehicleColor: "", vehicleBrand: "", licensePlate: "" });

  const [addressExpandedId, setAddressExpandedId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressEntry>({
    id: "", label: "Home", customLabel: "", street: "", city: "", state: "", zip: "", country: "", phone: "", phoneCountry: COUNTRY_CODES[0],
  });

  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);

  const [formData, setFormData] = useState<GuestFormData>({
    firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "",
    customerSince: "", dateOfBirth: "", anniversary: "", address: "",
    vehicles: [], profilePhoto: null, note: "",
  });

  const MAX_VEHICLES = 6;
  const MAX_ADDRESSES = 6;

  const saveNewVehicle = useCallback(() => {
    if (newVehicle.licensePlate && newVehicle.vehicleBrand) {
      setFormData(prev => ({ ...prev, vehicles: [...prev.vehicles, { ...newVehicle }] }));
      setNewVehicle({ vehicleType: "", vehicleColor: "", vehicleBrand: "", licensePlate: "" });
      setShowNewVehicleForm(false);
    } else {
      setShowNewVehicleForm(false);
    }
  }, [newVehicle]);

  const saveNewAddress = useCallback(() => {
    if (newAddress.street && newAddress.city && newAddress.state && newAddress.zip) {
      const entry: AddressEntry = { ...newAddress, id: crypto.randomUUID() };
      setAddresses(prev => {
        const updated = [...prev, entry];
        syncAddressToForm(updated);
        return updated;
      });
      setNewAddress({ id: "", label: "Home", customLabel: "", street: "", city: "", state: "", zip: "", country: "", phone: "", phoneCountry: COUNTRY_CODES[0] });
      setShowNewAddressForm(false);
    } else {
      setShowNewAddressForm(false);
    }
  }, [newAddress]);

  const handleVehicleChange = (index: number, field: keyof VehicleEntry, value: string) => {
    setFormData(prev => {
      const vehicles = [...prev.vehicles];
      vehicles[index] = { ...vehicles[index], [field]: value };
      if (field === "vehicleType") vehicles[index].vehicleBrand = "";
      return { ...prev, vehicles };
    });
  };

  const handleRemoveVehicle = (index: number) => {
    setFormData(prev => ({ ...prev, vehicles: prev.vehicles.filter((_, i) => i !== index) }));
    if (vehicleExpandedIndex === index) setVehicleExpandedIndex(null);
  };

  const handleRemoveAddress = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    syncAddressToForm(updated);
    if (addressExpandedId === id) setAddressExpandedId(null);
  };

  const handleUpdateAddress = (id: string, field: keyof AddressEntry, value: any) => {
    setAddresses(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, [field]: value } : a);
      syncAddressToForm(updated);
      return updated;
    });
  };

  const syncAddressToForm = (addrs: AddressEntry[]) => {
    const fullAddr = addrs.map(a => [a.street, a.city, [a.state, a.zip].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ")).join(" | ");
    setFormData(prev => ({ ...prev, address: fullAddr }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleInputChange("profilePhoto", reader.result as string);
      reader.readAsDataURL(file);
    }
    setPhotoMenuOpen(false);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) { fileInputRef.current.setAttribute('capture', 'user'); fileInputRef.current.click(); }
    setPhotoMenuOpen(false);
  };

  const handleUploadFromSystem = () => {
    if (fileInputRef.current) { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); }
    setPhotoMenuOpen(false);
  };

  const handleInputChange = (field: keyof GuestFormData, value: string) => {
    if (field === "phoneNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [field]: formatPhoneNumber(digits) }));
      return;
    }
    if (field === "email") {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (value.includes("@")) {
        const [local, domain] = value.split("@");
        if (local && (!domain || !domain.includes("."))) {
          const filtered = EMAIL_DOMAINS.filter(d => !domain || d.startsWith(domain.toLowerCase()));
          setEmailSuggestions(filtered.map(d => `${local}@${d}`));
          setShowEmailSuggestions(filtered.length > 0);
        } else {
          setShowEmailSuggestions(false);
        }
      } else {
        setShowEmailSuggestions(false);
      }
      return;
    }
    if (field === "note" && value.length > NOTE_MAX) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectEmailSuggestion = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    setShowEmailSuggestions(false);
  };

  const getStreetSuggestions = (value: string) => {
    if (value.length < 2) { setShowStreetSuggestions(false); return; }
    const filtered = SAMPLE_STREETS.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
    setStreetSuggestions(filtered);
    setShowStreetSuggestions(filtered.length > 0);
  };

  const getCitySuggestions = (value: string) => {
    if (value.length < 1) { setShowCitySuggestions(false); return; }
    const filtered = SAMPLE_CITIES.filter(c => c.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5);
    setCitySuggestions(filtered);
    setShowCitySuggestions(filtered.length > 0);
  };

  const getStateSuggestions = (value: string) => {
    if (value.length < 1) { setShowStateSuggestions(false); return; }
    const filtered = US_STATES.filter(s => s.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5);
    setStateSuggestions(filtered);
    setShowStateSuggestions(filtered.length > 0);
  };

  const getCountrySuggestions = (value: string) => {
    if (value.length < 1) { setShowCountrySuggestions(false); return; }
    const filtered = COUNTRIES_LIST.filter(c => c.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5);
    setCountrySuggestions(filtered);
    setShowCountrySuggestions(filtered.length > 0);
  };

  const [isSaving, setIsSaving] = useState(false);
  const isFormEmpty = !formData.firstName && !formData.lastName && !formData.email && !formData.phoneNumber;
  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.phoneNumber;

  const handleSave = async () => {
    if (isSaving) return;
    if (isFormEmpty) { onClose(); return; }
    if (!isFormValid) { toast.error("Please fill in all required fields."); return; }

    setIsSaving(true);
    try {
      const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ");
      const initials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
      const vehicleStrs = formData.vehicles.filter(v => v.vehicleColor || v.vehicleBrand || v.vehicleType).map(v => [v.vehicleColor, v.vehicleBrand, v.vehicleType].filter(Boolean).join(" "));
      const vehicleStr = vehicleStrs.join(", ");
      const licensePlates = formData.vehicles.filter(v => v.licensePlate).map(v => v.licensePlate).join(", ");

      const guestRow: Record<string, any> = {
        name: fullName, middle_name: formData.middleName || "", email: formData.email, phone: formData.phoneNumber,
        since: formData.customerSince || "", birthday: formData.dateOfBirth || "", anniversary: formData.anniversary || "",
        address: formData.address || "", vehicle: vehicleStr, license_plate: licensePlates,
        avatar_url: formData.profilePhoto || null, initials, is_archived: false, notes_general: formData.note || "",
      };

      const { error } = await (supabase as any).from("guests").insert(guestRow);
      if (error) { console.error("Failed to save guest:", error); toast.error("Failed to save guest."); setIsSaving(false); return; }
      toast.success("Guest saved successfully!");
      onSave(formData);
    } catch (err) {
      console.error("Error saving guest:", err);
      toast.error("An unexpected error occurred.");
    } finally { setIsSaving(false); }
  };

  const handleBack = () => { handleSave(); if (onBack) onBack(); else onClose(); };

  const Divider = () => <div className="h-px bg-white/5 mx-4" />;

  const DateRow = ({ label, value, field, fromYear, toYear, disableFuture }: {
    label: string; value: string; field: keyof GuestFormData; fromYear: number; toYear: number; disableFuture?: boolean;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center justify-between px-4 py-3 min-h-[44px] cursor-pointer">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <div className="flex items-center gap-1">
            <span className={`text-sm ${value ? 'text-foreground' : 'text-neutral-500'}`}>{value || "MM / DD / YYYY"}</span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-800 border-white/10" align="end">
        <Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={(date) => handleInputChange(field, date ? format(date, "MM/dd/yyyy") : "")} disabled={disableFuture ? (date) => date > new Date() : undefined} initialFocus className={cn("p-3 pointer-events-auto")} captionLayout="dropdown-buttons" fromYear={fromYear} toYear={toYear} />
      </PopoverContent>
    </Popover>
  );

  const getDisplayLabel = (addr: AddressEntry) => {
    if (addr.label === "Custom" && addr.customLabel) return addr.customLabel;
    return addr.label;
  };

  // Inline address form fields
  const renderAddressFormFields = ({ addr, onChange }: { addr: AddressEntry; onChange: (field: keyof AddressEntry, value: any) => void }) => (
    <div className="space-y-3 p-4">
      {/* Label */}
      <div>
        <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Label</label>
        <Select value={addr.label} onValueChange={(v) => { onChange("label", v); if (v !== "Custom") onChange("customLabel", ""); }}>
          <SelectTrigger className="bg-neutral-900 border-neutral-700 text-foreground text-sm rounded-lg h-10">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-white/10">
            {ADDRESS_LABELS.map(l => <SelectItem key={l} value={l} className="text-foreground">{l}</SelectItem>)}
          </SelectContent>
        </Select>
        {addr.label === "Custom" && (
          <input
            type="text"
            value={addr.customLabel || ""}
            onChange={(e) => onChange("customLabel", e.target.value)}
            placeholder="Enter custom label..."
            className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none mt-2"
            autoComplete="off"
          />
        )}
      </div>
      {/* Phone Number */}
      <div>
        <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Phone Number</label>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="flex items-center gap-1 px-3 h-10 rounded-lg bg-neutral-900 border border-neutral-700 text-sm flex-shrink-0">
                <span className="text-base leading-none">{addr.phoneCountry.flag}</span>
                <span className="text-xs text-neutral-400">{addr.phoneCountry.code}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0 bg-neutral-800 border-white/10" align="start">
              <div className="max-h-48 overflow-y-auto">
                {COUNTRY_CODES.map((c, ci) => (
                  <button key={`${c.label}-${ci}`} onClick={() => onChange("phoneCountry", c)} className={`flex items-center gap-3 w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-colors ${addr.phoneCountry?.label === c.label ? 'bg-white/5' : ''}`}>
                    <span>{c.flag}</span><span className="text-foreground">{c.label}</span><span className="text-neutral-400 ml-auto">{c.code}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <input
            type="tel"
            value={addr.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              onChange("phone", formatPhoneNumber(digits));
            }}
            placeholder="(201) 555-0123"
            className="flex-1 h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none"
            autoComplete="off"
          />
        </div>
      </div>
      {/* Street Address */}
      <div className="relative">
        <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Street Address<span className="text-red-400">*</span></label>
        <input
          type="text" value={addr.street}
          onChange={(e) => { onChange("street", e.target.value); getStreetSuggestions(e.target.value); }}
          onBlur={() => setTimeout(() => setShowStreetSuggestions(false), 200)}
          placeholder="Start typing an address..."
          className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none"
          autoComplete="off"
        />
        {showStreetSuggestions && streetSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 rounded-lg border border-white/10 overflow-hidden z-20 shadow-lg">
            {streetSuggestions.map((s) => (
              <button key={s} onMouseDown={(e) => { e.preventDefault(); onChange("street", s); setShowStreetSuggestions(false); }} className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/10 transition-colors">{s}</button>
            ))}
          </div>
        )}
      </div>
      {/* City & State */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">City<span className="text-red-400">*</span></label>
          <input
            type="text" value={addr.city}
            onChange={(e) => { onChange("city", e.target.value); getCitySuggestions(e.target.value); }}
            onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
            placeholder="City"
            className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none"
            autoComplete="off"
          />
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 rounded-lg border border-white/10 overflow-hidden z-20 shadow-lg">
              {citySuggestions.map((c) => (
                <button key={c} onMouseDown={(e) => { e.preventDefault(); onChange("city", c); setShowCitySuggestions(false); }} className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/10 transition-colors">{c}</button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">State<span className="text-red-400">*</span></label>
          <input
            type="text" value={addr.state}
            onChange={(e) => { onChange("state", e.target.value); getStateSuggestions(e.target.value); }}
            onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
            placeholder="State"
            className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none"
            autoComplete="off"
          />
          {showStateSuggestions && stateSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 rounded-lg border border-white/10 overflow-hidden z-20 shadow-lg">
              {stateSuggestions.map((s) => (
                <button key={s} onMouseDown={(e) => { e.preventDefault(); onChange("state", s); setShowStateSuggestions(false); }} className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/10 transition-colors">{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Zip & Country */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Zip Code<span className="text-red-400">*</span></label>
          <input
            type="text" value={addr.zip}
            onChange={(e) => onChange("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="Zip"
            className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none"
            autoComplete="off"
          />
        </div>
        <div className="relative">
          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Country</label>
          <input
            type="text" value={addr.country}
            onChange={(e) => { onChange("country", e.target.value); getCountrySuggestions(e.target.value); }}
            onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)}
            placeholder="Country"
            className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none"
            autoComplete="off"
          />
          {showCountrySuggestions && countrySuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-800 rounded-lg border border-white/10 overflow-hidden z-20 shadow-lg">
              {countrySuggestions.map((c) => (
                <button key={c} onMouseDown={(e) => { e.preventDefault(); onChange("country", c); setShowCountrySuggestions(false); }} className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/10 transition-colors">{c}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Card height for vehicle and address
  const CARD_HEIGHT = "h-[72px]";

  return (
    <div className="flex flex-col h-full bg-[#F0F0F0] dark:bg-background overflow-hidden">
      {/* Back Header */}
      {hideHeader && onBack && (
        <div className="flex items-center h-12 px-4 flex-shrink-0">
          <button onClick={handleBack} className="flex items-center text-foreground hover:opacity-70 transition-opacity">
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: getIconBgColor('#F9900E') }}>
              <img src={addGuestIcon} alt="" className="w-6 h-6 object-contain" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">New Guest</h3>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
              Guests will only be added to your guestbook if required fields (Name, Email, or Phone) are completed.
            </p>
          </div>
        </div>

        {/* Profile Photo + Form Fields */}
        <div className="px-4 py-4">
          <div className="flex gap-5">
            {/* Avatar */}
            <div className="flex flex-col items-center flex-shrink-0">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
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
                  <button onClick={handleCameraCapture} className="flex items-center gap-2 w-full px-3 py-2 text-foreground text-sm hover:bg-white/10 rounded transition-colors"><Camera className="w-4 h-4" /> Camera</button>
                  <button onClick={handleUploadFromSystem} className="flex items-center gap-2 w-full px-3 py-2 text-foreground text-sm hover:bg-white/10 rounded transition-colors"><Upload className="w-4 h-4" /> Upload</button>
                </PopoverContent>
              </Popover>
            </div>

            {/* Two column card groups */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
              {/* Left Card - Contact Info */}
              <div className="bg-white dark:bg-neutral-800/60 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap mr-4">First Name <span className="text-red-400">*</span></span>
                  <input type="text" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} placeholder="Enter" className="text-sm text-right bg-transparent outline-none text-foreground placeholder:text-neutral-500 w-full max-w-[60%]" autoComplete="off" />
                </div>
                <Divider />
                <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap mr-4">Last Name <span className="text-red-400">*</span></span>
                  <input type="text" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} placeholder="Enter" className="text-sm text-right bg-transparent outline-none text-foreground placeholder:text-neutral-500 w-full max-w-[60%]" autoComplete="off" />
                </div>
                <Divider />
                {/* Phone Number */}
                <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap mr-4">Phone <span className="text-red-400">*</span></span>
                  <div className="flex items-center gap-2 w-full max-w-[60%] justify-end">
                    <Popover open={showCountryPicker} onOpenChange={setShowCountryPicker}>
                      <PopoverTrigger asChild>
                        <button type="button" className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-600/50 transition-colors text-sm flex-shrink-0">
                          <span className="text-base leading-none">{countryCode.flag}</span>
                          <span className="text-xs text-neutral-400">{countryCode.code}</span>
                          <ChevronDown className="w-3 h-3 text-neutral-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-0 bg-neutral-800 border-white/10" align="start">
                        <div className="p-2 border-b border-white/10">
                          <input type="text" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="Search country..." className="w-full px-3 py-2 text-sm bg-neutral-700/50 rounded-lg text-foreground placeholder:text-neutral-500 outline-none" autoComplete="off" />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {COUNTRY_CODES.filter(c => c.label.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)).map((c, i) => (
                            <button key={`${c.label}-${i}`} onClick={() => { setCountryCode(c); setShowCountryPicker(false); setCountrySearch(""); }} className={`flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm hover:bg-white/10 transition-colors ${countryCode.label === c.label && countryCode.code === c.code ? 'bg-white/5' : ''}`}>
                              <span className="text-base">{c.flag}</span><span className="text-foreground">{c.label}</span><span className="text-neutral-400 ml-auto">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      placeholder="(XXX) XXX-XXXX"
                      className="text-sm text-right bg-transparent outline-none text-foreground placeholder:text-neutral-500 w-full min-w-0"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <Divider />
                {/* Email */}
                <div className="relative">
                  <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                    <span className="text-sm font-medium text-foreground whitespace-nowrap mr-4">Email <span className="text-red-400">*</span></span>
                    <input
                      type="email" value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                      placeholder="email@example.com"
                      className="text-sm text-right bg-transparent outline-none text-foreground placeholder:text-neutral-500 w-full max-w-[60%]"
                      autoComplete="off"
                    />
                  </div>
                  {showEmailSuggestions && emailSuggestions.length > 0 && (
                    <div className="absolute right-4 top-full mt-0.5 bg-neutral-800 rounded-lg border border-white/10 overflow-hidden z-20 shadow-lg min-w-[220px]">
                      {emailSuggestions.slice(0, 5).map((s) => (
                        <button key={s} onMouseDown={(e) => { e.preventDefault(); selectEmailSuggestion(s); }} className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/10 transition-colors">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
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
              <textarea value={formData.note} onChange={(e) => handleInputChange("note", e.target.value)} placeholder="Optional" maxLength={NOTE_MAX} rows={2} className="w-full px-4 py-3 text-sm bg-transparent text-foreground placeholder:text-neutral-500 outline-none resize-none" />
              <span className="absolute bottom-2 right-4 text-xs text-neutral-500">{NOTE_MAX - (formData.note?.length || 0)}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Details & Address - Side by Side */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle Details Column */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Vehicle Details</p>
              <div className="space-y-3">
                {/* Vehicle cards grid - cards + add button in same grid */}
                <div className="grid grid-cols-2 gap-2">
                  {formData.vehicles.map((vehicle, index) => {
                    const isExpanded = vehicleExpandedIndex === index;
                    const displayBrand = [vehicle.vehicleBrand, vehicle.vehicleType].filter(Boolean).join(" ");
                    const displayMeta = [vehicle.licensePlate, vehicle.vehicleColor].filter(Boolean).join(" · ");

                    if (isExpanded) return null;

                    return (
                      <SwipeableCard
                        key={index}
                        onEdit={() => setVehicleExpandedIndex(index)}
                        onDelete={() => handleRemoveVehicle(index)}
                      >
                        <div className={`flex items-center gap-2.5 p-3 ${CARD_HEIGHT}`}>
                          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                            {getVehicleIcon(vehicle.vehicleType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{displayBrand || "Vehicle"}</p>
                            {displayMeta && <p className="text-xs text-neutral-400 truncate mt-0.5">{displayMeta}</p>}
                          </div>
                        </div>
                      </SwipeableCard>
                    );
                  })}

                  {/* Add Vehicle button - inline in grid */}
                  {!showNewVehicleForm && formData.vehicles.length < MAX_VEHICLES && (
                    <button
                      onClick={() => setShowNewVehicleForm(true)}
                      className={`border-2 border-dashed border-neutral-600 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-neutral-500 transition-colors ${CARD_HEIGHT}`}
                    >
                      <Plus className="w-5 h-5 text-neutral-500" />
                      <span className="text-xs text-neutral-400">Add Vehicle</span>
                    </button>
                  )}
                </div>

                {/* Expanded edit form for existing vehicle */}
                {vehicleExpandedIndex !== null && formData.vehicles[vehicleExpandedIndex] && (() => {
                  const index = vehicleExpandedIndex;
                  const vehicle = formData.vehicles[index];
                  return (
                    <div className="border border-neutral-700 rounded-xl overflow-hidden">
                      <button onClick={() => setVehicleExpandedIndex(null)} className="flex items-center justify-between w-full p-3 text-left">
                        <span className="text-sm font-medium text-foreground">Edit Vehicle</span>
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      </button>
                      <div className="border-t border-neutral-700 p-4 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Vehicle Number<span className="text-red-400">*</span></label>
                          <input value={vehicle.licensePlate} onChange={(e) => handleVehicleChange(index, "licensePlate", e.target.value.toUpperCase())} placeholder="Enter Vehicle Number" className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none uppercase" autoComplete="off" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Vehicle Type</label>
                          <Select value={vehicle.vehicleType} onValueChange={(v) => handleVehicleChange(index, "vehicleType", v)}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-700 text-foreground text-sm rounded-lg h-10"><SelectValue placeholder="Enter Vehicle Type" /></SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-white/10">{vehicleTypes.map(t => <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Vehicle Color</label>
                          <Select value={vehicle.vehicleColor} onValueChange={(v) => handleVehicleChange(index, "vehicleColor", v)}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-700 text-foreground text-sm rounded-lg h-10"><SelectValue placeholder="Enter Vehicle Color" /></SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-white/10">{vehicleColors.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Vehicle Brand<span className="text-red-400">*</span></label>
                          <Select value={vehicle.vehicleBrand} onValueChange={(v) => handleVehicleChange(index, "vehicleBrand", v)} disabled={!vehicle.vehicleType}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-700 text-foreground text-sm rounded-lg h-10 disabled:opacity-50"><SelectValue placeholder={vehicle.vehicleType ? "Enter Vehicle Brand" : "Select type first"} /></SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-white/10">{(vehicle.vehicleType && vehicleBrands[vehicle.vehicleType] || []).map(b => <SelectItem key={b} value={b} className="text-foreground">{b}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* New vehicle inline form */}
                {showNewVehicleForm && (
                  <div className="border border-neutral-700 rounded-xl overflow-hidden">
                    <button onClick={saveNewVehicle} className="flex items-center justify-between w-full p-3 text-left">
                      <span className="text-sm font-medium text-foreground">New Vehicle</span>
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    </button>
                    <div className="border-t border-neutral-700 p-4 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Vehicle Number<span className="text-red-400">*</span></label>
                        <input value={newVehicle.licensePlate} onChange={(e) => setNewVehicle(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))} placeholder="Enter Vehicle Number" className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-foreground placeholder:text-neutral-500 outline-none uppercase" autoComplete="off" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Vehicle Type</label>
                        <Select value={newVehicle.vehicleType} onValueChange={(v) => setNewVehicle(prev => ({ ...prev, vehicleType: v, vehicleBrand: "" }))}>
                          <SelectTrigger className="bg-neutral-900 border-neutral-700 text-foreground text-sm rounded-lg h-10"><SelectValue placeholder="Enter Vehicle Type" /></SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-white/10">{vehicleTypes.map(t => <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Vehicle Color</label>
                        <Select value={newVehicle.vehicleColor} onValueChange={(v) => setNewVehicle(prev => ({ ...prev, vehicleColor: v }))}>
                          <SelectTrigger className="bg-neutral-900 border-neutral-700 text-foreground text-sm rounded-lg h-10"><SelectValue placeholder="Enter Vehicle Color" /></SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-white/10">{vehicleColors.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Vehicle Brand<span className="text-red-400">*</span></label>
                        <Select value={newVehicle.vehicleBrand} onValueChange={(v) => setNewVehicle(prev => ({ ...prev, vehicleBrand: v }))} disabled={!newVehicle.vehicleType}>
                          <SelectTrigger className="bg-neutral-900 border-neutral-700 text-foreground text-sm rounded-lg h-10 disabled:opacity-50"><SelectValue placeholder={newVehicle.vehicleType ? "Enter Vehicle Brand" : "Select type first"} /></SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-white/10">{(newVehicle.vehicleType && vehicleBrands[newVehicle.vehicleType] || []).map(b => <SelectItem key={b} value={b} className="text-foreground">{b}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Column */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Address</p>
              <div className="space-y-3">
                {/* Address cards grid - cards + add button in same grid */}
                <div className="grid grid-cols-2 gap-2">
                  {addresses.map((addr) => {
                    const isExpanded = addressExpandedId === addr.id;
                    const displayAddr = [addr.street, addr.city, [addr.state, addr.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");

                    if (isExpanded) return null;

                    return (
                      <SwipeableCard
                        key={addr.id}
                        onEdit={() => setAddressExpandedId(addr.id)}
                        onDelete={() => handleRemoveAddress(addr.id)}
                      >
                        <div className={`flex items-start gap-2.5 p-3 ${CARD_HEIGHT}`}>
                          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {getLabelIcon(addr.label)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{getDisplayLabel(addr)}</p>
                            <p className="text-xs text-neutral-400 leading-relaxed mt-0.5 line-clamp-2">{displayAddr}</p>
                            {addr.phone && (
                              <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {addr.phoneCountry.code} {addr.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </SwipeableCard>
                    );
                  })}

                  {/* Add Address button - inline in grid */}
                  {!showNewAddressForm && addresses.length < MAX_ADDRESSES && (
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className={`border-2 border-dashed border-neutral-600 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-neutral-500 transition-colors ${CARD_HEIGHT}`}
                    >
                      <Plus className="w-5 h-5 text-neutral-500" />
                      <span className="text-xs text-neutral-400">Add Address</span>
                    </button>
                  )}
                </div>

                {/* Expanded edit form for existing address */}
                {addressExpandedId && addresses.find(a => a.id === addressExpandedId) && (
                  <div className="border border-neutral-700 rounded-xl overflow-hidden">
                    <button onClick={() => setAddressExpandedId(null)} className="flex items-center justify-between w-full p-3 text-left">
                      <span className="text-sm font-medium text-foreground">Edit Address</span>
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    </button>
                    <div className="border-t border-neutral-700">
                      {renderAddressFormFields({
                        addr: addresses.find(a => a.id === addressExpandedId)!,
                        onChange: (field, value) => handleUpdateAddress(addressExpandedId, field, value),
                      })}
                    </div>
                  </div>
                )}

                {/* New address inline form */}
                {showNewAddressForm && (
                  <div className="border border-neutral-700 rounded-xl overflow-hidden">
                    <button onClick={saveNewAddress} className="flex items-center justify-between w-full p-3 text-left">
                      <span className="text-sm font-medium text-foreground">New Address</span>
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    </button>
                    <div className="border-t border-neutral-700">
                      {renderAddressFormFields({
                        addr: newAddress,
                        onChange: (field, value) => setNewAddress(prev => ({ ...prev, [field]: value })),
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons for compact/order mode */}
      {compact && (
        <div className="flex gap-3 p-4 border-t border-white/10 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-white/10 border-white/20 text-foreground hover:bg-white/20">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !isFormValid} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{isSaving ? "Saving..." : "Save Guest"}</Button>
        </div>
      )}
    </div>
  );
};

export default AddGuestForm;
