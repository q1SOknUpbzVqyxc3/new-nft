import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "./button";

export function LoadingState({ label = "Загрузка" }: { label?: string }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-panel state-panel--error" role="alert">
      <AlertCircle aria-hidden="true" />
      <div>
        <strong>Не удалось загрузить данные</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Повторить
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="state-panel">
      <Inbox aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="nft-grid" aria-label="Загрузка NFT" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="nft-card nft-card--skeleton" key={index}>
          <div className="skeleton nft-card__media" />
          <div className="nft-card__body">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        </div>
      ))}
    </div>
  );
}
