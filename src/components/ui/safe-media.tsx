import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/ui";

type SafeMediaProps = {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  /** Sends the session cookie cross-origin (needed for auth-gated resources like the avatar endpoint). */
  credentials?: boolean;
};

export function SafeMedia({ src, alt, className, eager = false, credentials = false }: SafeMediaProps) {
  return <SafeMediaImage key={src} src={src} alt={alt} className={className} eager={eager} credentials={credentials} />;
}

function SafeMediaImage({ src, alt, className, eager = false, credentials = false }: SafeMediaProps) {
  const [hasError, setHasError] = useState(false);
  const safeSource = /^https?:\/\//i.test(src) || src.startsWith("/") ? src : "";

  if (!safeSource || hasError) {
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
