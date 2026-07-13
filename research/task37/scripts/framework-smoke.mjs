import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 43037;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "framework-app", "--port", String(port)], {
  cwd: root,
  env: { ...process.env, NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
server.stdout.on("data", (chunk) => { output += chunk; });
server.stderr.on("data", (chunk) => { output += chunk; });

async function request(pathname, init) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${pathname}`, init);
      if (response.ok) return response;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next server did not serve ${pathname}\n${output}`);
}

try {
  const article = await (await request("/article/portable-editorial-story")).text();
  if (!article.includes("A Portable Editorial Story") || !article.includes("data-editorial-node=\"gallery\"")) {
    throw new Error("server-rendered article is incomplete");
  }
  const preview = await (await request("/admin/preview", { headers: { cookie: "task37-preview=enabled" } })).text();
  if (!preview.includes("Private preview enabled")) throw new Error("private preview cookie was not honored");
  const health = await (await request("/api/health")).json();
  if (health.status !== "ok" || health.portability !== "node-server") throw new Error("health response mismatch");
  console.log("portable Node server smoke passed");
} finally {
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}
