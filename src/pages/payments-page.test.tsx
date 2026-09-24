import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("shows a support banner after creating a payment and never polls payment status", async () => {
    vi.stubEnv("VITE_SUPPORT_URL", "https://t.me/support");
    const fetchStub = makeFetch({});
    renderPaymentsPage("topup", fetchStub);

    fireEvent.click(await screen.findByRole("radio", { name: /Card/ }));
    fireEvent.change(screen.getByLabelText("Сумма", { exact: false }), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /Продолжить/ }));

    await screen.findByText(/Платёж создан/);
    const banner = screen.getByRole("link", { name: /Оплатили, но баланс не изменился/ });
    expect(banner).toHaveAttribute("href", "https://t.me/support");
    await new Promise((resolve) => setTimeout(resolve, 5_500));
    expect(fetchStub.mock.calls.some(([input]) => String(input).includes("/api/payment/check"))).toBe(false);
    vi.unstubAllEnvs();
  }, 10_000);

  it("keeps a created withdrawal successful when the account refresh fails", async () => {
    const fetchStub = makeFetch({});
    const refreshUser = vi.fn().mockRejectedValue(new Error("network down"));
    renderPaymentsPage("withdraw", fetchStub, baseUser(), refreshUser);

    fireEvent.click(await screen.findByRole("radio", { name: /Bank/ }));
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

  async function submitWithdraw(fetchStub: ReturnType<typeof makeFetch>, refreshUser?: () => Promise<unknown>) {
    renderPaymentsPage("withdraw", fetchStub, baseUser(), refreshUser);
    fireEvent.click(await screen.findByRole("radio", { name: /Bank/ }));
    fireEvent.change(screen.getByLabelText("Сумма", { exact: false }), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Реквизиты"), { target: { value: "IBAN123" } });
    fireEvent.click(screen.getByRole("button", { name: /Создать запрос/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Подтвердить вывод" }));
  }

  it("opens the withdrawal-suspended notice when the backend answers u_cant_withdraw", async () => {
    await submitWithdraw(makeFetch({ createWithdraw: () => jsonResponse("u_cant_withdraw", 400) }));
    const dialog = await screen.findByRole("dialog", { name: "Вывод средств приостановлен" });
    expect(dialog).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("opens the AML notice after a withdrawal when the refreshed account is not AML verified", async () => {
    const refreshUser = vi.fn().mockResolvedValue(baseUser({ aml_verified: false }));
    await submitWithdraw(makeFetch({}), refreshUser);
    expect(await screen.findByRole("dialog", { name: /AML-проверки/ })).toBeInTheDocument();
  });

  it("routes large card deposits to the finance department instead of showing an invoice", async () => {
    const fetchStub = makeFetch({ paymentMethods: () => jsonResponse([{ api_id: 1, label: "Банковская карта", icon: "" }]) });
    renderPaymentsPage("topup", fetchStub, baseUser({ currency: "RUB" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Банковская карта/ }));
    fireEvent.change(screen.getByLabelText("Сумма", { exact: false }), { target: { value: "5000" } });
    fireEvent.click(screen.getByRole("button", { name: /Продолжить/ }));
    expect(await screen.findByRole("dialog", { name: "Пополнение на крупную сумму" })).toBeInTheDocument();
    expect(screen.queryByText(/Платёж создан/)).not.toBeInTheDocument();
  });

  it("blocks withdrawal submission on the frontend when can_withdraw is false", async () => {
    const fetchStub = makeFetch({});
    const { container } = renderPaymentsPage("withdraw", fetchStub, baseUser({ can_withdraw: false }));

    fireEvent.click(await screen.findByRole("radio", { name: /Bank/ }));
    expect(screen.getByText("Вывод средств временно недоступен для вашего аккаунта.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Создать запрос/ })).toBeDisabled();

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
    fireEvent.click(await screen.findByRole("radio", { name: /Card/ }));
    await waitFor(() => expect(screen.getByText(`Минимум ${formatMoney(50, "USD")}`)).toBeInTheDocument());
    cleanup();
    vi.unstubAllGlobals();

    const fetchStubWithdraw = makeFetch({ withdrawMethods: () => jsonResponse([{ api_id: 2, label: "Bank", icon: "", min_dep: 10 }]) });
    renderPaymentsPage("withdraw", fetchStubWithdraw, baseUser({ minimal_deposit: 50 }));
    fireEvent.click(await screen.findByRole("radio", { name: /Bank/ }));
    await waitFor(() => expect(screen.getByText(`Минимум ${formatMoney(10, "USD")}`)).toBeInTheDocument());
    expect(screen.queryByText(`Минимум ${formatMoney(50, "USD")}`)).not.toBeInTheDocument();
  });

  it("shows a fixed bank list instead of a free-text field when withdrawing via SBP", async () => {
    const fetchStub = makeFetch({ withdrawMethods: () => jsonResponse([{ api_id: 3, label: "СБП", icon: "" }]) });
    renderPaymentsPage("withdraw", fetchStub, baseUser());

    fireEvent.click(await screen.findByRole("radio", { name: /СБП/ }));
    expect(screen.queryByLabelText("Банк (если требуется)")).not.toBeInTheDocument();
    const bankSelect = screen.getByLabelText("Банк");
    expect(bankSelect.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "СберБанк" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Сумма", { exact: false }), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Реквизиты"), { target: { value: "+79990000000" } });
    fireEvent.change(bankSelect, { target: { value: "ВТБ" } });
    fireEvent.click(screen.getByRole("button", { name: /Создать запрос/ }));
    const confirmHeading = await screen.findByText("Подтвердите вывод");
    const confirmation = confirmHeading.closest("section");
    if (!confirmation) throw new Error("confirmation section not found");
    expect(within(confirmation).getByText("ВТБ")).toBeInTheDocument();
  });
});
