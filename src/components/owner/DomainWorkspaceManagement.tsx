import { useEffect, useState, type FormEvent } from "react";
import {
  createManagedWorkspace,
  listManagedWorkspaces,
  listWorkspaceAuditEvents,
  resendManagedInvitation,
  updateManagedWorkspace,
  type AuditEvent,
  type ManagedInvitation,
  type ManagedWorkspace,
  type WorkspaceAction,
  type WorkspaceRole,
} from "../../services/domainWorkspaceApi";

const workspaceRoles: { value: WorkspaceRole; label: string }[] = [
  { value: "operations", label: "Operations" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "staff_admin", label: "Staff administrator" },
];

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

function StateBadge({ children }: { children: string }) {
  return <span className="inline-flex rounded-full bg-orange/10 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-orange">{children.replaceAll("_", " ")}</span>;
}

export function DomainWorkspaceManagement() {
  const [workspaces, setWorkspaces] = useState<ManagedWorkspace[]>([]);
  const [approvedDomain, setApprovedDomain] = useState("");
  const [dnsReady, setDnsReady] = useState("not_configured");
  const [sslReady, setSslReady] = useState("not_configured");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole>("operations");
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [invitation, setInvitation] = useState<ManagedInvitation | null>(null);
  const [renameId, setRenameId] = useState("");
  const [renameUsername, setRenameUsername] = useState("");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[] | null>(null);

  async function refresh() {
    const result = await listManagedWorkspaces();
    setWorkspaces(result.workspaces);
    setApprovedDomain(result.approvedDomain);
    setDnsReady(result.readiness.dns);
    setSslReady(result.readiness.ssl);
  }

  useEffect(() => {
    let mounted = true;
    listManagedWorkspaces()
      .then((result) => {
        if (!mounted) return;
        setWorkspaces(result.workspaces);
        setApprovedDomain(result.approvedDomain);
        setDnsReady(result.readiness.dns);
        setSslReady(result.readiness.ssl);
      })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : "Could not load workspace management.");
      });
    return () => { mounted = false; };
  }, []);

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    setInvitation(null);
    try {
      const result = await createManagedWorkspace(
        { name: name.trim(), email: email.trim(), username: username.trim(), workspaceRole },
        crypto.randomUUID(),
      );
      await refresh();
      setName("");
      setEmail("");
      setUsername("");
      if (result.invitation) {
        setInvitation(result.invitation);
        setMessage(result.replayed
          ? "Workspace already exists from a previous retry. Use Reissue invitation if the original link was not received."
          : "Staff account and workspace created. Send the one-time invitation link to the employee.");
      } else {
        setMessage("Workspace already exists from a previous request. Reissue its invitation if needed.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the workspace.");
    } finally {
      setPending(false);
    }
  }

  async function runAction(workspace: ManagedWorkspace, action: WorkspaceAction) {
    if (action === "deactivate" && !window.confirm(`Permanently deactivate ${workspace.hostname}? This cannot be undone.`)) return;
    if (action === "suspend" && !window.confirm(`Suspend access to ${workspace.hostname}?`)) return;
    setBusyId(workspace.id);
    setError("");
    setMessage("");
    try {
      await updateManagedWorkspace(workspace.id, { action });
      await refresh();
      const actionLabel = action === "reactivate" ? "reactivated" : action === "deactivate" ? "deactivated" : "suspended";
      setMessage(`${workspace.hostname} ${actionLabel}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Workspace status could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  async function saveRename(workspace: ManagedWorkspace) {
    setBusyId(workspace.id);
    setError("");
    try {
      await updateManagedWorkspace(workspace.id, { action: "rename", username: renameUsername });
      await refresh();
      setRenameId("");
      setMessage("Hostname updated. Existing invitations remain valid until they expire or are reissued.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The hostname could not be renamed.");
    } finally {
      setBusyId("");
    }
  }

  async function reissueInvitation(workspace: ManagedWorkspace) {
    setBusyId(workspace.id);
    setError("");
    try {
      const result = await resendManagedInvitation(workspace.id);
      setInvitation(result.invitation);
      setMessage(`A replacement invitation for ${workspace.email} is ready to send. The old link is invalidated.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The invitation could not be reissued.");
    } finally {
      setBusyId("");
    }
  }

  async function loadAuditEvents() {
    setError("");
    try {
      const result = await listWorkspaceAuditEvents();
      setAuditEvents(result.events);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The internal audit log could not be loaded.");
    }
  }

  async function copyInvitation() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.url);
      setMessage("Invitation link copied. Send it to the employee before it expires.");
    } catch {
      setMessage("Clipboard access is unavailable. Select and copy the invitation URL below.");
    }
  }

  return (
    <section id="workspaces" className="mt-8 scroll-mt-24 rounded-xl2 border border-line bg-paper p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Owner controls</p>
          <h2 className="mt-2 text-2xl font-black">Domain &amp; Workspace Management</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Staff subdomains resolve to this shared application. A hostname only selects a workspace; the API separately verifies the signed-in account and its assigned workspace on every protected request.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-soft p-3 text-sm">
          <p><strong>Approved domain:</strong> {approvedDomain || "Loading…"}</p>
          <p className="mt-1"><strong>Wildcard DNS:</strong> <StateBadge>{dnsReady}</StateBadge></p>
          <p className="mt-1"><strong>Wildcard HTTPS:</strong> <StateBadge>{sslReady}</StateBadge></p>
          <p className="mt-2 max-w-sm text-xs text-muted">Readiness is operator-configured, not verified or provisioned by this module.</p>
        </div>
      </div>

      {error ? <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
      {message ? <p role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</p> : null}
      {invitation ? (
        <div className="mt-4 rounded-2xl border border-orange/30 bg-orange/5 p-4">
          <p className="font-black">One-time staff invitation</p>
          <p className="mt-1 text-sm text-muted">Share privately with the intended employee. Expires {formatDate(invitation.expiresAt)}.</p>
          <input aria-label="Staff invitation URL" className="form-field mt-3" readOnly value={invitation.url} onFocus={(event) => event.currentTarget.select()} />
          <button type="button" className="secondary-button mt-3" onClick={copyInvitation}>Copy invitation link</button>
        </div>
      ) : null}

      <form onSubmit={createWorkspace} className="mt-6 rounded-2xl border border-line bg-soft p-4">
        <h3 className="font-black">Create and assign a staff workspace</h3>
        <p className="mt-1 text-sm text-muted">Creates a unique staff account, role, hostname, and expiring invitation as one retry-safe operation.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="form-field"><span>Employee name</span><input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="form-field"><span>Work email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="form-field"><span>Hostname username</span><input required maxLength={30} pattern="[A-Za-z0-9](?:[A-Za-z0-9-]{0,28}[A-Za-z0-9])?" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="e.g. varad" /><small>{username || "username"}.{approvedDomain || "approved-domain"}</small></label>
          <label className="form-field"><span>Workspace role</span><select value={workspaceRole} onChange={(event) => setWorkspaceRole(event.target.value as WorkspaceRole)}>{workspaceRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
        </div>
        <button className="premium-button mt-4" disabled={pending} type="submit">{pending ? "Creating…" : "Create workspace and invite"}</button>
      </form>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">Staff workspaces</h3>
          <p className="mt-1 text-sm text-muted">Hostname and TLS status reflect global operator configuration; account identity and status are checked by the backend.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void refresh().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Refresh failed."))}>Refresh list</button>
      </div>

      <div className="mt-4 space-y-4">
        {workspaces.map((workspace) => (
          <article key={workspace.id} className="rounded-2xl border border-line bg-soft p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-black">{workspace.name}</h4>
                <p className="text-sm text-muted">{workspace.email} · {workspace.workspaceRole.replaceAll("_", " ")}</p>
                <p className="mt-2 break-all font-bold text-orange">{workspace.hostname}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StateBadge>{workspace.hostnameStatus}</StateBadge>
                <StateBadge>{workspace.accountStatus}</StateBadge>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <p><strong>DNS:</strong> {workspace.dnsStatus.replaceAll("_", " ")}</p>
              <p><strong>SSL:</strong> {workspace.sslStatus.replaceAll("_", " ")}</p>
              <p><strong>Last activity:</strong> {formatDate(workspace.lastActivityAt)}</p>
              <p><strong>Created:</strong> {formatDate(workspace.createdAt)}</p>
            </div>
            {workspace.setupError ? <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Setup:</strong> {workspace.setupError}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.accountStatus === "invited" ? <button type="button" className="secondary-button min-h-9 px-3 text-xs" disabled={busyId === workspace.id} onClick={() => void reissueInvitation(workspace)}>Reissue invitation</button> : null}
              {workspace.accountStatus === "invited" && renameId !== workspace.id ? <button type="button" className="secondary-button min-h-9 px-3 text-xs" onClick={() => { setRenameId(workspace.id); setRenameUsername(workspace.username); }}>Rename hostname</button> : null}
              {workspace.accountStatus === "active" ? <button type="button" className="secondary-button min-h-9 px-3 text-xs" disabled={busyId === workspace.id} onClick={() => void runAction(workspace, "suspend")}>Suspend</button> : null}
              {workspace.accountStatus === "suspended" ? <button type="button" className="secondary-button min-h-9 px-3 text-xs" disabled={busyId === workspace.id} onClick={() => void runAction(workspace, "reactivate")}>Reactivate</button> : null}
              {workspace.accountStatus !== "deactivated" ? <button type="button" className="secondary-button min-h-9 px-3 text-xs text-red-700" disabled={busyId === workspace.id} onClick={() => void runAction(workspace, "deactivate")}>Deactivate</button> : null}
            </div>
            {renameId === workspace.id ? (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="form-field"><span>New username</span><input value={renameUsername} maxLength={30} onChange={(event) => setRenameUsername(event.target.value.toLowerCase())} /></label>
                <span className="pb-2 font-bold text-orange">.{approvedDomain}</span>
                <button type="button" className="premium-button min-h-10" disabled={busyId === workspace.id} onClick={() => void saveRename(workspace)}>Save hostname</button>
                <button type="button" className="secondary-button min-h-10" onClick={() => setRenameId("")}>Cancel</button>
              </div>
            ) : null}
          </article>
        ))}
        {!workspaces.length ? <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">No staff workspaces exist yet.</p> : null}
      </div>

      <details className="mt-7 rounded-2xl border border-line p-4" onToggle={(event) => {
        if (event.currentTarget.open && auditEvents === null) void loadAuditEvents();
      }}>
        <summary className="cursor-pointer font-black">
          Internal workspace audit log
        </summary>
        <p className="mt-2 text-sm text-muted">Owner-only administrative changes; separate from staff activity and customer activity.</p>
        {auditEvents ? <div className="mt-4 space-y-2">{auditEvents.map((event) => (
          <article key={event.id} className="rounded-xl bg-soft p-3 text-sm">
            <p className="font-bold">{event.type} · {event.targetType} {event.targetId}</p>
            <p className="text-muted">{event.actor.name} ({event.actor.email}) · {formatDate(event.createdAt)}</p>
          </article>
        ))}{!auditEvents.length ? <p className="text-sm text-muted">No audit events recorded yet.</p> : null}</div> : null}
      </details>
    </section>
  );
}
