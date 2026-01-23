import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, ArrowRight, UserCheck, X } from "lucide-react";
import { formatTableName } from "@/lib/orderUtils";
import type { ActiveOrderInfo } from "@/lib/orderUtils";

interface ActiveOrderExistsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingOrder: ActiveOrderInfo | null;
  onUseSameCustomer: () => void;
  tableId: string;
}

const ActiveOrderExistsDialog = ({
  isOpen,
  onClose,
  existingOrder,
  onUseSameCustomer,
  tableId,
}: ActiveOrderExistsDialogProps) => {
  const navigate = useNavigate();

  if (!existingOrder) return null;

  const handleGoToExistingOrder = () => {
    onClose();
    navigate(`/tableorder/${existingOrder.table}?selected=${existingOrder.id}`);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-neutral-900 border-neutral-700 max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-amber-400" />
          </div>
          <AlertDialogTitle className="text-white text-xl text-center">
            Active Order Exists on {formatTableName(tableId)}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400 text-center mt-2">
            This table has an active order for:
          </AlertDialogDescription>
          
          {/* Existing Customer Info */}
          <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <div className="text-white font-semibold text-lg">{existingOrder.name}</div>
            {existingOrder.phone && (
              <div className="text-neutral-400 text-sm mt-1">{existingOrder.phone}</div>
            )}
            <div className="flex items-center gap-2 mt-2 text-neutral-500 text-sm">
              <span>Party of {existingOrder.partySize}</span>
              <span>·</span>
              <span className="text-amber-400">{existingOrder.status}</span>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {/* Use Same Customer - Primary action */}
          <button
            onClick={onUseSameCustomer}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <UserCheck className="w-5 h-5" />
            Use Same Customer (Same Party)
          </button>

          {/* Go to Existing Order */}
          <button
            onClick={handleGoToExistingOrder}
            className="w-full py-3 px-4 bg-neutral-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-neutral-600 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            Go to Existing Order
          </button>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-transparent text-neutral-400 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors border border-neutral-700"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>

        <AlertDialogFooter className="hidden">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ActiveOrderExistsDialog;
