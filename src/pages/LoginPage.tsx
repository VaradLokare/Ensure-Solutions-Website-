import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { portalRouteMap, useAuth } from "../services/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    const session = login({ email, role: "customer" });

    if (!session) {
      setError("Unable to create a secure session.");
      return;
    }

    setError("");
    navigate(portalRouteMap.customer);
  };

  return (
    <main className="mx-auto grid min-h-[80vh] max-w-[1200px] place-items-center px-5 py-14 lg:px-8">
      <div className="grid w-full gap-6 overflow-hidden rounded-[32px] border border-line bg-paper shadow-soft lg:grid-cols-[1fr_0.95fr]">
        <section className="bg-ink p-8 text-white lg:p-10">
          <p className="eyebrow !text-orange">Customer account</p>
          <h1 className="mt-4 max-w-xl text-[clamp(2.5rem,5vw,5rem)] font-black leading-[0.94] tracking-[-0.05em]">
            Your orders and support, all in one place.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-white/75">
            Sign in to view your orders, request support, and manage your customer account.
          </p>
        </section>

        <section className="p-6 md:p-8 lg:p-10">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Customer access</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Login</h2>
            </div>
            <Link to="/signup" className="text-sm font-bold text-orange hover:text-orange-hover">
              Create account
            </Link>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm font-bold text-ink">
              <span>Work email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 text-muted" size={18} />
                <input
                  className="field pl-11"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="block space-y-2 text-sm font-bold text-ink">
              <span>Password</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 text-muted" size={18} />
                <input
                  className="field pl-11"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </label>

            <div className="flex items-center justify-between gap-3 text-sm text-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-orange" />
                <span>Role-based access</span>
              </div>
              <Link to="/signup" className="font-bold text-ink hover:text-orange">
                Need an account?
              </Link>
            </div>

            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

            <button type="submit" className="premium-button w-full justify-center">
              Continue <ArrowRight size={16} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
