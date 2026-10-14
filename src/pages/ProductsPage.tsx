import { ProductCard } from "../components/products/ProductCard";
import { usePortalData } from "../services/portalData";

export function ProductsPage() {
  const { products } = usePortalData();
  const publishedProducts = products.filter((product) => product.status === "Active");

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-14 lg:px-8">
      <p className="eyebrow">Products</p>
      <div className="mb-10 max-w-3xl">
        <h1 className="section-heading">Industrial machines and support resources.</h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          Explore the current product catalogue and select a machine or support resource for more details.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {publishedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {!publishedProducts.length ? <p className="rounded-xl2 border border-dashed border-line p-6 text-muted">There are no published products at the moment.</p> : null}
    </main>
  );
}
