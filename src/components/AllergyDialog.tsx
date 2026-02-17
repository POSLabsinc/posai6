import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import allergyIcon from "@/assets/icons/allergy.svg";

interface AllergyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (allergies: string[], notes: string) => void;
}

const commonAllergies = [
  "Peanuts",
  "Tree Nuts",
  "Milk/Dairy",
  "Eggs",
  "Wheat/Gluten",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "Mustard",
];

export default function AllergyDialog({ open, onOpenChange, onSave }: AllergyDialogProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const handleSave = () => {
    onSave(selectedAllergies, notes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <img src={allergyIcon} alt="" className="w-5 h-5" />
            Allergy Information
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Mark any allergies or dietary restrictions for this order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Common Allergies Grid */}
          <div className="space-y-2">
            <label className="text-sm text-neutral-300">Common Allergies</label>
            <div className="grid grid-cols-2 gap-2">
              {commonAllergies.map((allergy) => (
                <button
                  key={allergy}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    selectedAllergies.includes(allergy)
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700 text-white'
                  }`}
                  onClick={() => toggleAllergy(allergy)}
                >
                  <span className="text-sm">{allergy}</span>
                  {selectedAllergies.includes(allergy) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm text-neutral-300">Additional Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional dietary requirements or notes..."
              className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 min-h-[80px]"
            />
          </div>

          {/* Selected Summary */}
          {selectedAllergies.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                <img src={allergyIcon} alt="" className="w-4 h-4" />
                Selected Allergies
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedAllergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="px-2 py-1 bg-amber-500/20 rounded text-xs text-amber-300"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600"
            onClick={handleSave}
          >
            Save Allergies
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
