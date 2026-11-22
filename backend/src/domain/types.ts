export type SupplierCode = "A" | "B";

// Shape returned by the (mock) supplier APIs
export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

// Shape returned by OUR API
export interface Hotel {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface Saving {
  name: string;
  chosenSupplier: string;
  chosenPrice: number;
  otherSupplier: string;
  otherPrice: number;
  saved: number;
}

export interface SupplierStatus {
  status: "ok" | "failed";
  count: number;
  error?: string;
}

export interface WorkflowMeta {
  city: string;
  suppliers: Record<SupplierCode, SupplierStatus>;
  totalOffers: number;
  savings: Saving[];
  generatedAt: string;
}

export interface WorkflowResult {
  hotels: Hotel[];
  meta: WorkflowMeta;
}
