import { useState } from "react";
import { X, Ticket, Calendar, QrCode, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface CreateVoucherFormProps {
  onClose: () => void;
  onCreate: (voucherData: VoucherFormData) => void;
}

export interface VoucherFormData {
  type: "percentage" | "fixed" | "free_item";
  value: string;
  expirationDate: string;
  maximumUses: string;
  minimumPurchase: string;
  tags: string;
  customCode: string;
  enableQrBarcode: boolean;
}

const CreateVoucherForm = ({ onClose, onCreate }: CreateVoucherFormProps) => {
  const [formData, setFormData] = useState<VoucherFormData>({
    type: "" as VoucherFormData["type"],
    value: "",
    expirationDate: "",
    maximumUses: "",
    minimumPurchase: "",
    tags: "",
    customCode: "",
    enableQrBarcode: false,
  });

  const handleChange = (field: keyof VoucherFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as VoucherFormData["type"], value: "" }));
  };

  const isFormValid =
    formData.type &&
    formData.expirationDate &&
    (formData.type === "free_item" || formData.value);

  const handleCreate = () => {
    if (isFormValid) {
      onCreate(formData);
      onClose();
    }
  };

  return (
    <div
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{
        background: "#7575754D",
        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-white" />
          <h2 className="text-lg font-semibold text-white">Create Voucher</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Type + Value row */}
        <div className={`grid ${formData.type && formData.type !== "free_item" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
          <div>
            <label className="text-sm text-white/70 mb-1 block">
              Type <span className="text-primary">*</span>
            </label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-white/10 z-[200]">
                <SelectItem value="percentage" className="text-white hover:bg-white/10">
                  Percentage
                </SelectItem>
                <SelectItem value="fixed" className="text-white hover:bg-white/10">
                  Fixed Amount
                </SelectItem>
                <SelectItem value="free_item" className="text-white hover:bg-white/10">
                  Free Item
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "percentage" && (
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                Percentage <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.value}
                  onChange={(e) => handleChange("value", e.target.value)}
                  placeholder="e.g. 20"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">%</span>
              </div>
            </div>
          )}

          {formData.type === "fixed" && (
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                Amount <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => handleChange("value", e.target.value)}
                  placeholder="e.g. 25.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-7"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">$</span>
              </div>
            </div>
          )}
        </div>

        {/* Expiration Date */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">
            Expiration Date <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Input
              type="date"
              value={formData.expirationDate}
              onChange={(e) => handleChange("expirationDate", e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-9 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
        </div>

        {/* Maximum Uses */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Maximum Uses</label>
          <Input
            type="number"
            min="1"
            value={formData.maximumUses}
            onChange={(e) => handleChange("maximumUses", e.target.value)}
            placeholder="Unlimited"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          {formData.maximumUses && (
            <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Use this voucher code "{formData.maximumUses}" times
            </p>
          )}
        </div>

        {/* Minimum Purchase */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Minimum Purchase</label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.minimumPurchase}
              onChange={(e) => handleChange("minimumPurchase", e.target.value)}
              placeholder="No minimum"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-7"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">$</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Tags (comma-separated)</label>
          <Input
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
            placeholder="e.g. VIP, Holiday, Promotion"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        {/* Custom Voucher Code */}
        <div>
          <label className="text-sm text-white/70 mb-1 block">Custom Voucher Code</label>
          <Input
            value={formData.customCode}
            onChange={(e) => handleChange("customCode", e.target.value.toUpperCase())}
            placeholder="e.g. SUMMER2026"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 uppercase"
          />
        </div>

        {/* QR / Barcode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-white/60" />
            <div>
              <p className="text-white text-sm font-medium">Enable QR / Barcode</p>
              <p className="text-white/40 text-xs">Generate a scannable code for this voucher.</p>
            </div>
          </div>
          <Switch
            checked={formData.enableQrBarcode}
            onCheckedChange={(checked) => handleChange("enableQrBarcode", checked)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleCreate}
          disabled={!isFormValid}
          className={`w-full h-11 rounded-lg font-medium transition-colors ${
            isFormValid
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          Create Voucher
        </button>
      </div>
    </div>
  );
};

export default CreateVoucherForm;
