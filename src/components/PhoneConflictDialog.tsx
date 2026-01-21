import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, User, Pencil, Users, Plus } from "lucide-react";
import { Customer } from "@/data/customers";

interface PhoneConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomer: Customer | null;
  newName: string;
  onUseExisting: () => void;
  onUpdateName: () => void;
  onAddFamilyMember: () => void;
  onCreateNew: () => void;
}

const PhoneConflictDialog = ({
  isOpen,
  onClose,
  existingCustomer,
  newName,
  onUseExisting,
  onUpdateName,
  onAddFamilyMember,
  onCreateNew,
}: PhoneConflictDialogProps) => {
  if (!existingCustomer) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "No orders yet";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-neutral-900 border-neutral-700 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <AlertDialogTitle className="text-amber-400 text-lg">
              Phone Number Already Exists
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-neutral-400 pt-2">
            This phone number is registered to a different customer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Existing Customer Info */}
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {existingCustomer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{existingCustomer.name}</p>
              <p className="text-neutral-400 text-sm">{existingCustomer.phone}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-700 flex gap-4 text-xs text-neutral-500">
            <span>Last order: {formatDate(existingCustomer.lastOrderDate)}</span>
            {existingCustomer.orderCount && (
              <span>{existingCustomer.orderCount} orders</span>
            )}
          </div>
        </div>

        {/* New Name Entered */}
        <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
          <p className="text-neutral-500 text-sm">You entered:</p>
          <p className="text-white font-medium">"{newName}"</p>
        </div>

        {/* Action Options */}
        <div className="space-y-2 mt-2">
          <button
            onClick={onUseExisting}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Use Existing Customer</p>
              <p className="text-neutral-500 text-xs">Continue with "{existingCustomer.name}"</p>
            </div>
          </button>

          <button
            onClick={onUpdateName}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Pencil className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Update Customer Name</p>
              <p className="text-neutral-500 text-xs">Change "{existingCustomer.name}" to "{newName}"</p>
            </div>
          </button>

          <button
            onClick={onAddFamilyMember}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Add as Family Member</p>
              <p className="text-neutral-500 text-xs">Link "{newName}" to this phone number</p>
            </div>
          </button>

          <button
            onClick={onCreateNew}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Create New Customer</p>
              <p className="text-neutral-500 text-xs">Save "{newName}" with a different phone</p>
            </div>
          </button>
        </div>

        <AlertDialogFooter className="mt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-sm"
          >
            Cancel
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PhoneConflictDialog;
