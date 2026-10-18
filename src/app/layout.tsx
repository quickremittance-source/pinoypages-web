import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/Chrome";
import { brand, SITE_URL } from "@/lib/guide";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${brand.name} ${brand.edition}`, template: `%s · ${brand.name}` },
  description: `${brand.tagline} · ${brand.region}`,
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#C8102E" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA" className={inter.variable}>
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
