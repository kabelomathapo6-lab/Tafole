"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/manager/menu", label: "Menu" },
  { href: "/manager/tables", label: "Tables" },
];

export function ManagerNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Manager" className="flex gap-1 lg:flex-col">
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 font-display text-sm font-semibold transition lg:rounded-control",
              active ? "bg-forest text-porcelain" : "text-olive hover:bg-stone",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
