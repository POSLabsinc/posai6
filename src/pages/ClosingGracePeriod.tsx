import { useState } from "react";
import Orders from "./Orders";
import ClosingGracePeriodModal from "@/components/ClosingGracePeriodModal";
import { useNavigate } from "react-router-dom";

const ClosingGracePeriod = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    navigate("/orders");
  };

  const handleConfirmExtension = (minutes: number) => {
    // Frontend only - would trigger backend action
    console.log(`Extended by ${minutes} minutes`);
    navigate("/orders");
  };

  const handleConfirmNoExtension = () => {
    // Frontend only - would trigger backend action
    console.log("No extension selected");
    navigate("/orders");
  };

  return (
    <div className="relative h-full">
      {/* Orders screen visible in background */}
      <Orders />
      
      {/* Modal overlay */}
      <ClosingGracePeriodModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onConfirmExtension={handleConfirmExtension}
        onConfirmNoExtension={handleConfirmNoExtension}
      />
    </div>
  );
};

export default ClosingGracePeriod;
