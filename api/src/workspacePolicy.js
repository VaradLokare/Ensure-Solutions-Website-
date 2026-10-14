const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;
const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "api", "app", "auth", "billing", "contact", "ftp",
  "help", "hostmaster", "mail", "owner", "root", "security", "staff", "support",
  "webmaster", "www",
]);
const WORKSPACE_ROLES = new Set(["staff_admin", "operations", "sales", "support"]);

export function normalizeUsername(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function validateUsername(value) {
  const username = normalizeUsername(value);
  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Use 1–30 lowercase letters, numbers, and internal hyphens for the username." };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { error: "That username is reserved and cannot be used as a staff hostname." };
  }
  return { username };
}

export function normalizeDomain(value) {
  const domain = String(value ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!domain || domain.includes("/") || domain.includes(":") || domain.includes("@") || /\s/.test(domain)) {
    throw new Error("PUBLIC_DOMAIN must be a bare approved domain name.");
  }
  return domain;
}

export function isAllowedHostname(hostname, approvedDomain) {
  const host = String(hostname ?? "").toLowerCase().replace(/\.$/, "");
  const prefix = host.endsWith(`.${approvedDomain}`) ? host.slice(0, -(approvedDomain.length + 1)) : "";
  return host === approvedDomain || (prefix.length > 0 && !prefix.includes(".")) ||
    host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function getRequestHostname(req, approvedDomain) {
  const raw = req.headers.host ?? "";
  if (!raw || /[\\/@\s]/.test(raw)) return null;
  const hostname = raw.replace(/:\d+$/, "").toLowerCase().replace(/\.$/, "");
  return isAllowedHostname(hostname, approvedDomain) ? hostname : null;
}

export function validateWorkspaceRole(value) {
  return WORKSPACE_ROLES.has(value) ? value : null;
}

export function readiness(env) {
  return {
    dns: env.WILDCARD_DNS_READY === "true" ? "configured" : "not_configured",
    ssl: env.WILDCARD_TLS_READY === "true" ? "configured" : "not_configured",
  };
}

export function getSetupError(env) {
  const missing = [];
  if (env.WILDCARD_DNS_READY !== "true") missing.push("Wildcard DNS readiness has not been confirmed by the operator.");
  if (env.WILDCARD_TLS_READY !== "true") missing.push("Wildcard HTTPS readiness has not been confirmed by the operator.");
  return missing.length ? missing.join(" ") : null;
}

export function resolveWorkspaceStatus(workspace, account, env) {
  if (workspace.status === "deactivated" || account.status === "deactivated") return "deactivated";
  if (workspace.status === "suspended" || account.status === "suspended") return "suspended";
  if (account.status !== "active" || getSetupError(env)) return "setup_pending";
  return "ready";
}

export function validateEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
