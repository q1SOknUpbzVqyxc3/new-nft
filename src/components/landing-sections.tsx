import { BadgeCheck, Clock3, History, ShieldCheck } from "lucide-react";

const STEPS = [
  { title: "Выберите NFT", desc: "Просматривайте коллекции по сети, цене и статусу продажи." },
  { title: "Пополните баланс", desc: "Карта, СБП или криптовалюта — баланс пополняется в несколько кликов." },
  { title: "Купите в один клик", desc: "Оплата списывается с баланса, NFT сразу появляется в вашем портфеле." },
  { title: "Продайте и выведите", desc: "Выставите NFT на продажу и выведите средства в течение 24 часов." }
];

export function HowItWorksSection() {
  return (
    <section className="landing__section container" aria-label="Как это работает">
      <div className="section-heading"><h2>Как это работает</h2></div>
      <div className="landing__cards">
        {STEPS.map((step, index) => (
          <div className="surface landing__card" key={step.title}>
            <span className="landing__card-index" aria-hidden="true">{index + 1}</span>
            <strong>{step.title}</strong>
            <p>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const GUARANTEES = [
  { icon: ShieldCheck, title: "Безопасный баланс", desc: "Средства списываются только при подтверждении покупки — ошибочные операции исключены." },
  { icon: History, title: "Прозрачная история", desc: "Каждая сделка отображается в истории операций со статусом и датой." },
  { icon: Clock3, title: "Быстрый вывод", desc: "Зачисление на баланс сразу после продажи, вывод — от минимальной суммы в течение 24 часов." },
  { icon: BadgeCheck, title: "Двухфакторная защита", desc: "Дополнительный код подтверждения для входа и вывода средств." }
];

export function GuaranteesSection() {
  return (
    <section className="landing__section container" aria-label="Гарантии">
      <div className="section-heading"><h2>Гарантии</h2></div>
      <div className="landing__cards">
        {GUARANTEES.map((item) => (
          <div className="surface landing__card" key={item.title}>
            <item.icon className="landing__card-icon" aria-hidden="true" />
            <strong>{item.title}</strong>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
