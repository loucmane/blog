import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: "inherit", ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
}

async function waitFor(url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Containers are still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${url} did not become ready`);
}

run("docker", ["compose", "down", "--volumes", "--remove-orphans"]);
try {
  run("docker", ["compose", "up", "--detach", "--wait"]);
  await Promise.all([
    waitFor("http://127.0.0.1:57037/health"),
    waitFor("http://127.0.0.1:57038/health"),
  ]);
  run(process.execPath, ["--test", "tests/persistence.integration.test.mjs"], {
    env: {
      ...process.env,
      TASK37_DATABASE_URL: "postgresql://task37:task37-local-password@127.0.0.1:55437/magazine",
      TASK37_S3_PRIMARY: "http://127.0.0.1:57037",
      TASK37_S3_RESTORE: "http://127.0.0.1:57038",
    },
  });
} finally {
  run("docker", ["compose", "down", "--volumes", "--remove-orphans"]);
}
