import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tafole: remove the waiting, not the waiter",
  description:
    "Guests order and call for service from a QR code at the table. The kitchen sees orders live and the waiter stays in charge.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf8f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
