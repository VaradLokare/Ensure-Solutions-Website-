import { PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortalData } from "../../services/portalData";

export function TutorialSection() {
  const { tutorials } = usePortalData();
  const publishedTutorials = tutorials.filter((tutorial) => tutorial.public);

  return (
    <section className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Machine tutorials</p>
          <h2 className="section-heading">Watch, learn, operate.</h2>
        </div>
        <Link className="secondary-button" to="/tutorials">
          Watch the Full Tutorial <PlayCircle size={17} />
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {publishedTutorials.slice(0, 3).map((tutorial) => (
          <article className="rounded-xl2 border border-line bg-paper p-5 shadow-card" key={tutorial.id}>
            <div className="mb-5 grid aspect-video place-items-center rounded-2xl bg-ink text-white">
              <PlayCircle className="text-orange" size={42} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-orange">
              {tutorial.category}
            </span>
            <h3 className="mt-3 text-xl font-black">{tutorial.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{tutorial.description}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-muted">
              <span>{tutorial.duration}</span>
              <span>{tutorial.language}</span>
              <span>{tutorial.difficulty}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
