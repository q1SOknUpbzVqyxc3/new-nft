export type NftNewsItem = { title: string; summary: string; url: string; image: string; source: string; lang: string; published: string };
export function decodeEntities(value: string): string;
export function stripHtml(value: string): string;
export function parseRss(xml: string, source: { name: string; lang: string }): NftNewsItem[];
export function isNftItem(item: { title: string; summary: string }, source: { allNft?: boolean }): boolean;
export function getNftNews(options?: { lang?: string; limit?: number; now?: number }): Promise<NftNewsItem[]>;
export function clearNftNewsCache(): void;
export function handleNftNewsRequest(url: URL): Promise<[number, Record<string, string>, string]>;
