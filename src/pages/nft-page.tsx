import { ArrowLeft, Blocks, CheckCircle2, Heart, ShoppingBag, Tag, Undo2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { ActivityFeed } from "@/components/activity-feed";
import { NftAuction, NftFacts } from "@/components/nft-market";
import { NoticeModal } from "@/components/notice-modal";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { SafeMedia } from "@/components/ui/safe-media";
import { TextField } from "@/components/ui/text-field";
import { ApiError } from "@/lib/api/client";
import { api } from "@/lib/api/services";
import { type Notice, notices } from "@/lib/notices";
import { getUserFacingError } from "@/lib/api/errors";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { useOptionalResource } from "@/lib/hooks/use-optional-resource";
import { formatDateTime, formatMoney } from "@/lib/formatters";

type TransactionIntent = { action: "buy" | "unsell"; price: number } | { action: "sell"; price: number };

export type NftActionKind = "sell" | "unsell" | "buy" | "none";

export function getNftActionKind(item: { is_own: boolean; is_sale: boolean }): NftActionKind {
  if (item.is_own) return item.is_sale ? "unsell" : "sell";
  return item.is_sale ? "buy" : "none";
}

function getFavouriteId(value: Awaited<ReturnType<typeof api.getFavourites>>[number]) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  const id = value.nft_id ?? value.pic?.id ?? value.id;
  return id === undefined ? null : String(id);
}

function buildSparklinePoints(prices: { value: number }[]) {
  if (prices.length < 2) return null;
  const values = prices.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 32 - ((value - min) / span) * 32;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function NftPage() {
  const { nftId = "" } = useParams();
  const { refreshUser } = useAuthenticatedUser();
  const nft = useApiResource(nftId ? `nft:${nftId}` : null, (signal) => api.getNft(nftId, signal));
  const extra = useOptionalResource(nftId ? `nft-extra:${nftId}` : null, (signal) => api.getNftExtra(nftId, signal));
  const favourites = useApiResource("favourites", (signal) => api.getFavourites(signal));
  // The backend reports is_own = false for your own NFT once it is listed for sale, so ownership is also read from your portfolio.
  const owned = useApiResource("owned-nfts", (signal) => api.getOwnedNfts(signal));
  const [pending, setPending] = useState(false);
  const [favouritePending, setFavouritePending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [intent, setIntent] = useState<TransactionIntent | null>(null);
  const isFavourite = useMemo(() => favourites.status === "success" && favourites.data.some((value) => getFavouriteId(value) === nftId), [favourites, nftId]);

  async function transact(action: "buy" | "sell" | "unsell", price?: number) {
    if (nft.status !== "success" || pending) return;
    if ((action === "sell" || action === "unsell") && nft.data.own_id === undefined) {
      setFeedback({ type: "error", text: "Backend не вернул идентификатор владения для этой операции." });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      if (action === "buy") await api.buyNft(nftId);
      if (action === "sell" && nft.data.own_id !== undefined && price !== undefined) await api.sellNft(String(nft.data.own_id), price);
      if (action === "unsell" && nft.data.own_id !== undefined) await api.unsellNft(String(nft.data.own_id));
    } catch (error) {
      setPending(false);
      if (action === "buy" && error instanceof ApiError && error.code === "u_cant_buy") {
        setIntent(null);
        setNotice(notices.buyBlocked);
      } else setFeedback({ type: "error", text: getUserFacingError(error) });
      return;
    }

    setFeedback({ type: "success", text: action === "buy" ? "Покупка завершена." : action === "sell" ? "NFT выставлен на продажу." : "NFT снят с продажи." });
    setIntent(null);
    nft.refresh();
    try {
      await refreshUser();
    } catch {
      setFeedback({ type: "warning", text: "Операция выполнена, но не удалось обновить данные профиля. Обновите страницу." });
    } finally {
      setPending(false);
    }
  }

  function submitSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(new FormData(event.currentTarget).get("price"));
    if (!Number.isFinite(price) || price <= 0) { setFeedback({ type: "error", text: "Введите корректную цену." }); return; }
    setIntent({ action: "sell", price });
  }

  async function toggleFavourite() {
    if (favouritePending) return;
    setFavouritePending(true); setFeedback(null);
    try {
      if (isFavourite) await api.deleteFavourite(nftId); else await api.addFavourite(nftId);
      favourites.refresh();
      setFeedback({ type: "success", text: isFavourite ? "Удалено из избранного." : "Добавлено в избранное." });
    } catch (error) {
      setFeedback({ type: "error", text: getUserFacingError(error) });
    } finally {
      setFavouritePending(false);
    }
  }

  if (nft.status === "loading" || owned.status === "loading") return <main className="container page"><LoadingState label="Загружаем NFT" /></main>;
  if (nft.status === "error") return <main className="container page"><ErrorState message={getUserFacingError(nft.error)} onRetry={nft.refresh} /></main>;
  const ownedRecord = owned.status === "success" ? owned.data.find((record) => String(record.pic.id) === nftId) : undefined;
  const item = { ...nft.data, is_own: nft.data.is_own || ownedRecord !== undefined, ...(nft.data.own_id === undefined && ownedRecord ? { own_id: ownedRecord.id } : {}) };
  const actionKind = getNftActionKind(item);
  const sparklinePoints = buildSparklinePoints(item.prices);

  return (
    <main className="container page nft-detail">
      <Link to={`/client/collection/${item.collection_id}`} className="back-link"><ArrowLeft size={16} /> {item.collection_name}</Link>
      <div className="asset-layout">
        <section className="asset-preview"><SafeMedia src={item.image} alt={`${item.collection_name} #${item.number}`} eager /></section>
        <section className="asset-details">
          <div className="asset-identity">
            <div className="asset-identity__badges">
              <span className="pill"><Blocks size={13} /> {item.blockchain || "Сеть не указана"}</span>
              {item.is_own ? <span className="pill pill--accent">Вы владелец</span> : null}
              {item.is_sale ? <span className="pill pill--accent">На продаже</span> : null}
            </div>
            <Link to={`/client/collection/${item.collection_id}`} className="asset-details__collection">{item.collection_name}</Link>
            <div className="asset-title">
              <h1>#{item.number}</h1>
              <Button variant="secondary" aria-label={isFavourite ? "Удалить из избранного" : "Добавить в избранное"} title={favourites.status === "error" ? getUserFacingError(favourites.error) : undefined} disabled={favouritePending || favourites.status !== "success"} onClick={() => void toggleFavourite()}><Heart fill={isFavourite ? "currentColor" : "none"} />{favourites.status === "error" ? "Избранное недоступно" : isFavourite ? "В избранном" : "В избранное"}</Button>
            </div>
          </div>
          <div className="trade-panel">
            <div className="price-panel"><span>Текущая цена</span><strong>{formatMoney(item.is_sale && item.sale_price ? item.sale_price : item.price, item.currency)}</strong></div>
            {feedback ? <div className={feedback.type === "success" ? "inline-alert inline-alert--success" : feedback.type === "warning" ? "inline-alert inline-alert--warning" : "inline-alert"} role="status">{feedback.type === "success" ? <CheckCircle2 size={17} /> : null}{feedback.text}</div> : null}
            <div className="asset-actions">
              {actionKind === "sell" ? <form className="sale-form" onSubmit={submitSale}><TextField name="price" type="number" min="0.01" step="0.01" label="Цена продажи" disabled={pending} required /><Button type="submit" disabled={pending}><Tag size={17} /> Выставить на продажу</Button></form>
                : actionKind === "unsell" ? (item.own_id !== undefined ? <Button variant="secondary" disabled={pending} onClick={() => setIntent({ action: "unsell", price: item.sale_price })}><Undo2 size={17} /> Снять с продажи</Button> : <div className="state-panel">Не удалось получить идентификатор владения для этой операции.</div>)
                : actionKind === "buy" ? <Button size="large" disabled={pending} onClick={() => setIntent({ action: "buy", price: item.sale_price || item.price })}><ShoppingBag size={18} /> Купить за {formatMoney(item.sale_price || item.price, item.currency)}</Button>
                : <div className="state-panel">NFT сейчас не выставлен на продажу.</div>}
            </div>
            {intent ? <section className="transaction-confirmation" aria-label="Подтверждение операции"><strong>{intent.action === "buy" ? "Подтвердите покупку" : intent.action === "sell" ? "Подтвердите размещение" : "Снять NFT с продажи?"}</strong><p>{item.collection_name} #{item.number} · {item.blockchain || "сеть не указана"}{intent.action !== "unsell" ? ` · ${formatMoney(intent.price, item.currency)}` : ""}</p><div><Button disabled={pending} onClick={() => void transact(intent.action, intent.price)}>{pending ? "Выполняем…" : "Подтвердить"}</Button><Button variant="ghost" disabled={pending} onClick={() => setIntent(null)}>Отмена</Button></div></section> : null}
          </div>
          <NftAuction nftId={nftId} item={item} onChanged={() => { nft.refresh(); owned.refresh(); void refreshUser().catch(() => undefined); }} onBlocked={() => setNotice(notices.buyBlocked)} />
          <NftFacts item={item} extra={extra.state === "ready" ? extra.data : null} unavailable={extra.state === "unavailable"} />
        </section>
      </div>
      <section className="asset-history">
        <div className="section-heading"><div><h2>История цены</h2></div></div>
        {item.prices.length ? (
          <>
            {sparklinePoints ? <svg className="price-sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label="График истории цены"><polyline points={sparklinePoints} /></svg> : null}
            <div className="history-list">{[...item.prices].reverse().map((point, index) => <div key={`${point.time}-${index}`}><span>{formatDateTime(point.time)}</span><strong>{formatMoney(point.value, item.currency)}</strong></div>)}</div>
          </>
        ) : <div className="state-panel">История цены пока недоступна.</div>}
      </section>
      <ActivityFeed scope={{ nftId }} title="Активность NFT" />
      {notice ? <NoticeModal notice={notice} onClose={() => setNotice(null)} /> : null}
    </main>
  );
}
