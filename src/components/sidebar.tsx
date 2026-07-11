"use client";

import { usePathname } from "next/navigation";
import { AppLink, cn } from "@kira-joo/frontend-toolkit-tailwind";

interface NavItem {
  href: "/" | "/users";
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/users", label: "Users" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <span className="text-lg font-bold text-slate-900">Nutrition Staff</span>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <AppLink
              key={item.href}
              path={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {item.label}
            </AppLink>
          );
        })}
      </nav>
    </aside>
  );
}
