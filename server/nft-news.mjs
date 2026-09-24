// NFT news aggregator: reads public RSS feeds, keeps only NFT-related items and caches the result.
// Shared by server.mjs, the Vercel function (api/news-nft.js) and the Vite dev server.

const SOURCES = [
  { id: "nftculture", name: "NFT Culture", url: "https://www.nftculture.com/feed/", lang: "en", allNft: true },
  { id: "nftevening", name: "NFT Evening", url: "https://nftevening.com/feed/", lang: "en" },
  { id: "cointelegraph", name: "Cointelegraph", url: "https://cointelegraph.com/rss/tag/nft", lang: "en" },
  { id: "nftplazas", name: "NFT Plazas", url: "https://nftplazas.com/feed/", lang: "en" },
  { id: "cryptonews", name: "Crypto News", url: "https://crypto.news/tag/nft/feed/", lang: "en" },
  { id: "cryptoslate", name: "CryptoSlate", url: "https://cryptoslate.com/tag/nft/feed/", lang: "en" },
  { id: "forklog", name: "ForkLog", url: "https://forklog.com/feed/", lang: "ru" },
  { id: "bits", name: "Bits.media", url: "https://bits.media/rss2/", lang: "ru" },
  { id: "incrypted", name: "Incrypted", url: "https://incrypted.com/feed/", lang: "ru" },
  { id: "coinspot", name: "CoinSpot", url: "https://coinspot.io/feed/", lang: "ru" },
  { id: "beincrypto-ru", name: "BeInCrypto", url: "https://ru.beincrypto.com/feed/", lang: "ru" }
];

const NFT_PATTERN = /\bNFTs?\b|\bНФТ\b|non-fungible|невзаимозаменяем|opensea|magic eden|cryptopunks?|bored ape|pudgy|azuki|ordinals|digital collectibles?|цифров\S* коллекци|generative art|ERC-?721|ERC-?1155/i;
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const CACHE_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const MAX_FEED_BYTES = 2_500_000;

const cache = new Map();

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", laquo: "«", raquo: "»", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };

export function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => safeChar(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => safeChar(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function safeChar(code) {
  try { return String.fromCodePoint(code); } catch { return ""; }
}

function unwrap(value) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

export function stripHtml(value) {
  return decodeEntities(unwrap(value).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function tag(item, name) {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return match ? match[1] : "";
}

function attr(item, name, attribute) {
  const match = item.match(new RegExp(`<${name}\\b[^>]*\\b${attribute}="([^"]+)"`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function httpUrl(value, { httpsOnly = false } = {}) {
  try {
    const url = new URL(decodeEntities(value.trim()));
    if (url.protocol === "https:" || (!httpsOnly && url.protocol === "http:")) return url.toString();
  } catch { /* not a URL */ }
  return "";
}

function truncate(value, max) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40))}…`;
}

/** Parses an RSS 2.0 document into plain items. Exported for tests. */
export function parseRss(xml, source) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => {
    const item = match[1];
    const title = stripHtml(tag(item, "title"));
    const rawDescription = tag(item, "description") || tag(item, "content:encoded");
    const summary = stripHtml(rawDescription).replace(/\s*The post .*? appeared first on .*$/i, "");
    const published = new Date(stripHtml(tag(item, "pubDate")) || stripHtml(tag(item, "dc:date")));
    const image = httpUrl(attr(item, "media:content", "url") || attr(item, "media:thumbnail", "url") || (/image/i.test(attr(item, "enclosure", "type")) ? attr(item, "enclosure", "url") : "") || (unwrap(rawDescription + tag(item, "content:encoded")).match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? ""), { httpsOnly: true });
    return {
      title,
      summary: truncate(summary, 240),
      url: httpUrl(tag(item, "link") ? unwrap(tag(item, "link")) : attr(item, "link", "href")),
      image,
      source: source.name,
      lang: source.lang,
      published: Number.isNaN(published.getTime()) ? "" : published.toISOString()
    };
  }).filter((item) => item.title && item.url && item.published);
}

/** True when an item is about NFTs. Feeds that only cover NFTs are trusted as a whole. */
export function isNftItem(item, source) {
  return source.allNft === true || NFT_PATTERN.test(`${item.title} ${item.summary}`);
}

async function fetchFeed(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(source.url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; NftNewsBot/1.0)", Accept: "application/rss+xml, application/xml, text/xml" }, redirect: "follow" });
    if (!response.ok) return [];
    const text = (await response.text()).slice(0, MAX_FEED_BYTES);
    return parseRss(text, source).filter((item) => isNftItem(item, source));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url.replace(/[?#].*$/, "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * NFT news for a language: items in that language first; English items top up the list when there are too few.
 * Results are cached for 15 minutes and stale data is served if every source fails.
 */
export async function getNftNews({ lang = "ru", limit = 20, now = Date.now() } = {}) {
  const wanted = lang === "ru" || lang === "bl" ? "ru" : "en";
  const cached = cache.get(wanted);
  if (cached && now - cached.at < CACHE_MS) return cached.items.slice(0, limit);

  const chosen = SOURCES.filter((source) => source.lang === wanted || wanted === "ru");
  const lists = await Promise.all(chosen.map(fetchFeed));
  const fresh = dedupe(lists.flat().filter((item) => now - new Date(item.published).getTime() <= MAX_AGE_MS && Date.parse(item.published) <= now + 3_600_000))
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  const preferred = fresh.filter((item) => item.lang === wanted);
  const items = (preferred.length >= 6 ? preferred : fresh).slice(0, 60);

  if (items.length === 0 && cached) return cached.items.slice(0, limit);
  cache.set(wanted, { at: now, items });
  return items.slice(0, limit);
}

export function clearNftNewsCache() {
  cache.clear();
}

/** Shared HTTP handler body: returns [status, headers, body]. */
export async function handleNftNewsRequest(url) {
  const lang = (url.searchParams.get("lang") ?? "ru").slice(0, 5);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 50);
  try {
    const items = await getNftNews({ lang, limit });
    return [200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=600" }, JSON.stringify(items)];
  } catch {
    return [502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, JSON.stringify({ detail: "news_unavailable" })];
  }
}
