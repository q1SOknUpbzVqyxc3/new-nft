import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/ui";

type SafeMediaProps = {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
};

export function SafeMedia({ src, alt, className, eager = false }: SafeMediaProps) {
  return <SafeMediaImage key={src} src={src} alt={alt} className={className} eager={eager} />;
}

function SafeMediaImage({ src, alt, className, eager = false }: SafeMediaProps) {
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
      onError={() => setHasError(true)}
    />
  );
}
