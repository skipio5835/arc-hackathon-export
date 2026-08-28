import type { IncomingMessage, ServerResponse } from "node:http";

type RequestWithQuery = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
};

export type ProxyRule = {
  method: "GET" | "POST";
  path: RegExp;
  query: readonly string[];
  authorization?: "required" | "forbidden";
};

const allowedMethods = new Set(["GET", "POST", "OPTIONS"]);
const maxRequestBytes = 100_000;
const maxResponseBytes = 2_000_000;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function requestIsSameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function safePath(value: string): string | null {
  const segments = value.split("/").filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => !/^[A-Za-z0-9._~:@-]+$/.test(segment))) {
    return null;
  }
  return segments.join("/");
}

async function readBody(request: IncomingMessage): Promise<Uint8Array | undefined> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += value.length;
    if (size > maxRequestBytes) throw new Error("Request body is too large.");
    chunks.push(value);
  }

  return size > 0 ? Buffer.concat(chunks) : undefined;
}

function matchingRule(method: string, path: string, rules: readonly ProxyRule[]): ProxyRule | undefined {
  return rules.find((rule) => rule.method === method && rule.path.test(path));
}

function hasOnlyAllowedQuery(request: RequestWithQuery, allowed: readonly string[]): boolean {
  const allowedKeys = new Set(["path", ...allowed]);
  return Object.entries(request.query ?? {}).every(([key, value]) => {
    const entries = Array.isArray(value) ? value : [value];
    return allowedKeys.has(key) && entries.length <= 2 && entries.every((entry) => !entry || entry.length <= 512);
  });
}

function validAuthorization(value: string | undefined, requirement: ProxyRule["authorization"]): boolean {
  if (requirement === "forbidden") return !value;
  if (requirement === "required") return Boolean(value && /^Bearer [A-Za-z0-9:_-]{12,512}$/.test(value));
  return !value || value.length <= 520;
}

function pathFromRequest(request: RequestWithQuery, sourcePrefix: string, apiPrefix: string): string {
  const queryPath = first(request.query?.path);
  if (queryPath) return queryPath;

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  for (const prefix of [sourcePrefix, apiPrefix]) {
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length + 1);
  }
  return "";
}

export function createCircleProxy(baseUrl: string, sourcePrefix: string, apiPrefix: string, rules: readonly ProxyRule[]) {
  return async function circleProxy(request: RequestWithQuery, response: ServerResponse): Promise<void> {
    if (request.method === "OPTIONS") {
      response.writeHead(204, { Allow: "GET, POST, OPTIONS" });
      response.end();
      return;
    }

    if (!request.method || !allowedMethods.has(request.method)) {
      response.writeHead(405, { Allow: "GET, POST, OPTIONS" });
      response.end("Method not allowed");
      return;
    }

    if (!requestIsSameOrigin(request)) {
      response.writeHead(403);
      response.end("Same-origin requests only");
      return;
    }

    const path = safePath(pathFromRequest(request, sourcePrefix, apiPrefix));
    if (!path) {
      response.writeHead(400);
      response.end("Invalid Circle API path");
      return;
    }

    const rule = matchingRule(request.method, path, rules);
    if (!rule || !hasOnlyAllowedQuery(request, rule.query)) {
      response.writeHead(404, { "cache-control": "no-store" });
      response.end("Circle API route not allowed");
      return;
    }

    if (!validAuthorization(request.headers.authorization, rule.authorization)) {
      response.writeHead(401, { "cache-control": "no-store" });
      response.end("Valid authorization required");
      return;
    }

    try {
      const target = new URL(path, `${baseUrl}/`);
      for (const [key, value] of Object.entries(request.query ?? {})) {
        if (key === "path") continue;
        for (const entry of Array.isArray(value) ? value : [value]) {
          if (entry) target.searchParams.append(key, entry);
        }
      }

      const body = request.method === "GET" ? undefined : await readBody(request);
      const upstream = await fetch(target, {
        method: request.method,
        headers: {
          Accept: "application/json",
          ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}),
          "Content-Type": request.headers["content-type"] ?? "application/json",
          ...(first(request.headers["x-user-agent"]) ? { "X-User-Agent": first(request.headers["x-user-agent"]) } : {}),
        },
        body: body ? new Uint8Array(body) : undefined,
        signal: AbortSignal.timeout(35_000),
      });

      const payload = Buffer.from(await upstream.arrayBuffer());
      if (payload.length > maxResponseBytes) throw new Error("Circle response is too large.");
      response.writeHead(upstream.status, {
        "cache-control": "no-store",
        "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
      });
      response.end(payload);
    } catch (error) {
      console.error("Circle proxy request failed", error instanceof Error ? error.name : "UnknownError");
      response.writeHead(502, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Circle proxy request failed" }));
    }
  };
}

export const config = { api: { bodyParser: false } };
