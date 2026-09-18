import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { formatMoney } from "@/lib/formatters";
import { PaymentsPage } from "./payments-page";

const { useAuthenticatedUserMock } = vi.hoisted(() => ({ useAuthenticatedUserMock: vi.fn() }));

vi.mock("@/auth/auth-context", () => ({ useAuthenticatedUser: useAuthenticatedUserMock }));

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: "user@example.com",
    username: null,
    avatar: "",
    balance: 100,
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

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

function pathOf(input: string) {
  return new URL(input, "http://localhost").pathname;
}

function makeFetch(overrides: {
  paymentMethods?: () => Response | Promise<Response>;
  withdrawMethods?: () => Response | Promise<Response>;
  createPayment?: () => Response | Promise<Response>;
  checkPayment?: () => Response | Promise<Response>;
  createWithdraw?: () => Response | Promise<Response>;
}) {
  return vi.fn(async (input: string) => {
    const path = pathOf(input);
    if (path === "/api/payment/methods") return overrides.paymentMethods ? overrides.paymentMethods() : jsonResponse([{ api_id: 1, label: "Card", icon: "", min_dep: 0 }]);
    if (path === "/api/withdraw/methods") return overrides.withdrawMethods ? overrides.withdrawMethods() : jsonResponse([{ api_id: 2, label: "Bank", icon: "", min_dep: 5 }]);
    if (path === "/api/payment/create") return overrides.createPayment ? overrides.createPayment() : jsonResponse({ id: "session-1" });
    if (path === "/api/payment/check") return overrides.checkPayment ? overrides.checkPayment() : jsonResponse(false);
    if (path === "/api/withdraw/create") return overrides.createWithdraw ? overrides.createWithdraw() : jsonResponse({});
    throw new Error(`Unhandled fetch in test: ${path}`);
  });
}

function renderPaymentsPage(mode: "topup" | "withdraw", fetchImpl: ReturnType<typeof makeFetch>, user = baseUser(), refreshUser: () => Promise<unknown> = vi.fn().mockResolvedValue(user)) {
  vi.stubGlobal("fetch", fetchImpl);
  useAuthenticatedUserMock.mockReturnValue({ user, refreshUser });
  return render(
    <MemoryRouter>
      <PaymentsPage mode={mode} />
    </MemoryRouter>
  );
}

describe("PaymentsPage", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    useAuthenticatedUserMock.mockReset();
  });

  it("keeps a confirmed payment confirmed when the balance refresh fails, without re-checking", async () => {
    let checkCalls = 0;
    const fetchStub = makeFetch({
      checkPayment: () => {
        checkCalls += 1;
        return Promise.resolve(jsonResponse(true));
      }
    });
    const refreshUser = vi.fn().mockRejectedValue(new Error("network down"));
    renderPaymentsPage("topup", fetchStub, baseUser(), refreshUser);

    await screen.findByRole("option", { name: "Card" });
    fireEvent.change(screen.getByLabelText("Способ"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Сумма", { exact: false }), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /Продолжить/ }));

    await screen.findByText(/Payment created/);
    await waitFor(() => expect(screen.getByText(/Платёж подтверждён, но не удалось обновить баланс/)).toBeInTheDocument(), { timeout: 8_000 });

    expect(checkCalls).toBe(1);
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Не удалось проверить статус/)).not.toBeInTheDocument();
  }, 10_000);

  it("keeps a created withdrawal successful when the account refresh fails", async () => {
    const fetchStub = makeFetch({});
    const refreshUser = vi.fn().mockRejectedValue(new Error("network down"));
    renderPaymentsPage("withdraw", fetchStub, baseUser(), refreshUser);

    await screen.findByRole("option", { name: "Bank" });
    fireEvent.change(screen.getByLabelText("Способ"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Сумма", { exact: false }), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Реквизиты"), { target: { value: "IBAN123" } });
    fireEvent.click(screen.getByRole("button", { name: /Создать запрос/ }));

    const confirmButton = await screen.findByRole("button", { name: "Подтвердить вывод" });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(screen.getByText("Запрос на вывод создан.")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Не удалось обновить данные аккаунта/)).toBeInTheDocument());
    expect(fetchStub.mock.calls.filter((call) => pathOf(call[0]) === "/api/withdraw/create")).toHaveLength(1);
    expect(refreshUser).toHaveBeenCalledTimes(1);
  });

  it("blocks withdrawal submission on the frontend when can_withdraw is false", async () => {
    const fetchStub = makeFetch({});
    const { container } = renderPaymentsPage("withdraw", fetchStub, baseUser({ can_withdraw: false }));

    await screen.findByRole("option", { name: "Bank" });
    expect(screen.getByText("Вывод средств временно недоступен для вашего аккаунта.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Создать запрос/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Способ"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Сумма", { exact: false }), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Реквизиты"), { target: { value: "IBAN123" } });
    const form = container.querySelector("form");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);

    expect(fetchStub.mock.calls.some((call) => pathOf(call[0]) === "/api/withdraw/create")).toBe(false);
  });

  it("uses minimal_deposit for topup minimums but not for withdraw minimums", async () => {
    const fetchStubTopup = makeFetch({ paymentMethods: () => jsonResponse([{ api_id: 1, label: "Card", icon: "", min_dep: 10 }]) });
    renderPaymentsPage("topup", fetchStubTopup, baseUser({ minimal_deposit: 50 }));
    await screen.findByRole("option", { name: "Card" });
    fireEvent.change(screen.getByLabelText("Способ"), { target: { value: "1" } });
    await waitFor(() => expect(screen.getByText(`Минимум ${formatMoney(50, "USD")}`)).toBeInTheDocument());
    cleanup();
    vi.unstubAllGlobals();

    const fetchStubWithdraw = makeFetch({ withdrawMethods: () => jsonResponse([{ api_id: 2, label: "Bank", icon: "", min_dep: 10 }]) });
    renderPaymentsPage("withdraw", fetchStubWithdraw, baseUser({ minimal_deposit: 50 }));
    await screen.findByRole("option", { name: "Bank" });
    fireEvent.change(screen.getByLabelText("Способ"), { target: { value: "2" } });
    await waitFor(() => expect(screen.getByText(`Минимум ${formatMoney(10, "USD")}`)).toBeInTheDocument());
    expect(screen.queryByText(`Минимум ${formatMoney(50, "USD")}`)).not.toBeInTheDocument();
  });
});
