PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  account_role TEXT NOT NULL CHECK (account_role IN ('owner', 'staff')),
  workspace_role TEXT NOT NULL CHECK (workspace_role IN ('owner', 'staff_admin', 'operations', 'sales', 'support')),
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'suspended', 'deactivated')),
  password_hash TEXT,
  last_activity_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id),
  hostname TEXT NOT NULL COLLATE NOCASE UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('setup_pending', 'ready', 'suspended', 'deactivated')),
  setup_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX sessions_account_id_idx ON sessions(account_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE invitations (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  created_at TEXT NOT NULL
);
CREATE INDEX invitations_account_id_idx ON invitations(account_id);

CREATE TABLE idempotency_keys (
  actor_id TEXT NOT NULL REFERENCES accounts(id),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (actor_id, idempotency_key)
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  event_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX audit_events_created_at_idx ON audit_events(created_at DESC);

CREATE TABLE staff_activity_logs (
  id TEXT PRIMARY KEY,
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  event_type TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX staff_activity_workspace_idx ON staff_activity_logs(workspace_id, created_at DESC);

CREATE TRIGGER audit_events_no_update
BEFORE UPDATE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit events are append-only');
END;

CREATE TRIGGER audit_events_no_delete
BEFORE DELETE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit events are append-only');
END;

CREATE TRIGGER staff_activity_logs_no_update
BEFORE UPDATE ON staff_activity_logs
BEGIN
  SELECT RAISE(ABORT, 'staff activity logs are append-only');
END;

CREATE TRIGGER staff_activity_logs_no_delete
BEFORE DELETE ON staff_activity_logs
BEGIN
  SELECT RAISE(ABORT, 'staff activity logs are append-only');
END;

CREATE TABLE schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
