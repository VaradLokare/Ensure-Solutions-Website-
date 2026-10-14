import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortalData } from "../../services/portalData";

export function ProductStory() {
  const { products } = usePortalData();
  const product = products.find((item) => item.status === "Active");

  if (!product) return null;

  const points = product.specs.slice(0, 4);

  return (
    <section className="bg-soft py-20">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 md:grid-cols-2 lg:px-8">
        <motion.img
          src={product.image}
          alt={product.name}
          className="rounded-[28px] border border-line shadow-soft"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
        />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ delay: 0.1 }}
        >
          <p className="eyebrow">{product.category}</p>
          <h2 className="section-heading">
            {product.name}
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted">
            {product.description}
          </p>
          <ul className="mt-7 space-y-4">
            {points.map((point) => (
              <li className="flex items-center gap-3 text-sm font-bold" key={point}>
                <CheckCircle2 className="text-orange" size={20} /> {point}
              </li>
            ))}
          </ul>
          <Link className="premium-button mt-8" to={`/products/${product.slug}`}>
            View product details <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
