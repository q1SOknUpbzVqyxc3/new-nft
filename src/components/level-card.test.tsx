import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { User } from "@/lib/api/schemas";
import { LevelCard } from "./level-card";

function user(overrides: Partial<User> = {}): User {
  return { id: 1, email: "u@example.com", avatar: "", balance: 0, currency: "USD", active: true, verificated: true, can_withdraw: true, turnover: 0, created: "", minimal_deposit: 0, ...overrides };
}

describe("LevelCard", () => {
  afterEach(cleanup);

  it("derives the level from turnover", () => {
    render(<LevelCard user={user({ turnover: 260_000, currency: "RUB" })} />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(screen.getAllByText("Ваш уровень")).toHaveLength(1);
    expect(screen.getByText(/До уровня 4 осталось/)).toBeTruthy();
  });

  it("prefers a backend supplied level", () => {
    render(<LevelCard user={user({ turnover: 0, level: 5 })} />);
    expect(screen.getAllByText("Уровень 5").length).toBeGreaterThan(0);
  });
});
