import { describe, it, expect } from "vitest";
import { GET } from "../app/health/route";

describe("GET /health", () => {
  it('returns 200 with body "ok\\n" and text/plain content type', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok\n");
    expect(res.headers.get("content-type")).toContain("text/plain");
  });
});