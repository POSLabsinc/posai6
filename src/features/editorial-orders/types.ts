export interface EditorialMoney {
  amount: number;
  currency: "USD";
}

export interface EditorialProduct {
  id: string;
  name: string;
  price: EditorialMoney;
  category: string;
  description: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isOpenPrice: boolean;
}

export interface EditorialCatalogResponse {
  products: EditorialProduct[];
  categories: string[];
  fetchedAt: string;
}

export interface EditorialCartLine {
  lineId: string;
  product: EditorialProduct;
  quantity: number;
  modifiers: string[];
  modifierTotal: number;
  notes: string;
}

export type EditorialPaymentMethod = "cash" | "card" | "gift_card";

export interface EditorialPaymentRequest {
  orderNumber: number;
  method: EditorialPaymentMethod;
  amount: EditorialMoney;
  tendered?: EditorialMoney;
}

export interface EditorialPaymentResponse {
  status: "confirmed" | "declined";
  orderId: string | null;
  orderNumber: number;
  paidAt: string | null;
  error?: {
    error: true;
    code: string;
    message: string;
  };
}