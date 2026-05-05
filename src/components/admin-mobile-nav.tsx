"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutGrid,
  Loader2,
  Menu,
  LogOut,
  Plus,
  Settings2,
  StickyNote,
  HelpCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: ClipboardList },
  { href: "/admin", label: "รายการที่พัก", icon: Building2 },
  { href: "/admin/notes", label: "บันทึกหมายเหตุ", icon: StickyNote },
  { href: "/admin/disputes", label: "คำถามที่พบบ่อย", icon: HelpCircle },
  { href: "/admin/fields", label: "จัดการฟิลด์", icon: Settings2 },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setOpen(false);
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("ออกจากระบบไม่สำเร็จ");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="md:hidden flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-primary" />
        <span className="font-semibold">PropAdmin</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
          <div className="flex items-center justify-between px-6 py-5 border-b">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <span className="font-semibold">Baanpool Admin</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

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
                  onClick={() => setOpen(false)}
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

          <div className="border-t p-4">
            <Link href="/admin/property/new" onClick={() => setOpen(false)}>
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                เพิ่มที่พัก
              </Button>
            </Link>
            <Button
              variant="outline"
              className="mt-3 w-full gap-2"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              ออกจากระบบ
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
