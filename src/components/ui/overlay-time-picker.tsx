import { CompactTimePicker } from "@/components/ui/compact-time-picker";

interface OverlayTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

/**
 * Standardized overlay time picker used across all settings.
 * Renders the CompactTimePicker as a floating overlay with a dismiss backdrop.
 */
const OverlayTimePicker = ({ isOpen, onClose, selectedTime, onTimeChange }: OverlayTimePickerProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
        <CompactTimePicker selectedTime={selectedTime} onTimeChange={onTimeChange} />
      </div>
    </>
  );
};

export { OverlayTimePicker };
