import { useState, type FormEvent } from "react";
import {
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  HelpCircle,
  Package,
  Route,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../services/auth";
import {
  usePortalData,
  type CustomerOrder,
  type DeliveryStatus,
  type PaymentStatus,
  type SupportRequest,
} from "../../services/portalData";

const workflow = ["Scheduled", "En Route", "Checked In", "Meeting Started", "Meeting Completed", "Checked Out"] as const;
const orderStatuses: CustomerOrder["status"][] = ["Awaiting approval", "Approved", "Ready for install", "Completed"];
const deliveryStatuses: DeliveryStatus[] = ["Not shipped", "Processing", "Shipped", "Out for delivery", "Delivered"];
const paymentStatuses: PaymentStatus[] = ["Unpaid", "Partially paid", "Paid", "Refunded"];
const sections = [
  { id: "overview", label: "Overview", Icon: ClipboardList },
  { id: "orders", label: "Orders & tracking", Icon: Package },
  { id: "invoices", label: "Invoices", Icon: FileText },
  { id: "visits", label: "Visits", Icon: CalendarClock },
  { id: "support", label: "Support", Icon: HelpCircle },
  { id: "tutorials", label: "Machine guides", Icon: BookOpenText },
  { id: "profile", label: "Profile", Icon: UserRound },
] as const;

type StaffSection = (typeof sections)[number]["id"];

export function StaffPortal() {
  const { session, updateSession } = useAuth();
  const {
    orders,
    visits,
    supportRequests,
    tutorials,
    updateOrderStatus,
    updateDeliveryStatus,
    updatePaymentStatus,
    issueInvoice,
    updateSupportStatus,
    advanceVisit,
  } = usePortalData();
  const [activeSection, setActiveSection] = useState<StaffSection>("overview");
  const [profileMessage, setProfileMessage] = useState("");
  const [profile, setProfile] = useState({
    name: session?.name ?? "",
    email: session?.email ?? "",
    company: session?.company ?? "",
  });
  const activeVisit = visits[0];
  const openOrders = orders.filter((order) => order.status !== "Completed").length;
  const pendingInvoices = orders.filter((order) => !order.invoiceIssued).length;
  const openSupport = supportRequests.filter((request) => request.status !== "Resolved").length;

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSession(profile);
    setProfileMessage("Staff profile updated for this session.");
  };

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
      <p className="eyebrow">Staff workspace</p>
      <h1 className="section-heading">Operations overview.</h1>
      <p className="mt-4 text-base text-muted">Manage customer orders, delivery updates, invoices, visits, and support follow-ups.</p>

      <nav aria-label="Staff dashboard sections" className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {sections.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            aria-current={activeSection === id ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-bold ${
              activeSection === id ? "bg-ink text-white" : "border border-line bg-paper text-ink"
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {activeSection === "overview" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Active orders" value={String(openOrders)} note="Need staff follow-up" />
              <Metric label="Invoices to issue" value={String(pendingInvoices)} note="Ready in order queue" />
              <Metric label="Open support" value={String(openSupport)} note="Customer requests" />
              <Metric label="Visits" value={String(visits.length)} note="Assigned visit records" />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">Recent orders</h2>
                  <button type="button" className="text-sm font-bold text-orange" onClick={() => setActiveSection("orders")}>Manage orders</button>
                </div>
                <div className="mt-4 space-y-3">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-soft p-3">
                      <div><p className="font-black">{order.id} · {order.customer}</p><p className="text-sm text-muted">{order.product}</p></div>
                      <span className="text-right text-xs font-bold">{order.deliveryStatus}</span>
                    </div>
                  ))}
                  {!orders.length ? <EmptyState text="No orders are waiting for staff." /> : null}
                </div>
              </section>
              <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">Support follow-ups</h2>
                  <button type="button" className="text-sm font-bold text-orange" onClick={() => setActiveSection("support")}>Open queue</button>
                </div>
                <div className="mt-4 space-y-3">
                  {supportRequests.filter((request) => request.status !== "Resolved").slice(0, 4).map((request) => (
                    <div key={request.id} className="rounded-2xl border border-line bg-soft p-3">
                      <p className="font-black">{request.topic}</p>
                      <p className="mt-1 text-sm text-muted">{request.customer} · {request.priority}</p>
                    </div>
                  ))}
                  {!openSupport ? <EmptyState text="All customer requests are resolved." /> : null}
                </div>
              </section>
            </div>
          </>
        ) : null}

        {activeSection === "orders" ? (
          <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
            <h2 className="text-xl font-black">Orders and delivery tracking</h2>
            <p className="mt-2 text-sm text-muted">Staff updates are reflected in the customer’s Order tracking section.</p>
            <div className="mt-5 space-y-4">
              {orders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-line bg-soft p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-black">{order.id} · {order.customer}</p><p className="text-sm text-muted">{order.company} · {order.product} · {order.quantity} units</p></div>
                    <strong>₹ {order.amount.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label className="form-field"><span>Order status</span><select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as CustomerOrder["status"])}>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="form-field"><span>Delivery tracking</span><select value={order.deliveryStatus} onChange={(event) => updateDeliveryStatus(order.id, event.target.value as DeliveryStatus)}>{deliveryStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="form-field"><span>Payment status</span><select value={order.paymentStatus} onChange={(event) => updatePaymentStatus(order.id, event.target.value as PaymentStatus)}>{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                  </div>
                </article>
              ))}
              {!orders.length ? <EmptyState text="No orders are available." /> : null}
            </div>
          </section>
        ) : null}

        {activeSection === "invoices" ? (
          <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
            <h2 className="text-xl font-black">Staff invoice desk</h2>
            <p className="mt-2 text-sm text-muted">Issue invoices here after reviewing the related order. Issued invoices become visible to that customer.</p>
            <div className="mt-5 space-y-3">
              {orders.map((order) => (
                <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-soft p-4">
                  <div><p className="font-black">{order.id} · {order.customer}</p><p className="text-sm text-muted">{order.product} · ₹ {order.amount.toLocaleString("en-IN")}</p></div>
                  {order.invoiceIssued
                    ? <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800">Invoice issued</span>
                    : <button type="button" className="premium-button" onClick={() => issueInvoice(order.id)}>Issue invoice</button>}
                </article>
              ))}
              {!orders.length ? <EmptyState text="No orders are available for invoicing." /> : null}
            </div>
          </section>
        ) : null}

        {activeSection === "visits" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
              <h2 className="text-xl font-black">Assigned visits</h2>
              <div className="mt-5 space-y-3">
                {visits.map((visit) => (
                  <article key={visit.id} className="rounded-2xl border border-line bg-soft p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-black">{visit.customer} · {visit.company}</p><p className="mt-1 text-sm text-muted">{visit.location}</p></div><span className="text-xs font-bold">{visit.status}</span></div>
                    <p className="mt-3 text-sm">{visit.notes}</p>
                    <button type="button" onClick={() => advanceVisit(visit.id)} className="secondary-button mt-4">Advance visit</button>
                  </article>
                ))}
                {!visits.length ? <EmptyState text="No visits are assigned." /> : null}
              </div>
            </section>
            {activeVisit ? (
              <section className="rounded-xl2 border border-line bg-soft p-5">
                <h2 className="text-xl font-black">Visit workflow</h2>
                <div className="mt-5 space-y-3">
                  {workflow.map((step, index) => {
                    const isCurrent = activeVisit.status === step;
                    const isComplete = workflow.indexOf(activeVisit.status) >= index;
                    return <div key={step} className={`flex items-center gap-3 rounded-2xl bg-paper p-3 text-sm font-bold ${isCurrent ? "ring-1 ring-orange" : ""}`}>{isComplete ? <CheckCircle2 className="text-orange" size={18} /> : <Route className="text-muted" size={18} />}{step}</div>;
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {activeSection === "support" ? (
          <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
            <h2 className="text-xl font-black">Customer support queue</h2>
            <div className="mt-5 space-y-3">
              {supportRequests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-line bg-soft p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-black">{request.topic} · {request.customer}</p><p className="mt-1 text-sm text-muted">{request.customerEmail ?? "No email provided"} · {request.priority}</p></div>
                    <select className="field w-auto" aria-label={`Status for ${request.id}`} value={request.status} onChange={(event) => updateSupportStatus(request.id, event.target.value as SupportRequest["status"])}><option>Open</option><option>In Progress</option><option>Resolved</option></select>
                  </div>
                  <p className="mt-3 text-sm leading-6">{request.message}</p>
                </article>
              ))}
              {!supportRequests.length ? <EmptyState text="No support requests have been submitted." /> : null}
            </div>
          </section>
        ) : null}

        {activeSection === "tutorials" ? (
          <section className="rounded-xl2 border border-line bg-paper p-5 shadow-card">
            <h2 className="text-xl font-black">Machine-use documents</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {tutorials.map((guide) => (
                <article key={guide.id} className="rounded-2xl border border-line bg-soft p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-orange">{guide.relatedProduct} · {guide.category}</p>
                  <h3 className="mt-2 font-black">{guide.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{guide.description}</p>
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6">{(guide.steps ?? [guide.description]).map((step) => <li key={step}>{step}</li>)}</ol>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === "profile" ? (
          <section className="max-w-2xl rounded-xl2 border border-line bg-paper p-6 shadow-card">
            <h2 className="text-xl font-black">Staff profile</h2>
            <form className="mt-5 space-y-4" onSubmit={saveProfile}>
              <label className="form-field"><span>Name</span><input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required /></label>
              <label className="form-field"><span>Work email</span><input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} required /></label>
              <label className="form-field"><span>Company</span><input value={profile.company} onChange={(event) => setProfile((current) => ({ ...current, company: event.target.value }))} /></label>
              {profileMessage ? <p role="status" className="text-sm font-bold text-emerald-700">{profileMessage}</p> : null}
              <button className="premium-button" type="submit">Save profile</button>
            </form>
            <p className="mt-5 text-xs leading-5 text-muted">Password changes require a secure authentication provider and are not available in this demo.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="rounded-xl2 border border-line bg-paper p-5 shadow-card"><p className="text-xs font-black uppercase tracking-[0.12em] text-muted">{label}</p><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-1 text-sm text-muted">{note}</p></article>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">{text}</p>;
}
