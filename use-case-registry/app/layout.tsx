import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EDUcore Use Case Registry",
  description:
    "Community-facing interface for collaboratively defining, structuring, and mapping real-world interoperability scenarios across education and workforce ecosystems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
