import { ArrowRight, Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { portalRouteMap, useAuth } from "../services/auth";

export function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name || !form.company || !form.email || !form.password) {
      setError("Please fill in all required account details.");
      return;
    }

    const session = login({
      name: form.name,
      email: form.email,
      company: form.company,
      role: "customer",
    });

    if (!session) {
      setError("Unable to create a secure session for this account.");
      return;
    }

    setError("");
    navigate(portalRouteMap.customer);
  };

  return (
    <main className="mx-auto grid min-h-[80vh] max-w-[1200px] place-items-center px-5 py-14 lg:px-8">
      <div className="grid w-full gap-6 overflow-hidden rounded-[32px] border border-line bg-paper shadow-soft lg:grid-cols-[1fr_0.95fr]">
        <section className="bg-ink p-8 text-white lg:p-10">
          <p className="eyebrow !text-orange">Welcome to EnsureSolution</p>
          <h1 className="mt-4 max-w-xl text-[clamp(2.5rem,5vw,5rem)] font-black leading-[0.94] tracking-[-0.05em]">
            Build your industrial workflow with confidence.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-white/75">
            Create your workspace, choose the correct role, and access the dashboards built for sales, operations, and customer support.
          </p>

          <div className="mt-8 space-y-4">
          </div>
        </section>

        <section className="p-6 md:p-8 lg:p-10">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Create account</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Sign up</h2>
            </div>
            <Link to="/login" className="text-sm font-bold text-orange hover:text-orange-hover">
              Login instead
            </Link>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-bold text-ink">
                <span>Full name</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-3.5 text-muted" size={18} />
                  <input
                    className="field pl-11"
                    value={form.name}
                    onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                    placeholder="Riya Nair"
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm font-bold text-ink">
                <span>Company</span>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-3.5 text-muted" size={18} />
                  <input
                    className="field pl-11"
                    value={form.company}
                    onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))}
                    placeholder="EnsureSolution Industries"
                  />
                </div>
              </label>
            </div>

            <label className="block space-y-2 text-sm font-bold text-ink">
              <span>Work email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 text-muted" size={18} />
                <input
                  className="field pl-11"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                  placeholder="riya@example.com"
                />
              </div>
            </label>

            <label className="block space-y-2 text-sm font-bold text-ink">
              <span>Password</span>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-4 top-3.5 text-muted" size={18} />
                <input
                  className="field pl-11"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                  placeholder="Create a secure password"
                />
              </div>
            </label>

            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

            <button type="submit" className="premium-button w-full justify-center">
              Create account <ArrowRight size={16} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
