import type { IncomingMessage, ServerResponse } from "node:http";

type RequestWithQuery = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
};

const allowedMethods = new Set(["GET", "POST", "OPTIONS"]);

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
    if (size > 1_000_000) throw new Error("Request body is too large.");
    chunks.push(value);
  }

  return size > 0 ? Buffer.concat(chunks) : undefined;
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

export function createCircleProxy(baseUrl: string, sourcePrefix: string, apiPrefix: string) {
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
          Authorization: request.headers.authorization ?? "",
          "Content-Type": request.headers["content-type"] ?? "application/json",
        },
        body: body ? new Uint8Array(body) : undefined,
      });

      const payload = Buffer.from(await upstream.arrayBuffer());
      response.writeHead(upstream.status, {
        "cache-control": "no-store",
        "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
      });
      response.end(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Circle proxy request failed";
      response.writeHead(502, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: message }));
    }
  };
}

export const config = { api: { bodyParser: false } };
