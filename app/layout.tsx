import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DEFAULT_LANGUAGE } from "./default-language";
import { translate } from "./i18n";

export const metadata: Metadata = {
  alternates: { canonical: "https://standpunktprotokoll-de.lonesinner.chatgpt.site" },
  title: translate(DEFAULT_LANGUAGE, "appTitle"),
  description: translate(DEFAULT_LANGUAGE, "appDescription"),
  applicationName: translate(DEFAULT_LANGUAGE, "appTitle"),
  manifest: `/manifest-${DEFAULT_LANGUAGE}.webmanifest`,
  appleWebApp: {
    capable: true,
    title: translate(DEFAULT_LANGUAGE, "appTitle"),
    statusBarStyle: "black-translucent",
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192-v20.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512-v20.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.svg",
    apple: [
      { url: "/apple-touch-icon-v20.png?v=22", type: "image/png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0b100e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={DEFAULT_LANGUAGE}>
      <head>
        <link rel="manifest" href={`/manifest-${DEFAULT_LANGUAGE}.webmanifest`} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192-v20.png?v=22" />
        <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="/apple-touch-icon-v20.png?v=22" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167-v20.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152-v20.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120-v20.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed-v20.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={translate(DEFAULT_LANGUAGE, "appTitle")} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
