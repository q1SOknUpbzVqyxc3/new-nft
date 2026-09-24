import { getBrandName } from "@/lib/brand";
import { legalLinks } from "@/lib/legal";
import { useLanguage } from "@/lib/language";
import { getSupportUrl } from "@/lib/support";

export function SiteFooter() {
  const language = useLanguage();
  const links = [
    { label: "Условия использования", href: legalLinks.terms(language) },
    { label: "Конфиденциальность", href: legalLinks.privacy(language) },
    { label: "Cookie", href: legalLinks.cookies(language) },
    { label: "Поддержка", href: getSupportUrl() }
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <footer className="site-footer">
      <span>{getBrandName()} · {new Date().getFullYear()}</span>
      <nav aria-label="Информация">{links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</nav>
    </footer>
  );
}
