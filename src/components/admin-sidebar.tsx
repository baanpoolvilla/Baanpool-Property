"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutGrid,
  Settings2,
  Plus,
  StickyNote,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: ClipboardList },
  { href: "/admin", label: "รายการที่พัก", icon: Building2 },
  { href: "/admin/notes", label: "บันทึกหมายเหตุ", icon: StickyNote },
  { href: "/admin/disputes", label: "คำถามที่พบบ่อย", icon: HelpCircle },
  { href: "/admin/fields", label: "จัดการฟิลด์", icon: Settings2 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-5">
        <LayoutGrid className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg">Baanpool Admin</span>
      </div>

      <Separator />

      {/* Nav links */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Quick add */}
      <div className="p-4">
        <Link href="/admin/property/new">
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            เพิ่มที่พัก
          </Button>
        </Link>
      </div>
    </aside>
  );
}
