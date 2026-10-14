import { ProductCard } from "../products/ProductCard";
import { usePortalData } from "../../services/portalData";

export function FeaturedProducts() {
  const { products } = usePortalData();
  const publishedProducts = products.filter((product) => product.status === "Active");

  return (
    <section className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8" id="products">
      <div className="mb-10 max-w-3xl">
        <p className="eyebrow">Our solutions</p>
        <h2 className="section-heading">Industrial Printing, Simplified.</h2>
        <p className="mt-5 text-lg leading-8 text-muted">
          Find the right equipment and support resources for your wire identification and industrial marking requirements.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {publishedProducts.slice(0, 3).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
