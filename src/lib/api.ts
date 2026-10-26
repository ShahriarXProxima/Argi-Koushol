import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Returns a standardized JSON success response
 */
export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Returns a standardized JSON error response
 */
export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

/**
 * Converts Zod validation errors to standardized API error response
 */
export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  const issues = error.issues.map((e) => ({
    field: e.path.join("."),
    message: e.message,
    code: e.code,
  }));
  return jsonError(
    "VALIDATION_ERROR",
    "Invalid request parameters or payload format.",
    422,
    issues
  );
}

/**
 * Verifies that the request contains the valid internal x-api-key header
 */
export function verifyApiKey(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key");
  const configuredKey = process.env.INGEST_API_KEY;

  if (!configuredKey) {
    console.warn("INGEST_API_KEY is not configured in environment variables.");
    return false;
  }

  return apiKey === configuredKey;
}

/**
 * Middleware-like check to require internal API key or return an error response
 */
export function requireApiKey(request: Request): NextResponse<ApiErrorResponse> | null {
  if (!verifyApiKey(request)) {
    return jsonError(
      "UNAUTHORIZED",
      "Missing or invalid x-api-key header.",
      401
    );
  }
  return null;
}
