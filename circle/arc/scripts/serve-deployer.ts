import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { handleArcInvoiceApi } from "./arcinvoice-api.js";
import "./demo-checklist.js";

const root = process.cwd();
const port = Number(process.env.PORT ?? "4173");

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function resolvePath(urlPath: string): string {
  const safePath = decodeURIComponent(urlPath.split("?")[0] ?? "/").replace(/^\/+/, "");
  let requested = safePath === "" ? "circle/arc/public/arc-invoice.html" : safePath;
  if (requested.startsWith("public/")) {
    requested = path.join("circle", "arc", requested);
  }

  const resolved = path.resolve(root, requested);
  if (!resolved.startsWith(root)) {
    throw new Error("Invalid path");
  }
  return resolved;
}

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function proxyExternalApi(req: IncomingMessage, res: ServerResponse, prefix: string, baseUrl: string): Promise<void> {
  const incomingUrl = new URL(req.url ?? "/", `http://localhost:${port}`);
  const targetPath = incomingUrl.pathname.replace(new RegExp(`^${prefix}`), "");
  const targetUrl = new URL(targetPath + incomingUrl.search, baseUrl);
  const body = await readRequestBody(req);
  const requestBody = body.length > 0 ? new Blob([new Uint8Array(body)]) : undefined;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      Authorization: req.headers.authorization ?? "",
      "Content-Type": req.headers["content-type"] ?? "application/json",
      Accept: "application/json",
    },
    body: requestBody,
  });

  const responseBody = Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status, {
    "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(responseBody);
}

const server = createServer((req, res) => {
  try {
    if ((req.url ?? "").startsWith("/api/arcinvoice")) {
      void handleArcInvoiceApi(req, res).catch((error) => {
        res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "ArcInvoice API failed" }));
      });
      return;
    }

    if ((req.url ?? "").startsWith("/circle-api/")) {
      void proxyExternalApi(req, res, "/circle-api", "https://api.circle.com").catch((error) => {
        res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Proxy failed" }));
      });
      return;
    }

    if ((req.url ?? "").startsWith("/circle-iris-sandbox/")) {
      void proxyExternalApi(req, res, "/circle-iris-sandbox", "https://iris-api-sandbox.circle.com").catch((error) => {
        res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Proxy failed" }));
      });
      return;
    }

    if ((req.url ?? "").startsWith("/circle-iris/")) {
      void proxyExternalApi(req, res, "/circle-iris", "https://iris-api.circle.com").catch((error) => {
        res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Proxy failed" }));
      });
      return;
    }

    if ((req.url ?? "").startsWith("/circle-gateway-testnet/")) {
      void proxyExternalApi(req, res, "/circle-gateway-testnet", "https://gateway-api-testnet.circle.com").catch((error) => {
        res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Proxy failed" }));
      });
      return;
    }

    if ((req.url ?? "").startsWith("/circle-gateway/")) {
      void proxyExternalApi(req, res, "/circle-gateway", "https://gateway-api.circle.com").catch((error) => {
        res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Proxy failed" }));
      });
      return;
    }

    const filePath = resolvePath(req.url ?? "/");
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(filePath).pipe(res);
  } catch (error) {
    res.writeHead(400);
    res.end(error instanceof Error ? error.message : "Bad request");
  }
});

server.listen(port, () => {
  console.log(`Deployer ready at http://localhost:${port}`);
});
