import { test, describe } from "node:test";
import assert from "node:assert/strict";

(process.env as Record<string, string | undefined>).NODE_ENV = "test";

// Mock server-only for Node.js test environment
require.cache[require.resolve("server-only")] = {
  id: require.resolve("server-only"),
  filename: require.resolve("server-only"),
  loaded: true,
  exports: {},
} as unknown as NodeModule;

import { checkRateLimit } from "../src/lib/rate-limit";

describe("Security & Quality Verification", () => {
  describe("Rate Limiter", () => {
    test("allows requests under the limit and blocks requests over the limit", () => {
      const mockRequest = new Request("http://localhost:3000/api/chat", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      });

      const options = {
        endpointPrefix: "/test-chat",
        limit: 3,
        windowMs: 60 * 1000,
      };

      // First 3 requests must succeed
      assert.equal(checkRateLimit(mockRequest, options), null);
      assert.equal(checkRateLimit(mockRequest, options), null);
      assert.equal(checkRateLimit(mockRequest, options), null);

      // 4th request must be rate limited (HTTP 429)
      const blocked = checkRateLimit(mockRequest, options);
      assert.notEqual(blocked, null);
      assert.equal(blocked?.status, 429);
    });

    test("differentiates different IP addresses", () => {
      const reqA = new Request("http://localhost:3000/api/detect", {
        headers: { "x-forwarded-for": "10.0.0.1" },
      });
      const reqB = new Request("http://localhost:3000/api/detect", {
        headers: { "x-forwarded-for": "10.0.0.2" },
      });

      const options = {
        endpointPrefix: "/test-ip-diff",
        limit: 1,
        windowMs: 60 * 1000,
      };

      assert.equal(checkRateLimit(reqA, options), null);
      // reqA second attempt is blocked
      assert.equal(checkRateLimit(reqA, options)?.status, 429);
      // reqB first attempt is allowed
      assert.equal(checkRateLimit(reqB, options), null);
    });
  });

  describe("API Key Authentication Check", () => {
    test("rejects write request to /api/decide without x-api-key", async () => {
      const { POST } = await import("../src/app/api/decide/route");
      const req = new Request("http://localhost:3000/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: "test-field" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error?.code, "UNAUTHORIZED");
    });

    test("rejects write request to /api/sensors without x-api-key", async () => {
      const { POST } = await import("../src/app/api/sensors/route");
      const req = new Request("http://localhost:3000/api/sensors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: "test-field", soilMoisture: 30, temperature: 25, humidity: 60 }),
      });

      const res = await POST(req);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error?.code, "UNAUTHORIZED");
    });
  });

  describe("Upload Validation on /api/detect", () => {
    test("rejects files with invalid MIME types", async () => {
      const { POST } = await import("../src/app/api/detect/route");
      const formData = new FormData();
      formData.append("fieldId", "test-field");
      const fakeFile = new File(["dummy script content"], "malicious.js", { type: "text/javascript" });
      formData.append("file", fakeFile);

      const req = new Request("http://localhost:3000/api/detect", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      assert.equal(res.status, 415);
      const data = await res.json();
      assert.equal(data.error?.code, "UNSUPPORTED_MEDIA_TYPE");
    });

    test("rejects files exceeding 5MB size limit", async () => {
      const { POST } = await import("../src/app/api/detect/route");
      const formData = new FormData();
      formData.append("fieldId", "test-field");
      // 6MB buffer
      const largeBuffer = new Uint8Array(6 * 1024 * 1024);
      const largeFile = new File([largeBuffer], "huge-leaf.jpg", { type: "image/jpeg" });
      formData.append("file", largeFile);

      const req = new Request("http://localhost:3000/api/detect", {
        method: "POST",
        body: formData,
      });

      const res = await POST(req);
      assert.equal(res.status, 413);
      const data = await res.json();
      assert.equal(data.error?.code, "PAYLOAD_TOO_LARGE");
    });
  });

  describe("MCP Server Bearer Token Authentication", () => {
    test("rejects request without Authorization header with 401", async () => {
      const { authMiddleware } = await import("../mcp-server/index");
      process.env.MCP_TOKEN = "test-secret-token";

      let responseStatus = 0;
      let responseBody: unknown = null;
      let nextCalled = false;

      const mockReq = {
        headers: {},
      } as unknown as import("express").Request;

      const mockRes = {
        status(code: number) {
          responseStatus = code;
          return this;
        },
        json(body: unknown) {
          responseBody = body;
          return this;
        },
      } as unknown as import("express").Response;

      const mockNext = () => {
        nextCalled = true;
      };

      authMiddleware(mockReq, mockRes, mockNext);

      assert.equal(responseStatus, 401);
      assert.equal(nextCalled, false);
      assert.match(
        (responseBody as { error: { message: string } }).error.message,
        /Missing or invalid Bearer token/
      );
    });

    test("rejects request with wrong Bearer token with 401", async () => {
      const { authMiddleware } = await import("../mcp-server/index");
      process.env.MCP_TOKEN = "test-secret-token";

      let responseStatus = 0;
      let nextCalled = false;

      const mockReq = {
        headers: { authorization: "Bearer invalid-token-xyz" },
      } as unknown as import("express").Request;

      const mockRes = {
        status(code: number) {
          responseStatus = code;
          return this;
        },
        json() {
          return this;
        },
      } as unknown as import("express").Response;

      authMiddleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.equal(responseStatus, 401);
      assert.equal(nextCalled, false);
    });

    test("allows request with valid Bearer token", async () => {
      const { authMiddleware } = await import("../mcp-server/index");
      process.env.MCP_TOKEN = "test-secret-token";

      let nextCalled = false;

      const mockReq = {
        headers: { authorization: "Bearer test-secret-token" },
      } as unknown as import("express").Request;

      const mockRes = {} as unknown as import("express").Response;

      authMiddleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });
});
