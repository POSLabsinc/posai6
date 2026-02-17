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

interface AddModifierContentProps {
  onBack: () => void;
  onSave: (data: {
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

const AddModifierContent = ({ onBack, onSave }: AddModifierContentProps) => {
  const [name, setName] = useState("");
  const [orderTypeTags, setOrderTypeTags] = useState<string[]>([]);
  const [canBeServed, setCanBeServed] = useState(true);
  const [is86, setIs86] = useState(true);
  const [hasOptions, setHasOptions] = useState(false);
  const [options, setOptions] = useState<ModifierOption[]>([
    { id: "1", name: "", price: "" }
  ]);
  const [hasMaxSelections, setHasMaxSelections] = useState(false);
  const [maxSelections, setMaxSelections] = useState(1);
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
          Add Modifier
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pt-6 px-6 pb-28">
        {/* APPLIES TO */}
        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 block">
            Applies To
          </span>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <button 
              className="w-full flex items-center justify-between py-3.5 px-4 active:opacity-70 transition-opacity"
              onClick={() => setShowOrderTypeSheet(true)}
            >
              <div className="flex flex-col items-start">
                <span className="text-foreground text-[15px] font-medium">Select order types</span>
                <span className="text-neutral-400 text-sm">
                  {orderTypeTags.length > 0 ? orderTypeTags.join(", ") : "No order types selected"}
                </span>
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

        {/* MODIFIER DETAILS */}
        <div className="mb-1">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 block">
            Modifier Details
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

            {/* Available to Order */}
            <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/50">
              <span className="text-foreground text-[15px]">Available to Order</span>
              <Switch
                checked={canBeServed}
                onCheckedChange={setCanBeServed}
              />
            </div>

            {/* Mark as Unavailable (86) */}
            <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-700/50">
              <span className="text-foreground text-[15px]">Mark as Unavailable (86)</span>
              <Switch
                checked={is86}
                onCheckedChange={setIs86}
              />
            </div>

            {/* Has Options */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-[15px]">Has Options</span>
              <Switch
                checked={hasOptions}
                onCheckedChange={setHasOptions}
              />
            </div>

            {/* Modifier Options (inline, shown when hasOptions is true) */}
            {hasOptions && (
              <>
                <div className="h-px bg-neutral-700/50 mx-4" />
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

                {/* Selection Limit */}
                <div className="h-px bg-neutral-700/50 mx-4" />
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-[15px]">Selection Limit</span>
                  <Switch
                    checked={hasMaxSelections}
                    onCheckedChange={setHasMaxSelections}
                  />
                </div>

                {/* Selection Limit Stepper */}
                {hasMaxSelections && (
                  <>
                    <div className="h-px bg-neutral-700/50 mx-4" />
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
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          When Has Options is enabled, you can create multiple choices under a single modifier. For example, Size (Small, Medium, Large) or Sauce Choice (BBQ, Mayo, Ketchup). Name – Enter the option name that staff will see on the POS. Price – Set the additional price for that option, if applicable. Leave it as zero if there is no extra charge. Add Option – Add more choices under the same modifier.
        </p>
      </div>
    </div>
  );
};

export default AddModifierContent;
