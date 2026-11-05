/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { isAdmin } from "@/lib/adminSession";
import { colors, fontStack, icons, logos, tagline } from "@/brand";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · brand", robots: { index: false, follow: false } };

export default async function BrandPage() {
  if (!(await isAdmin())) notFound();
  const tile = (a: { file: string; name: string }) => (
    <li key={a.file} className="card p-3">
      <div className="flex h-32 items-center justify-center rounded bg-white">
        <img src={a.file} alt={a.name} className="max-h-28 max-w-full object-contain" />
      </div>
      <p className="mt-2 text-sm font-semibold">{a.name}</p>
      <a href={a.file} download className="text-xs text-phblue underline">
        Download {a.file.split("/").pop()}
      </a>
    </li>
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" data-testid="admin-brand">
      <PageHead kicker="Admin" title="Brand kit" />
      <p className="text-muted">
        Official brand sheet, Nov 3 2026. Tagline: <strong>{tagline}</strong> Source of truth: <code>src/brand.ts</code>
        .
      </p>
      <h2 className="mt-8 text-xl font-bold text-navy">Colours</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Object.values(colors).map((c) => (
          <li key={c.hex} className="card overflow-hidden">
            <div className="h-16 border-b border-sand" style={{ background: c.hex }} />
            <div className="p-2 text-sm">
              <p className="font-semibold">{c.name}</p>
              <p className="font-mono">{c.hex}</p>
              <p className="text-xs text-muted">{c.use}</p>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-bold text-navy">Typography</h2>
      <p className="mt-2" style={{ fontFamily: fontStack }}>
        <span className="text-2xl font-bold text-navy">Helvetica / Arial</span> · <code>{fontStack}</code>
      </p>
      <h2 className="mt-8 text-xl font-bold text-navy">Logos</h2>
      <p className="text-sm text-muted">On dark backgrounds, always set the logo on a white panel.</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">{logos.map(tile)}</ul>
      <h2 className="mt-8 text-xl font-bold text-navy">Icons</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">{icons.map(tile)}</ul>
    </div>
  );
}
