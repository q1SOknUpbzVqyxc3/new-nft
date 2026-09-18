import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountStatus } from "./account-status";
import { SupportLink } from "./support-link";
import { formatNotificationText, getBalanceDelta } from "@/lib/notification-text";
import type { User } from "@/lib/api/schemas";

function user(overrides: Partial<User> = {}): User {
  return { id: 1, email: "a@b.c", avatar: "", balance: 0, currency: "USD", active: true, verificated: true, can_withdraw: true, turnover: 0, created: "", minimal_deposit: 0, ...overrides };
}

describe("AccountStatus", () => {
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

  it("shows verified and available withdrawals with text labels", () => {
    render(<AccountStatus user={user()} />);
    expect(screen.getByText("Верифицирован")).toBeInTheDocument();
    expect(screen.getByText("Доступен")).toBeInTheDocument();
    expect(screen.getByText("Активен")).toBeInTheDocument();
  });

  it("uses a neutral unverified label and marks restricted withdrawals", () => {
    render(<AccountStatus user={user({ verificated: false, can_withdraw: false, active: false })} />);
    expect(screen.getByText("Не верифицирован")).toBeInTheDocument();
    expect(screen.getByText("Ограничен")).toBeInTheDocument();
    expect(screen.getByText("Не активирован")).toBeInTheDocument();
  });

  it("renders AML only when the backend provides it, and never invents it", () => {
    const { rerender } = render(<AccountStatus user={user()} />);
    expect(screen.queryByText("AML")).not.toBeInTheDocument();
    rerender(<AccountStatus user={user({ aml_verified: true })} />);
    expect(screen.getByText("Пройден")).toBeInTheDocument();
    rerender(<AccountStatus user={user({ aml_verified: false })} />);
    expect(screen.getByText("Не пройден")).toBeInTheDocument();
  });

  it("shows banned accounts", () => {
    render(<AccountStatus user={user({ is_banned: true })} />);
    expect(screen.getByText("Заблокирован")).toBeInTheDocument();
  });
});

describe("SupportLink", () => {
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

  it("renders nothing without a configured support URL", () => {
    vi.stubEnv("VITE_SUPPORT_URL", "");
    const { container } = render(<SupportLink />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a safe external link only for https URLs", () => {
    vi.stubEnv("VITE_SUPPORT_URL", "https://t.me/example");
    render(<SupportLink />);
    const link = screen.getByRole("link", { name: /поддержку/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    cleanup();
    vi.stubEnv("VITE_SUPPORT_URL", "javascript:alert(1)");
    const { container } = render(<SupportLink />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("notification text", () => {
  it("formats known keys and computes a real balance delta", () => {
    expect(formatNotificationText("nft_bought")).toBe("NFT куплен");
    expect(getBalanceDelta(2580705.4, 1969601.47)).toBeCloseTo(-611103.93);
    expect(getBalanceDelta(100, 150)).toBe(50);
  });

  it("returns no delta when balances are missing or unchanged", () => {
    expect(getBalanceDelta(null, null)).toBeNull();
    expect(getBalanceDelta(undefined, 5)).toBeNull();
    expect(getBalanceDelta(10, 10)).toBeNull();
  });
});
