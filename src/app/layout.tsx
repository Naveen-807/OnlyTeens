import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Proof18",
  description: "Guided financial autonomy for teens, guardians, and Clawrence.",
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
