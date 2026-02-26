import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, Sparkles, DollarSign, BadgeDollarSign, Wallet, Tag, LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Discount {
  id: string;
  name: string;
  type: "percentage" | "amount";
  value: number;
  icon: LucideIcon;
}

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyDiscounts: (discounts: Discount[]) => void;
  currentDiscounts: Discount[];
  subtotal: number;
}

const availableDiscounts: Discount[] = [
  { id: "employee", name: "Employee Discount", type: "percentage", value: 20, icon: Briefcase },
  { id: "senior", name: "Senior Citizen", type: "percentage", value: 15, icon: Heart },
  { id: "student", name: "Student Discount", type: "percentage", value: 10, icon: GraduationCap },
  { id: "military", name: "Military Discount", type: "percentage", value: 15, icon: Shield },
  { id: "loyalty", name: "Loyalty Member", type: "percentage", value: 5, icon: Star },
  { id: "happy-hour", name: "Happy Hour", type: "percentage", value: 25, icon: Clock },
  { id: "birthday", name: "Birthday Special", type: "percentage", value: 30, icon: Cake },
  { id: "first-visit", name: "First Visit", type: "percentage", value: 10, icon: Sparkles },
  { id: "manager-5", name: "Manager Comp $5", type: "amount", value: 5, icon: DollarSign },
  { id: "manager-10", name: "Manager Comp $10", type: "amount", value: 10, icon: BadgeDollarSign },
  { id: "manager-15", name: "Manager Comp $15", type: "amount", value: 15, icon: Wallet },
  { id: "promo-code", name: "Promo Code Discount", type: "percentage", value: 20, icon: Tag },
];

export function DiscountDialog({
  open,
  onOpenChange,
  onApplyDiscounts,
  currentDiscounts,
  subtotal,
}: DiscountDialogProps) {
  const [selectedDiscounts, setSelectedDiscounts] = useState<Discount[]>(currentDiscounts);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      setSelectedDiscounts(currentDiscounts);
    }
  }, [open, currentDiscounts]);

  const handleApply = () => {
    onApplyDiscounts(selectedDiscounts);
    onOpenChange(false);
  };

  const toggleDiscount = (discount: Discount) => {
    setSelectedDiscounts(prev => {
      const isSelected = prev.some(d => d.id === discount.id);
      if (isSelected) {
        return prev.filter(d => d.id !== discount.id);
      } else {
        return [...prev, discount];
      }
    });
  };

  const calculateDiscountAmount = (discount: Discount) => {
    if (discount.type === "percentage") {
      return (subtotal * discount.value) / 100;
    }
    return discount.value;
  };

  const calculateTotalSavings = () => {
    return selectedDiscounts.reduce((total, discount) => {
      return total + calculateDiscountAmount(discount);
    }, 0);
  };

  const totalSavings = calculateTotalSavings();

  const DiscountList = ({ isMobileView = false }: { isMobileView?: boolean }) => (
    <>
      {isMobileView ? (
        <div className="max-h-[50vh] overflow-y-auto">
          <div className="p-3 space-y-2">
            {availableDiscounts.map((discount) => {
              const discountAmount = calculateDiscountAmount(discount);
              const isSelected = selectedDiscounts.some(d => d.id === discount.id);

              return (
                <button
                  key={discount.id}
                  onClick={() => toggleDiscount(discount)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary/20 border border-primary"
                      : "bg-neutral-800 hover:bg-neutral-700 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? "bg-primary"
                          : "bg-neutral-700"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <discount.icon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">
                        {discount.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {discount.type === "percentage"
                          ? `${discount.value}% off`
                          : `$${discount.value.toFixed(2)} off`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    -${discountAmount.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <ScrollArea className="max-h-[50vh]">
          <div className="p-3 space-y-2">
            {availableDiscounts.map((discount) => {
              const discountAmount = calculateDiscountAmount(discount);
              const isSelected = selectedDiscounts.some(d => d.id === discount.id);

              return (
                <button
                  key={discount.id}
                  onClick={() => toggleDiscount(discount)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary/20 border border-primary"
                      : "bg-neutral-800 hover:bg-neutral-700 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? "bg-primary"
                          : "bg-neutral-700"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <discount.icon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">
                        {discount.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {discount.type === "percentage"
                          ? `${discount.value}% off`
                          : `$${discount.value.toFixed(2)} off`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    -${discountAmount.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
      {selectedDiscounts.length > 0 && (
        <div className="px-4 py-3 bg-primary/10 border-t border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {selectedDiscounts.length} discount{selectedDiscounts.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedDiscounts.map(d => d.name).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Savings</p>
              <p className="text-lg font-bold text-primary">-${totalSavings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 pt-2 border-t border-sidebar-border">
        <Button
          onClick={handleApply}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Apply {selectedDiscounts.length > 0 ? `(${selectedDiscounts.length})` : ''}
        </Button>
      </div>
    </>
  );

  // Use Drawer for mobile, Dialog for desktop/landscape
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-neutral-900 border-sidebar-border">
          <DrawerHeader className="border-b border-sidebar-border pb-2">
            <DrawerTitle className="text-foreground text-lg font-semibold text-center">
              Select Discounts
            </DrawerTitle>
          </DrawerHeader>
          <DiscountList isMobileView={true} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-neutral-900 border-sidebar-border p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-sidebar-border">
          <DialogTitle className="text-foreground text-lg font-semibold">
            Select Discounts
          </DialogTitle>
        </DialogHeader>
        <DiscountList />
      </DialogContent>
    </Dialog>
  );
}

export type { Discount };
