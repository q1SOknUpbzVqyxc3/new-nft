import { LifeBuoy } from "lucide-react";
import { getSupportUrl } from "@/lib/support";

export function SupportLink({ label = "Написать в поддержку" }: { label?: string }) {
  const url = getSupportUrl();
  if (!url) return null;
  return <a className="support-link" href={url} target="_blank" rel="noopener noreferrer"><LifeBuoy size={15} aria-hidden="true" />{label}</a>;
}
