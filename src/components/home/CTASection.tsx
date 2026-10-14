import { ArrowRight, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import { heroImage } from "../../data/catalog";

export function CTASection() {
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-10 lg:px-8">
      <div className="grid items-center gap-8 overflow-hidden rounded-[32px] bg-[#FFF3EC] p-8 md:grid-cols-[1fr_0.8fr] lg:p-12">
        <div>
          <p className="eyebrow">Quote support</p>
          <h2 className="section-heading">Find the Right Solution for Your Business.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            Tell us about your wire identification requirements, and the team can help you explore suitable equipment.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="premium-button justify-center" to="/contact">
              Request a Quote <ArrowRight size={16} />
            </Link>
            <Link className="secondary-button justify-center" to="/contact">
              Talk to Our Team <PhoneCall size={16} />
            </Link>
          </div>
        </div>
        <img className="rounded-[24px] border border-orange/20 shadow-card" src={heroImage} alt="Industrial marking machine" />
      </div>
    </section>
  );
}
