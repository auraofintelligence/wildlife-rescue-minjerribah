import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const title = "Wildlife Rescue Minjerribah";
  const description = "Offline-first wildlife guidance, accurate reporting and local rescue coordination for Minjerribah.";

  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title,
    description,
    applicationName: title,
    manifest: "/manifest.webmanifest",
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og.png", width: 1664, height: 936, alt: "Wildlife Rescue Minjerribah island field map" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "WRM Rescue",
    },
  };
}

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
