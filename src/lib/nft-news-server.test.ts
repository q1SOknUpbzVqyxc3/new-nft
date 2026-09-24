import { afterEach, describe, expect, it, vi } from "vitest";
import { clearNftNewsCache, decodeEntities, getNftNews, isNftItem, parseRss, stripHtml } from "../../server/nft-news.mjs";

const source = { name: "Test", lang: "en" };
const xml = (items: string) => `<?xml version="1.0"?><rss><channel>${items}</channel></rss>`;
const item = (title: string, extra = "", date = "Fri, 18 Sep 2026 14:55:29 +0000") => `<item><title><![CDATA[${title}]]></title><link>https://example.com/${encodeURIComponent(title)}</link><pubDate>${date}</pubDate>${extra}</item>`;

describe("nft news aggregator", () => {
  afterEach(() => { clearNftNewsCache(); vi.unstubAllGlobals(); });

  it("decodes entities and strips HTML", () => {
    expect(decodeEntities("Fed&#8217;s &amp; NFTs &#x2014; ok")).toBe("Fed’s & NFTs — ok");
    expect(stripHtml("<p>Hello <b>NFT</b> world</p>")).toBe("Hello NFT world");
  });

  it("parses RSS items with images and drops the WordPress footer from summaries", () => {
    const [parsed] = parseRss(xml(item("Pudgy Penguins launch", '<description><![CDATA[<p>Big news.</p> The post Pudgy launch appeared first on NFT Evening.]]></description><media:content url="https://cdn.example.com/p.jpg" medium="image"/>')), source);
    expect(parsed).toMatchObject({ title: "Pudgy Penguins launch", summary: "Big news.", image: "https://cdn.example.com/p.jpg", published: "2026-09-18T14:55:29.000Z" });
    expect(parsed?.url.startsWith("https://example.com/")).toBe(true);
  });

  it("ignores non-https images, items without dates and unsafe links", () => {
    const parsed = parseRss(xml(item("A", '<media:content url="http://insecure.example.com/x.jpg"/>') + "<item><title>No date</title><link>https://x.com/1</link></item>" + "<item><title>Bad</title><link>javascript:alert(1)</link><pubDate>Fri, 18 Sep 2026 14:55:29 +0000</pubDate></item>"), source);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.image).toBe("");
  });

  it("keeps only NFT-related items unless the whole feed is NFT-only", () => {
    expect(isNftItem({ title: "Bitcoin rallies", summary: "Fed hikes" }, {})).toBe(false);
    expect(isNftItem({ title: "OpenSea adds Solana", summary: "" }, {})).toBe(true);
    expect(isNftItem({ title: "Новый NFT-проект", summary: "" }, {})).toBe(true);
    expect(isNftItem({ title: "Anything", summary: "" }, { allNft: true })).toBe(true);
  });

  it("merges feeds, filters, dedupes by url, sorts newest first and returns an empty list when every source fails", async () => {
    const now = Date.parse("2026-09-20T12:00:00Z");
    const feed = xml(item("Older NFT sale", "", "Mon, 14 Sep 2026 10:00:00 +0000") + item("Newest NFT news", "", "Sat, 19 Sep 2026 10:00:00 +0000") + item("Bitcoin only", "", "Sat, 19 Sep 2026 11:00:00 +0000") + item("Ancient NFT story", "", "Mon, 01 Jan 2024 10:00:00 +0000"));
    // Only a general (non NFT-only) source answers, so the NFT filter is what is being tested.
    vi.stubGlobal("fetch", vi.fn((input: string) => Promise.resolve(input.includes("cointelegraph") ? new Response(feed, { status: 200 }) : new Response("", { status: 404 }))));
    const items = await getNftNews({ lang: "en", limit: 10, now });
    expect(items.map((entry) => entry.title)).toEqual(["Newest NFT news", "Older NFT sale"]);

    clearNftNewsCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    expect(await getNftNews({ lang: "en", limit: 10, now: now + 1000 })).toEqual([]);
  });
});
