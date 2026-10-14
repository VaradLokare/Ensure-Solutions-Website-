import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "../services/auth";
import { useCart } from "../services/cart";
import { usePortalData } from "../services/portalData";
import { currency, getProductPrice } from "../utils/productPricing";

export function CheckoutPage() {
  const { lines, clearCart } = useCart();
  const { session } = useAuth();
  const { createCustomerOrder, products } = usePortalData();
  const [submitted, setSubmitted] = useState(false);
  const [customer, setCustomer] = useState(session?.name ?? "");
  const [company, setCompany] = useState(session?.company ?? "");
  const [email, setEmail] = useState(session?.email ?? "");

  const unavailableLines = lines.filter(({ product, quantity }) => {
    const currentProduct = products.find((item) => item.id === product.id);
    return !currentProduct || currentProduct.status !== "Active" || quantity > currentProduct.stock;
  });
  const currentLines = lines.map(({ product, quantity }) => ({
    product: products.find((item) => item.id === product.id) ?? product,
    quantity,
  }));
  const currentSubtotal = currentLines.reduce(
    (sum, line) => sum + getProductPrice(line.product) * line.quantity,
    0,
  );
  const currentShipping = currentSubtotal > 0 ? 350 : 0;
  const currentTax = currentSubtotal * 0.05;
  const currentTotal = currentSubtotal + currentShipping + currentTax;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (unavailableLines.length) {
      return;
    }
    for (const line of lines) {
      createCustomerOrder({
        customer: customer.trim(),
        customerEmail: email.trim(),
        company: company.trim(),
        productId: line.product.id,
        quantity: line.quantity,
      });
    }
    clearCart();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-[1100px] items-center justify-center px-5 py-16 lg:px-8">
        <section className="max-w-xl rounded-[28px] border border-line bg-paper p-8 text-center shadow-soft">
          <CheckCircle2 className="mx-auto text-success" size={56} />
          <p className="eyebrow mt-6">Order submitted</p>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,4rem)] font-black leading-none tracking-[-0.04em] text-ink">
            Your quote request is in review.
          </h1>
          <p className="mt-5 text-lg text-muted">
            Your order is in the staff queue. You can track it from the customer portal using {email}.
          </p>
          <Link className="premium-button mt-8" to="/login">
            Customer login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-3 section-heading">Complete your order request.</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit} className="rounded-[30px] border border-line bg-paper p-6 shadow-card">
          <div className="flex items-center gap-3 text-sm font-bold text-ink">
            <ShieldCheck className="text-orange" size={18} />
            Secure industrial procurement
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="form-field">
              <span>Full name</span>
              <input placeholder="Aarav Singh" value={customer} onChange={(event) => setCustomer(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Company</span>
              <input placeholder="Ensure Solutions Pvt. Ltd." value={company} onChange={(event) => setCompany(event.target.value)} required />
            </label>
            <label className="form-field md:col-span-2">
              <span>Email address</span>
              <input type="email" placeholder="team@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="form-field md:col-span-2">
              <span>Shipping address</span>
              <textarea rows={4} placeholder="Factory address, city, state, postal code" />
            </label>
            <label className="form-field">
              <span>Phone</span>
              <input placeholder="+91 98765 43210" />
            </label>
            <label className="form-field">
              <span>Delivery timeline</span>
              <select defaultValue="">
                <option value="" disabled>
                  Select timeline
                </option>
                <option value="2-4 weeks">2–4 weeks</option>
                <option value="4-8 weeks">4–8 weeks</option>
                <option value="8+ weeks">8+ weeks</option>
              </select>
            </label>
          </div>

          {unavailableLines.length ? <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">One or more products are no longer available or exceed current stock. Update your cart before ordering.</p> : null}
          <button className="premium-button mt-8 w-full justify-center" disabled={lines.length === 0 || unavailableLines.length > 0} type="submit">
            Place order request <ArrowRight size={18} />
          </button>
        </form>

        <aside className="rounded-[30px] border border-line bg-soft p-6 shadow-card">
          <h2 className="text-xl font-black">Order summary</h2>
          <div className="mt-6 space-y-4">
            {currentLines.map(({ product, quantity }) => (
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3" key={product.id}>
                <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-bold">{product.name}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Qty {quantity}</p>
                </div>
                <strong>{currency.format(getProductPrice(product) * quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 text-sm text-muted">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <strong className="text-ink">{currency.format(currentSubtotal)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <strong className="text-ink">{currency.format(currentShipping)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <strong className="text-ink">{currency.format(currentTax)}</strong>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
            <span className="text-sm font-black uppercase tracking-[0.14em] text-muted">Total</span>
            <strong className="text-3xl font-black">{currency.format(currentTotal)}</strong>
          </div>

          <Link className="secondary-button mt-6 w-full justify-center" to="/cart">
            Edit cart
          </Link>
        </aside>
      </div>
    </main>
  );
}
