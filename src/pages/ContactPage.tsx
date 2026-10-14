import { QuoteForm } from "../components/forms/QuoteForm";

export function ContactPage() {
  return (
    <main className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 md:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <section>
        <p className="eyebrow">Contact</p>
        <h1 className="section-heading">Request a quote or machine demo.</h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          Share your wire identification requirements. The form is validated in the browser and ready to connect to Firestore, email notifications, or a CRM endpoint.
        </p>
        <div className="mt-8 rounded-xl2 border border-line bg-soft p-5">
          <p className="text-sm font-black uppercase tracking-[0.14em]">Owner-configured contact block</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Phone, address, WhatsApp, email, support hours, and social links should be supplied by the owner.
          </p>
        </div>
      </section>
      <QuoteForm />
    </main>
  );
}
