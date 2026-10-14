import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { openDatabase } from "../src/database.js";
import { createId, hashPassword } from "../src/security.js";

const environment = {
  NODE_ENV: "test",
  PUBLIC_DOMAIN: "ensuresolution.com",
  PUBLIC_APP_ORIGIN: "http://127.0.0.1:5173",
  SESSION_SECRET: "test-session-secret-with-at-least-32-characters",
  WILDCARD_DNS_READY: "true",
  WILDCARD_TLS_READY: "true",
};
const password = "a-secure-test-password";
async function fixture(t) {
  const db = await openDatabase(":memory:");
  const ownerId = createId();
  const ownerHash = await hashPassword(password);
  const createdAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO accounts
      (id, email, username, display_name, account_role, workspace_role, status, password_hash, created_at, updated_at)
    VALUES (?, 'owner@example.com', 'owner', 'Test Owner', 'owner', 'owner', 'active', ?, ?, ?)
  `).run(ownerId, ownerHash, createdAt, createdAt);
  const server = createApp({ db, env: environment }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  async function request(path, { cookie, ...options } = {}) {
    const headers = new Headers(options.headers);
    if (cookie) headers.set("cookie", cookie);
    return fetch(`${base}${path}`, { ...options, headers });
  }
  async function ownerCookie() {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "owner@example.com", password }),
    });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie").split(";")[0];
  }
  return { db, server, request, ownerCookie, ownerId };
}

test("management routes require an authenticated owner session", async (t) => {
  const { request } = await fixture(t);
  const response = await request("/api/domain-workspaces");
  assert.equal(response.status, 401);
  const unauthorizedCreate = await request("/api/domain-workspaces", { method: "POST" });
  assert.equal(unauthorizedCreate.status, 401);
});

test("workspace creation is retry-safe, validates hostnames, and returns an invite once", async (t) => {
  const { request, db, ownerCookie } = await fixture(t);
  const cookie = await ownerCookie();
  const payload = { name: "Varad Lokare", email: "varad@example.com", username: "varad", workspaceRole: "operations" };
  const create = () => request("/api/domain-workspaces", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": "create-varad-once" },
    body: JSON.stringify(payload),
    cookie,
  });
  const first = await create();
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  assert.equal(firstBody.workspace.hostname, "varad.ensuresolution.com");
  assert.equal(firstBody.workspace.hostnameStatus, "setup_pending");
  const token = new URL(firstBody.invitation.url).searchParams.get("invite");
  assert.ok(token);
  const storedInvitation = db.prepare("SELECT token_hash FROM invitations").get();
  assert.notEqual(storedInvitation.token_hash, token);

  const retry = await create();
  assert.equal(retry.status, 200);
  const retryBody = await retry.json();
  assert.equal(retryBody.workspace.id, firstBody.workspace.id);
  assert.equal(retryBody.invitation, null);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM accounts WHERE account_role = 'staff'").get().count, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM invitations").get().count, 1);

  const collision = await request("/api/domain-workspaces", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": "create-other-once" },
    body: JSON.stringify({ ...payload, username: "root" }),
    cookie,
  });
  assert.equal(collision.status, 400);
});

test("invitation activation binds hostname access to the signed-in account, not just the host", async (t) => {
  const { request, db, ownerCookie } = await fixture(t);
  const owner = await ownerCookie();
  const created = await request("/api/domain-workspaces", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": "create-rahul-once" },
    body: JSON.stringify({ name: "Rahul Staff", email: "rahul@example.com", username: "rahul", workspaceRole: "support" }),
    cookie: owner,
  });
  assert.equal(created.status, 201);
  const invitationUrl = (await created.json()).invitation.url;
  const token = new URL(invitationUrl).searchParams.get("invite");
  const accepted = await request("/api/invitations/accept", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password: "another-secure-test-password" }),
  });
  assert.equal(accepted.status, 201);
  const staffCookie = accepted.headers.get("set-cookie").split(";")[0];
  const workspaceResponse = await request("/api/staff/workspace", {
    cookie: staffCookie,
    headers: { host: "rahul.ensuresolution.com" },
  });
  assert.equal(workspaceResponse.status, 200);
  assert.equal((await workspaceResponse.json()).workspace.accountId, JSON.parse(await accepted.clone().text()).user.id);

  const wrongHostname = await request("/api/staff/workspace", {
    cookie: staffCookie,
    headers: { host: "varad.ensuresolution.com" },
  });
  assert.equal(wrongHostname.status, 403);
  const forbiddenOwnerAction = await request("/api/domain-workspaces", { cookie: staffCookie });
  assert.equal(forbiddenOwnerAction.status, 403);

  const duplicateToken = await request("/api/invitations/accept", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password: "another-secure-test-password" }),
  });
  assert.equal(duplicateToken.status, 400);
});

test("suspending a workspace revokes existing sessions and logs owner actions separately", async (t) => {
  const { request, db, ownerCookie } = await fixture(t);
  const owner = await ownerCookie();
  const created = await request("/api/domain-workspaces", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": "create-sam-once" },
    body: JSON.stringify({ name: "Sam Staff", email: "sam@example.com", username: "sam", workspaceRole: "sales" }),
    cookie: owner,
  });
  const inviteToken = new URL((await created.json()).invitation.url).searchParams.get("invite");
  const accepted = await request("/api/invitations/accept", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: inviteToken, password: "sam-secure-test-password" }),
  });
  const staffCookie = accepted.headers.get("set-cookie").split(";")[0];
  const accountId = (await accepted.json()).user.id;
  const workspace = db.prepare("SELECT id FROM workspaces WHERE account_id = ?").get(accountId);
  const suspended = await request(`/api/domain-workspaces/${workspace.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "suspend" }),
    cookie: owner,
  });
  assert.equal(suspended.status, 200);
  assert.equal((await suspended.json()).workspace.hostnameStatus, "suspended");
  assert.equal((await request("/api/staff/workspace", { cookie: staffCookie })).status, 401);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM audit_events WHERE event_type = 'workspace.suspended'").get().count, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM staff_activity_logs WHERE event_type = 'invitation.accepted'").get().count, 1);
  assert.equal((await request("/api/audit-events", { cookie: staffCookie })).status, 401);
});

test("staff activity is isolated to its assigned workspace and validates event data", async (t) => {
  const { request, db, ownerCookie } = await fixture(t);
  const owner = await ownerCookie();
  const created = await request("/api/domain-workspaces", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": "create-lee-once" },
    body: JSON.stringify({ name: "Lee Staff", email: "lee@example.com", username: "lee", workspaceRole: "operations" }),
    cookie: owner,
  });
  const token = new URL((await created.json()).invitation.url).searchParams.get("invite");
  const accepted = await request("/api/invitations/accept", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password: "lee-secure-test-password" }),
  });
  const staffCookie = accepted.headers.get("set-cookie").split(";")[0];
  const activity = await request("/api/staff/activity", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventType: "workspace.opened", details: { view: "overview" } }),
    cookie: staffCookie,
  });
  assert.equal(activity.status, 201);
  const entries = await request("/api/staff/activity", { cookie: staffCookie });
  assert.equal((await entries.json()).entries[0].type, "workspace.opened");
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM audit_events WHERE event_type = 'workspace.opened'").get().count, 0);
  const invalid = await request("/api/staff/activity", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventType: "customer.activity", details: {} }),
    cookie: staffCookie,
  });
  assert.equal(invalid.status, 400);
});
