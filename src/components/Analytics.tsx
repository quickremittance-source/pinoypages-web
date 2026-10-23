"use client";
import Script from "next/script";
import { useEffect } from "react";
import { GA_ID, captureUrlCtx } from "@/lib/gtag";

/** Site-wide GA4. Renders nothing (no script, no cookies) unless NEXT_PUBLIC_GA_ID is set. */
export function Analytics() {
  useEffect(() => captureUrlCtx(), []);
  if (!GA_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`}
      </Script>
    </>
  );
}
