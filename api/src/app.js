import { randomBytes, randomUUID } from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import {
  clearSessionCookie,
  createId,
  hashPassword,
  hashToken,
  readSessionCookie,
  setSessionCookie,
  verifyPassword,
} from "./security.js";
import {
  getRequestHostname,
  getSetupError,
  normalizeDomain,
  readiness,
  resolveWorkspaceStatus,
  validateEmail,
  validateUsername,
  validateWorkspaceRole,
} from "./workspacePolicy.js";

const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
const INVITATION_LIFETIME_MS = 72 * 60 * 60 * 1000;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const STAFF_ACTIVITY_TYPES = new Set(["workspace.opened", "profile.viewed", "visit.updated", "support.updated"]);
const EMAIL_PLACEHOLDER_HASH = "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function accountSummary(account) {
  return {
    id: account.id,
    email: account.email,
    username: account.username,
    name: account.display_name,
    role: account.account_role,
    workspaceRole: account.workspace_role,
    status: account.status,
    lastActivityAt: account.last_activity_at,
  };
}

function workspaceSummary(row, env) {
  const state = readiness(env);
  return {
    id: row.id,
    hostname: row.hostname,
    username: row.username,
    name: row.display_name,
    email: row.email,
    accountId: row.account_id,
    accountRole: row.account_role,
    workspaceRole: row.workspace_role,
    accountStatus: row.account_status,
    hostnameStatus: resolveWorkspaceStatus(
      { status: row.workspace_status },
      { status: row.account_status },
      env,
    ),
    dnsStatus: state.dns,
    sslStatus: state.ssl,
    lastActivityAt: row.last_activity_at,
    setupError: row.account_status === "invited"
      ? "Employee invitation has not been accepted."
      : getSetupError(env),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function findWorkspaceRow(db, workspaceId) {
  return db.prepare(`
    SELECT w.*, a.email, a.username, a.display_name, a.account_role,
      a.workspace_role, a.status AS account_status, a.last_activity_at
    FROM workspaces w
    JOIN accounts a ON a.id = w.account_id
    WHERE w.id = ?
  `).get(workspaceId);
}

function writeAudit(db, { actorId, eventType, targetType, targetId, details = {} }) {
  db.prepare(`
    INSERT INTO audit_events (id, actor_account_id, event_type, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(createId(), actorId, eventType, targetType, targetId, JSON.stringify(details), nowIso());
}

function writeStaffActivity(db, { actorId, workspaceId, eventType, details = {} }) {
  db.prepare(`
    INSERT INTO staff_activity_logs (id, actor_account_id, workspace_id, event_type, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(createId(), actorId, workspaceId, eventType, JSON.stringify(details), nowIso());
}

function safeOrigin(origin, env) {
  if (!origin) return true;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  const approvedDomain = normalizeDomain(env.PUBLIC_DOMAIN);
  const hostname = parsed.hostname.toLowerCase();
  const isDevelopmentHost = hostname === "localhost" || hostname === "127.0.0.1";
  const secureRequired = env.NODE_ENV === "production";
  if (secureRequired && parsed.protocol !== "https:") return false;
  if (!secureRequired && !["http:", "https:"].includes(parsed.protocol)) return false;
  if (isDevelopmentHost) {
    try {
      return new URL(env.PUBLIC_APP_ORIGIN ?? "http://127.0.0.1:5173").origin === parsed.origin;
    } catch {
      return false;
    }
  }
  return hostname === approvedDomain || hostname.endsWith(`.${approvedDomain}`) &&
    hostname.slice(0, -(approvedDomain.length + 1)).indexOf(".") === -1;
}

export function createApp({ db, env = process.env, webRoot } = {}) {
  if (!db) throw new Error("A database instance is required to create the workspace API.");
  const approvedDomain = normalizeDomain(env.PUBLIC_DOMAIN ?? "ensuresolution.com");
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", Number.parseInt(env.TRUST_PROXY ?? "0", 10) || false);
  app.use(helmet());
  app.use(express.json({ limit: "16kb", strict: true }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api", (req, res, next) => {
    const hostname = getRequestHostname(req, approvedDomain);
    if (!hostname) return res.status(421).json({ error: "Request host is not within the approved domain." });
    req.workspaceHostname = hostname;
    if (!SAFE_METHODS.has(req.method) && !safeOrigin(req.get("origin"), env)) {
      return res.status(403).json({ error: "Request origin is not allowed." });
    }
    next();
  });

  app.use("/api/auth/login", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts. Try again later." },
  }));

  const requireSession = (req, res, next) => {
    const token = readSessionCookie(req.get("cookie"));
    if (!token) return res.status(401).json({ error: "Sign-in is required." });
    const now = nowIso();
    const session = db.prepare(`
      SELECT s.account_id, a.id, a.email, a.username, a.display_name, a.account_role,
        a.workspace_role, a.status, a.password_hash
      FROM sessions s
      JOIN accounts a ON a.id = s.account_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(hashToken(token), now);
    if (!session || session.status !== "active") {
      db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
      return res.status(401).json({ error: "Your sign-in has expired or been disabled." });
    }
    req.account = session;
    req.sessionTokenHash = hashToken(token);
    db.prepare("UPDATE accounts SET last_activity_at = ?, updated_at = ? WHERE id = ?")
      .run(now, now, session.account_id);
    next();
  };

  const requireOwner = (req, res, next) => {
    if (req.account.account_role !== "owner") {
      return res.status(403).json({ error: "Owner permission is required." });
    }
    next();
  };

  const requireStaff = (req, res, next) => {
    if (req.account.account_role !== "staff") {
      return res.status(403).json({ error: "Staff permission is required." });
    }
    next();
  };

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const emailOrUsername = String(req.body?.email ?? "").trim().toLowerCase();
      const password = String(req.body?.password ?? "");
      if (!emailOrUsername || !password || password.length > 256) {
        return res.status(400).json({ error: "Enter your account email and password." });
      }
      const account = db.prepare(`
        SELECT * FROM accounts
        WHERE email = ? OR username = ?
      `).get(emailOrUsername, emailOrUsername);
      const passwordMatches = await verifyPassword(password, account?.password_hash ?? EMAIL_PLACEHOLDER_HASH);
      if (!account || !passwordMatches || account.status !== "active") {
        return res.status(401).json({ error: "The email or password is incorrect, or the account is not active." });
      }
      if (account.account_role === "staff") {
        const assignedWorkspace = db.prepare("SELECT * FROM workspaces WHERE account_id = ?").get(account.id);
        if (!assignedWorkspace || ["suspended", "deactivated"].includes(assignedWorkspace.status)) {
          return res.status(403).json({ error: "This workspace is not available. Contact the owner." });
        }
        const hostWorkspace = db.prepare("SELECT account_id FROM workspaces WHERE hostname = ?").get(req.workspaceHostname);
        if (hostWorkspace && hostWorkspace.account_id !== account.id) {
          return res.status(403).json({ error: "This hostname is assigned to another staff identity." });
        }
      }

      const token = randomBytes(32).toString("base64url");
      const createdAt = nowIso();
      db.prepare(`
        INSERT INTO sessions (token_hash, account_id, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `).run(hashToken(token), account.id, new Date(Date.now() + SESSION_LIFETIME_MS).toISOString(), createdAt);
      if (account.account_role === "staff") {
        const workspace = db.prepare("SELECT id FROM workspaces WHERE account_id = ?").get(account.id);
        writeStaffActivity(db, { actorId: account.id, workspaceId: workspace.id, eventType: "session.started" });
      } else {
        writeAudit(db, {
          actorId: account.id,
          eventType: "auth.login",
          targetType: "account",
          targetId: account.id,
        });
      }
      setSessionCookie(res, token, env);
      res.json({ user: accountSummary(account) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", requireSession, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(req.sessionTokenHash);
    if (req.account.account_role === "owner") {
      writeAudit(db, {
        actorId: req.account.account_id,
        eventType: "auth.logout",
        targetType: "account",
        targetId: req.account.account_id,
      });
    }
    clearSessionCookie(res, env);
    res.status(204).end();
  });

  app.get("/api/auth/session", requireSession, (req, res) => {
    res.json({ user: accountSummary(req.account) });
  });

  app.post("/api/invitations/accept", async (req, res, next) => {
    try {
      const token = String(req.body?.token ?? "");
      const password = String(req.body?.password ?? "");
      if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
        return res.status(400).json({ error: "The invitation link is invalid or expired." });
      }
      if (password.length < 12 || password.length > 256) {
        return res.status(400).json({ error: "Choose a password between 12 and 256 characters." });
      }
      const invitation = db.prepare(`
        SELECT i.*, a.status AS account_status, a.id AS staff_id
        FROM invitations i JOIN accounts a ON a.id = i.account_id
        WHERE i.token_hash = ?
      `).get(hashToken(token));
      if (!invitation || invitation.used_at || invitation.expires_at <= nowIso() ||
          invitation.account_status !== "invited") {
        return res.status(400).json({ error: "The invitation link is invalid, expired, or already used." });
      }
      const passwordHash = await hashPassword(password);
      const acceptedAt = nowIso();
      const workspace = db.prepare("SELECT * FROM workspaces WHERE account_id = ?").get(invitation.staff_id);
      const transaction = db.transaction(() => {
        db.prepare("UPDATE invitations SET used_at = ? WHERE token_hash = ? AND used_at IS NULL")
          .run(acceptedAt, hashToken(token));
        db.prepare("UPDATE accounts SET password_hash = ?, status = 'active', updated_at = ? WHERE id = ?")
          .run(passwordHash, acceptedAt, invitation.staff_id);
        const status = getSetupError(env) ? "setup_pending" : "ready";
        db.prepare("UPDATE workspaces SET status = ?, setup_error = ?, updated_at = ? WHERE account_id = ?")
          .run(status, getSetupError(env), acceptedAt, invitation.staff_id);
        writeAudit(db, {
          actorId: invitation.staff_id,
          eventType: "workspace.invitation.accepted",
          targetType: "workspace",
          targetId: workspace.id,
          details: { accountId: invitation.staff_id },
        });
      });
      transaction();

      const sessionToken = randomBytes(32).toString("base64url");
      db.prepare("INSERT INTO sessions (token_hash, account_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
        .run(hashToken(sessionToken), invitation.staff_id, new Date(Date.now() + SESSION_LIFETIME_MS).toISOString(), acceptedAt);
      writeStaffActivity(db, {
        actorId: invitation.staff_id,
        workspaceId: workspace.id,
        eventType: "invitation.accepted",
      });
      setSessionCookie(res, sessionToken, env);
      const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(invitation.staff_id);
      res.status(201).json({ user: accountSummary(account) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/change-password", requireSession, async (req, res, next) => {
    try {
      const currentPassword = String(req.body?.currentPassword ?? "");
      const newPassword = String(req.body?.newPassword ?? "");
      if (newPassword.length < 12 || newPassword.length > 256) {
        return res.status(400).json({ error: "Choose a password between 12 and 256 characters." });
      }
      if (!await verifyPassword(currentPassword, req.account.password_hash)) {
        return res.status(401).json({ error: "The current password is incorrect." });
      }
      const passwordHash = await hashPassword(newPassword);
      const changedAt = nowIso();
      db.prepare("UPDATE accounts SET password_hash = ?, updated_at = ? WHERE id = ?")
        .run(passwordHash, changedAt, req.account.account_id);
      db.prepare("DELETE FROM sessions WHERE account_id = ? AND token_hash != ?")
        .run(req.account.account_id, req.sessionTokenHash);
      if (req.account.account_role === "owner") {
        writeAudit(db, {
          actorId: req.account.account_id,
          eventType: "auth.password_changed",
          targetType: "account",
          targetId: req.account.account_id,
        });
      } else {
        const workspace = db.prepare("SELECT id FROM workspaces WHERE account_id = ?").get(req.account.account_id);
        writeStaffActivity(db, {
          actorId: req.account.account_id,
          workspaceId: workspace.id,
          eventType: "password.changed",
        });
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/domain-workspaces", requireSession, requireOwner, (_req, res) => {
    const rows = db.prepare(`
      SELECT w.*, a.email, a.username, a.display_name, a.account_role,
        a.workspace_role, a.status AS account_status, a.last_activity_at
      FROM workspaces w JOIN accounts a ON a.id = w.account_id
      ORDER BY w.created_at DESC
    `).all();
    res.json({
      approvedDomain,
      readiness: readiness(env),
      workspaces: rows.map((row) => workspaceSummary(row, env)),
    });
  });

  app.post("/api/domain-workspaces", requireSession, requireOwner, (req, res, next) => {
    try {
      const name = String(req.body?.name ?? "").trim();
      const email = validateEmail(req.body?.email);
      const { username, error: usernameError } = validateUsername(req.body?.username);
      const workspaceRole = validateWorkspaceRole(req.body?.workspaceRole);
      const idempotencyKey = String(req.get("idempotency-key") ?? "");
      if (!name || name.length > 120 || !email || !username || !workspaceRole) {
        return res.status(400).json({ error: usernameError ?? "Enter a valid name, email, username, and workspace role." });
      }
      if (idempotencyKey.length < 8 || idempotencyKey.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)) {
        return res.status(400).json({ error: "Provide a valid Idempotency-Key header for safe retries." });
      }

      const requestHash = hashToken(JSON.stringify({ name, email, username, workspaceRole }));
      const existing = db.prepare(`
        SELECT request_hash, resource_id FROM idempotency_keys
        WHERE actor_id = ? AND idempotency_key = ?
      `).get(req.account.account_id, idempotencyKey);
      if (existing) {
        if (existing.request_hash !== requestHash) {
          return res.status(409).json({ error: "This idempotency key was already used for a different request." });
        }
        const row = findWorkspaceRow(db, existing.resource_id);
        return res.status(200).json({ workspace: workspaceSummary(row, env), invitation: null, replayed: true });
      }

      if (db.prepare("SELECT 1 FROM accounts WHERE email = ? OR username = ?").get(email, username)) {
        return res.status(409).json({ error: "That email or username is already assigned to an account." });
      }
      const id = createId();
      const accountId = createId();
      const inviteToken = randomBytes(32).toString("base64url");
      const createdAt = nowIso();
      const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS).toISOString();
      const hostname = `${username}.${approvedDomain}`;
      const setupError = getSetupError(env);
      const transaction = db.transaction(() => {
        db.prepare(`
          INSERT INTO accounts
            (id, email, username, display_name, account_role, workspace_role, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'staff', ?, 'invited', ?, ?)
        `).run(accountId, email, username, name, workspaceRole, createdAt, createdAt);
        db.prepare(`
          INSERT INTO workspaces (id, account_id, hostname, status, setup_error, created_at, updated_at)
          VALUES (?, ?, ?, 'setup_pending', ?, ?, ?)
        `).run(id, accountId, hostname, setupError, createdAt, createdAt);
        db.prepare(`
          INSERT INTO invitations (token_hash, account_id, expires_at, created_by, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(hashToken(inviteToken), accountId, expiresAt, req.account.account_id, createdAt);
        db.prepare(`
          INSERT INTO idempotency_keys (actor_id, idempotency_key, request_hash, resource_id, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(req.account.account_id, idempotencyKey, requestHash, id, createdAt);
        writeAudit(db, {
          actorId: req.account.account_id,
          eventType: "workspace.created",
          targetType: "workspace",
          targetId: id,
          details: { accountId, email, username, workspaceRole, hostname },
        });
      });
      transaction();

      const row = findWorkspaceRow(db, id);
      const inviteUrl = new URL("/adminlogin", env.PUBLIC_APP_ORIGIN ?? `https://${approvedDomain}`);
      inviteUrl.searchParams.set("invite", inviteToken);
      res.status(201).json({
        workspace: workspaceSummary(row, env),
        invitation: { url: inviteUrl.toString(), expiresAt },
        replayed: false,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/domain-workspaces/:id/invitation", requireSession, requireOwner, (req, res, next) => {
    try {
      const row = findWorkspaceRow(db, req.params.id);
      if (!row) return res.status(404).json({ error: "Workspace not found." });
      if (row.account_status !== "invited") {
        return res.status(409).json({ error: "An invitation can only be reissued to a pending employee." });
      }
      const token = randomBytes(32).toString("base64url");
      const createdAt = nowIso();
      const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS).toISOString();
      const transaction = db.transaction(() => {
        db.prepare("UPDATE invitations SET used_at = ? WHERE account_id = ? AND used_at IS NULL")
          .run(createdAt, row.account_id);
        db.prepare("INSERT INTO invitations (token_hash, account_id, expires_at, created_by, created_at) VALUES (?, ?, ?, ?, ?)")
          .run(hashToken(token), row.account_id, expiresAt, req.account.account_id, createdAt);
        writeAudit(db, {
          actorId: req.account.account_id,
          eventType: "workspace.invitation.resent",
          targetType: "workspace",
          targetId: row.id,
          details: { accountId: row.account_id },
        });
      });
      transaction();
      const inviteUrl = new URL("/adminlogin", env.PUBLIC_APP_ORIGIN ?? `https://${approvedDomain}`);
      inviteUrl.searchParams.set("invite", token);
      res.json({ invitation: { url: inviteUrl.toString(), expiresAt } });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/domain-workspaces/:id", requireSession, requireOwner, (req, res, next) => {
    try {
      const row = findWorkspaceRow(db, req.params.id);
      if (!row) return res.status(404).json({ error: "Workspace not found." });
      const action = String(req.body?.action ?? "");
      const updatedAt = nowIso();
      const transaction = db.transaction(() => {
        if (action === "rename") {
          const { username, error } = validateUsername(req.body?.username);
          if (!username) throw Object.assign(new Error(error), { status: 400 });
          if (row.account_status !== "invited" || row.last_activity_at) {
            throw Object.assign(new Error("A hostname can only be renamed before the employee accepts the invitation or signs in."), { status: 409 });
          }
          if (db.prepare("SELECT 1 FROM accounts WHERE username = ? AND id != ?").get(username, row.account_id)) {
            throw Object.assign(new Error("That username is already assigned to an account."), { status: 409 });
          }
          db.prepare("UPDATE accounts SET username = ?, updated_at = ? WHERE id = ?")
            .run(username, updatedAt, row.account_id);
          db.prepare("UPDATE workspaces SET hostname = ?, updated_at = ? WHERE id = ?")
            .run(`${username}.${approvedDomain}`, updatedAt, row.id);
          writeAudit(db, {
            actorId: req.account.account_id,
            eventType: "workspace.renamed",
            targetType: "workspace",
            targetId: row.id,
            details: { previousHostname: row.hostname, hostname: `${username}.${approvedDomain}` },
          });
        } else if (action === "suspend" || action === "deactivate" || action === "reactivate") {
          if (action === "reactivate" && row.account_status === "deactivated") {
            throw Object.assign(new Error("Deactivated accounts cannot be reactivated. Create a new staff invitation instead."), { status: 409 });
          }
          if (action === "reactivate" && row.account_status !== "suspended") {
            throw Object.assign(new Error("Only a suspended workspace can be reactivated."), { status: 409 });
          }
          if (action === "suspend" && ["suspended", "deactivated"].includes(row.account_status)) {
            throw Object.assign(new Error("Only an active or invited workspace can be suspended."), { status: 409 });
          }
          if (action === "deactivate" && row.account_status === "deactivated") {
            throw Object.assign(new Error("This workspace is already deactivated."), { status: 409 });
          }
          let accountStatus;
          let workspaceStatus;
          if (action === "suspend") {
            accountStatus = "suspended";
            workspaceStatus = "suspended";
          } else if (action === "deactivate") {
            accountStatus = "deactivated";
            workspaceStatus = "deactivated";
          } else {
            accountStatus = row.password_hash ? "active" : "invited";
            workspaceStatus = accountStatus === "active" && !getSetupError(env) ? "ready" : "setup_pending";
          }
          db.prepare("UPDATE accounts SET status = ?, updated_at = ? WHERE id = ?")
            .run(accountStatus, updatedAt, row.account_id);
          db.prepare("UPDATE workspaces SET status = ?, setup_error = ?, updated_at = ? WHERE id = ?")
            .run(
              workspaceStatus,
              accountStatus === "invited" ? "Employee invitation has not been accepted." : getSetupError(env),
              updatedAt,
              row.id,
            );
          if (action !== "reactivate") {
            db.prepare("DELETE FROM sessions WHERE account_id = ?").run(row.account_id);
          }
          const eventName = action === "suspend" ? "suspended" :
            action === "deactivate" ? "deactivated" : "reactivated";
          writeAudit(db, {
            actorId: req.account.account_id,
            eventType: `workspace.${eventName}`,
            targetType: "workspace",
            targetId: row.id,
            details: { accountId: row.account_id, accountStatus },
          });
        } else {
          throw Object.assign(new Error("Use rename, suspend, reactivate, or deactivate."), { status: 400 });
        }
      });
      transaction();
      res.json({ workspace: workspaceSummary(findWorkspaceRow(db, row.id), env) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/audit-events", requireSession, requireOwner, (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 250);
    const events = db.prepare(`
      SELECT e.id, e.event_type, e.target_type, e.target_id, e.details_json, e.created_at,
        a.display_name AS actor_name, a.email AS actor_email
      FROM audit_events e JOIN accounts a ON a.id = e.actor_account_id
      ORDER BY e.created_at DESC LIMIT ?
    `).all(limit);
    res.json({
      events: events.map((event) => ({
        id: event.id,
        type: event.event_type,
        targetType: event.target_type,
        targetId: event.target_id,
        details: parseJson(event.details_json),
        createdAt: event.created_at,
        actor: { name: event.actor_name, email: event.actor_email },
      })),
    });
  });

  app.get("/api/staff/workspace", requireSession, requireStaff, (req, res) => {
    const row = db.prepare(`
      SELECT w.*, a.email, a.username, a.display_name, a.account_role,
        a.workspace_role, a.status AS account_status, a.last_activity_at
      FROM workspaces w JOIN accounts a ON a.id = w.account_id
      WHERE w.account_id = ?
    `).get(req.account.account_id);
    if (!row) return res.status(403).json({ error: "No workspace is assigned to this staff account." });
    const hostWorkspace = db.prepare("SELECT account_id FROM workspaces WHERE hostname = ?").get(req.workspaceHostname);
    if (hostWorkspace && hostWorkspace.account_id !== req.account.account_id) {
      return res.status(403).json({ error: "This hostname is assigned to another staff identity." });
    }
    res.json({ workspace: workspaceSummary(row, env) });
  });

  app.get("/api/staff/activity", requireSession, requireStaff, (req, res) => {
    const workspace = db.prepare("SELECT id FROM workspaces WHERE account_id = ?").get(req.account.account_id);
    if (!workspace) return res.status(403).json({ error: "No workspace is assigned to this staff account." });
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const entries = db.prepare(`
      SELECT id, event_type, details_json, created_at
      FROM staff_activity_logs
      WHERE workspace_id = ? AND actor_account_id = ?
      ORDER BY created_at DESC LIMIT ?
    `).all(workspace.id, req.account.account_id, limit);
    res.json({
      entries: entries.map((entry) => ({
        id: entry.id,
        type: entry.event_type,
        details: parseJson(entry.details_json),
        createdAt: entry.created_at,
      })),
    });
  });

  app.post("/api/staff/activity", requireSession, requireStaff, (req, res) => {
    const workspace = db.prepare("SELECT id FROM workspaces WHERE account_id = ?").get(req.account.account_id);
    if (!workspace) return res.status(403).json({ error: "No workspace is assigned to this staff account." });
    const eventType = String(req.body?.eventType ?? "");
    const details = req.body?.details ?? {};
    if (!STAFF_ACTIVITY_TYPES.has(eventType) || !details || typeof details !== "object" ||
        Array.isArray(details) || Buffer.byteLength(JSON.stringify(details)) > 2048) {
      return res.status(400).json({ error: "The staff activity event is invalid or too large." });
    }
    writeStaffActivity(db, {
      actorId: req.account.account_id,
      workspaceId: workspace.id,
      eventType,
      details,
    });
    res.status(201).json({ saved: true });
  });

  app.use((error, _req, res, _next) => {
    if (error?.status && Number.isInteger(error.status)) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "The email, username, hostname, or request key is already in use." });
    }
    console.error("Workspace API request failed:", error?.message ?? "Unknown server error");
    res.status(500).json({ error: "The request could not be completed. Check the server logs." });
  });

  if (webRoot) {
    app.use(express.static(webRoot, { index: false, fallthrough: true }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/") || req.path === "/health") return next();
      res.sendFile("index.html", { root: webRoot }, (error) => {
        if (error) next(error);
      });
    });
  }

  return app;
}
