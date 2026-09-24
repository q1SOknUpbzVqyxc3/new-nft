import { ArrowUpRight, LifeBuoy } from "lucide-react";
import { getSupportUrl } from "@/lib/support";

/** Whole-plate link to support; without a configured support URL it degrades to a plain notice. */
export function SupportBanner({ title, description }: { title: string; description: string }) {
  const url = getSupportUrl();
  const content = (
    <>
      <span className="support-banner__icon" aria-hidden="true"><LifeBuoy size={20} /></span>
      <span className="support-banner__text"><strong>{title}</strong><span>{description}</span></span>
      {url ? <ArrowUpRight className="support-banner__arrow" size={20} aria-hidden="true" /> : null}
    </>
  );
  return url
    ? <a className="support-banner" href={url} target="_blank" rel="noopener noreferrer">{content}</a>
    : <div className="support-banner support-banner--static">{content}</div>;
}
