import { FileDown, Lock, PlayCircle } from "lucide-react";
import { usePortalData } from "../services/portalData";

export function TutorialsPage() {
  const { tutorials } = usePortalData();
  const publishedTutorials = tutorials.filter((tutorial) => tutorial.public);

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-14 lg:px-8">
      <p className="eyebrow">Tutorial library</p>
      <div className="mb-10 max-w-3xl">
        <h1 className="section-heading">Machine guidance for customers and staff.</h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          Tutorials can be managed by the owner dashboard, published publicly, or reserved for secure staff training.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {publishedTutorials.map((tutorial) => (
          <article className="rounded-xl2 border border-line bg-paper p-5 shadow-card" key={tutorial.id}>
            <div className="mb-5 grid aspect-video place-items-center rounded-2xl bg-ink text-white">
              {tutorial.public ? <PlayCircle className="text-orange" size={44} /> : <Lock className="text-orange" size={44} />}
            </div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">{tutorial.category}</p>
            <h2 className="mt-3 text-xl font-black">{tutorial.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{tutorial.description}</p>
            {tutorial.steps?.length ? (
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted">
                {tutorial.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-muted">
              <span>{tutorial.relatedProduct}</span>
              <span>{tutorial.duration}</span>
              <span>{tutorial.language}</span>
            </div>
            <div className="secondary-button mt-5 w-full justify-center">
              Machine guide <FileDown size={16} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
