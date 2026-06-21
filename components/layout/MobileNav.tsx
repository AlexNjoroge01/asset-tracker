"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ScanLine, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/assets",    icon: Package,         label: "Assets"    },
  { href: "/scan",      icon: ScanLine,        label: "Scan"      },
  { href: "/settings",  icon: Settings,        label: "Settings"  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card md:hidden">
      {/* safe-area inset for notched phones */}
      <div className="flex pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors min-h-[52px] justify-center",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive && "drop-shadow-[0_0_5px_hsl(var(--primary)/0.7)]"
                )}
              />
              <span className="truncate max-w-[60px] text-center">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
