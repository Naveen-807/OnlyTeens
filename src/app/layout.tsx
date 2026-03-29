import type { Metadata } from "next";
import Script from "next/script";

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
      <body>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
