"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };
/** Active when the path is the item itself or nested under it (e.g. /directory/food). */
export const isActive = (path: string, href: string) => href !== "/" && (path === href || path.startsWith(`${href}/`));

/** Main menu links with the current page highlighted (navy text, red underline) and aria-current="page". */
export function NavLinks({ items, mobile = false }: { items: NavItem[]; mobile?: boolean }) {
  const path = usePathname() ?? "/";
  return items.map((n) => {
    const on = isActive(path, n.href);
    return (
      <li key={n.href}>
        <Link
          href={n.href}
          aria-current={on ? "page" : undefined}
          data-active={on ? "true" : undefined}
          className={`inline-block rounded-md border-b-2 px-2.5 py-2 ${
            on ? "border-[#E01820] bg-[#002050]/5 text-[#002050]" : "border-transparent"
          } ${mobile ? "" : "hover:bg-aqua hover:text-sea"}`}
        >
          {n.label}
        </Link>
      </li>
    );
  });
}
