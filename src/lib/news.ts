import { z } from "zod";

export const newsItemSchema = z.object({
  title: z.string(),
  summary: z.string().default(""),
  url: z.string().url(),
  image: z.string().default(""),
  source: z.string(),
  lang: z.string().default("en"),
  published: z.string()
});

export type NewsItem = z.infer<typeof newsItemSchema>;

/** NFT news comes from our own same-origin aggregator (`/news/nft`, see server/nft-news.mjs), not from the API backend. */
export async function loadNftNews(lang: string, signal: AbortSignal): Promise<NewsItem[]> {
  const response = await fetch(`/news/nft?lang=${encodeURIComponent(lang)}&limit=20`, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`news_${response.status}`);
  const parsed = z.array(newsItemSchema).safeParse(await response.json());
  if (!parsed.success) throw new Error("news_invalid");
  // Only plain web links may be rendered as hrefs.
  return parsed.data.filter((item) => /^https?:\/\//i.test(item.url));
}

export function isNftNewsEnabled() {
  return import.meta.env["VITE_NEWS_WIDGET"] !== "off";
}
