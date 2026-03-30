import type { Metadata } from "next";

import "./globals.css";

const title = "Proof18";
const description =
  "Cross-chain confidential teen finance with private policy, controlled autonomy, and guardian-delegated AI execution.";

export const metadata: Metadata = {
  metadataBase: new URL("https://proof18.app"),
  title,
  description,
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title,
    description,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
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
