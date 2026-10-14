import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../types/domain";

type CartLine = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  changeQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      addItem: (product) => {
        setLines((current) => {
          const existing = current.find((line) => line.product.id === product.id);
          if (existing) {
            return current.map((line) =>
              line.product.id === product.id
                ? { ...line, quantity: line.quantity + 1 }
                : line,
            );
          }

          return [...current, { product, quantity: 1 }];
        });
      },
      removeItem: (productId) => {
        setLines((current) => current.filter((line) => line.product.id !== productId));
      },
      changeQuantity: (productId, quantity) => {
        setLines((current) =>
          current.map((line) =>
            line.product.id === productId
              ? { ...line, quantity: Math.max(1, quantity) }
              : line,
          ),
        );
      },
      clearCart: () => setLines([]),
    }),
    [lines],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
