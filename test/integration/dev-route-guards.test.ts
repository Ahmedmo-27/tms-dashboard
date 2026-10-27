/**
 * Production guards on the dev-only API routes.
 *
 * src/app/api/test-config and src/app/api/test-login are debugging probes that
 * ship in the production bundle — `next build` lists both. Each is gated on
 * `NODE_ENV !== "production"`, and that one line is the whole protection:
 *
 *   - test-config leaks which env vars are set and the running NODE_ENV,
 *   - test-login forwards arbitrary credentials to the real API and reports
 *     whether they worked, which is a credential-stuffing oracle.
 *
 * Deleting the guard breaks nothing visible, so nothing would catch it. These
 * tests do.
 */
import { describe, expect, it, vi } from "vitest";

/**
 * Swaps NODE_ENV for the duration of a test and re-imports the handler.
 *
 * `vi.stubEnv` is used rather than assigning to process.env directly: Node
 * rejects a non-enumerable descriptor on process.env, and stubEnv also restores
 * the original value even if the test throws. resetModules matters because the
 * handlers read NODE_ENV at call time but are cached per module graph.
 */
async function withNodeEnv<T>(
  value: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  vi.stubEnv("NODE_ENV", value as string);
  vi.resetModules();
  try {
    return await fn();
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
}

describe("GET /api/test-config", () => {
  it("is a 404 in production", async () => {
    await withNodeEnv("production", async () => {
      const { GET } = await import("@/app/api/test-config/route");
      const res = await GET();
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ message: "Not found" });
    });
  });

  it("leaks no env detail in the production response", async () => {
    await withNodeEnv("production", async () => {
      const { GET } = await import("@/app/api/test-config/route");
      const body = await (await GET()).json();
      expect(body).not.toHaveProperty("config");
      expect(JSON.stringify(body)).not.toMatch(/NODE_ENV|hasApiUrl/);
    });
  });

  it("answers in development", async () => {
    await withNodeEnv("development", async () => {
      const { GET } = await import("@/app/api/test-config/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  it("never returns a secret value, only whether one is set", async () => {
    await withNodeEnv("development", async () => {
      const { GET } = await import("@/app/api/test-config/route");
      const body = await (await GET()).json();
      // hasApiUrl is a boolean; the URL itself must not be echoed.
      expect(typeof body.config.hasApiUrl).toBe("boolean");
      expect(JSON.stringify(body)).not.toContain(
        process.env.NEXT_PUBLIC_TMS_API_URL ?? "__unset__"
      );
    });
  });
});

describe("POST /api/test-login", () => {
  const credentials = {
    phoneNumber: "01000000000",
    password: "irrelevant-because-it-must-404",
  };

  const req = () =>
    new Request("https://dash.example.test/api/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

  it("is a 404 in production", async () => {
    await withNodeEnv("production", async () => {
      const { POST } = await import("@/app/api/test-login/route");
      const res = await POST(req());
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ message: "Not found" });
    });
  });

  it("does not call the upstream API at all in production", async () => {
    // The important half: the 404 must happen BEFORE the credentials are
    // forwarded, or the endpoint is still a working login oracle.
    await withNodeEnv("production", async () => {
      vi.doMock("@/lib/tms-api", () => ({
        tms: { post: vi.fn() },
      }));
      const { tms } = await import("@/lib/tms-api");
      const { POST } = await import("@/app/api/test-login/route");

      await POST(req());
      expect(tms.post).not.toHaveBeenCalled();
      vi.doUnmock("@/lib/tms-api");
    });
  });

  it("does not even read the request body in production", async () => {
    await withNodeEnv("production", async () => {
      const { POST } = await import("@/app/api/test-login/route");
      const request = req();
      await POST(request);
      // An unread body leaves the stream unconsumed.
      expect(request.bodyUsed).toBe(false);
    });
  });

  it("strips the token from a successful development response", async () => {
    await withNodeEnv("development", async () => {
      vi.doMock("@/lib/tms-api", () => ({
        tms: {
          post: vi.fn().mockResolvedValue({
            data: {
              data: {
                token: "a-real-session-token-that-must-not-be-echoed",
                user: { name: "Test Person", role: "management" },
              },
            },
          }),
        },
      }));
      const { POST } = await import("@/app/api/test-login/route");

      const res = await POST(req());
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data).not.toHaveProperty("token");
      expect(JSON.stringify(body)).not.toContain(
        "a-real-session-token-that-must-not-be-echoed"
      );
      // The non-secret fields still come through.
      expect(body.data.user.role).toBe("management");
      vi.doUnmock("@/lib/tms-api");
    });
  });

  it("reports an upstream failure without leaking a stack", async () => {
    await withNodeEnv("development", async () => {
      vi.doMock("@/lib/tms-api", () => ({
        tms: {
          post: vi.fn().mockRejectedValue(new Error("upstream refused")),
        },
      }));
      const { POST } = await import("@/app/api/test-login/route");

      const res = await POST(req());
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toBe("upstream refused");
      expect(body.error).not.toHaveProperty("stack");
      vi.doUnmock("@/lib/tms-api");
    });
  });
});

describe("the guard is keyed on the exact string \"production\"", () => {
  // A truthy-ish check such as `if (process.env.NODE_ENV)` would gate the
  // route in every environment; a loose one could miss it. Pin the contract.
  it.each(["development", "test", "staging", "Production", "PRODUCTION", ""])(
    "NODE_ENV=%p does NOT trigger the 404",
    async (value) => {
      await withNodeEnv(value, async () => {
        const { GET } = await import("@/app/api/test-config/route");
        expect((await GET()).status).toBe(200);
      });
    }
  );

  it("NODE_ENV=production triggers the 404", async () => {
    await withNodeEnv("production", async () => {
      const { GET } = await import("@/app/api/test-config/route");
      expect((await GET()).status).toBe(404);
    });
  });
});
