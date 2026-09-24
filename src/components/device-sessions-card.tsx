import { Laptop } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/page-state";
import { isEndpointUnavailable } from "@/lib/api/client";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { normalizeSession } from "@/lib/device";
import { formatDateTime } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { UnavailableNote } from "./unavailable-note";

export function DeviceSessionsCard() {
  const sessions = useApiResource("device-sessions", (signal) => api.getSessions(signal));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function run(id: string, action: () => Promise<unknown>) {
    if (busyId) return;
    setBusyId(id); setMessage("");
    try {
      await action();
      sessions.refresh();
    } catch (error) {
      setMessage(getUserFacingError(error));
    } finally {
      setBusyId(null);
    }
  }

  if (sessions.status === "loading") return <LoadingState label="Загружаем устройства" />;
  if (sessions.status === "error") {
    return isEndpointUnavailable(sessions.error)
      ? <div className="device-sessions"><h2>Устройства</h2><UnavailableNote>Управление устройствами скоро появится — сервер пока не поддерживает список сессий.</UnavailableNote></div>
      : <div className="inline-alert" role="alert">{getUserFacingError(sessions.error)}</div>;
  }

  const items = sessions.data.map(normalizeSession);
  return (
    <div className="device-sessions">
      <h2>Устройства</h2>
      <p className="profile-muted">Здесь показаны устройства, на которых выполнен вход в аккаунт.</p>
      {items.length === 0 ? <p className="profile-muted">Активных сессий не найдено.</p> : (
        <ul className="device-list">
          {items.map((item) => (
            <li className="device-list__item" key={item.id}>
              <Laptop size={20} aria-hidden="true" />
              <div>
                <strong>{item.label ?? "Неизвестное устройство"}{item.isCurrent ? " · это устройство" : ""}</strong>
                <small>{[item.ip, item.lastActive ? formatDateTime(item.lastActive) : null].filter(Boolean).join(" · ") || "—"}</small>
              </div>
              {item.isCurrent ? null : <Button variant="secondary" size="small" disabled={busyId !== null} onClick={() => void run(item.id, () => api.revokeSession(item.id))}>{busyId === item.id ? "…" : "Завершить"}</Button>}
            </li>
          ))}
        </ul>
      )}
      {items.some((item) => !item.isCurrent) ? <Button variant="danger" disabled={busyId !== null} onClick={() => void run("others", () => api.revokeOtherSessions())}>{busyId === "others" ? "Завершаем…" : "Завершить все остальные сессии"}</Button> : null}
      {message ? <div className="inline-alert" role="alert">{message}</div> : null}
    </div>
  );
}
