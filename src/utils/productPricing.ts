import type { Product } from "../types/domain";

export const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function getProductPrice(product: Product) {
  return Math.round(product.price * (1 - product.discountPercent / 100));
}

export function getProductPriceLabel(product: Product) {
  return currency.format(getProductPrice(product));
}
