import {
  BarChart3,
  Building2,
  CreditCard,
  Download,
  FileSpreadsheet,
  Package,
  PackagePlus,
  Pencil,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  Video,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { DomainWorkspaceManagement } from "../../components/owner/DomainWorkspaceManagement";
import { ownerMetrics } from "../../data/catalog";
import { usePortalData, type DeliveryStatus, type PaymentStatus, type PortalProduct } from "../../services/portalData";
import { currency, getProductPrice } from "../../utils/productPricing";

const modules = [
  { label: "Products", href: "#products", Icon: PackagePlus },
  { label: "Customers", href: "#customers", Icon: UserRound },
  { label: "Reports", href: "#reports", Icon: FileSpreadsheet },
  { label: "Orders and billing", href: "#customers", Icon: BarChart3 },
  { label: "Audit logs", href: "#reports", Icon: ShieldCheck },
  { label: "Domain & Workspace Management", href: "#workspaces", Icon: Building2 },
  { label: "Settings", href: "#settings", Icon: Settings },
];

const settingToggles = [
  { key: "autoInvoice", label: "Auto-invoice" },
  { key: "stockAlerts", label: "Stock alerts" },
  { key: "publicTutorials", label: "Public tutorials" },
  { key: "serviceFollowUp", label: "Service follow-up" },
] as const;

export function OwnerPortal() {
  const {
    products, customers, tutorials, orders, visits, supportRequests, auditEntries, settings,
    addProduct, updateProduct, toggleProductStatus, toggleTutorialPublic, updateOrderStatus,
    updateDeliveryStatus, updatePaymentStatus, updateSupportStatus, updateSetting, updateProfile,
  } =
    usePortalData();
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    discountPercent: "0",
    stock: "",
    description: "",
    specs: "",
    image: "/assets/industrial-wire-marker.png",
    availability: "Available" as PortalProduct["availability"],
    status: "Active" as PortalProduct["status"],
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productMessage, setProductMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [profileForm, setProfileForm] = useState(settings.profile);

  const metrics = useMemo(
    () => [
      { label: "Quote pipeline", value: String(orders.filter((order) => order.status !== "Completed").length), note: "Awaiting action" },
      { label: "Published products", value: String(products.filter((product) => product.status === "Active").length), note: "Visible in catalogue" },
      { label: "Customers", value: String(customers.length), note: "In customer records" },
      { label: "Open support", value: String(supportRequests.filter((item) => item.status !== "Resolved").length), note: "Customer requests" },
    ],
    [orders, products, supportRequests, customers.length],
  );
  const totalPaid = orders.filter((order) => order.paymentStatus === "Paid").reduce((sum, order) => sum + order.amount, 0);
  const completedVisits = visits.filter((visit) => visit.status === "Checked Out").length;
  const staffVisitCounts = visits.reduce<Record<string, number>>((counts, visit) => {
    counts[visit.staff] = (counts[visit.staff] ?? 0) + 1;
    return counts;
  }, {});

  const downloadReport = (reportName: "orders" | "visits" | "support") => {
    const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const records = reportName === "orders"
      ? [["Order", "Customer", "Company", "Product", "Quantity", "Amount", "Order status", "Delivery status", "Payment status"], ...orders.map((order) => [order.id, order.customer, order.company, order.product, order.quantity, order.amount, order.status, order.deliveryStatus, order.paymentStatus])]
      : reportName === "visits"
        ? [["Visit", "Customer", "Company", "Staff", "Location", "Status"], ...visits.map((visit) => [visit.id, visit.customer, visit.company, visit.staff, visit.location, visit.status])]
        : [["Request", "Customer", "Topic", "Priority", "Status", "Message"], ...supportRequests.map((request) => [request.id, request.customer, request.topic, request.priority, request.status, request.message])];
    const csv = records.map((record) => record.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ensuresolution-${reportName}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetProductForm = () => {
    setForm({ name: "", category: "", price: "", discountPercent: "0", stock: "", description: "", specs: "", image: "/assets/industrial-wire-marker.png", availability: "Available", status: "Active" });
    setEditingProductId(null);
  };

  const handleSaveProduct = () => {
    const price = Number(form.price);
    const discountPercent = Number(form.discountPercent);
    const stock = Number(form.stock);

    if (!form.name.trim() || !form.category.trim() || !form.image.trim() || !Number.isFinite(price) || price < 0 ||
      !Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100 || !Number.isFinite(stock) || stock < 0) {
      setProductMessage("Enter a product name, category, image, non-negative price and stock, and a discount from 0% to 100%.");
      return;
    }

    const fields = {
      name: form.name.trim(),
      slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      category: form.category.trim(),
      price,
      discountPercent,
      priceLabel: currency.format(Math.round(price * (1 - discountPercent / 100))),
      stock,
      description: form.description.trim(),
      specs: form.specs.split(/\r?\n/).map((spec) => spec.trim()).filter(Boolean),
      image: form.image.trim(),
      availability: form.availability,
      status: form.status,
    };

    if (editingProductId) {
      updateProduct(editingProductId, fields);
    } else {
      addProduct({ ...fields, description: fields.description || "New product ready for customer review." });
    }
    setProductMessage(editingProductId ? "Product listing updated." : "Product added to the catalogue.");
    resetProductForm();
  };

  const startEditingProduct = (product: PortalProduct) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      discountPercent: String(product.discountPercent),
      stock: String(product.stock),
      description: product.description,
      specs: product.specs.join("\n"),
      image: product.image,
      availability: product.availability,
      status: product.status,
    });
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileMessage("Name and email are required.");
      return;
    }
    updateProfile(profileForm);
    setProfileMessage("Profile saved for this dashboard session.");
  };

  const handlePasswordUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordForm.current || passwordForm.next.length < 8 || passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage("Enter your current password, a new password (at least 8 characters), and matching confirmation.");
      return;
    }
    setPasswordMessage("Password form validated. Connect Firebase Authentication to securely apply this change.");
    setPasswordForm({ current: "", next: "", confirm: "" });
  };

  return (
    <PortalShell label="Owner dashboard" title="Operate products, orders, staff visits, and reporting.">
      <div className="grid gap-4 md:grid-cols-4">
        {(metrics.length ? metrics : ownerMetrics).map((metric) => (
          <article className="rounded-xl2 border border-line bg-paper p-5 shadow-card" key={metric.label}>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">{metric.label}</p>
            <strong className="mt-3 block text-4xl font-black">{metric.value}</strong>
            <p className="mt-2 text-sm text-muted">{metric.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {modules.map(({ label, href, Icon }) => (
          <a href={href} className="dashboard-tile" key={label}>
            <Icon className="text-orange" size={24} />
            <span>{label}</span>
          </a>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="products" className="scroll-mt-24 rounded-xl2 border border-line bg-paper p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Catalogue updates</h2>
            <span className="rounded-full bg-orange/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.1em] text-orange">
              {products.length} products
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              className="form-field"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Product name"
            />
            <input
              className="form-field"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="Category"
            />
            <input
              className="form-field"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              placeholder="Price"
            />
            <input
              className="form-field"
              type="number"
              min="0"
              max="100"
              value={form.discountPercent}
              onChange={(event) => setForm((current) => ({ ...current, discountPercent: event.target.value }))}
              placeholder="Discount (%)"
            />
            <input
              className="form-field"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
              placeholder="Stock"
            />
            <input
              className="form-field"
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              placeholder="Product image URL or /assets/..."
            />
            <select className="form-field" value={form.availability} onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value as PortalProduct["availability"] }))}>
              <option>Available</option>
              <option>Quote Required</option>
              <option>Configured to Order</option>
            </select>
            <select className="form-field" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PortalProduct["status"] }))}>
              <option>Active</option>
              <option>Draft</option>
            </select>
          </div>
          {form.image.trim() ? <img className="mt-3 h-36 w-48 rounded-xl object-cover" src={form.image} alt="Product preview" /> : null}
          <textarea
            className="form-field mt-3 min-h-[100px]"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Short product description"
          />
          <label className="mt-3 block space-y-2 text-sm font-bold">
            <span>Product details and specifications (one per line)</span>
            <textarea
              className="form-field min-h-[120px]"
              value={form.specs}
              onChange={(event) => setForm((current) => ({ ...current, specs: event.target.value }))}
              placeholder={"Marking width: 2-12 mm\nSupported materials: PVC, sleeve, wire"}
            />
          </label>
          <button type="button" onClick={handleSaveProduct} className="premium-button mt-4">
            {editingProductId ? <><Save size={16} /> Save product</> : <><PackagePlus size={16} /> Add product</>}
          </button>
          {editingProductId ? <button type="button" onClick={resetProductForm} className="secondary-button ml-2 mt-4">Cancel edit</button> : null}
          {productMessage ? <p role="status" className="mt-3 text-sm text-muted">{productMessage}</p> : null}

          <div className="mt-6 space-y-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-2xl border border-line bg-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div>
                    <p className="text-lg font-black">{product.name}</p>
                    <p className="text-sm text-muted">{product.category}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                    {product.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">{product.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-ink">
                  <span>{product.stock} in stock</span>
                  <span>{currency.format(getProductPrice(product))}{product.discountPercent > 0 ? ` · ${product.discountPercent}% off` : ""}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => startEditingProduct(product)} className="secondary-button min-h-9 px-3 text-xs"><Pencil size={14} /> Edit listing</button>
                  <button type="button" onClick={() => toggleProductStatus(product.id)} className="secondary-button min-h-9 px-3 text-xs">
                    {product.status === "Active" ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Workflow status</h2>
              <Sparkles className="text-orange" size={20} />
            </div>
            <div className="mt-5 space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="rounded-2xl border border-line bg-soft p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black">{order.id}</p>
                      <p className="text-xs text-muted">{order.customer}</p>
                    </div>
                    <span className="rounded-full bg-orange/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-orange">
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {(["Awaiting approval", "Approved", "Ready for install", "Completed"] as const).map((status) => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => updateOrderStatus(order.id, status)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                          order.status === status ? "bg-ink text-white" : "bg-paper text-muted"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
            <h2 className="text-xl font-black">Settings</h2>
            <div className="mt-5 space-y-3">
              {settingToggles.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-soft p-3 text-sm font-bold text-ink">
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => updateSetting(key, !settings[key])}
                    className={`relative h-7 w-12 rounded-full transition ${
                      settings[key] ? "bg-orange" : "bg-muted/40"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        settings[key] ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section id="customers" className="mt-8 scroll-mt-24 rounded-xl2 border border-line bg-paper p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Customer directory</h2>
            <p className="mt-1 text-sm text-muted">Customer profiles, purchases, delivery progress, payments, visits, and support.</p>
          </div>
          <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-black uppercase text-orange">{customers.length} customers</span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {customers.map((customer) => {
            const customerOrders = orders.filter((order) => order.customer === customer.name);
            const customerVisits = visits.filter((visit) => visit.customer === customer.name);
            const customerSupport = supportRequests.filter((request) => request.customer === customer.name);
            return (
              <article key={customer.name} className="rounded-2xl border border-line bg-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{customer.name}</h3>
                    <p className="text-sm text-muted">{customer.company}</p>
                    <p className="mt-2 text-sm">{customer.email} · {customer.phone}</p>
                    <p className="mt-1 text-xs text-muted">{customer.address}</p>
                  </div>
                  <div className="text-right text-xs font-bold text-muted">
                    <p>{customerOrders.length} orders</p>
                    <p>{customerVisits.length} staff visits</p>
                    <p>{customerSupport.length} support requests</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {customerOrders.length ? customerOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-line bg-paper p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-black">{order.id} · {order.product}</p>
                          <p className="text-xs text-muted">{order.quantity} units · {currency.format(order.amount)} · Due {order.dueDate}</p>
                        </div>
                        <span className="rounded-full bg-orange/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange">{order.status}</span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-muted">
                          <Truck size={15} className="text-orange" /> Delivery
                          <select className="form-field min-h-9 py-1" value={order.deliveryStatus} onChange={(event) => updateDeliveryStatus(order.id, event.target.value as DeliveryStatus)}>
                            {(["Not shipped", "Processing", "Shipped", "Out for delivery", "Delivered"] satisfies DeliveryStatus[]).map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-muted">
                          <CreditCard size={15} className="text-orange" /> Payment
                          <select className="form-field min-h-9 py-1" value={order.paymentStatus} onChange={(event) => updatePaymentStatus(order.id, event.target.value as PaymentStatus)}>
                            {(["Unpaid", "Partially paid", "Paid", "Refunded"] satisfies PaymentStatus[]).map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted">No orders recorded yet.</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="reports" className="mt-8 scroll-mt-24 rounded-xl2 border border-line bg-paper p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Business reports</h2>
            <p className="mt-1 text-sm text-muted">A shared view of staff visits, customer activity, orders, payments, and support.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => downloadReport("orders")} className="secondary-button min-h-10 px-3 text-xs"><Download size={14} /> Orders CSV</button>
            <button type="button" onClick={() => downloadReport("visits")} className="secondary-button min-h-10 px-3 text-xs"><Download size={14} /> Staff CSV</button>
            <button type="button" onClick={() => downloadReport("support")} className="secondary-button min-h-10 px-3 text-xs"><Download size={14} /> Support CSV</button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ReportMetric label="Order value" value={currency.format(orders.reduce((sum, order) => sum + order.amount, 0))} />
          <ReportMetric label="Paid revenue" value={currency.format(totalPaid)} />
          <ReportMetric label="Staff visits completed" value={`${completedVisits} / ${visits.length}`} />
          <ReportMetric label="Unresolved support" value={String(supportRequests.filter((request) => request.status !== "Resolved").length)} />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="font-black">Staff activity</h3>
            <div className="mt-3 space-y-2">
              {Object.entries(staffVisitCounts).map(([staff, visitCount]) => (
                <div key={staff} className="flex items-center justify-between rounded-xl border border-line bg-soft p-3 text-sm">
                  <span className="font-bold">{staff}</span>
                  <span className="text-muted">{visitCount} visits · {visits.filter((visit) => visit.staff === staff && visit.status === "Checked Out").length} completed</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-black">Customer activity</h3>
            <div className="mt-3 space-y-2">
              {customers.map((customer) => {
                const activityOrders = orders.filter((order) => order.customer === customer.name);
                const paid = activityOrders.filter((order) => order.paymentStatus === "Paid").reduce((sum, order) => sum + order.amount, 0);
                return <div key={customer.name} className="flex items-center justify-between rounded-xl border border-line bg-soft p-3 text-sm">
                  <span className="font-bold">{customer.name}</span>
                  <span className="text-right text-muted">{activityOrders.length} orders · {currency.format(paid)} paid</span>
                </div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <DomainWorkspaceManagement />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
          <h2 className="text-xl font-black">Tutorial visibility</h2>
          <div className="mt-5 space-y-3">
            {tutorials.map((tutorial) => (
              <div key={tutorial.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-soft p-3">
                <div>
                  <p className="font-black">{tutorial.title}</p>
                  <p className="text-xs text-muted">{tutorial.relatedProduct}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTutorialPublic(tutorial.id)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.09em] ${
                    tutorial.public ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {tutorial.public ? "Public" : "Private"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
          <h2 className="text-xl font-black">Support queue</h2>
          <div className="mt-5 space-y-3">
            {supportRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-line bg-soft p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{request.topic}</p>
                  <span className="rounded-full bg-muted/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.09em] text-muted">
                    {request.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{request.customer}</p>
                <p className="mt-2 text-sm">{request.message}</p>
                <label className="mt-3 flex items-center gap-2 text-xs font-bold text-muted">
                  Request status
                  <select className="form-field min-h-9 py-1" value={request.status} onChange={(event) => updateSupportStatus(request.id, event.target.value as typeof request.status)}>
                    {(["Open", "In Progress", "Resolved"] as const).map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-xl2 border border-line bg-paper p-5 shadow-card">
        <h2 className="text-xl font-black">Activity stream</h2>
        <div className="mt-5 space-y-3">
          {auditEntries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-soft p-3">
              <div>
                <p className="font-black">{entry.actor}</p>
                <p className="text-sm text-muted">{entry.message}</p>
              </div>
              <div className="text-right text-xs text-muted">
                <p>{entry.time}</p>
                <p className="mt-1 uppercase tracking-[0.12em] text-orange">{entry.type}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="settings" className="mt-8 scroll-mt-24 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
          <h2 className="text-xl font-black">Owner profile</h2>
          <p className="mt-1 text-sm text-muted">Manage the contact details shown to your operations team.</p>
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
            <input className="form-field" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" />
            <input className="form-field" type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" />
            <input className="form-field" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" />
            <input className="form-field" value={profileForm.company} onChange={(event) => setProfileForm((current) => ({ ...current, company: event.target.value }))} placeholder="Company" />
            <button type="submit" className="premium-button"><Save size={16} /> Save profile</button>
            {profileMessage ? <p role="status" className="text-sm text-muted">{profileMessage}</p> : null}
          </form>
        </div>
        <div className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
          <h2 className="text-xl font-black">Change password</h2>
          <p className="mt-1 text-sm text-muted">Password updates require a connected authentication provider.</p>
          <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-3">
            <input className="form-field" type="password" autoComplete="current-password" value={passwordForm.current} onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))} placeholder="Current password" />
            <input className="form-field" type="password" autoComplete="new-password" value={passwordForm.next} onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))} placeholder="New password (8+ characters)" />
            <input className="form-field" type="password" autoComplete="new-password" value={passwordForm.confirm} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))} placeholder="Confirm new password" />
            <button type="submit" className="secondary-button"><ShieldCheck size={16} /> Validate password change</button>
            {passwordMessage ? <p role="status" className="text-sm text-muted">{passwordMessage}</p> : null}
          </form>
        </div>
      </section>
    </PortalShell>
  );
}

function PortalShell({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-soft py-10">
      <div className="mx-auto grid max-w-[1400px] gap-6 px-5 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">EnsureSolution</p>
          <nav className="mt-6 space-y-2 text-sm font-bold text-muted">
            {[
              { label: "Overview", href: "#overview" },
              { label: "Products", href: "#products" },
              { label: "Customers", href: "#customers" },
              { label: "Reports", href: "#reports" },
              { label: "Domain & Workspace Management", href: "#workspaces" },
              { label: "Settings", href: "#settings" },
            ].map(({ label: navLabel, href }) => (
              <a key={href} href={href} className="block rounded-2xl px-4 py-3 transition hover:bg-soft hover:text-orange">{navLabel}</a>
            ))}
          </nav>
        </aside>
        <section id="overview">
          <p className="eyebrow">{label}</p>
          <h1 className="mb-8 max-w-4xl text-[clamp(2.2rem,5vw,4.8rem)] font-black leading-[0.94] tracking-[-0.04em]">
            {title}
          </h1>
          {children}
        </section>
      </div>
    </main>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-line bg-soft p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </article>
  );
}
