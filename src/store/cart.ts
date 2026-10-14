import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  packLabel: string;
  unitPrice: number; // display only. The server recalculates every price at checkout.
  quantity: number;
  maxQuantity: number;
  imagePath: string | null;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty: number) => { capped: boolean };
  setQuantity: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty) => {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        const wanted = (existing?.quantity ?? 0) + qty;
        const quantity = Math.min(wanted, item.maxQuantity);
        set({
          items: existing
            ? get().items.map((i) => (i.variantId === item.variantId ? { ...i, ...item, quantity } : i))
            : [...get().items, { ...item, quantity }],
        });
        return { capped: wanted > item.maxQuantity };
      },
      setQuantity: (variantId, qty) =>
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(qty, i.maxQuantity)) } : i
          ),
        }),
      removeItem: (variantId) => set({ items: get().items.filter((i) => i.variantId !== variantId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "ne-cart-v1", storage: createJSONStorage(() => localStorage) }
  )
);

export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
