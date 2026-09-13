import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "RiverGuard AI — Flood Risk Intelligence for Keralam",
  description:
    "Real-time, district-level flood risk intelligence for Keralam, powered by live weather data and machine learning.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#050b16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-950 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-aqua-500 focus:px-4 focus:py-2 focus:text-navy-950"
        >
          Skip to main content
        </a>
        <Providers>
          <NavBar />
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
