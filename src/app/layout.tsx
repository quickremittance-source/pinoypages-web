import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/Chrome";
import { StickyCta } from "@/components/StickyCta";
import { brand, SITE_URL } from "@/lib/guide";
import { ALLOW_INDEXING } from "@/lib/seo";
import { Analytics } from "@/components/Analytics";
import { PageView } from "@/components/PageView";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${brand.name} ${brand.edition}`, template: `%s · ${brand.name}` },
  description: `${brand.tagline} · ${brand.region}`,
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#0b5e7a" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="pb-16 md:pb-0">
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <StickyCta />
        <Analytics />
        <PageView />
      </body>
    </html>
  );
}
