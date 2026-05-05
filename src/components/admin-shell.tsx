"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("ออกจากระบบไม่สำเร็จ");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminMobileNav />
        <div className="hidden border-b px-4 py-3 md:flex md:items-center md:justify-end md:px-8">
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut} className="gap-2">
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            ออกจากระบบ
          </Button>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
