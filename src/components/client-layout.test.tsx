import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ClientLayout } from "./client-layout";

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock("@/auth/auth-context", () => ({ useAuth: useAuthMock }));

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: "user@example.com",
    username: null,
    avatar: "",
    balance: 42,
    currency: "USD",
    active: true,
    verificated: true,
    can_withdraw: true,
    turnover: 0,
    created: "",
    minimal_deposit: 0,
    ...overrides
  };
}

function renderLayout(user = baseUser(), logout: () => Promise<void> = vi.fn().mockResolvedValue(undefined)) {
  useAuthMock.mockReturnValue({ status: "authenticated", user, error: null, login: vi.fn(), signup: vi.fn(), logout, refreshSession: vi.fn().mockResolvedValue(user) });
  return render(
    <MemoryRouter initialEntries={["/client/main"]}>
      <Routes>
        <Route element={<ClientLayout />}>
          <Route path="/client/main" element={<span>market content</span>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ClientLayout", () => {
  afterEach(() => {
    cleanup();
    useAuthMock.mockReset();
    document.body.style.overflow = "";
  });

  it("renders primary marketplace navigation, balance, and global search", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: "Маркет" })).toHaveAttribute("href", "/client/main");
    expect(screen.getByRole("link", { name: "Мои NFT" })).toHaveAttribute("href", "/client/owns");
    expect(screen.getByRole("link", { name: "История" })).toHaveAttribute("href", "/client/profile/history");
    expect(screen.getByRole("textbox", { name: "Поиск по маркетплейсу" })).toBeInTheDocument();
    expect(screen.getByText("42 $")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Профиль" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Уведомления" })).toBeInTheDocument();
    expect(screen.getByText("market content")).toBeInTheDocument();
  });

  it("shows the activation gate instead of the marketplace shell for inactive accounts", () => {
    renderLayout(baseUser({ active: false }));
    expect(screen.queryByText("market content")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Маркет" })).not.toBeInTheDocument();
  });

  it("opens and closes the mobile navigation drawer, locking body scroll while open", () => {
    renderLayout();
    const menuButton = screen.getByRole("button", { name: "Открыть меню" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: "Закрыть меню" })).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");
    const drawer = screen.getByRole("navigation", { name: "Мобильная навигация" });
    expect(drawer).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Маркет/ }).length).toBeGreaterThan(0);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Мобильная навигация" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("focuses the first drawer item on open and returns focus to the trigger on close", () => {
    renderLayout();
    const menuButton = screen.getByRole("button", { name: "Открыть меню" });
    fireEvent.click(menuButton);
    const drawer = screen.getByRole("navigation", { name: "Мобильная навигация" });
    const items = drawer.querySelectorAll("a, button");
    expect(items[0]).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Открыть меню" })).toHaveFocus();
  });

  it("traps Tab focus inside the drawer and wraps at both ends", () => {
    renderLayout();
    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
    const drawer = screen.getByRole("navigation", { name: "Мобильная навигация" });
    const items = Array.from(drawer.querySelectorAll<HTMLElement>("a, button"));
    const first = items[0]!;
    const last = items[items.length - 1]!;

    last.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("logs out and navigates to login", () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    renderLayout(baseUser(), logout);
    fireEvent.click(screen.getByRole("button", { name: "Выйти" }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
