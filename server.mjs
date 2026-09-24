import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleNftNewsRequest } from "./server/nft-news.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "dist");
const port = Number(process.env.PORT ?? 3000);
const backend = new URL(process.env.API_ORIGIN ?? "https://back.monvravex.com");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".map": "application/json", ".woff2": "font/woff2" };
const headers = { "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin" };

// Mirrors src/lib/brand.ts: one build serves every mirror domain, so the brand in <title>/Open Graph tags is derived from the Host header.
const ignoredPrefixes = new Set(["www", "back", "app", "api", "m"]);
const countrySecondLevels = new Set(["ac", "co", "com", "edu", "gov", "net", "org"]);
function brandFromHost(host) {
  const parts = String(host ?? "").toLowerCase().split(":")[0].split(".").filter(Boolean);
  if (parts.length < 2 || parts.every((part) => /^\d+$/.test(part))) return null;
  while (parts.length > 2 && ignoredPrefixes.has(parts[0])) parts.shift();
  const last = parts[parts.length - 1];
  const nameIndex = parts.length >= 3 && last.length === 2 && countrySecondLevels.has(parts[parts.length - 2]) ? parts.length - 3 : parts.length - 2;
  const name = parts[Math.max(0, nameIndex)] ?? "";
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : null;
}
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
function renderIndex(host) {
  const indexHtml = readFileSync(join(root, "index.html"), "utf8");
  const brand = brandFromHost(host);
  if (!brand) return indexHtml;
  const name = escapeHtml(brand);
  return indexHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`)
    .replace(/(<meta property="og:site_name" content=")[^"]*"/, `$1${name}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${name}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${name} — платформа для коллекционирования и торговли цифровыми активами"`);
}

function proxy(req, res) {
  const forward = { ...req.headers, host: backend.host };
  const upstream = (backend.protocol === "https:" ? httpsRequest : httpRequest)({ hostname: backend.hostname, port: backend.port || undefined, path: req.url, method: req.method, headers: forward }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on("error", () => { if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json" }); res.end('{"detail":"upstream_unavailable"}'); });
  req.pipe(upstream);
}

function serve(req, res) {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  let file = normalize(join(root, pathname));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) file = join(root, "index.html");
  if (file === join(root, "index.html")) {
    res.writeHead(200, { ...headers, "Content-Type": types[".html"], "Cache-Control": "no-cache" });
    res.end(renderIndex(req.headers.host));
    return;
  }
  const immutable = file.includes(`${join(root, "assets")}`);
  res.writeHead(200, { ...headers, "Content-Type": types[extname(file)] ?? "application/octet-stream", "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache" });
  createReadStream(file).pipe(res);
}

async function news(req, res) {
  const [status, newsHeaders, body] = await handleNftNewsRequest(new URL(req.url ?? "/", "http://x"));
  res.writeHead(status, { ...headers, ...newsHeaders });
  res.end(body);
}

createServer((req, res) => {
  const path = req.url ?? "";
  if (path === "/news/nft" || path.startsWith("/news/nft?")) return void news(req, res);
  return path.startsWith("/api/") ? proxy(req, res) : serve(req, res);
}).listen(port, () => console.log(`listening on ${port}`));
