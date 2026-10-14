import { CTASection } from "../components/home/CTASection";
import { FeaturedProducts } from "../components/home/FeaturedProducts";
import { FeatureStrip } from "../components/home/FeatureStrip";
import { HeroSection } from "../components/home/HeroSection";
import { ProductStory } from "../components/home/ProductStory";
import { TutorialSection } from "../components/home/TutorialSection";

export function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeatureStrip />
      <FeaturedProducts />
      <ProductStory />
      <HowItWorks />
      <TutorialSection />
      <BrandSection />
      <CTASection />
    </main>
  );
}

function HowItWorks() {
  const steps = [
    "Configure the machine and prepare supported material.",
    "Enter the required text or identification details.",
    "Print the identification and verify the result.",
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8">
      <p className="eyebrow">How it works</p>
      <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <h2 className="section-heading">A clean workflow from setup to verification.</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article className="rounded-xl2 border border-line bg-paper p-6 shadow-card" key={step}>
              <span className="text-5xl font-black text-orange">{index + 1}</span>
              <p className="mt-6 text-sm font-bold leading-6">{step}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandSection() {
  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 md:grid-cols-2 lg:px-8">
        <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-black leading-[0.92] tracking-[-0.04em]">
          Built Around Better Workflows.
        </h2>
        <div className="space-y-6 text-lg leading-8 text-white/70">
          <p>
            EnsureSolution presents industrial wire marking products, tutorials, enquiries, orders, and customer support in one connected experience.
          </p>
          <p>
            Verified company imagery, industries served, certifications, contact information, and social links should be managed by the owner from the dashboard once backend configuration is connected.
          </p>
        </div>
      </div>
    </section>
  );
}
