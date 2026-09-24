import { describe, expect, it } from "vitest";
import { formatNotificationText } from "./notification-text";

describe("formatNotificationText", () => {
  it("decodes known event codes and aliases", () => {
    expect(formatNotificationText("topup_accept")).toBe("Пополнение подтверждено");
    expect(formatNotificationText("notif_withdraw_declined")).toBe("Заявка на вывод отклонена");
    expect(formatNotificationText("WITHDRAW_DECLINE_BY_VERIF")).toContain("верификация");
  });

  it("keeps human text and humanizes unknown codes", () => {
    expect(formatNotificationText("Custom message here")).toBe("Custom message here");
    expect(formatNotificationText("some.new_event")).toBe("New event");
  });
});
