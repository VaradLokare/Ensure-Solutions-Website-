import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { acceptStaffInvitation, signInTeam } from "../services/domainWorkspaceApi";
import { portalRouteMap, useAuth } from "../services/auth";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const invitationToken = searchParams.get("invite") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = invitationToken
        ? await acceptStaffInvitation(invitationToken, password)
        : await signInTeam(email, password);
      const role = result.user.role;
      login({ id: result.user.id, name: result.user.name, email: result.user.email, role });
      navigate(portalRouteMap[role]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not complete team sign-in.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-5 py-14 text-ink">
      <section className="w-full max-w-lg rounded-[32px] border border-line bg-paper p-6 shadow-soft md:p-10">
        <div className="mb-8">
          <p className="eyebrow !text-orange">Team access</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            {invitationToken ? "Accept your staff invitation" : "Staff & owner login"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {invitationToken
              ? "Choose a password to activate your account and open your assigned workspace."
              : "Sign in with your invited team account. Your account role is verified by the server."}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {!invitationToken ? (
            <label className="block space-y-2 text-sm font-bold">
              <span>Work email or username</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 text-muted" size={18} />
                <input
                  className="field pl-11"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </label>
          ) : null}

          <label className="block space-y-2 text-sm font-bold">
            <span>{invitationToken ? "Create password (12+ characters)" : "Password"}</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 text-muted" size={18} />
              <input
                className="field pl-11"
                type="password"
                autoComplete={invitationToken ? "new-password" : "current-password"}
                minLength={invitationToken ? 12 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={invitationToken ? "Create a strong password" : "Enter your password"}
                required
              />
            </div>
          </label>

          <div className="flex items-center gap-2 text-sm text-muted">
            <ShieldCheck size={16} className="text-orange" />
            <span>Server-verified owner or staff access</span>
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className="premium-button w-full justify-center">
            {pending ? "Please wait…" : invitationToken ? "Activate account" : "Continue"} <ArrowRight size={16} />
          </button>
        </form>
      </section>
    </main>
  );
}
