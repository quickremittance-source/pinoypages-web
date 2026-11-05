"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type NavItem = { href: string; label: string; match?: string[]; children?: NavItem[]; icon?: "home" };
/** Active when the path is the item itself or nested under it (e.g. /directory/food). */
export const isActive = (path: string, href: string) =>
  href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
const activeFor = (path: string, n: NavItem): boolean =>
  [n.href, ...(n.match ?? [])].some((h) => isActive(path, h)) || (n.children ?? []).some((c) => activeFor(path, c));

const linkCls = (on: boolean, mobile: boolean) =>
  `inline-block rounded-md border-b-2 px-2.5 py-2 ${
    on ? "border-phred bg-navy/5 text-navy" : "border-transparent"
  } ${mobile ? "" : "hover:bg-aqua hover:text-sea"}`;

/** Desktop dropdown: opens on hover, on the toggle button (click/Enter/Space) and closes on Escape or outside click. */
function Dropdown({ n, path }: { n: NavItem; path: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const on = activeFor(path, n);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const id = `sub-${n.href.replace(/\W/g, "")}`;
  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }
      }}
    >
      <span className="inline-flex items-center">
        <Link
          href={n.href}
          aria-current={on ? (n.children!.some((c) => activeFor(path, c)) ? "true" : "page") : undefined}
          data-active={on ? "true" : undefined}
          className={linkCls(on, false)}
        >
          {n.label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`${n.label} submenu`}
          onClick={() => setOpen((o) => !o)}
          className="rounded-md px-1 py-2 hover:bg-aqua"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true" fill="currentColor">
            <path d="M5 7l5 6 5-6z" />
          </svg>
        </button>
      </span>
      <ul
        id={id}
        hidden={!open}
        data-testid="submenu"
        className="absolute left-0 top-full z-30 min-w-48 rounded-md border border-sand bg-white p-1 shadow-lg"
      >
        {n.children!.map((c) => {
          const con = activeFor(path, c);
          return (
            <li key={c.href}>
              <Link
                href={c.href}
                aria-current={con ? "page" : undefined}
                className={`block rounded px-3 py-2 hover:bg-aqua hover:text-sea ${con ? "text-navy underline decoration-phred decoration-2" : ""}`}
              >
                {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

/** Home glyph; same drawing as public/brand/icons/icon-home.svg (official icon set). */
function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 align-[-4px] text-navy"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  );
}

/** Main menu links with the current page highlighted (navy text, red underline) and aria-current="page". */
export function NavLinks({ items, mobile = false }: { items: NavItem[]; mobile?: boolean }) {
  const path = usePathname() ?? "/";
  return items.map((n) => {
    if (n.children?.length && !mobile) return <Dropdown key={n.href} n={n} path={path} />;
    // Parent counts as current only when no child is the current page, so aria-current stays unique.
    const childOn = (n.children ?? []).some((c) => activeFor(path, c));
    const on = activeFor(path, n);
    return (
      <li key={n.href} className={n.children?.length ? "flex items-center" : undefined}>
        <Link
          href={n.href}
          aria-current={on ? (childOn ? "true" : "page") : undefined}
          data-active={on ? "true" : undefined}
          className={linkCls(on, mobile)}
          {...(n.icon === "home" ? { "aria-label": n.label, "data-testid": "nav-home" } : {})}
        >
          {n.icon === "home" ? <HomeIcon /> : n.label}
        </Link>
        {n.children?.length ? (
          <ul aria-label={`${n.label} submenu`} className="flex gap-1 border-l border-sand pl-1 text-xs">
            {n.children.map((c) => {
              const con = activeFor(path, c);
              return (
                <li key={c.href}>
                  <Link href={c.href} aria-current={con ? "page" : undefined} className={linkCls(con, true)}>
                    {c.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </li>
    );
  });
}
