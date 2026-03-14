import type { Metadata } from "next";
import "./globals.css";
import "@/styles/invoice-print.css";

export const metadata: Metadata = {
  title: "Invoice Generator",
  description: "Minimal invoice generator MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
