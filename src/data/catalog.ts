import { BadgeCheck, Gauge, Headphones, Workflow } from "lucide-react";
import type { FeaturePoint, PortalMetric, Product, Tutorial } from "../types/domain";

export const heroImage = "/assets/industrial-wire-marker.png";

export const products: Product[] = [
  {
    id: "p-wiremark-pro",
    slug: "wiremark-pro",
    name: "WireMark Pro",
    description:
      "Compact wire identification machine for clear name, number, and code marking workflows.",
    price: 275000,
    discountPercent: 0,
    priceLabel: "Price on request",
    availability: "Quote Required",
    category: "Wire Marking",
    image: heroImage,
    specs: [
      "Designed for wire identification workflows",
      "Configurable marking guidance",
      "Operator tutorial support",
      "Manuals and maintenance resources",
    ],
  },
  {
    id: "p-inline-marker",
    slug: "inline-marker",
    name: "Inline Marker Station",
    description:
      "A production-friendly marking setup for teams that need consistent identification steps.",
    price: 410000,
    discountPercent: 0,
    priceLabel: "Configured quote",
    availability: "Configured to Order",
    category: "Production Line",
    image: heroImage,
    specs: [
      "Workflow-oriented setup",
      "Product-specific operating guidance",
      "Support document library",
      "Quote-based configuration",
    ],
  },
  {
    id: "p-service-kit",
    slug: "service-kit",
    name: "Support & Training Kit",
    description:
      "Tutorials, manuals, and support resources for smoother machine operation and upkeep.",
    price: 18500,
    discountPercent: 0,
    priceLabel: "Included with support",
    availability: "Available",
    category: "Support",
    image: heroImage,
    specs: [
      "Public and private tutorials",
      "PDF manual downloads",
      "Maintenance guidance",
      "Support request tracking",
    ],
  },
];

export const featurePoints: FeaturePoint[] = [
  {
    title: "Precision Identification",
    description: "Support clear, consistent wire marking for production and service teams.",
    Icon: BadgeCheck,
  },
  {
    title: "Efficient Workflows",
    description: "Centralize product references, quotes, tutorials, and follow-ups.",
    Icon: Workflow,
  },
  {
    title: "Reliable Performance",
    description: "Keep machine information, orders, and service history easy to access.",
    Icon: Gauge,
  },
  {
    title: "Technical Support",
    description: "Give customers and staff guided resources for setup and operation.",
    Icon: Headphones,
  },
];

export const tutorials: Tutorial[] = [
  {
    id: "t-start",
    title: "Machine Setup Basics",
    relatedProduct: "WireMark Pro",
    description: "Prepare supported material, review safety checks, and configure first-run settings.",
    duration: "06:40",
    language: "English",
    difficulty: "Getting Started",
    category: "Installation and Setup",
    public: true,
  },
  {
    id: "t-operation",
    title: "Entering Identification Details",
    relatedProduct: "WireMark Pro",
    description: "Understand text entry, marking review, and result verification steps.",
    duration: "08:15",
    language: "English",
    difficulty: "Intermediate",
    category: "Machine Operation",
    public: true,
  },
  {
    id: "t-maintenance",
    title: "Routine Maintenance Checklist",
    relatedProduct: "Support & Training Kit",
    description: "Keep rollers, feed paths, and inspection areas ready for scheduled use.",
    duration: "05:20",
    language: "English",
    difficulty: "Getting Started",
    category: "Maintenance",
    public: false,
  },
];

export const ownerMetrics: PortalMetric[] = [
  { label: "Quote pipeline", value: "12", note: "Awaiting owner review" },
  { label: "Published products", value: "3", note: "Ready for catalogue" },
  { label: "Staff visits", value: "8", note: "Scheduled this week" },
  { label: "Open support", value: "5", note: "Customer requests" },
];
