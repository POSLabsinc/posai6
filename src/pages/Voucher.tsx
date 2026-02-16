import { useNavigate } from "react-router-dom";
import VoucherDialog from "@/components/VoucherDialog";

const Voucher = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <VoucherDialog
        isOpen={true}
        onClose={() => navigate(-1)}
        onAddVoucher={(amount) => {
          // TODO: integrate with order context
          navigate(-1);
        }}
        onRedeemVoucher={(code, balance) => {
          // TODO: integrate with order context
          navigate(-1);
        }}
      />
    </div>
  );
};

export default Voucher;
