/**
 * Production build: всегда NODE_ENV=production (даже если в .env NODE_ENV=development).
 * next build --webpack — стабильнее на VPS (Turbopack + симлинки / global-error).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env") });

process.env.NODE_ENV = "production";

function run(label, command, args) {
  console.log(`[build-prod] ${label}`);
  const r = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

run("prisma generate", "npx", ["prisma", "generate"]);
run("next build --webpack", "npx", ["next", "build", "--webpack"]);
