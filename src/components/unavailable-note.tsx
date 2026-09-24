import { Clock } from "lucide-react";

export function UnavailableNote({ children }: { children: string }) {
  return <p className="unavailable-note"><Clock size={16} aria-hidden="true" /><span>{children}</span></p>;
}
