import type { LucideIcon } from "lucide-react";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  priceLabel: string;
  availability: "Available" | "Quote Required" | "Configured to Order";
  category: string;
  image: string;
  specs: string[];
};

export type Tutorial = {
  id: string;
  title: string;
  relatedProduct: string;
  description: string;
  duration: string;
  language: string;
  difficulty: "Getting Started" | "Intermediate" | "Advanced";
  category: string;
  public: boolean;
  steps?: string[];
};

export type PortalMetric = {
  label: string;
  value: string;
  note: string;
};

export type FeaturePoint = {
  title: string;
  description: string;
  Icon: LucideIcon;
};
