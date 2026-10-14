import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export type PortalRole = "owner" | "staff" | "customer";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  company: string;
  role: PortalRole;
};

export const portalRouteMap: Record<PortalRole, string> = {
  owner: "/owner",
  staff: "/staff",
  customer: "/customer",
};

export const portalLoginRouteMap: Record<PortalRole, string> = {
  owner: "/adminlogin",
  staff: "/adminlogin",
  customer: "/login",
};

const SESSION_STORAGE_KEY = "ensuresolution.portal.session";

export function resolvePortalRole(email: string): PortalRole {
  const normalized = email.trim().toLowerCase();

  if (normalized.includes(".owner") || normalized.startsWith("owner@") || normalized.includes("@owner.")) {
    return "owner";
  }

  if (normalized.includes(".staff") || normalized.startsWith("staff@") || normalized.includes("@staff.")) {
    return "staff";
  }

  return "customer";
}

function readStoredSession(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed || !parsed.email || !parsed.role) {
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

type AuthContextValue = {
  session: SessionUser | null;
  login: (input: { id?: string; name?: string; email: string; company?: string; role?: PortalRole }) => SessionUser;
  updateSession: (profile: Pick<SessionUser, "name" | "email" | "company">) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(() => readStoredSession());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return;
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [session]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    isAuthenticated: Boolean(session),
    login: ({ id, name, email, company, role }) => {
      const resolvedRole = role ?? resolvePortalRole(email);
      const nextSession: SessionUser = {
        id: id ?? `${resolvedRole}-${Date.now()}`,
        name: name?.trim() || email.split("@")[0] || "Portal User",
        email: email.trim(),
        company: company?.trim() || "EnsureSolution",
        role: resolvedRole,
      };

      setSession(nextSession);
      return nextSession;
    },
    updateSession: (profile) => {
      setSession((current) => current ? { ...current, ...profile } : current);
    },
    logout: () => {
      setSession(null);
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function ProtectedPortalRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: PortalRole[];
  children: React.ReactElement;
}) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    const loginRoute = allowedRoles.includes("customer") ? "/login" : "/adminlogin";
    return <Navigate to={loginRoute} replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(session.role)) {
    return <Navigate to={portalLoginRouteMap[session.role]} replace />;
  }

  return children;
}
