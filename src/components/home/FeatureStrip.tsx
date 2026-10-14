import { featurePoints } from "../../data/catalog";

export function FeatureStrip() {
  return (
    <section className="mx-auto max-w-[1400px] px-5 lg:px-8">
      <div className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line md:grid-cols-4">
        {featurePoints.map(({ title, description, Icon }) => (
          <div className="bg-paper p-6" key={title}>
            <Icon className="mb-5 text-orange" size={26} strokeWidth={1.8} />
            <h2 className="text-sm font-black uppercase tracking-[0.14em]">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
