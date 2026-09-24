import { ImageOff } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/ui";

type SafeMediaProps = {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  /** Sends the session cookie cross-origin (needed for auth-gated resources like the avatar endpoint). */
  credentials?: boolean;
  /** Replaces the default "image unavailable" placeholder, for spots where a failed load is an expected, non-alarming state (e.g. no avatar set yet). */
  fallback?: ReactNode;
};

export function SafeMedia({ src, alt, className, eager = false, credentials = false, fallback }: SafeMediaProps) {
  return <SafeMediaImage key={src} src={src} alt={alt} className={className} eager={eager} credentials={credentials} fallback={fallback} />;
}

function SafeMediaImage({ src, alt, className, eager = false, credentials = false, fallback }: SafeMediaProps) {
  const [hasError, setHasError] = useState(false);
  const safeSource = /^https?:\/\//i.test(src) || src.startsWith("/") ? src : "";

  if (!safeSource || hasError) {
    if (fallback !== undefined) return <span className={className}>{fallback}</span>;
    return (
      <div className={cn("media-fallback", className)} role="img" aria-label={`${alt}: изображение недоступно`}>
        <ImageOff aria-hidden="true" />
        <span>Изображение недоступно</span>
      </div>
    );
  }

  return (
    <img
      src={safeSource}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      referrerPolicy="no-referrer"
      crossOrigin={credentials ? "use-credentials" : undefined}
      onError={() => setHasError(true)}
    />
  );
}
