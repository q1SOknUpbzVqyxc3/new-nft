import { BadgeCheck, Clock3, History, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useT, type TranslationKey } from "@/lib/i18n";

const STEP_KEYS: Array<{ title: TranslationKey; desc: TranslationKey }> = [
  { title: "landing_how_step1_title", desc: "landing_how_step1_desc" },
  { title: "landing_how_step2_title", desc: "landing_how_step2_desc" },
  { title: "landing_how_step3_title", desc: "landing_how_step3_desc" },
  { title: "landing_how_step4_title", desc: "landing_how_step4_desc" }
];

export function HowItWorksSection() {
  const t = useT();
  return (
    <section className="landing__section container" aria-label={t("landing_how_title")}>
      <div className="section-heading"><h2>{t("landing_how_title")}</h2></div>
      <div className="landing__cards">
        {STEP_KEYS.map((step, index) => (
          <div className="surface landing__card" key={step.title}>
            <span className="landing__card-index" aria-hidden="true">{index + 1}</span>
            <strong>{t(step.title)}</strong>
            <p>{t(step.desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const GUARANTEE_KEYS: Array<{ icon: typeof ShieldCheck; title: TranslationKey; desc: TranslationKey }> = [
  { icon: ShieldCheck, title: "landing_guarantees_card1_title", desc: "landing_guarantees_card1_desc" },
  { icon: History, title: "landing_guarantees_card2_title", desc: "landing_guarantees_card2_desc" },
  { icon: Clock3, title: "landing_guarantees_card3_title", desc: "landing_guarantees_card3_desc" },
  { icon: BadgeCheck, title: "landing_guarantees_card4_title", desc: "landing_guarantees_card4_desc" }
];

export function GuaranteesSection() {
  const t = useT();
  return (
    <section className="landing__section container" aria-label={t("landing_guarantees_title")}>
      <div className="section-heading"><h2>{t("landing_guarantees_title")}</h2></div>
      <div className="landing__cards">
        {GUARANTEE_KEYS.map((item) => (
          <div className="surface landing__card" key={item.title}>
            <item.icon className="landing__card-icon" aria-hidden="true" />
            <strong>{t(item.title)}</strong>
            <p>{t(item.desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURE_KEYS: Array<{ icon: typeof ShieldCheck; title: TranslationKey; desc: TranslationKey }> = [
  { icon: ShieldCheck, title: "landing_features_card1_title", desc: "landing_features_card1_desc" },
  { icon: Zap, title: "landing_features_card2_title", desc: "landing_features_card2_desc" },
  { icon: Sparkles, title: "landing_features_card3_title", desc: "landing_features_card3_desc" }
];

export function FeaturesSection() {
  const t = useT();
  return (
    <section className="landing__section container" aria-label={t("landing_features_title")}>
      <div className="section-heading"><h2>{t("landing_features_title")}</h2></div>
      <div className="landing__cards">
        {FEATURE_KEYS.map((item) => (
          <div className="surface landing__card" key={item.title}>
            <item.icon className="landing__card-icon" aria-hidden="true" />
            <strong>{t(item.title)}</strong>
            <p>{t(item.desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
