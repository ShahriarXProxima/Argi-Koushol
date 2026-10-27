import { jsonError } from "./api";
import type { NextResponse } from "next/server";
import type { ApiErrorResponse } from "./api";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store: Map<key, RateLimitRecord>
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    const valid = record.timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

/**
 * Extracts a reliable client identifier (IP address) from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  return "127.0.0.1";
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  endpointPrefix: string;
}

/**
 * Applies a sliding window rate limit to an incoming Request.
 * Returns null if allowed, or a 429 NextResponse if rate limit is exceeded.
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): NextResponse<ApiErrorResponse> | null {
  const ip = getClientIp(request);
  const key = `${options.endpointPrefix}:${ip}`;
  const now = Date.now();

  cleanupStaleEntries(options.windowMs);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Retain only timestamps within the sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < options.windowMs);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));

    const response = jsonError(
      "RATE_LIMIT_EXCEEDED",
      `Too many requests to ${options.endpointPrefix}. Please wait ${retryAfterSec} seconds before trying again.`,
      429,
      { retryAfterSec }
    );

    response.headers.set("Retry-After", String(retryAfterSec));
    response.headers.set("X-RateLimit-Limit", String(options.limit));
    response.headers.set("X-RateLimit-Remaining", "0");
    return response;
  }

  // Record this request
  record.timestamps.push(now);
  return null;
}
