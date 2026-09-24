/** Hides most of a card number, phone or wallet in payout details before showing them in history. */
export function maskDetails(details: string, methodLabel = "") {
  if (!details) return details;
  const label = methodLabel.toLowerCase();
  const digits = details.replace(/\D/g, "");

  if (label.includes("карт") || label.includes("card")) {
    return digits.length >= 12 ? `${digits.slice(0, 8)}****${digits.slice(-4)}` : details;
  }
  if (label.includes("сбп") || label.includes("sbp")) {
    return digits.length === 11 ? `+${digits.slice(0, 2)}*****${digits.slice(-4)}` : details;
  }
  return details.length > 12 ? `${details.slice(0, 6)}…${details.slice(-4)}` : details;
}
