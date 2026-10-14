import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../services/cart";
import { usePortalData } from "../services/portalData";
import { currency, getProductPrice } from "../utils/productPricing";

export function CartPage() {
  const { lines, changeQuantity, removeItem } = useCart();
  const { products } = usePortalData();
  const currentLines = lines.map(({ product, quantity }) => ({
    product: products.find((item) => item.id === product.id) ?? product,
    quantity,
  }));

  const subtotal = currentLines.reduce((sum, line) => {
    const price = getProductPrice(line.product);
    return sum + price * line.quantity;
  }, 0);

  const shipping = subtotal > 0 ? 350 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  if (!currentLines.length) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[1200px] items-center justify-center px-5 py-16 lg:px-8">
        <section className="w-full max-w-xl rounded-[28px] border border-line bg-paper p-8 text-center shadow-soft">
          <ShoppingBag className="mx-auto text-orange" size={52} />
          <p className="eyebrow mt-6">Your cart is empty</p>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,4.2rem)] font-black leading-[0.92] tracking-[-0.04em]">
            Ready to configure your next machine?
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            Browse the product catalogue to compare wire-marking solutions and quote-ready equipment.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link className="premium-button" to="/products">
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
      <p className="eyebrow">Shopping cart</p>
      <h1 className="mt-3 section-heading">Review your order.</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          {currentLines.map(({ product, quantity }) => (
            <article className="flex flex-col gap-4 rounded-[24px] border border-line bg-paper p-4 shadow-card sm:flex-row" key={product.id}>
              <img src={product.image} alt={product.name} className="h-28 w-full rounded-2xl object-cover sm:w-32" />
              <div className="flex-1">
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-orange">{product.category}</p>
                    <h2 className="mt-2 text-xl font-black">{product.name}</h2>
                  </div>
                  <button className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-error" onClick={() => removeItem(product.id)}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>

                <div className="mt-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-3 rounded-full border border-line bg-soft px-2 py-2">
                    <button className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink transition hover:text-orange" aria-label={`Decrease quantity for ${product.name}`} onClick={() => changeQuantity(product.id, quantity - 1)}>
                      <Minus size={16} />
                    </button>
                    <span className="min-w-8 text-center text-sm font-black">{quantity}</span>
                    <button className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink transition hover:text-orange" aria-label={`Increase quantity for ${product.name}`} onClick={() => changeQuantity(product.id, quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <strong className="text-xl font-black">{currency.format(getProductPrice(product) * quantity)}</strong>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="rounded-[28px] border border-line bg-soft p-6 shadow-card">
          <h2 className="text-xl font-black">Order summary</h2>

          <div className="mt-6 space-y-3 text-sm text-muted">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <strong className="text-ink">{currency.format(subtotal)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <strong className="text-ink">{currency.format(shipping)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <strong className="text-ink">{currency.format(tax)}</strong>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
            <span className="text-sm font-black uppercase tracking-[0.14em] text-muted">Total</span>
            <strong className="text-3xl font-black">{currency.format(total)}</strong>
          </div>

          <Link className="premium-button mt-8 w-full justify-center" to="/checkout">
            Proceed to checkout
          </Link>
          <Link className="secondary-button mt-3 w-full justify-center" to="/products">
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}
