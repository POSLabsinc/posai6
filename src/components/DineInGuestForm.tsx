import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DineInGuestFormProps {
  onSave: (data: DineInGuestData) => void;
  onCancel?: () => void;
}

export interface DineInGuestData {
  guestName: string;
  tableNumber: string;
  phoneNumber: string;
  email: string;
  notes: string;
}

const tableNumbers = Array.from({ length: 30 }, (_, i) => String(i + 1));

const DineInGuestForm = ({ onSave, onCancel }: DineInGuestFormProps) => {
  const [formData, setFormData] = useState<DineInGuestData>({
    guestName: "",
    tableNumber: "",
    phoneNumber: "",
    email: "",
    notes: "",
  });

  const maxNotes = 70;

  const handleInputChange = (field: keyof DineInGuestData, value: string) => {
    if (field === "notes" && value.length > maxNotes) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (formData.guestName && formData.tableNumber) {
      onSave(formData);
    }
  };

  const wordCount = formData.notes.split(/\s+/).filter(Boolean).length;

  return (
    <div className="p-4 border-b border-sidebar-border" style={{
      background: 'rgba(117, 117, 117, 0.3)',
    }}>
      <h3 className="text-sm font-semibold text-foreground mb-3">Guest Information</h3>
      
      {/* Search Field */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Guest Name or Number"
          className="pl-9 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Guest Name and Table Number */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Input
            placeholder="Guest Name*"
            value={formData.guestName}
            onChange={(e) => handleInputChange("guestName", e.target.value)}
            className="bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <Select value={formData.tableNumber} onValueChange={(value) => handleInputChange("tableNumber", value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-sm h-9 text-foreground">
              <SelectValue placeholder="Table Number*" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              {tableNumbers.map((num) => (
                <SelectItem key={num} value={num} className="text-white hover:bg-neutral-700">
                  Table {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Phone Number */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-md h-9">
          <span className="text-lg">🇺🇸</span>
          <span className="text-xs text-muted-foreground">+1</span>
        </div>
        <Input
          placeholder="Phone Number*"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          className="flex-1 bg-white/10 border-white/20 text-sm h-9 text-foreground placeholder:text-muted-foreground"
        />
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
        disabled={!formData.guestName || !formData.tableNumber}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9"
      >
        Save
      </Button>
    </div>
  );
};

export default DineInGuestForm;
