"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, LayoutDashboard, Package, QrCode, Settings, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavItem } from "./NavItem";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/assets", icon: Package, label: "Assets" },
  { href: "/scan", icon: ScanLine, label: "Scan" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-2 py-4">
      <div className="px-4 pb-2">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <QrCode className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "QR Asset Tracker"}
          </span>
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={onNavClick} />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-3 left-3 z-50"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 bg-card">
          <SidebarContent onNavClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
