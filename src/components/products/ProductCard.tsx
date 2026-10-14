import { ArrowRight, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "../../types/domain";
import { useCart } from "../../services/cart";
import { currency, getProductPrice } from "../../utils/productPricing";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <motion.article
      className="group overflow-hidden rounded-xl2 border border-line bg-paper shadow-card"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/products/${product.slug}`} className="block overflow-hidden bg-card">
        <img
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      </Link>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-orange">
            {product.category}
          </span>
          <span className="rounded-full border border-line px-3 py-1 text-xs font-bold text-muted">
            {product.availability}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-black">{product.name}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{product.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-sm font-black">
              {product.discountPercent > 0 ? currency.format(getProductPrice(product)) : product.priceLabel}
            </span>
            {product.discountPercent > 0 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold text-muted line-through">{currency.format(product.price)}</span>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">{product.discountPercent}% off</span>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button className="icon-button" onClick={() => addItem(product)} aria-label={`Add ${product.name} to cart`}>
              <ShoppingCart size={17} />
            </button>
            <Link className="icon-button text-orange" to={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
