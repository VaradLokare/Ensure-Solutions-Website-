import { useState, type FormEvent } from "react";
import {
  BookOpenText,
  CircleHelp,
  FileText,
  MapPinned,
  Package,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../services/auth";
import { usePortalData, type SupportRequest } from "../../services/portalData";

const sections = [
  { id: "profile", label: "Profile", Icon: UserRound },
  { id: "orders", label: "Orders", Icon: Package },
  { id: "tracking", label: "Order tracking", Icon: MapPinned },
  { id: "invoices", label: "Invoices", Icon: FileText },
  { id: "tutorials", label: "Machine guides", Icon: BookOpenText },
  { id: "support", label: "Support", Icon: CircleHelp },
] as const;

type SectionId = (typeof sections)[number]["id"];

export function CustomerPortal() {
  const { session, updateSession } = useAuth();
  const { customers, orders, supportRequests, tutorials, createSupportRequest } = usePortalData();
  const customerRecord = customers.find((customer) => customer.email.toLowerCase() === session?.email.toLowerCase());
  const customerName = customerRecord?.name ?? session?.name ?? "Customer";
  const customerEmail = session?.email ?? "";
  const customerCompany = customerRecord?.company ?? session?.company ?? "";
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [profileMessage, setProfileMessage] = useState("");
  const [profile, setProfile] = useState({
    name: customerName,
    company: customerCompany,
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [supportForm, setSupportForm] = useState({
    topic: "",
    priority: "Medium" as SupportRequest["priority"],
    message: "",
  });
  const [supportMessage, setSupportMessage] = useState("");

  const myOrders = orders.filter((order) =>
    order.customerEmail
      ? order.customerEmail.toLowerCase() === customerEmail.toLowerCase()
      : order.customer === customerName,
  );
  const mySupport = supportRequests.filter((request) =>
    request.customerEmail
      ? request.customerEmail.toLowerCase() === customerEmail.toLowerCase()
      : request.customer === customerName,
  );
  const visibleTutorials = tutorials.filter((tutorial) =>
    tutorial.public || myOrders.some((order) => order.product === tutorial.relatedProduct),
  );

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    updateSession({ ...profile, email: session.email });
    setProfileMessage("Your profile details have been updated for this session.");
  };

  const submitPasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.next.length < 8) {
      setPasswordMessage("Choose a password with at least 8 characters.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage("The new passwords do not match.");
      return;
    }
    setPasswordMessage("Password changes are not connected yet. Connect a secure authentication provider to update your login password.");
  };

  const submitSupportRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !supportForm.topic.trim() || !supportForm.message.trim()) {
      setSupportMessage("Add a subject and message before submitting.");
      return;
    }
    createSupportRequest({
      customer: customerName,
      customerEmail,
      ...supportForm,
      topic: supportForm.topic.trim(),
      message: supportForm.message.trim(),
    });
    setSupportForm({ topic: "", priority: "Medium", message: "" });
    setSupportMessage("Your request has been sent to the staff support queue.");
  };

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
      <p className="eyebrow">Customer portal</p>
      <h1 className="section-heading">Your account and purchases.</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
        View your own orders, staff updates, invoices, machine guides, and support requests.
      </p>

      <nav aria-label="Customer portal sections" className="mt-8 flex gap-2 overflow-x-auto pb-2">
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
        {activeSection === "profile" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl2 border border-line bg-paper p-6 shadow-card">
              <h2 className="text-xl font-black">Login and profile information</h2>
              <form className="mt-5 space-y-4" onSubmit={saveProfile}>
                <label className="form-field">
                  <span>Full name</span>
                  <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required />
                </label>
                <label className="form-field">
                  <span>Login email</span>
                  <input type="email" value={customerEmail} readOnly />
                </label>
                <label className="form-field">
                  <span>Company</span>
                  <input value={profile.company || customerCompany} onChange={(event) => setProfile((current) => ({ ...current, company: event.target.value }))} />
                </label>
                <p className="text-xs leading-5 text-muted">Your account role: Customer</p>
                {profileMessage ? <p role="status" className="text-sm font-bold text-emerald-700">{profileMessage}</p> : null}
                <button type="submit" className="premium-button">Save profile</button>
              </form>
            </section>

            <section className="rounded-xl2 border border-line bg-paper p-6 shadow-card">
              <h2 className="text-xl font-black">Change password</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Password management requires a secure authentication service. The current demo sign-in does not store or verify passwords.
              </p>
              <form className="mt-5 space-y-4" onSubmit={submitPasswordChange}>
                <label className="form-field">
                  <span>Current password</span>
                  <input type="password" autoComplete="current-password" value={passwordForm.current} onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))} required />
                </label>
                <label className="form-field">
                  <span>New password</span>
                  <input type="password" autoComplete="new-password" value={passwordForm.next} onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))} required />
                </label>
                <label className="form-field">
                  <span>Confirm new password</span>
                  <input type="password" autoComplete="new-password" value={passwordForm.confirm} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))} required />
                </label>
                {passwordMessage ? <p role="status" className="text-sm font-bold text-muted">{passwordMessage}</p> : null}
                <button type="submit" className="secondary-button">Check password change</button>
              </form>
            </section>
          </div>
        ) : null}

        {activeSection === "orders" ? (
          <section className="rounded-xl2 border border-line bg-paper p-6 shadow-card">
            <h2 className="text-xl font-black">Your orders</h2>
            <div className="mt-5 space-y-3">
              {myOrders.length ? myOrders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-line bg-soft p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-black">{order.id}</p><p className="text-sm text-muted">{order.product} · {order.quantity} units</p></div>
                    <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-black text-orange">{order.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{order.company}</p>
                  <p className="mt-3 text-sm font-bold">₹ {order.amount.toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-xs text-muted">Order date/due date: {order.dueDate}</p>
                </article>
              )) : <EmptyState text="Your purchased orders will appear here." />}
            </div>
          </section>
        ) : null}

        {activeSection === "tracking" ? (
          <section className="rounded-xl2 border border-line bg-paper p-6 shadow-card">
            <h2 className="text-xl font-black">Order tracking</h2>
            <p className="mt-2 text-sm text-muted">Tracking information is maintained by staff and shown here as it changes.</p>
            <div className="mt-5 space-y-3">
              {myOrders.length ? myOrders.map((order) => (
                <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-soft p-4">
                  <div><p className="font-black">{order.id} · {order.product}</p><p className="mt-1 text-sm text-muted">Order status: {order.status}</p></div>
                  <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{order.deliveryStatus}</span>
                </article>
              )) : <EmptyState text="Tracking appears after you place an order." />}
            </div>
          </section>
        ) : null}

        {activeSection === "invoices" ? (
          <section className="rounded-xl2 border border-line bg-paper p-6 shadow-card">
            <h2 className="text-xl font-black">Invoices</h2>
            <p className="mt-2 text-sm text-muted">Invoices are prepared and issued by staff.</p>
            <div className="mt-5 space-y-3">
              {myOrders.filter((order) => order.invoiceIssued).length ? myOrders.filter((order) => order.invoiceIssued).map((order) => (
                <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-soft p-4">
                  <div>
                    <p className="font-black">Invoice · {order.id}</p>
                    <p className="mt-1 text-sm text-muted">{customerName} · {order.company}</p>
                    <p className="text-sm text-muted">{order.product} · {order.quantity} units · ₹ {order.amount.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted">Payment: {order.paymentStatus} · Issued by staff</p>
                  </div>
                  <button type="button" onClick={() => window.print()} className="secondary-button print:hidden">Print invoice</button>
                </article>
              )) : <EmptyState text="Staff-issued invoices will appear here." />}
            </div>
          </section>
        ) : null}

        {activeSection === "tutorials" ? (
          <section className="rounded-xl2 border border-line bg-paper p-6 shadow-card">
            <h2 className="text-xl font-black">Machine-use documents</h2>
            <div className="mt-5 grid gap-4">
              {visibleTutorials.map((tutorial) => (
                <article key={tutorial.id} className="rounded-2xl border border-line bg-soft p-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-orange">{tutorial.relatedProduct} · {tutorial.category}</p>
                  <h3 className="mt-2 text-lg font-black">{tutorial.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{tutorial.description}</p>
                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
                    {(tutorial.steps ?? [tutorial.description]).map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === "support" ? (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-xl2 border border-line bg-ink p-6 text-white">
              <h2 className="text-xl font-black">Customer care</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">Contact the team directly or send a request for staff follow-up.</p>
              <a className="mt-5 block font-bold text-orange" href="mailto:support@ensuresolution.example">support@ensuresolution.example</a>
              <a className="mt-2 block font-bold text-orange" href="tel:+919876500000">+91 98765 00000</a>
              <p className="mt-4 text-xs text-white/50">Demo contact details; replace with your verified customer-care contacts.</p>
            </section>
            <section className="rounded-xl2 border border-line bg-paper p-6 shadow-card">
              <h2 className="text-xl font-black">Create a support request</h2>
              <form className="mt-5 space-y-4" onSubmit={submitSupportRequest}>
                <label className="form-field"><span>Subject</span><input value={supportForm.topic} onChange={(event) => setSupportForm((current) => ({ ...current, topic: event.target.value }))} required /></label>
                <label className="form-field"><span>Priority</span><select value={supportForm.priority} onChange={(event) => setSupportForm((current) => ({ ...current, priority: event.target.value as SupportRequest["priority"] }))}><option>Low</option><option>Medium</option><option>High</option></select></label>
                <label className="form-field"><span>Message</span><textarea rows={4} value={supportForm.message} onChange={(event) => setSupportForm((current) => ({ ...current, message: event.target.value }))} required /></label>
                {supportMessage ? <p role="status" className="text-sm font-bold text-muted">{supportMessage}</p> : null}
                <button type="submit" className="premium-button">Send to staff</button>
              </form>
            </section>
            <section className="rounded-xl2 border border-line bg-paper p-6 shadow-card lg:col-span-2">
              <h2 className="text-xl font-black">Your support requests</h2>
              <div className="mt-4 space-y-3">
                {mySupport.length ? mySupport.map((request) => (
                  <article key={request.id} className="rounded-2xl border border-line bg-soft p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-black">{request.topic}</h3><span className="text-xs font-bold">{request.status} · {request.priority}</span></div>
                    <p className="mt-2 text-sm text-muted">{request.message}</p>
                  </article>
                )) : <EmptyState text="You have no support requests yet." />}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">{text}</p>;
}
