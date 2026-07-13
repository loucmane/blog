import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");
const entries = fs.readFileSync(path.join(fixtureRoot, "SHA256SUMS"), "utf8").trim().split("\n");

for (const entry of entries) {
  const match = entry.match(/^([0-9a-f]{64})  ([^/]+)$/);
  if (!match) throw new Error(`invalid checksum entry: ${entry}`);
  const [, expected, filename] = match;
  const actual = createHash("sha256").update(fs.readFileSync(path.join(fixtureRoot, filename))).digest("hex");
  if (actual !== expected) throw new Error(`${filename} checksum mismatch`);
}

console.log(`verified ${entries.length} committed synthetic fixture checksum`);
