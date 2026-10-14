import "dotenv/config";
import { scryptSync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import { openDatabase } from "../src/database.js";
import { createId } from "../src/security.js";

function ask(question) {
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => reader.question(question, (answer) => {
    reader.close();
    resolve(answer.trim());
  }));
}

function askHidden(question) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Owner creation requires an interactive terminal so the password is not echoed.");
  }
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    let password = "";
    process.stdout.write(question);
    input.setRawMode(true);
    input.resume();
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          input.setRawMode(false);
          input.off("data", onData);
          reject(new Error("Owner creation cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          input.setRawMode(false);
          input.off("data", onData);
          process.stdout.write("\n");
          resolve(password);
          return;
        }
        if (character === "\u007f" || character === "\b") password = password.slice(0, -1);
        else if (character >= " ") password += character;
      }
    };
    input.on("data", onData);
  });
}

const email = (await ask("Owner email: ")).toLowerCase();
const name = await ask("Owner display name: ");
const password = await askHidden("Owner password (minimum 12 characters): ");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || password.length < 12 || password.length > 256) {
  throw new Error("Enter a valid email, display name, and password from 12 to 256 characters.");
}

const salt = randomBytes(16).toString("hex");
const digest = scryptSync(password, salt, 64).toString("hex");
const timestamp = new Date().toISOString();
const db = await openDatabase();
try {
  const exists = db.prepare("SELECT 1 FROM accounts WHERE account_role = 'owner' LIMIT 1").get();
  if (exists) throw new Error("An owner account already exists. Use the owner dashboard to manage staff.");
  db.prepare(`
    INSERT INTO accounts
      (id, email, username, display_name, account_role, workspace_role, status, password_hash, created_at, updated_at)
    VALUES (?, ?, 'owner', ?, 'owner', 'owner', 'active', ?, ?, ?)
  `).run(createId(), email, name, `scrypt$${salt}$${digest}`, timestamp, timestamp);
  console.log("Owner account created. Sign in at /adminlogin.");
} finally {
  db.close();
}
