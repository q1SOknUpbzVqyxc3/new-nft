import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DesignArt } from "./design-art";
import { DesignSwitcher } from "./design-switcher";

function clearDesignCookie() {
  document.cookie = "design=; path=/; max-age=0";
}

describe("DesignSwitcher", () => {
  beforeEach(() => { clearDesignCookie(); delete document.documentElement.dataset["design"]; });
  afterEach(() => { cleanup(); clearDesignCookie(); });

  it("lists every design and marks the default as pressed", () => {
    render(<DesignSwitcher />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Стандарт" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("applies the chosen design to <html> and remembers it as a numeric cookie", () => {
    render(<DesignSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: "Factory" }));
    expect(document.documentElement.dataset["design"]).toBe("factory");
    expect(document.cookie).toContain("design=3");
    expect(screen.getByRole("button", { name: "Factory" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Стандарт" }));
    expect(document.documentElement.dataset["design"]).toBeUndefined();
    expect(document.cookie).toContain("design=0");
  });

  it("swaps the landing artwork with the design", () => {
    render(<><DesignSwitcher /><DesignArt /></>);
    expect(screen.queryByTestId("art-cube")).toBeNull();
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Resend" })); });
    expect(screen.getByTestId("art-cube")).toBeTruthy();
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Factory" })); });
    expect(screen.getByTestId("art-dashboard")).toBeTruthy();
  });
});
