import type { Product, Tutorial } from "../types/domain";
import { products, tutorials } from "../data/catalog";

export async function getPublishedProducts(): Promise<Product[]> {
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return products.find((product) => product.slug === slug);
}

export async function getPublishedTutorials(): Promise<Tutorial[]> {
  return tutorials.filter((tutorial) => tutorial.public);
}

export const backendReadiness = {
  auth: "Firebase Auth boundary prepared; connect project config in environment variables.",
  database: "Firestore product, order, CRM, tutorial, and audit collections should back these mock services.",
  storage: "Use Firebase Storage or Google Cloud Storage for product images, manuals, invoices, and videos.",
  trustedOps:
    "Cloud Functions or Cloud Run should own payments, emails, Excel exports, retention jobs, and audit writes.",
};
