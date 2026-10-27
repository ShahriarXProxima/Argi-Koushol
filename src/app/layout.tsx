import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#166534" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  applicationName: "Agri-Koushol কৃষি কৌশল",
  title: {
    default: "Agri-Koushol কৃষি কৌশল | Autonomous AI Farm Platform",
    template: "%s | Agri-Koushol কৃষি কৌশল",
  },
  description:
    "Autonomous AI farm platform with IoT soil telemetry, weather safety guards, drone crop vision, and harvest yield optimization.",
  keywords: [
    "Agri-Koushol",
    "কৃষি কৌশল",
    "Smart Agriculture",
    "Autonomous Farm",
    "Precision Irrigation",
    "Crop Guardian",
    "Bangladesh Agriculture",
  ],
  authors: [{ name: "Agri-Koushol Engineering Team" }],
  creator: "Agri-Koushol",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agri-Koushol",
  },
  openGraph: {
    title: "Agri-Koushol কৃষি কৌশল | Autonomous AI Farm Platform",
    description:
      "Autonomous AI farm management system with precision monitoring, weather safety guards, and crop optimization.",
    url: "https://agri-koushol.local",
    siteName: "Agri-Koushol",
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agri-Koushol কৃষি কৌশল",
    description: "Autonomous AI farm management system with precision monitoring.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansBengali.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={200}>
            <I18nProvider>
              <AppShell>{children}</AppShell>
              <Toaster richColors position="top-right" />
            </I18nProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
