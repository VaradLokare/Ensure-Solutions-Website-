# Workspace API and Plesk staging deployment

This module does not edit DNS, Plesk, certificates, or hosting-provider settings. Run it in a separate staging deployment and verify all external wildcard prerequisites before considering a production release.

## What it provides

- Express JSON API under `/api`, with an HTTP-only, `SameSite=Strict` eight-hour session cookie.
- SQLite migrations in `migrations/`; the database is kept outside source control.
- Owner bootstrap, staff invitations, account/workspace lifecycle, hostname validation, workspace-scoped staff activity, and a separate append-only owner audit log.
- One shared application and one approved domain. Hostnames are derived server-side as `<username>.<PUBLIC_DOMAIN>`; API access always authenticates an account and checks its assigned workspace.
- DNS and SSL status are readiness flags supplied by the operator. No DNS or certificate API keys are used.

## Local/staging setup

1. Back up the staging copy and deploy the branch to a non-production Plesk subscription or local environment.
2. Install the website dependencies from `Website/`, then install the API dependencies:

   ```powershell
   npm install
   npm --prefix api install
   Copy-Item api\.env.example api\.env
   ```

3. Set `PUBLIC_DOMAIN` to the staging domain (for example `staging.ensuresolution.com`), `PUBLIC_APP_ORIGIN` to the staging origin, and `SESSION_SECRET` to a unique random value of at least 32 characters. Leave `WILDCARD_DNS_READY` and `WILDCARD_TLS_READY` set to `false` until the staging wildcard records and certificate are configured and independently verified.
4. Create the staging owner account interactively. The password input is not echoed:

   ```powershell
   npm --prefix api run owner:create
   ```

5. Start the API and the Vite dev server in separate terminals:

   ```powershell
   npm --prefix api run dev
   npm run dev
   ```

   Vite proxies `/api` to `http://127.0.0.1:4010`. Run the focused API tests with `npm --prefix api test` and make a production frontend build with `npm run build`.

## Plesk staging configuration

1. Create or select a **staging** domain/subscription in Plesk. Do not reuse the production app root or production database.
2. Build the frontend (`npm run build`) and deploy the `Website` tree, including `dist/`, `api/src/`, `api/migrations/`, `api/package.json`, and the API lockfile. Do not deploy `node_modules`, `.env`, or a local SQLite file.
3. In Plesk Node.js settings, select Node.js 20 or newer. Set the application root to the deployed `Website` folder, run `npm install` there for the Vite build only if building on the server, and run `npm --prefix api install --omit=dev` for the API. Set the startup file to `api/src/server.js`. Set the process `HOST`/`PORT` to the values Plesk assigns; `HOST=0.0.0.0` may be required by the Plesk proxy.
4. Configure the following application environment variables in Plesk (never put secrets in Vite variables):

   | Variable | Staging value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `PUBLIC_DOMAIN` | staging base domain only |
   | `PUBLIC_APP_ORIGIN` | `https://<staging-domain>` |
   | `DATABASE_PATH` | absolute path on persistent staging storage, outside the deployed/replaced release directory |
   | `SESSION_SECRET` | unique random secret, at least 32 characters |
   | `WILDCARD_DNS_READY` | `false` until manually verified |
   | `WILDCARD_TLS_READY` | `false` until manually verified |
   | `TRUST_PROXY` | `1` only if exactly one trusted Plesk reverse proxy sits in front of Express; otherwise `0` |
   | `HOST` / `PORT` | Plesk-assigned listener values |

   Keep the SQLite database on persistent storage with restrictive filesystem permissions and include it in the normal encrypted backup policy. Do not share one writable SQLite file across multiple hosts.
5. For staging only, have the DNS/hosting operator configure a wildcard record for `*.<staging-domain>` pointing to the staging vhost, and install a wildcard HTTPS certificate covering both the base and staff wildcard names. Configure the Plesk vhost/reverse proxy so the base site and all one-label staff subdomains reach this same application. Do not enable either readiness flag until the operator has confirmed DNS resolution and certificate coverage from outside the server.
6. Restart the staging Node application. Verify `/health`, a customer page, the owner sign-in, invite acceptance, and staff access at the assigned staging hostname. Confirm an authenticated staff account is denied on another employee's hostname and that a hostname without a valid session receives no protected data.
7. To undo a staging test, stop the app, preserve logs if needed, and restore the staging source/database backup. No production DNS, Plesk settings, or existing website files are changed by these instructions.

## First owner and invitation flow

- Run `npm --prefix api run owner:create` once against the intended database. The script refuses to create a second owner.
- The owner signs in through `/adminlogin`; account type is returned by the API, not selected by the browser.
- In **Domain & Workspace Management**, create the staff name, email, username, and role. The transaction creates the account, one workspace, a hashed single-use invitation, and an audit entry.
- Copy the private invitation link and send it to that employee using the organization's approved channel. It expires after 72 hours. Reissuing it invalidates outstanding invitation tokens.
- The hostname remains setup-pending until the employee accepts and the operator has confirmed wildcard DNS and TLS readiness. Renaming is allowed only before the invitee activates/signs in. Deactivation is terminal; create a fresh account if rehiring.

## API and authorization reference

All mutation requests use same-origin checks when an `Origin` header is present. Team sessions are opaque random tokens; only a SHA-256 token hash is stored in SQLite. Passwords use per-account scrypt salts. Session lookup rechecks account status in the database, and suspension/deactivation deletes active sessions.

| Endpoint | Permission | Purpose |
| --- | --- | --- |
| `GET /health` | Public | Liveness only |
| `POST /api/auth/login` | Public, rate-limited | Authenticate by email or username; server determines role |
| `POST /api/auth/logout` | Signed-in account | Revoke current session |
| `GET /api/auth/session` | Signed-in account | Return server-verified identity |
| `POST /api/auth/change-password` | Signed-in account | Verify current password, update hash, revoke other sessions |
| `POST /api/invitations/accept` | Public, single-use token | Set staff password and activate invited account |
| `GET /api/domain-workspaces` | Owner only | List workspaces and DNS/SSL readiness |
| `POST /api/domain-workspaces` | Owner only | Create account/workspace/invite; requires `Idempotency-Key` |
| `PATCH /api/domain-workspaces/:id` | Owner only | Safely rename a pending hostname or suspend/reactivate/deactivate |
| `POST /api/domain-workspaces/:id/invitation` | Owner only | Reissue a pending invitation and invalidate earlier tokens |
| `GET /api/audit-events` | Owner only | Read internal workspace-administration audit events |
| `GET /api/staff/workspace` | That active staff account | Read its own assigned workspace; mismatched known hostname is denied |
| `GET /api/staff/activity` | That active staff account | Read only its own staff activity |
| `POST /api/staff/activity` | That active staff account | Append a validated event to its own staff activity log |

The module's staff activity table and owner audit table are distinct. Customer activities remain in the existing application and are not exposed through these API routes. Staff activity writes derive actor and workspace IDs from the authenticated session, never from request fields.

## Database changes

`migrations/001_domain_workspaces.sql` creates accounts, workspaces, opaque sessions, expiring invitation hashes, idempotency keys, append-only owner audit events, and append-only staff activity records. Run `npm --prefix api run migrate` before starting after deployment; migrations are versioned and safe to rerun. Back up the SQLite file before any schema changes.

## Operational security notes

- The example domain and readiness flags are configuration, not proof that DNS or HTTPS is actually set up.
- There is no hosting-provider integration and no API key in the browser. Plesk/DNS/certificate work is performed separately by an operator.
- `Host`/subdomain parsing never grants privileges. Every protected request requires the HTTP-only session and database permission checks.
- Use HTTPS in production, a unique `SESSION_SECRET`, persistent private database storage, outbound email through an approved transactional service if invitations should be emailed automatically, and server-side log retention/monitoring.
- Before production rollout, independently review the staging deployment, backup/restore, invitation delivery, domain ownership, wildcard certificate, reverse-proxy trust, and security tests. Obtain explicit approval before changing production DNS or existing production website files.
