import { afterEach, describe, expect, it, vi } from "vitest";

const payload = {
  summary: "Invoices are reviewed manually.",
  inefficiencies: ["Manual checking takes time."],
  suggestions: [
    {
      title: "Automate validation",
      description: "Use rules to catch common errors.",
      complexity: "low",
      priority: "high",
    },
  ],
};

async function loadClient() {
  vi.resetModules();
  vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
  return import("./client");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("analyseProcess API client", () => {
  it("returns a validated structured response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));
    const { analyseProcess } = await loadClient();

    await expect(analyseProcess("Review invoices")).resolves.toEqual(payload);
  });

  it("rejects malformed successful responses at runtime", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ summary: "missing fields" }))));
    const { analyseProcess } = await loadClient();

    await expect(analyseProcess("Review invoices")).rejects.toThrow("invalid response");
  });

  it("maps server throttling to a helpful message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 429 })));
    const { analyseProcess } = await loadClient();

    await expect(analyseProcess("Review invoices")).rejects.toThrow("Too many requests");
  });

  it("reports a missing API URL as an actionable configuration error", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "");
    const { analyseProcess } = await import("./client");

    await expect(analyseProcess("Review invoices")).rejects.toThrow("VITE_API_BASE_URL");
  });

  it("forwards an abort signal to cancel the request", async () => {
    const fetchMock = vi.fn((_url: string, options: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { analyseProcess } = await loadClient();
    const controller = new AbortController();
    const request = analyseProcess("Review invoices", controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });
});
