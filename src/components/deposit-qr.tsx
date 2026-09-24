import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { buildDepositQrPayload } from "@/lib/crypto-uri";
import { Button } from "./ui/button";

/** QR is always visible on desktop; on phones it sits behind a toggle to keep the invoice short. */
export function DepositQr({ address, symbol, network }: { address: string; symbol?: string; network?: string }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState("");
  const payload = buildDepositQrPayload({ address, ...(symbol ? { symbol } : {}), ...(network ? { network } : {}) });

  useEffect(() => {
    if (!payload) return;
    let cancelled = false;
    QRCode.toDataURL(payload, { margin: 1, width: 320 }).then((url) => { if (!cancelled) setDataUrl(url); }, () => { if (!cancelled) setDataUrl(""); });
    return () => { cancelled = true; };
  }, [payload]);

  if (!payload) return null;
  return (
    <div className="deposit-qr">
      <Button type="button" variant="secondary" size="small" className="deposit-qr__toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? "Скрыть QR-код" : "Показать QR-код"}</Button>
      <div className={open ? "deposit-qr__box deposit-qr__box--open" : "deposit-qr__box"}>
        {dataUrl ? <img src={dataUrl} alt="QR-код кошелька для пополнения" /> : <span className="skeleton deposit-qr__placeholder" aria-hidden="true" />}
        <span className="deposit-qr__caption">Сканируйте для оплаты</span>
      </div>
    </div>
  );
}
