import { ExternalLink, Newspaper } from "lucide-react";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { loadNftNews } from "@/lib/news";
import { EmptyState, ErrorState, LoadingState } from "./ui/page-state";

const dateFormats = { ru: "ru-RU", en: "en-GB" } as const;

function formatNewsDate(value: string, lang: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return lang === "ru" ? "сегодня" : "today";
  if (diffDays === 1) return lang === "ru" ? "вчера" : "yesterday";
  return new Intl.DateTimeFormat(dateFormats[lang === "ru" ? "ru" : "en"], { day: "numeric", month: "short" }).format(date);
}

/** NFT market news from professional NFT / crypto media (aggregated and filtered to NFT topics by our own server). */
export function NftNews({ lang = "ru" }: { lang?: string }) {
  const news = useApiResource(`nft-news:${lang}`, (signal) => loadNftNews(lang, signal));

  return (
    <div className="nft-news" role="region" aria-label="Новости NFT">
      {news.status === "loading" ? <LoadingState label="Загружаем новости" /> : news.status === "error" ? <ErrorState message="Не удалось загрузить новости. Попробуйте позже." onRetry={news.refresh} /> : news.data.length === 0 ? <EmptyState title="Новостей пока нет" description="Свежие материалы об NFT появятся здесь." /> : (
        <ul className="nft-news__list">
          {news.data.map((item) => (
            <li key={item.url}>
              <a className="nft-news__item" href={item.url} target="_blank" rel="noopener noreferrer">
                {item.image ? <img className="nft-news__image" src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="nft-news__image nft-news__image--empty" aria-hidden="true"><Newspaper size={20} /></span>}
                <span className="nft-news__body">
                  <strong>{item.title}</strong>
                  {item.summary ? <span className="nft-news__summary">{item.summary}</span> : null}
                  <small>{item.source} · {formatNewsDate(item.published, lang)} <ExternalLink size={11} aria-hidden="true" /></small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
