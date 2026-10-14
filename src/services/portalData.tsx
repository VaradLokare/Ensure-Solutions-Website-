import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product, Tutorial } from "../types/domain";

export type PortalProduct = Product & {
  stock: number;
  status: "Active" | "Draft";
};

export type PortalCustomer = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
};

export type DeliveryStatus =
  | "Not shipped"
  | "Processing"
  | "Shipped"
  | "Out for delivery"
  | "Delivered";

export type PaymentStatus = "Unpaid" | "Partially paid" | "Paid" | "Refunded";

export type CustomerOrder = {
  id: string;
  customer: string;
  customerEmail?: string;
  company: string;
  product: string;
  productId: string;
  quantity: number;
  amount: number;
  status: "Awaiting approval" | "Approved" | "Ready for install" | "Completed";
  dueDate: string;
  invoiceIssued: boolean;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
};

export type PortalVisit = {
  id: string;
  customer: string;
  company: string;
  location: string;
  staff: string;
  status: "Scheduled" | "En Route" | "Checked In" | "Meeting Started" | "Meeting Completed" | "Checked Out";
  notes: string;
};

export type SupportRequest = {
  id: string;
  customer: string;
  customerEmail?: string;
  topic: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Resolved";
  message: string;
};

export type ActivityEntry = {
  id: string;
  type: "product" | "tutorial" | "order" | "staff" | "support" | "system";
  actor: string;
  message: string;
  time: string;
  severity: "info" | "success" | "warn";
};

const visitStatuses: PortalVisit["status"][] = [
  "Scheduled",
  "En Route",
  "Checked In",
  "Meeting Started",
  "Meeting Completed",
  "Checked Out",
];

const initialProducts: PortalProduct[] = [
  {
    id: "p-wiremark-pro",
    slug: "wiremark-pro",
    name: "WireMark Pro",
    description: "Compact wire identification machine for clear name, number, and code marking workflows.",
    price: 275000,
    discountPercent: 0,
    priceLabel: "₹ 2,75,000",
    availability: "Quote Required",
    category: "Wire Marking",
    image: "/assets/industrial-wire-marker.png",
    specs: ["Designed for wire identification workflows", "Configurable marking guidance"],
    stock: 12,
    status: "Active",
  },
  {
    id: "p-inline-marker",
    slug: "inline-marker",
    name: "Inline Marker Station",
    description: "Production-friendly marking setup for teams that need consistent identification steps.",
    price: 410000,
    discountPercent: 0,
    priceLabel: "₹ 4,10,000",
    availability: "Configured to Order",
    category: "Production Line",
    image: "/assets/industrial-wire-marker.png",
    specs: ["Workflow-oriented setup", "Product-specific operating guidance"],
    stock: 5,
    status: "Active",
  },
  {
    id: "p-service-kit",
    slug: "service-kit",
    name: "Support & Training Kit",
    description: "Tutorials, manuals, and support resources for smoother machine operation and upkeep.",
    price: 18500,
    discountPercent: 0,
    priceLabel: "₹ 18,500",
    availability: "Available",
    category: "Support",
    image: "/assets/industrial-wire-marker.png",
    specs: ["Public and private tutorials", "Maintenance guidance"],
    stock: 30,
    status: "Active",
  },
];

const initialTutorials: Tutorial[] = [
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
    steps: [
      "Place the machine on a stable, level surface and connect the approved power supply.",
      "Check the material path and confirm the guides match the wire or sleeve size.",
      "Switch on the machine and follow the on-screen calibration prompts.",
      "Run a short test mark and confirm the text is readable before starting production.",
    ],
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
    steps: [
      "Open a new marking job and select the correct material preset.",
      "Enter the identification text and review the preview for spelling and alignment.",
      "Load the material and verify it is seated in the feed guides.",
      "Run one sample, inspect the result, then start the remaining batch.",
    ],
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
    steps: [
      "Power down and disconnect the machine before cleaning.",
      "Remove dust and debris from the feed path with a soft, dry cloth.",
      "Inspect rollers and guides for wear or obstruction; do not use abrasive cleaners.",
      "Reconnect, run the calibration check, and record any service issues.",
    ],
  },
];

const initialOrders: CustomerOrder[] = [
  {
    id: "SO-1042",
    customer: "Aarav Singh",
    customerEmail: "aarav@northwind.example",
    company: "Northwind Automation",
    product: "WireMark Pro",
    productId: "p-wiremark-pro",
    quantity: 2,
    amount: 550000,
    status: "Awaiting approval",
    dueDate: "2026-10-15",
    invoiceIssued: false,
    deliveryStatus: "Processing",
    paymentStatus: "Unpaid",
  },
  {
    id: "SO-1039",
    customer: "Meera Shah",
    customerEmail: "meera@crestcontrols.example",
    company: "Crest Controls",
    product: "Inline Marker Station",
    productId: "p-inline-marker",
    quantity: 1,
    amount: 410000,
    status: "Approved",
    dueDate: "2026-10-12",
    invoiceIssued: true,
    deliveryStatus: "Shipped",
    paymentStatus: "Partially paid",
  },
  {
    id: "SO-1031",
    customer: "Aarav Singh",
    customerEmail: "aarav@northwind.example",
    company: "Northwind Automation",
    product: "Support & Training Kit",
    productId: "p-service-kit",
    quantity: 3,
    amount: 55500,
    status: "Completed",
    dueDate: "2026-10-04",
    invoiceIssued: true,
    deliveryStatus: "Delivered",
    paymentStatus: "Paid",
  },
];

const initialCustomers: PortalCustomer[] = [
  {
    name: "Aarav Singh",
    email: "aarav@northwind.example",
    phone: "+91 98765 43210",
    company: "Northwind Automation",
    address: "Bhosari Industrial Estate, Pune, Maharashtra",
  },
  {
    name: "Meera Shah",
    email: "meera@crestcontrols.example",
    phone: "+91 98765 12340",
    company: "Crest Controls",
    address: "Aundh Service Center, Pune, Maharashtra",
  },
];

const initialVisits: PortalVisit[] = [
  {
    id: "V-204",
    customer: "Aarav Singh",
    company: "Northwind Automation",
    location: "Bhosari Industrial Estate",
    staff: "Riya Nair",
    status: "Checked In",
    notes: "Customer requested calibration walkthrough after install.",
  },
  {
    id: "V-205",
    customer: "Meera Shah",
    company: "Crest Controls",
    location: "Aundh Service Center",
    staff: "Aditya Rao",
    status: "En Route",
    notes: "On the way for machine readiness review.",
  },
];

const initialSupportRequests: SupportRequest[] = [
  {
    id: "SR-110",
    customer: "Aarav Singh",
    topic: "Machine calibration support",
    priority: "High",
    status: "Open",
    message: "Need guidance on the validation step for the new WireMark Pro setup.",
  },
  {
    id: "SR-106",
    customer: "Meera Shah",
    topic: "Training session access",
    priority: "Medium",
    status: "In Progress",
    message: "Customer wants access to the private installation tutorial set for the team.",
  },
];

const initialAuditEntries: ActivityEntry[] = [
  {
    id: "A-1",
    type: "system",
    actor: "Owner",
    message: "Quote pipeline reviewed and sent to engineering.",
    time: "10 minutes ago",
    severity: "success",
  },
  {
    id: "A-2",
    type: "staff",
    actor: "Riya Nair",
    message: "Visit V-204 was checked in at the customer site.",
    time: "28 minutes ago",
    severity: "info",
  },
  {
    id: "A-3",
    type: "order",
    actor: "Customer",
    message: "SO-1039 was approved and invoice issued.",
    time: "1 hour ago",
    severity: "success",
  },
];

const initialSettings = {
  autoInvoice: true,
  stockAlerts: true,
  publicTutorials: true,
  serviceFollowUp: true,
  profile: {
    name: "EnsureSolution Owner",
    email: "owner@ensuresolution.example",
    phone: "+91 98765 00000",
    company: "EnsureSolution",
  },
};

const PORTAL_DATA_STORAGE_KEY = "ensuresolution.portal.data";

type StoredPortalData = {
  products: PortalProduct[];
  customers: PortalCustomer[];
  tutorials: Tutorial[];
  orders: CustomerOrder[];
  visits: PortalVisit[];
  supportRequests: SupportRequest[];
  auditEntries: ActivityEntry[];
  settings: typeof initialSettings;
};

function readStoredList<T>(key: keyof StoredPortalData, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PORTAL_DATA_STORAGE_KEY);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as Partial<StoredPortalData>;
    const value = stored[key];
    return Array.isArray(value) ? value as T[] : fallback;
  } catch (error) {
    console.error("Unable to read saved portal data.", error);
    return fallback;
  }
}

function readStoredSettings() {
  if (typeof window === "undefined") return initialSettings;
  try {
    const raw = window.localStorage.getItem(PORTAL_DATA_STORAGE_KEY);
    if (!raw) return initialSettings;
    const stored = JSON.parse(raw) as Partial<StoredPortalData>;
    return stored.settings ?? initialSettings;
  } catch (error) {
    console.error("Unable to read saved portal settings.", error);
    return initialSettings;
  }
}

type PortalContextValue = {
  products: PortalProduct[];
  customers: PortalCustomer[];
  tutorials: Tutorial[];
  orders: CustomerOrder[];
  visits: PortalVisit[];
  supportRequests: SupportRequest[];
  auditEntries: ActivityEntry[];
  settings: typeof initialSettings;
  addProduct: (payload: {
    name: string;
    category: string;
    price: number;
    discountPercent: number;
    stock: number;
    description: string;
    image: string;
    specs: string[];
    availability: PortalProduct["availability"];
    status: PortalProduct["status"];
  }) => void;
  updateProduct: (productId: string, payload: Omit<PortalProduct, "id">) => void;
  toggleProductStatus: (productId: string) => void;
  toggleTutorialPublic: (tutorialId: string) => void;
  updateOrderStatus: (orderId: string, status: CustomerOrder["status"]) => void;
  updateDeliveryStatus: (orderId: string, status: DeliveryStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  issueInvoice: (orderId: string) => void;
  updateSupportStatus: (requestId: string, status: SupportRequest["status"]) => void;
  advanceVisit: (visitId: string) => void;
  createCustomerOrder: (payload: { customer: string; customerEmail?: string; company: string; productId: string; quantity: number }) => void;
  createSupportRequest: (payload: { customer: string; customerEmail?: string; topic: string; priority: SupportRequest["priority"]; message: string }) => void;
  updateSetting: (key: "autoInvoice" | "stockAlerts" | "publicTutorials" | "serviceFollowUp", value: boolean) => void;
  updateProfile: (profile: typeof initialSettings.profile) => void;
};

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<PortalProduct[]>(() => readStoredList("products", initialProducts));
  const [customers, setCustomers] = useState<PortalCustomer[]>(() => readStoredList("customers", initialCustomers));
  const [tutorials, setTutorials] = useState<Tutorial[]>(() => readStoredList("tutorials", initialTutorials));
  const [orders, setOrders] = useState<CustomerOrder[]>(() => readStoredList("orders", initialOrders));
  const [visits, setVisits] = useState<PortalVisit[]>(() => readStoredList("visits", initialVisits));
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>(() => readStoredList("supportRequests", initialSupportRequests));
  const [auditEntries, setAuditEntries] = useState<ActivityEntry[]>(() => readStoredList("auditEntries", initialAuditEntries));
  const [settings, setSettings] = useState(readStoredSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(PORTAL_DATA_STORAGE_KEY, JSON.stringify({
        products,
        customers,
        tutorials,
        orders,
        visits,
        supportRequests,
        auditEntries,
        settings,
      } satisfies StoredPortalData));
    } catch (error) {
      console.error("Unable to save portal changes in this browser.", error);
    }
  }, [products, customers, tutorials, orders, visits, supportRequests, auditEntries, settings]);

  const addAuditEntry = (entry: Omit<ActivityEntry, "id" | "time">) => {
    const next: ActivityEntry = {
      ...entry,
      id: `A-${Date.now()}`,
      time: "just now",
    };

    setAuditEntries((current) => [next, ...current]);
  };

  const value = useMemo<PortalContextValue>(
    () => ({
      products,
      customers,
      tutorials,
      orders,
      visits,
      supportRequests,
      auditEntries,
      settings,
      addProduct: ({ name, category, price, discountPercent, stock, description, image, specs, availability, status }) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const product: PortalProduct = {
          id: `p-${slug}-${Date.now()}`,
          slug,
          name,
          description,
          price,
          discountPercent,
          priceLabel: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price * (1 - discountPercent / 100)),
          availability,
          category,
          image,
          specs,
          stock,
          status,
        };

        setProducts((current) => [product, ...current]);
        addAuditEntry({
          type: "product",
          actor: "Owner",
          message: `${name} was added to the product catalogue.`,
          severity: "success",
        });
      },
      updateProduct: (productId, payload) => {
        setProducts((current) => current.map((product) => product.id === productId ? { ...payload, id: productId } : product));
        addAuditEntry({ type: "product", actor: "Owner", message: `${payload.name} product details were updated.`, severity: "info" });
      },
      toggleProductStatus: (productId) => {
        const changedProduct = products.find((product) => product.id === productId);
        if (!changedProduct) return;
        const status = changedProduct.status === "Active" ? "Draft" : "Active";
        setProducts((current) => current.map((product) => product.id === productId ? { ...product, status } : product));
        addAuditEntry({ type: "product", actor: "Owner", message: `${changedProduct.name} was ${status === "Active" ? "published" : "unpublished"}.`, severity: "info" });
      },
      toggleTutorialPublic: (tutorialId) => {
        setTutorials((current) =>
          current.map((tutorial) =>
            tutorial.id === tutorialId ? { ...tutorial, public: !tutorial.public } : tutorial,
          ),
        );

        const changedTutorial = tutorials.find((tutorial) => tutorial.id === tutorialId);
        if (changedTutorial) {
          addAuditEntry({
            type: "tutorial",
            actor: "Owner",
            message: `${changedTutorial.title} visibility was updated to ${!changedTutorial.public ? "public" : "private"}.`,
            severity: "info",
          });
        }
      },
      updateOrderStatus: (orderId, status) => {
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId
              ? { ...order, status }
              : order,
          ),
        );

        addAuditEntry({
          type: "order",
          actor: "Staff",
          message: `Order ${orderId} was moved to ${status}.`,
          severity: "info",
        });
      },
      updateDeliveryStatus: (orderId, deliveryStatus) => {
        setOrders((current) => current.map((order) => order.id === orderId ? { ...order, deliveryStatus } : order));
        addAuditEntry({ type: "order", actor: "Staff", message: `Delivery for ${orderId} was updated to ${deliveryStatus}.`, severity: "info" });
      },
      updatePaymentStatus: (orderId, paymentStatus) => {
        setOrders((current) => current.map((order) => order.id === orderId ? { ...order, paymentStatus } : order));
        addAuditEntry({ type: "order", actor: "Staff", message: `Payment for ${orderId} was updated to ${paymentStatus}.`, severity: "info" });
      },
      issueInvoice: (orderId) => {
        setOrders((current) => current.map((order) => order.id === orderId ? { ...order, invoiceIssued: true } : order));
        addAuditEntry({ type: "order", actor: "Staff", message: `Invoice for ${orderId} was issued by staff.`, severity: "success" });
      },
      updateSupportStatus: (requestId, status) => {
        setSupportRequests((current) => current.map((request) => request.id === requestId ? { ...request, status } : request));
        const request = supportRequests.find((item) => item.id === requestId);
        if (request) {
          addAuditEntry({ type: "support", actor: "Staff", message: `${request.id} was marked ${status}.`, severity: "info" });
        }
      },
      advanceVisit: (visitId) => {
        setVisits((current) =>
          current.map((visit) => {
            if (visit.id !== visitId) {
              return visit;
            }

            const currentIndex = visitStatuses.indexOf(visit.status);
            const nextStatus = visitStatuses[Math.min(currentIndex + 1, visitStatuses.length - 1)];
            return { ...visit, status: nextStatus };
          }),
        );

        addAuditEntry({
          type: "staff",
          actor: "Staff",
          message: `Visit ${visitId} advanced to the next workflow stage.`,
          severity: "success",
        });
      },
      createCustomerOrder: ({ customer, customerEmail, company, productId, quantity }) => {
        const selectedProduct = products.find((product) => product.id === productId) ?? products[0];
        const order: CustomerOrder = {
          id: `SO-${Math.floor(1000 + Math.random() * 9000)}`,
          customer,
          customerEmail,
          company,
          product: selectedProduct.name,
          productId: selectedProduct.id,
          quantity,
          amount: Math.round(selectedProduct.price * (1 - selectedProduct.discountPercent / 100)) * quantity,
          status: "Awaiting approval",
          dueDate: "2026-10-20",
          invoiceIssued: false,
          deliveryStatus: "Not shipped",
          paymentStatus: "Unpaid",
        };

        setOrders((current) => [order, ...current]);
        setCustomers((current) => current.some((item) => item.name === customer) ? current : [
          ...current,
          { name: customer, email: customerEmail ?? `${customer.toLowerCase().replace(/\s+/g, ".")}@customer.example`, phone: "Not provided", company, address: "Not provided" },
        ]);
        addAuditEntry({
          type: "order",
          actor: customer,
          message: `${order.id} was raised for ${selectedProduct.name}.`,
          severity: "warn",
        });
      },
      createSupportRequest: ({ customer, customerEmail, topic, priority, message }) => {
        const request: SupportRequest = {
          id: `SR-${Math.floor(100 + Math.random() * 900)}`,
          customer,
          customerEmail,
          topic,
          priority,
          status: "Open",
          message,
        };

        setSupportRequests((current) => [request, ...current]);
        addAuditEntry({
          type: "support",
          actor: customer,
          message: `${request.id} was created for ${topic}.`,
          severity: "info",
        });
      },
      updateSetting: (key, value) => {
        setSettings((current) => ({ ...current, [key]: value }));
        addAuditEntry({
          type: "system",
          actor: "Owner",
          message: `${key} was set to ${value ? "enabled" : "disabled"}.`,
          severity: "info",
        });
      },
      updateProfile: (profile) => {
        setSettings((current) => ({ ...current, profile }));
        addAuditEntry({ type: "system", actor: "Owner", message: "Owner profile details were updated.", severity: "info" });
      },
    }),
    [products, customers, tutorials, orders, visits, supportRequests, settings, auditEntries],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortalData() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortalData must be used within a PortalDataProvider");
  }

  return context;
}
