import { useState, useCallback } from "react";
import type { DineInGuestData } from "@/components/DineInGuestForm";
import type { TakeOutGuestData } from "@/components/TakeOutGuestForm";
import type { DeliveryGuestData } from "@/components/DeliveryGuestForm";
import type { BanquetGuestData } from "@/components/BanquetGuestForm";
import type { DriveThruGuestData } from "@/components/DriveThruGuestForm";
import type { CurbSideGuestData } from "@/components/CurbSideGuestForm";
import type { ScheduledGuestData } from "@/components/ScheduledGuestForm";
import type { PhoneInGuestData } from "@/components/PhoneInGuestForm";
import type { CustomOrderGuestData } from "@/components/CustomOrderGuestForm";

export type AnyGuestData =
  | DineInGuestData
  | TakeOutGuestData
  | DeliveryGuestData
  | BanquetGuestData
  | DriveThruGuestData
  | CurbSideGuestData
  | ScheduledGuestData
  | PhoneInGuestData
  | CustomOrderGuestData;

export function useOrderTypeGuests() {
  const [showDineInForm, setShowDineInForm] = useState(false);
  const [dineInGuestData, setDineInGuestData] = useState<DineInGuestData | null>(null);
  const [showTakeOutForm, setShowTakeOutForm] = useState(false);
  const [takeOutGuestData, setTakeOutGuestData] = useState<TakeOutGuestData | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryGuestData, setDeliveryGuestData] = useState<DeliveryGuestData | null>(null);
  const [showBanquetForm, setShowBanquetForm] = useState(false);
  const [banquetGuestData, setBanquetGuestData] = useState<BanquetGuestData | null>(null);
  const [showDriveThruForm, setShowDriveThruForm] = useState(false);
  const [driveThruGuestData, setDriveThruGuestData] = useState<DriveThruGuestData | null>(null);
  const [showCurbSideForm, setShowCurbSideForm] = useState(false);
  const [curbSideGuestData, setCurbSideGuestData] = useState<CurbSideGuestData | null>(null);
  const [showScheduledForm, setShowScheduledForm] = useState(false);
  const [scheduledGuestData, setScheduledGuestData] = useState<ScheduledGuestData | null>(null);
  const [showPhoneInForm, setShowPhoneInForm] = useState(false);
  const [phoneInGuestData, setPhoneInGuestData] = useState<PhoneInGuestData | null>(null);
  const [showCustomOrderForm, setShowCustomOrderForm] = useState(false);
  const [customOrderGuestData, setCustomOrderGuestData] = useState<CustomOrderGuestData | null>(null);

  const closeAllForms = useCallback(() => {
    setShowDineInForm(false);
    setShowTakeOutForm(false);
    setShowDeliveryForm(false);
    setShowBanquetForm(false);
    setShowDriveThruForm(false);
    setShowCurbSideForm(false);
    setShowScheduledForm(false);
    setShowPhoneInForm(false);
    setShowCustomOrderForm(false);
  }, []);

  const openFormForType = useCallback((label: string) => {
    closeAllForms();
    switch (label) {
      case "DINE IN": setShowDineInForm(true); break;
      case "TAKE OUT": setShowTakeOutForm(true); break;
      case "DELIVERY": setShowDeliveryForm(true); break;
      case "BANQUET": setShowBanquetForm(true); break;
      case "DRIVE THRU": setShowDriveThruForm(true); break;
      case "CURB SIDE": setShowCurbSideForm(true); break;
      case "SCHEDULED": setShowScheduledForm(true); break;
      case "PHONE-IN": setShowPhoneInForm(true); break;
      case "CUSTOM": setShowCustomOrderForm(true); break;
    }
  }, [closeAllForms]);

  const clearAllGuestData = useCallback(() => {
    setDineInGuestData(null);
    setTakeOutGuestData(null);
    setDeliveryGuestData(null);
    setBanquetGuestData(null);
    setDriveThruGuestData(null);
    setCurbSideGuestData(null);
    setScheduledGuestData(null);
    setPhoneInGuestData(null);
    setCustomOrderGuestData(null);
    closeAllForms();
  }, [closeAllForms]);

  return {
    // Show states
    showDineInForm, setShowDineInForm,
    showTakeOutForm, setShowTakeOutForm,
    showDeliveryForm, setShowDeliveryForm,
    showBanquetForm, setShowBanquetForm,
    showDriveThruForm, setShowDriveThruForm,
    showCurbSideForm, setShowCurbSideForm,
    showScheduledForm, setShowScheduledForm,
    showPhoneInForm, setShowPhoneInForm,
    showCustomOrderForm, setShowCustomOrderForm,
    // Data states
    dineInGuestData, setDineInGuestData,
    takeOutGuestData, setTakeOutGuestData,
    deliveryGuestData, setDeliveryGuestData,
    banquetGuestData, setBanquetGuestData,
    driveThruGuestData, setDriveThruGuestData,
    curbSideGuestData, setCurbSideGuestData,
    scheduledGuestData, setScheduledGuestData,
    phoneInGuestData, setPhoneInGuestData,
    customOrderGuestData, setCustomOrderGuestData,
    // Actions
    closeAllForms,
    openFormForType,
    clearAllGuestData,
  };
}
