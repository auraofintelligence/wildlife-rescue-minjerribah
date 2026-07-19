import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Wildlife Rescue Minjerribah";
const description =
  "Offline-first wildlife guidance, accurate reporting and local rescue coordination for Minjerribah.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: title,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WRM Rescue",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#153d34",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
