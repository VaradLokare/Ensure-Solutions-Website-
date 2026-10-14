export type WorkspaceRole = "staff_admin" | "operations" | "sales" | "support";
export type WorkspaceAction = "suspend" | "reactivate" | "deactivate";

export type ManagedWorkspace = {
  id: string;
  hostname: string;
  username: string;
  name: string;
  email: string;
  accountId: string;
  workspaceRole: WorkspaceRole;
  accountStatus: "invited" | "active" | "suspended" | "deactivated";
  hostnameStatus: "setup_pending" | "ready" | "suspended" | "deactivated";
  dnsStatus: "configured" | "not_configured";
  sslStatus: "configured" | "not_configured";
  lastActivityAt: string | null;
  setupError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagedInvitation = {
  url: string;
  expiresAt: string;
};

export type AuditEvent = {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  details: Record<string, string>;
  createdAt: string;
  actor: { name: string; email: string };
};

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`);
  return payload;
}

export function signInTeam(email: string, password: string) {
  return requestJson<{ user: { id: string; email: string; name: string; role: "owner" | "staff" } }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
}

export function acceptStaffInvitation(token: string, password: string) {
  return requestJson<{ user: { id: string; email: string; name: string; role: "staff" } }>(
    "/api/invitations/accept",
    { method: "POST", body: JSON.stringify({ token, password }) },
  );
}

export function listManagedWorkspaces() {
  return requestJson<{ approvedDomain: string; readiness: { dns: string; ssl: string }; workspaces: ManagedWorkspace[] }>(
    "/api/domain-workspaces",
  );
}

export function createManagedWorkspace(
  input: { name: string; email: string; username: string; workspaceRole: WorkspaceRole },
  idempotencyKey: string,
) {
  return requestJson<{
    workspace: ManagedWorkspace;
    invitation: ManagedInvitation | null;
    replayed: boolean;
  }>("/api/domain-workspaces", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });
}

export function updateManagedWorkspace(
  workspaceId: string,
  input: { action: "rename"; username: string } | { action: WorkspaceAction },
) {
  return requestJson<{ workspace: ManagedWorkspace }>(`/api/domain-workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function resendManagedInvitation(workspaceId: string) {
  return requestJson<{ invitation: ManagedInvitation }>(
    `/api/domain-workspaces/${encodeURIComponent(workspaceId)}/invitation`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function listWorkspaceAuditEvents() {
  return requestJson<{ events: AuditEvent[] }>("/api/audit-events");
}
