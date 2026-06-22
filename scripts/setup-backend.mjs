#!/usr/bin/env node
/**
 * One-click backend setup for remixed projects.
 *
 * Use only when Lovable's automatic remix failed to copy the backend
 * (database schema + edge functions) into the new project.
 *
 * Usage:
 *   SUPABASE_DB_URL=postgresql://... \
 *   SUPABASE_ACCESS_TOKEN=sbp_... \
 *   SUPABASE_PROJECT_REF=xxxxxxxx \
 *   node scripts/setup-backend.mjs
 *
 * Or run with no env vars and it will prompt.
 *
 * Requires: Node 18+. Supabase CLI is invoked via `npx -y supabase@latest`.
 */

import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const FUNCTIONS_DIR = join(ROOT, "supabase", "functions");
const SECRETS_CHECKLIST = join(__dirname, "secrets-checklist.json");

const c = {
  reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", cyan: "\x1b[36m",
};
const log = (m) => console.log(m);
const ok = (m) => log(`${c.green}OK${c.reset}  ${m}`);
const warn = (m) => log(`${c.yellow}WARN${c.reset}  ${m}`);
const err = (m) => log(`${c.red}FAIL${c.reset}  ${m}`);
const step = (m) => log(`\n${c.bold}${c.cyan}> ${m}${c.reset}`);

async function prompt(q, { secret = false } = {}) {
  const rl = createInterface({ input, output, terminal: true });
  if (secret) {
    // Best-effort: hide echo on TTYs
    process.stdout.write(q);
    rl.close();
    return await new Promise((res) => {
      const onData = (b) => {
        const s = b.toString("utf8");
        if (s === "\n" || s === "\r" || s === "\r\n") {
          process.stdin.removeListener("data", onData);
          process.stdin.pause();
          process.stdout.write("\n");
          res(buf.trim());
        } else if (s === "\u0003") {
          process.exit(1);
        } else {
          buf += s;
        }
      };
      let buf = "";
      process.stdin.resume();
      process.stdin.on("data", onData);
    });
  }
  const answer = await rl.question(q);
  rl.close();
  return answer.trim();
}

async function getConfig() {
  let dbUrl = process.env.SUPABASE_DB_URL;
  let accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  let projectRef = process.env.SUPABASE_PROJECT_REF;

  if (!dbUrl) dbUrl = await prompt("Target SUPABASE_DB_URL (postgresql://...): ");
  if (!projectRef) projectRef = await prompt("Target SUPABASE_PROJECT_REF (the project id): ");
  if (!accessToken) accessToken = await prompt("Target SUPABASE_ACCESS_TOKEN (sbp_...): ", { secret: true });

  if (!dbUrl || !projectRef || !accessToken) {
    err("Missing required values. Aborting.");
    process.exit(1);
  }
  return { dbUrl, accessToken, projectRef };
}

function hasPsql() {
  const r = spawnSync("psql", ["--version"], { stdio: "ignore" });
  return r.status === 0;
}

function runPsql(dbUrl, sql) {
  return spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
}

function runPsqlFile(dbUrl, file) {
  return spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", file], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
}

function ensureMigrationsTable(dbUrl) {
  const sql = `
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      statements text[],
      name text
    );
  `;
  const r = runPsql(dbUrl, sql);
  if (r.status !== 0) {
    err("Could not create migrations tracking table.");
    log(r.stderr || r.stdout);
    process.exit(1);
  }
}

function appliedVersions(dbUrl) {
  const r = spawnSync(
    "psql",
    [dbUrl, "-At", "-c", "SELECT version FROM supabase_migrations.schema_migrations"],
    { encoding: "utf8" }
  );
  if (r.status !== 0) return new Set();
  return new Set(r.stdout.split("\n").map((s) => s.trim()).filter(Boolean));
}

function migrationVersion(filename) {
  // 20260206134237_... -> 20260206134237
  return filename.split("_")[0];
}

function applyMigrations(dbUrl) {
  step("Applying database migrations");
  if (!existsSync(MIGRATIONS_DIR)) {
    warn("No supabase/migrations folder found. Skipping.");
    return;
  }
  if (!hasPsql()) {
    err("psql is not installed. Install PostgreSQL client tools and retry.");
    process.exit(1);
  }
  ensureMigrationsTable(dbUrl);
  const already = appliedVersions(dbUrl);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let applied = 0, skipped = 0, failed = 0;
  for (const f of files) {
    const version = migrationVersion(f);
    if (already.has(version)) {
      skipped++;
      continue;
    }
    const full = join(MIGRATIONS_DIR, f);
    process.stdout.write(`  applying ${f} ... `);
    const r = runPsqlFile(dbUrl, full);
    if (r.status !== 0) {
      console.log(`${c.red}FAIL${c.reset}`);
      log(r.stderr || r.stdout);
      failed++;
      err(`Migration ${f} failed. Fix the issue and re-run this script (already applied migrations will be skipped).`);
      process.exit(1);
    }
    // Record version
    const rec = runPsql(
      dbUrl,
      `INSERT INTO supabase_migrations.schema_migrations(version, name) VALUES ('${version}', '${f.replace(/'/g, "''")}') ON CONFLICT (version) DO NOTHING`
    );
    if (rec.status !== 0) {
      warn(`Applied ${f} but could not record version. Continuing.`);
    }
    console.log(`${c.green}OK${c.reset}`);
    applied++;
  }
  ok(`Migrations: ${applied} applied, ${skipped} already present, ${failed} failed.`);
}

function deployFunctions({ projectRef, accessToken }) {
  step("Deploying edge functions");
  if (!existsSync(FUNCTIONS_DIR)) {
    warn("No supabase/functions folder. Skipping.");
    return;
  }
  const fns = readdirSync(FUNCTIONS_DIR).filter((name) => {
    const p = join(FUNCTIONS_DIR, name);
    return statSync(p).isDirectory() && existsSync(join(p, "index.ts"));
  });
  if (fns.length === 0) {
    warn("No edge functions found.");
    return;
  }

  let deployed = 0, failed = 0;
  for (const name of fns) {
    process.stdout.write(`  deploying ${name} ... `);
    const r = spawnSync(
      "npx",
      ["-y", "supabase@latest", "functions", "deploy", name, "--project-ref", projectRef, "--no-verify-jwt"],
      {
        cwd: ROOT,
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
        encoding: "utf8",
      }
    );
    if (r.status !== 0) {
      console.log(`${c.red}FAIL${c.reset}`);
      log(r.stderr || r.stdout);
      failed++;
    } else {
      console.log(`${c.green}OK${c.reset}`);
      deployed++;
    }
  }
  ok(`Edge functions: ${deployed} deployed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

function printSecretsChecklist() {
  step("Secrets checklist");
  if (!existsSync(SECRETS_CHECKLIST)) {
    warn("secrets-checklist.json not found. Skipping.");
    return;
  }
  const list = JSON.parse(readFileSync(SECRETS_CHECKLIST, "utf8"));
  log("Add these to the remixed project (Project Settings > Secrets, or via the Lovable Cloud UI):");
  for (const s of list.required) {
    log(`  - ${c.bold}${s.name}${c.reset}  ${c.dim}${s.where}${c.reset}`);
  }
  if (list.connectors?.length) {
    log("\nConnector-managed (reconnect via the Connectors panel):");
    for (const s of list.connectors) {
      log(`  - ${c.bold}${s.name}${c.reset}  ${c.dim}${s.where}${c.reset}`);
    }
  }
  if (list.autoProvisioned?.length) {
    log(`\n${c.dim}Auto-provisioned by Lovable Cloud (do NOT add manually): ${list.autoProvisioned.map(s => s.name).join(", ")}${c.reset}`);
  }
}

async function main() {
  log(`${c.bold}Lovable Cloud backend recovery${c.reset}`);
  log(`${c.dim}Recreates this project's schema + edge functions in a remixed project.${c.reset}`);

  const cfg = await getConfig();
  applyMigrations(cfg.dbUrl);
  deployFunctions(cfg);
  printSecretsChecklist();

  log(`\n${c.green}${c.bold}Done.${c.reset} Reload the remixed project preview.`);
}

main().catch((e) => {
  err(e?.stack || String(e));
  process.exit(1);
});
