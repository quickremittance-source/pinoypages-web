import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/Chrome";
import { StickyCta } from "@/components/StickyCta";
import { brand, SITE_URL } from "@/lib/guide";
import { ALLOW_INDEXING } from "@/lib/seo";
import { Analytics } from "@/components/Analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${brand.name} ${brand.edition}`, template: `%s · ${brand.name}` },
  description: `${brand.tagline} · ${brand.region}`,
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#C8102E" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA" className={inter.variable}>
      <body className="pb-16 md:pb-0">
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <StickyCta />
        <Analytics />
      </body>
    </html>
  );
}
