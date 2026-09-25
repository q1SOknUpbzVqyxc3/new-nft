import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/brand";
import { DesignArt } from "@/components/design-art";
import { GuaranteesSection, HowItWorksSection } from "@/components/landing-sections";

export function LandingPage() {
  return (
    <main className="landing">
      <header className="landing__header container">
        <Brand to="/" />
        <nav aria-label="Навигация входа" className="landing__nav">
          <Link to="/auth/login" className="button button--ghost">Войти</Link>
          <Link to="/auth/signup" className="button button--primary">Регистрация</Link>
        </nav>
      </header>
      <section className="landing__hero container">
        <div className="landing__copy">
          <span className="eyebrow"><Sparkles size={14} /> Digital assets marketplace</span>
          <h1>Коллекционируйте цифровые активы уверенно</h1>
          <p>Открывайте коллекции, управляйте своими NFT и совершайте сделки в едином прозрачном интерфейсе.</p>
          <div className="landing__actions">
            <Link to="/auth/signup" className="button button--primary button--large">Начать работу <ArrowRight size={17} /></Link>
            <Link to="/auth/login" className="button button--secondary button--large">У меня есть аккаунт</Link>
          </div>
        </div>
        <div className="landing__visual" aria-hidden="true">
          <DesignArt />
        </div>
      </section>
      <HowItWorksSection />
      <GuaranteesSection />
      <section className="landing__principles container" aria-label="Преимущества">
        <div><ShieldCheck /><strong>Надёжные сценарии</strong><span>Понятные статусы каждой операции</span></div>
        <div><Zap /><strong>Быстрый доступ</strong><span>Коллекции и активы без лишних шагов</span></div>
        <div><Sparkles /><strong>Чистый интерфейс</strong><span>Данные и действия в центре внимания</span></div>
      </section>
    </main>
  );
}
