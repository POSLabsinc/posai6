import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from "@/lib/utils";
import { Customer } from "@/services/customerService";
import { useCustomerSearch, usePhoneConflict } from "@/hooks/useCustomerSearch";
import PhoneConflictDialog from "@/components/PhoneConflictDialog";

interface DineInGuestFormProps {
  onSave: (data: DineInGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
  initialData?: DineInGuestData | null;
}

export interface DineInGuestData {
  guestName: string;
  tableNumber: string;
  phoneNumber: string;
  email: string;
  notes: string;
}

const DineInGuestForm = ({ onSave, onCancel, onClose, initialData }: DineInGuestFormProps) => {
  const [formData, setFormData] = useState<DineInGuestData>({
    guestName: initialData?.guestName || "",
    tableNumber: initialData?.tableNumber || "",
    phoneNumber: initialData?.phoneNumber ? formatPhoneNumber(initialData.phoneNumber) : "",
    email: initialData?.email || "",
    notes: initialData?.notes || "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Phone conflict state
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictCustomer, setConflictCustomer] = useState<Customer | null>(null);

  const maxNotes = 70;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (guest) =>
        guest.name.toLowerCase().includes(query) ||
        guest.phone.replace(/\D/g, "").includes(query.replace(/\D/g, ""))
    );
  }, [searchQuery]);

  // Check for phone conflict when phone number changes
  useEffect(() => {
    const conflict = checkPhoneConflict(formData.phoneNumber, formData.guestName);
    if (conflict) {
      setConflictCustomer(conflict);
      setShowConflictDialog(true);
    }
  }, [formData.phoneNumber, formData.guestName]);

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

  const handleInputChange = (field: keyof DineInGuestData, value: string) => {
    if (field === "notes" && value.length > maxNotes) return;
    if (field === "phoneNumber") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
    // Phone is optional for dine-in, but if provided must be valid
    const phoneValid = !formData.phoneNumber || isValidPhoneNumber(formData.phoneNumber);
    if (formData.guestName && formData.tableNumber && phoneValid) {
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

  // Conflict resolution handlers
  const handleUseExisting = () => {
    if (conflictCustomer) {
      setFormData((prev) => ({
        ...prev,
        guestName: conflictCustomer.name,
        email: conflictCustomer.email || prev.email,
      }));
    }
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const handleUpdateName = () => {
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const handleAddFamilyMember = () => {
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const handleCreateNew = () => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: "",
    }));
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const isFormValid = formData.guestName && formData.tableNumber && (!formData.phoneNumber || isValidPhoneNumber(formData.phoneNumber));

  return (
    <div className="flex flex-col h-full rounded-b-lg overflow-hidden bg-neutral-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 md:border-b-0">
        <h2 className="text-lg font-semibold text-white">Dine-In Guest Information</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
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

        {/* Guest Name and Table Number */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-neutral-500 mb-1 block">Guest Name *</label>
            <Input
              placeholder="Enter guest name"
              value={formData.guestName}
              onChange={(e) => handleInputChange("guestName", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-500 mb-1 block">Table Number *</label>
            <Input
              type="number"
              min={1}
              max={30}
              inputMode="numeric"
              placeholder="Enter table number"
              value={formData.tableNumber}
              onChange={(e) => handleInputChange("tableNumber", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>
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

export default DineInGuestForm;
