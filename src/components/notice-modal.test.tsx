import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { notices } from "@/lib/notices";
import { ConfirmModal, NoticeModal } from "./notice-modal";

describe("modals", () => {
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

  it("links to support when configured and closes with Escape when dismissible", () => {
    vi.stubEnv("VITE_SUPPORT_URL", "https://t.me/support");
    const onClose = vi.fn();
    render(<NoticeModal notice={notices.withdrawBlocked} onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: "Вывод средств приостановлен" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Написать в поддержку" }).getAttribute("href")).toBe("https://t.me/support");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape and backdrop clicks for restrictions but still closes via the button", () => {
    const onClose = vi.fn();
    render(<NoticeModal notice={notices.verification} dismissible={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(document.querySelector(".modal-backdrop") as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("confirm modal calls the right handler", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmModal title="Отключить?" description="Точно?" confirmLabel="Отключить" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Отключить" }));
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
