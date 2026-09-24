import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PaymentDetails } from "./payment-details";

describe("PaymentDetails", () => {
  afterEach(cleanup);

  it("shows labelled invoice fields and hides the sentinel minimum", () => {
    render(<PaymentDetails currency="RUB" session={{ id: 6159, min_dep: 999_999_999_999, details: { amount: "0.02372706", wallet: "0x4c56", network: "eth", expiration_estimate: "2099-09-20T01:42:51.262Z" } }} />);
    expect(screen.getByText("Сумма к оплате")).toBeTruthy();
    expect(screen.getByText("0.02372706")).toBeTruthy();
    expect(screen.getByText("ETH")).toBeTruthy();
    expect(screen.getByText("0x4c56")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Скопировать адрес кошелька" })).toBeTruthy();
    expect(screen.queryByText("Минимальная сумма")).toBeNull();
    expect(screen.queryByText(/999/)).toBeNull();
  });

  it("humanizes unknown fields", () => {
    render(<PaymentDetails currency="RUB" session={{ id: 1, details: { bank_name: "Test" } }} />);
    expect(screen.getByText("Bank name")).toBeTruthy();
  });
});
