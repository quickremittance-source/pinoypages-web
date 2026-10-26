import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/Chrome";
import { brand, SITE_URL } from "@/lib/guide";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${brand.name} Beta`, template: `%s · ${brand.name} Beta` },
  description: brand.tagline,
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#0B5E7A" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <div
          role="note"
          data-testid="beta-banner"
          className="bg-amber-400 px-4 py-2 text-center text-sm font-bold text-black"
        >
          Beta — Pinoy Pages legacy design, kept for reference. The current site is{" "}
          <a href="https://pinoypages.ca" className="underline">
            pinoypages.ca
          </a>
          .
        </div>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
