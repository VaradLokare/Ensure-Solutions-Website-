import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { openDatabase } from "./database.js";
import { normalizeDomain } from "./workspacePolicy.js";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = process.env;
if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be set to at least 32 characters before starting the API.");
}
normalizeDomain(env.PUBLIC_DOMAIN ?? "ensuresolution.com");

const db = await openDatabase();
const configuredWebRoot = env.WEB_ROOT
  ? path.resolve(process.cwd(), env.WEB_ROOT)
  : path.resolve(apiRoot, "..", "dist");
const webRoot = fs.existsSync(path.join(configuredWebRoot, "index.html")) ? configuredWebRoot : undefined;
const app = createApp({ db, env, webRoot });
const port = Number.parseInt(env.PORT ?? "4010", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

const server = app.listen(port, env.HOST ?? "127.0.0.1", () => {
  console.log(`EnsureSolution workspace API listening on ${env.HOST ?? "127.0.0.1"}:${port}`);
  if (!webRoot) console.log("No production frontend build found; serve the Vite app separately in development.");
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
