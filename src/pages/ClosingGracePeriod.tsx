import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ClosingGracePeriodModal from "@/components/ClosingGracePeriodModal";

const DEVICE_ID = "shared";

function formatNewClosingTime(baseHour: number, baseMinute: number, extensionMinutes: number): string {
  const totalMinutes = baseHour * 60 + baseMinute + extensionMinutes;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;
  const period = newHour >= 12 ? "PM" : "AM";
  const displayHour = newHour === 0 ? 12 : newHour > 12 ? newHour - 12 : newHour;
  return `${displayHour}:${newMinute.toString().padStart(2, "0")} ${period}`;
}

const ClosingGracePeriod = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  // Check if there's already an extension for today
  useEffect(() => {
    const checkExisting = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("closing_time_extensions")
        .select("*")
        .eq("device_id", DEVICE_ID)
        .eq("extension_date", today)
        .eq("status", "active")
        .maybeSingle();

      if (data) {
        toast.info("Closing time already extended today", {
          description: `Extended to ${data.new_closing_time}`,
        });
        navigate(-1);
      }
    };
    checkExisting();
  }, [navigate]);

  const handleConfirmExtension = useCallback(async (minutes: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const baseHour = 22;
    const baseMinute = 0;
    const newClosing = formatNewClosingTime(baseHour, baseMinute, minutes);

    const { error } = await (supabase as any)
      .from("closing_time_extensions")
      .upsert(
        {
          device_id: DEVICE_ID,
          extension_date: today,
          original_closing_time: "10:00 PM",
          extension_minutes: minutes,
          new_closing_time: newClosing,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id,extension_date" }
      );

    if (error) {
      toast.error("Failed to save extension", { description: error.message });
    } else {
      toast.success("Closing time extended", {
        description: `New closing time: ${newClosing}`,
        duration: 5000,
      });
    }
    navigate(-1);
  }, [navigate]);

  const handleConfirmNoExtension = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);

    await (supabase as any)
      .from("closing_time_extensions")
      .upsert(
        {
          device_id: DEVICE_ID,
          extension_date: today,
          original_closing_time: "10:00 PM",
          extension_minutes: 0,
          new_closing_time: "10:00 PM",
          status: "declined",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id,extension_date" }
      );

    toast.info("No extension applied", {
      description: "Restaurant will close at 10:00 PM",
    });
    navigate(-1);
  }, [navigate]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    navigate(-1);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full w-full bg-background">
      <ClosingGracePeriodModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirmExtension={handleConfirmExtension}
        onConfirmNoExtension={handleConfirmNoExtension}
      />
    </div>
  );
};

export default ClosingGracePeriod;
