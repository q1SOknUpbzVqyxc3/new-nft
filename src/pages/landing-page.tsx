import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/brand";
import { DesignArt } from "@/components/design-art";
import { FeaturesSection, GuaranteesSection, HowItWorksSection } from "@/components/landing-sections";
import { useDesign } from "@/lib/design";
import { useT } from "@/lib/i18n";

export function LandingPage() {
  const t = useT();
  const design = useDesign();
  const hasArtwork = design !== "default";
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <main className="landing">
      <header className="landing__header container">
        <Brand to="/" />
        <nav aria-label="Навигация входа" className="landing__nav">
          <Link to="/auth/login" className="button button--ghost">{t("landing_login")}</Link>
          <Link to="/auth/signup" className="button button--primary">{t("landing_signup")}</Link>
        </nav>
      </header>
      <section className={`landing__hero${hasArtwork ? " landing__hero--art" : ""}`}>
        <video
          className="landing__hero-video"
          autoPlay={!reduceMotion}
          muted
          playsInline
          loop
          preload={reduceMotion ? "none" : "metadata"}
          poster={isMobile ? "/mobile-poster.jpg" : "/pc-poster.jpg"}
          aria-hidden="true"
        >
          <source src="/mobile.mp4" media="(max-width: 900px)" type="video/mp4" />
          <source src="/pc.mp4" type="video/mp4" />
        </video>
        <div className="landing__hero-scrim" aria-hidden="true" />
        <div className="landing__hero-inner container">
          <div className="landing__copy">
            <span className="eyebrow"><Sparkles size={14} /> Digital assets marketplace</span>
            <h1>{t("landing_hero_title")}</h1>
            <p>{t("landing_hero_desc")}</p>
            <div className="landing__actions">
              <Link to="/auth/signup" className="button button--primary button--large">{t("landing_cta_start")} <ArrowRight size={17} /></Link>
              <Link to="/auth/login" className="button button--secondary button--large">{t("landing_cta_have_account")}</Link>
            </div>
          </div>
          {hasArtwork && (
            <div className="landing__visual" aria-hidden="true">
              <DesignArt />
            </div>
          )}
        </div>
      </section>
      <HowItWorksSection />
      <GuaranteesSection />
      <FeaturesSection />
    </main>
  );
}
