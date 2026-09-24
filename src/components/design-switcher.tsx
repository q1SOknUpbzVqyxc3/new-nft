import { DESIGNS, setDesign, useDesign } from "@/lib/design";

/** TEMPORARY review tool: switches the whole site between design variants. Delete before release. */
export function DesignSwitcher() {
  const current = useDesign();
  return (
    <div className="design-switcher" role="toolbar" aria-label="Переключатель дизайнов (временный)">
      <span className="design-switcher__label">Дизайн · временно</span>
      <div className="design-switcher__options">
        {DESIGNS.map((design) => (
          <button key={design.id} type="button" className={design.id === current ? "design-switcher__btn design-switcher__btn--active" : "design-switcher__btn"} aria-pressed={design.id === current} onClick={() => setDesign(design.id)}>{design.label}</button>
        ))}
      </div>
    </div>
  );
}
