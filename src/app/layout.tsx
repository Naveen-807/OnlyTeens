import type { Metadata } from "next";

import "./globals.css";

const title = "Calma";
const description =
  "Consumer finance for families on Flow with direct actions, agent assistance, and guardian-bounded autopilot.";

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
      <body className="bg-background text-foreground antialiased" style={{ colorScheme: "dark" }}>
        {children}
      </body>
    </html>
  );
}
