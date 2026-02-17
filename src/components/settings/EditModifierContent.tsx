import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { OrderTypeSheet } from "@/components/ui/order-type-sheet";

interface ModifierOption {
  id: string;
  name: string;
  price: string;
}

interface EditModifierContentProps {
  modifier: {
    id: string;
    name: string;
    type: string;
    selectedOptions: number;
    price: number;
    archived: boolean;
    orderTypeTags?: string[];
    canBeServed?: boolean;
    is86?: boolean;
    hasOptions?: boolean;
    options?: ModifierOption[];
    hasMaxSelections?: boolean;
    maxSelections?: number;
  };
  onBack: () => void;
  onSave: (data: {
    id: string;
    name: string;
    orderTypeTags: string[];
    canBeServed: boolean;
    is86: boolean;
    hasOptions: boolean;
    options: ModifierOption[];
    hasMaxSelections: boolean;
    maxSelections: number;
  }) => void;
}

const EditModifierContent = ({ modifier, onBack, onSave }: EditModifierContentProps) => {
  const [name, setName] = useState(modifier.name);
  const [orderTypeTags, setOrderTypeTags] = useState<string[]>(modifier.orderTypeTags || ["Dine in"]);
  const [canBeServed, setCanBeServed] = useState(modifier.canBeServed ?? true);
  const [is86, setIs86] = useState(modifier.is86 ?? false);
  const [hasOptions, setHasOptions] = useState(modifier.hasOptions ?? false);
  const [options, setOptions] = useState<ModifierOption[]>(
    modifier.options && modifier.options.length > 0 
      ? modifier.options 
      : [{ id: "1", name: "", price: "" }]
  );
  const [hasMaxSelections, setHasMaxSelections] = useState(modifier.hasMaxSelections ?? false);
  const [maxSelections, setMaxSelections] = useState(modifier.maxSelections ?? 1);
  const [showOrderTypeSheet, setShowOrderTypeSheet] = useState(false);

  const handleOrderTypeClose = (selectedTypes: string[]) => {
    if (selectedTypes.length > 0) {
      setOrderTypeTags(selectedTypes);
    }
    setShowOrderTypeSheet(false);
  };

  const handleBack = () => {
    // Only save if name is provided
    if (name.trim()) {
      // If has options enabled, check for valid options
      if (hasOptions) {
        const validOptions = options.filter(opt => opt.name.trim());
        if (validOptions.length === 0) {
          toast({
            title: "Error",
            description: "At least 1 option should be added",
            variant: "destructive",
          });
          return;
        }
      }

      onSave({
        id: modifier.id,
        name,
        orderTypeTags,
        canBeServed,
        is86,
        hasOptions,
        options: options.filter(opt => opt.name.trim()),
        hasMaxSelections,
        maxSelections,
      });
    }
    onBack();
  };

  const addOption = () => {
    setOptions([...options, { id: Date.now().toString(), name: "", price: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 1) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const updateOption = (id: string, field: "name" | "price", value: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-4 relative">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
          Edit Modifier
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pt-6 px-6 pb-28">
        {/* ORDER TYPE APPLICABLE */}
        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 block">
            Order Type Applicable
          </span>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <button 
              className="w-full flex items-center justify-between py-3.5 px-4 active:opacity-70 transition-opacity"
              onClick={() => setShowOrderTypeSheet(true)}
            >
              <div className="flex flex-col items-start">
                <span className="text-foreground text-[15px] font-medium">Order Type Tag</span>
                <span className="text-neutral-400 text-sm">{orderTypeTags.join(", ")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-foreground text-[15px]">{orderTypeTags.length}</span>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>
            </button>
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Choose which order types this modifier applies to, such as Dine-In, Takeaway, or Delivery. This allows you to control where the modifier can be used.
        </p>

        {/* Order Type Selection Sheet */}
        <OrderTypeSheet
          isOpen={showOrderTypeSheet}
          onClose={handleOrderTypeClose}
          initialSelected={orderTypeTags}
        />

        {/* MODIFIER INFORMATION */}
        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 block">
            Modifier Information
          </span>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {/* Modifier Name */}
            <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/50">
              <span className="text-foreground text-[15px]">Modifier Name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name"
                className="bg-transparent border-none text-right text-neutral-400 placeholder:text-neutral-500 w-40 h-auto p-0 focus-visible:ring-0"
              />
            </div>

            {/* Can this modifier be served? */}
            <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/50">
              <span className="text-foreground text-[15px]">Can this modifier be served?</span>
              <Switch
                checked={canBeServed}
                onCheckedChange={setCanBeServed}
              />
            </div>

            {/* 86 this Modifier? */}
            <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/50">
              <span className="text-foreground text-[15px]">86 this Modifier?</span>
              <Switch
                checked={is86}
                onCheckedChange={setIs86}
              />
            </div>

            {/* Does this modifier have options? */}
            <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/50">
              <span className="text-foreground text-[15px]">Does this modifier have options?</span>
              <Switch
                checked={hasOptions}
                onCheckedChange={setHasOptions}
              />
            </div>

            {/* Maximum Number of Selections */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-[15px]">Maximum Number of Selections</span>
              <Switch
                checked={hasMaxSelections}
                onCheckedChange={setHasMaxSelections}
              />
            </div>
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          When Has Options is enabled, you can create multiple choices under a single modifier. For example, Size (Small, Medium, Large) or Sauce Choice (BBQ, Mayo, Ketchup). Name – Enter the option name that staff will see on the POS. Price – Set the additional price for that option, if applicable. Leave it as zero if there is no extra charge. Add Option – Add more choices under the same modifier.
        </p>

        {/* MODIFIER OPTIONS (shown when hasOptions is true) */}
        {hasOptions && (
          <div className="mb-6">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 block">
              Modifier Options
            </span>
            <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_120px_40px] items-center py-3.5 px-4 border-b border-neutral-700/50">
                <span className="text-foreground text-[15px] font-semibold">Name</span>
                <span className="text-foreground text-[15px] font-semibold">Price</span>
                <span />
              </div>

              {/* Option Rows */}
              {options.map((option, index) => (
                <div key={option.id}>
                  {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                  <div className="grid grid-cols-[1fr_120px_40px] items-center py-3.5 px-4">
                    <Input
                      value={option.name}
                      onChange={(e) => updateOption(option.id, "name", e.target.value)}
                      placeholder="Enter Option Name"
                      className="bg-transparent border-none text-neutral-400 placeholder:text-neutral-500 h-auto p-0 focus-visible:ring-0"
                    />
                    <Input
                      value={option.price}
                      onChange={(e) => updateOption(option.id, "price", e.target.value)}
                      placeholder="Enter Price"
                      className="bg-transparent border-none text-neutral-400 placeholder:text-neutral-500 h-auto p-0 focus-visible:ring-0"
                    />
                    <button
                      onClick={() => removeOption(option.id)}
                      className="flex items-center justify-center text-neutral-500 active:opacity-70 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Option Button */}
              <div className="h-px bg-neutral-700/50 mx-4" />
              <button
                onClick={addOption}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-primary active:opacity-70 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[15px] font-medium">Add Option</span>
              </button>
            </div>
            <p className="text-neutral-400 text-sm mt-2 px-1">
              At least 1 option should be added
            </p>
          </div>
        )}

        {/* Maximum Selections Stepper (shown when hasMaxSelections is true) */}
        {hasMaxSelections && (
          <div className="mb-6">
            <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-[15px]">{maxSelections}</span>
                <div className="flex items-center bg-neutral-700/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setMaxSelections(Math.max(1, maxSelections - 1))}
                    className="w-10 h-10 flex items-center justify-center text-foreground active:opacity-70 transition-opacity border-r border-neutral-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMaxSelections(maxSelections + 1)}
                    className="w-10 h-10 flex items-center justify-center text-foreground active:opacity-70 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditModifierContent;
