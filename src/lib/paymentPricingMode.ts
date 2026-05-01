// Payment Pricing Mode shared helper
// Controls whether the PaymentDialog applies a cash discount, a card surcharge,
// or shows both prices side-by-side.

export type PaymentPricingMode = "cash-discount" | "card-surcharge" | "show-both";

export const CASH_DISCOUNT_RATE = 0.03;
export const CARD_SURCHARGE_RATE = 0.03;

const STORAGE_KEY = "payment-pricing-mode";
const EVENT_NAME = "payment-pricing-mode-updated";

export const getPaymentPricingMode = (): PaymentPricingMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "cash-discount" || stored === "card-surcharge" || stored === "show-both") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "cash-discount";
};

export const setPaymentPricingMode = (mode: PaymentPricingMode) => {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { mode } }));
};

export const subscribePaymentPricingMode = (cb: (mode: PaymentPricingMode) => void) => {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.mode) cb(detail.mode);
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) cb(e.newValue as PaymentPricingMode);
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", storageHandler);
  };
};
