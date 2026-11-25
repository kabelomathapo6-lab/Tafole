import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/cn";

export interface QrCardProps {
  url: string;
  title: string;
  subtitle?: string;
  size?: number;
  className?: string;
}

/** A QR code with a label, used on the print sheet and in the table drawer. */
export function QrCard({
  url,
  title,
  subtitle,
  size = 180,
  className,
}: QrCardProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-2 text-center", className)}
    >
      {subtitle ? <p className="text-sm text-olive">{subtitle}</p> : null}
      <p className="font-display text-xl font-bold">{title}</p>
      <div data-qr className="rounded-card border border-line bg-porcelain p-3">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          marginSize={1}
          title={`QR code for ${title}`}
        />
      </div>
      <p className="text-sm font-semibold text-pine">Scan to order</p>
    </div>
  );
}
