import { ShieldAlert } from "lucide-react";
import type { Notice } from "@/lib/notices";
import { getSupportUrl } from "@/lib/support";
import { Modal } from "./modal";
import { Button } from "./ui/button";

/** System notice with standard copy and a support call to action (falls back to "Понятно" when support is not configured). */
export function NoticeModal({ notice, onClose, dismissible = true, closeLabel = "Понятно" }: { notice: Notice; onClose: () => void; dismissible?: boolean; closeLabel?: string }) {
  const supportUrl = notice.support ? getSupportUrl() : null;
  return (
    <Modal title={notice.title} onClose={onClose} dismissible={dismissible} icon={<ShieldAlert size={22} />}>
      {notice.paragraphs.map((paragraph) => <p className="modal-text" key={paragraph}>{paragraph}</p>)}
      <div className="modal-actions">
        {supportUrl ? <a className="button button--primary button--medium" href={supportUrl} target="_blank" rel="noopener noreferrer">Написать в поддержку</a> : null}
        <Button variant={supportUrl ? "ghost" : "primary"} onClick={onClose}>{closeLabel}</Button>
      </div>
    </Modal>
  );
}

export function ConfirmModal({ title, description, confirmLabel, pending = false, danger = false, onConfirm, onCancel }: { title: string; description: string; confirmLabel: string; pending?: boolean; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title={title} onClose={onCancel} dismissible={!pending}>
      <p className="modal-text">{description}</p>
      <div className="modal-actions">
        <Button variant="ghost" disabled={pending} onClick={onCancel}>Отмена</Button>
        <Button variant={danger ? "danger" : "primary"} disabled={pending} onClick={onConfirm}>{pending ? "…" : confirmLabel}</Button>
      </div>
    </Modal>
  );
}
