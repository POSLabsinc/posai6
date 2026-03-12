import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from "@/lib/utils";
import { Customer } from "@/services/customerService";
import { useCustomerSearch, usePhoneConflict } from "@/hooks/useCustomerSearch";
import PhoneConflictDialog from "@/components/PhoneConflictDialog";

interface TakeOutGuestFormProps {
  onSave: (data: TakeOutGuestData) => void;
  onCancel?: () => void;
  onClose?: () => void;
  initialData?: TakeOutGuestData | null;
}

export interface TakeOutGuestData {
  guestName: string;
  phoneNumber: string;
  email: string;
  notes: string;
}

const TakeOutGuestForm = ({ onSave, onCancel, onClose, initialData }: TakeOutGuestFormProps) => {
  const [formData, setFormData] = useState<TakeOutGuestData>({
    guestName: initialData?.guestName || "",
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

  const handleInputChange = (field: keyof TakeOutGuestData, value: string) => {
    if (field === "notes" && value.length > maxNotes) return;
    if (field === "phoneNumber") {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
    if (formData.guestName && isValidPhoneNumber(formData.phoneNumber)) {
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
    // In a real app, this would update the customer record in the database
    // For now, just keep the new name and close the dialog
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const handleAddFamilyMember = () => {
    // In a real app, this would link the new profile to the existing phone number
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const handleCreateNew = () => {
    // Clear the phone number so user can enter a different one
    setFormData((prev) => ({
      ...prev,
      phoneNumber: "",
    }));
    setShowConflictDialog(false);
    setConflictCustomer(null);
  };

  const isFormValid = formData.guestName && isValidPhoneNumber(formData.phoneNumber);

  return (
    <div className="flex flex-col h-full rounded-b-lg overflow-hidden bg-neutral-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 md:border-b-0">
        <h2 className="text-lg font-semibold text-white">Take-Out Guest Information</h2>
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
          <label className="text-sm text-neutral-500 mb-1 block">Phone Number *</label>
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

export default TakeOutGuestForm;
