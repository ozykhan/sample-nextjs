import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const SERVER = ".next/standalone/server.js";
const RUN = existsSync(SERVER);
const PORT = RUN ? 4321 + Math.floor(Math.random() * 1000) : 0;
const base = `http://localhost:${PORT}`;
let proc: ReturnType<typeof spawn> | undefined;

async function waitFor(port: number, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://localhost:${port}/health`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`server on ${port} did not become healthy`);
}

beforeAll(async () => {
  if (!RUN) return;
  proc = spawn("node", [SERVER], {
    env: { ...process.env, PORT: String(PORT), HOSTNAME: "0.0.0.0" },
    stdio: "ignore",
  });
  await waitFor(PORT);
}, 30000);

afterAll(() => {
  if (proc) proc.kill("SIGTERM");
});

describe.runIf(RUN)("integration against standalone server", () => {
  it("home renders SSR with title + version footer", async () => {
    const r = await fetch(`${base}/`);
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain("Hello from sample-app");
    expect(html).toContain("sample-app v");
  });
});