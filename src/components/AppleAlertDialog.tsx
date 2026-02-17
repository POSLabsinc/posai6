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

interface AppleAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  cancelText?: string;
  confirmText: string;
}

const AppleAlertDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description, 
  cancelText = "Cancel", 
  confirmText 
}: AppleAlertDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[270px] rounded-[14px] p-0 border-0 bg-[#2C2C2E]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        <AlertDialogHeader className="pt-5 pb-4 px-4 space-y-2">
          <AlertDialogTitle className="text-[17px] font-semibold text-white text-center tracking-[-0.4px]">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-[#EBEBF599] text-center leading-[18px] tracking-[-0.08px]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-row border-t border-[#545458]/50 p-0 m-0 gap-0">
          <AlertDialogCancel className="flex-1 h-11 m-0 rounded-none border-0 bg-transparent hover:bg-[#545458]/30 text-[17px] font-semibold text-white/70 tracking-[-0.4px] transition-colors">
            {cancelText}
          </AlertDialogCancel>
          <div className="w-[0.5px] bg-[#545458]/50" />
          <AlertDialogAction 
            onClick={onConfirm}
            className="flex-1 h-11 m-0 rounded-none border-0 bg-transparent hover:bg-[#545458]/30 text-[17px] font-normal text-[#FF9500] tracking-[-0.4px] transition-colors"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AppleAlertDialog;
