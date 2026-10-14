import { ArrowRight, FileText, PlayCircle, ShoppingCart } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../services/cart";
import { usePortalData } from "../services/portalData";
import { currency, getProductPrice } from "../utils/productPricing";

export function ProductDetailPage() {
  const { slug } = useParams();
  const { products } = usePortalData();
  const product = products.find((item) => item.slug === slug && item.status === "Active");
  const { addItem } = useCart();

  if (!product) {
    return (
      <main className="mx-auto max-w-[1000px] px-5 py-20 text-center">
        <p className="eyebrow">Product unavailable</p>
        <h1 className="mt-4 text-4xl font-black">This product is not currently listed.</h1>
        <Link className="premium-button mt-8" to="/products">Browse products</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div className="overflow-hidden rounded-[28px] border border-line bg-card shadow-soft">
        <img className="h-full min-h-[420px] w-full object-cover" src={product.image} alt={product.name} />
      </div>
      <section>
        <p className="eyebrow">{product.category}</p>
        <h1 className="mt-4 text-[clamp(2.7rem,6vw,5.8rem)] font-black leading-[0.92] tracking-[-0.04em]">
          {product.name}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted">{product.description}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <span className="rounded-full bg-soft px-4 py-2 text-sm font-black">
            {product.discountPercent > 0 ? currency.format(getProductPrice(product)) : product.priceLabel}
          </span>
          {product.discountPercent > 0 ? (
            <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700">
              {product.discountPercent}% off · <s>{currency.format(product.price)}</s>
            </span>
          ) : null}
          <span className="rounded-full bg-[#FFF3EC] px-4 py-2 text-sm font-black text-orange">
            {product.availability}
          </span>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="premium-button justify-center" onClick={() => addItem(product)}>
            Add to Cart <ShoppingCart size={16} />
          </button>
          <Link className="secondary-button justify-center" to="/contact">
            Request a Quote <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {product.specs.map((spec) => (
            <div className="rounded-2xl border border-line bg-paper p-4 text-sm font-bold" key={spec}>
              {spec}
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link className="secondary-button justify-center" to="/tutorials">
            Demo Video <PlayCircle size={16} />
          </Link>
          <Link className="secondary-button justify-center" to="/tutorials">
            Manuals & Downloads <FileText size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
