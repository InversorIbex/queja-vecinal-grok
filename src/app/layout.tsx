import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { siteOrigin } from "@/lib/utils";
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

const siteUrl = siteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Reporta un problema del barrio, esté donde esté. Para comprobar si sigue o ya está arreglado hay que estar a 1 km. PWA móvil y web sincronizadas.",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function bad(v){v=String(v||"");return v.indexOf("ChunkLoadError")!==-1||v.indexOf("Loading chunk")!==-1||v.indexOf("Failed to fetch dynamically imported module")!==-1;}function reload(){try{if(sessionStorage.getItem("qv_chunk_reload"))return;sessionStorage.setItem("qv_chunk_reload","1");}catch(e){}var done=function(){location.reload();};if(navigator.serviceWorker){navigator.serviceWorker.getRegistrations().then(function(regs){return Promise.all(regs.map(function(r){return r.unregister();}));}).catch(function(){}).finally(done);}else done();}window.addEventListener("error",function(e){if(bad(e.message)||bad(e.error&&e.error.name)||bad(e.error&&e.error.message))reload();});window.addEventListener("unhandledrejection",function(e){var r=e.reason||{};if(bad(r.name)||bad(r.message))reload();});window.addEventListener("load",function(){setTimeout(function(){try{sessionStorage.removeItem("qv_chunk_reload");}catch(e){}},4000);});})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
