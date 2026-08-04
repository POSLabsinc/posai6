import { useNavigate } from "react-router-dom";
import { ClockInOverlay } from "@/components/ClockInOverlay";

/** Standalone route for the clock-in PIN screen. */
const ClockInPin = () => {
  const navigate = useNavigate();

  return (
    <ClockInOverlay
      isOpen
      onClose={() => navigate("/")}
      onEnterPOS={() => navigate("/")}
    />
  );
};

export default ClockInPin;
