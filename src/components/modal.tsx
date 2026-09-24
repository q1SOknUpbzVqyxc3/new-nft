import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** When false, Escape and backdrop clicks do nothing; only the explicit close button (or an action) dismisses it. */
  dismissible?: boolean;
  wide?: boolean;
  icon?: ReactNode;
};

/** Accessible modal: dialog semantics, Escape/backdrop dismissal, focus moved in and restored, page scroll locked. */
export function Modal({ onClose, title, children, dismissible = true, wide = false, icon }: ModalProps) {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const card = cardRef.current;
    card?.focus();
    document.body.style.overflow = "hidden";

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) { onCloseRef.current(); return; }
      if (event.key !== "Tab" || !card) return;
      const focusable = Array.from(card.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === card)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [dismissible]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => { if (dismissible && event.target === event.currentTarget) onClose(); }}>
      <div ref={cardRef} className={wide ? "modal-card modal-card--wide" : "modal-card"} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <button type="button" className="modal-close" aria-label="Закрыть" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        {icon ? <span className="modal-icon" aria-hidden="true">{icon}</span> : null}
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
}
