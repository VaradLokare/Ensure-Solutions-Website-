import { CTASection } from "../components/home/CTASection";

export function AboutPage() {
  return (
    <main>
      <section className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 md:grid-cols-2 lg:px-8">
        <div>
          <p className="eyebrow">About EnsureSolution</p>
          <h1 className="section-heading">Industrial product presentation with real operating tools.</h1>
        </div>
        <div className="space-y-6 text-lg leading-8 text-muted">
          <p>
            EnsureSolution sells industrial machines used for printing names, numbers, and other identification details on wires.
          </p>
          <p>
            This website is structured to support verified product data, owner-managed content, quote workflows, customer orders, tutorials, billing, and staff CRM activity.
          </p>
        </div>
      </section>
      <CTASection />
    </main>
  );
}
