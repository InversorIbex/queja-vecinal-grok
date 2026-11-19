import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Reporta problemas del barrio a ≤10 km. PWA móvil y web sincronizadas. Quejas anónimas, votos y reputación vecinal.",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Plataforma vecinal: quejas geolocalizadas, moderación, mapa público. Móvil y web con la misma base de datos.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_TAGLINE,
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0284c7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c4a6e" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
