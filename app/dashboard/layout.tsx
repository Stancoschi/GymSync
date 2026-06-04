import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/layout/logout-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SidebarNav, BottomNav, SidebarFooterLinks } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 7h2.5M10.5 7H13M3.5 4.5v5M10.5 4.5v5M3.5 7h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-primary-foreground"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Gym<span className="text-primary">Sync</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border space-y-0.5">
          <SidebarFooterLinks />
          <div className="px-3 pt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="border-b border-border px-5 py-3 flex items-center justify-between md:justify-end bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {/* Mobile logo */}
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 7h2.5M10.5 7H13M3.5 4.5v5M10.5 4.5v5M3.5 7h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-primary-foreground"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight">
              Gym<span className="text-primary">Sync</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-7 page-enter">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <BottomNav />
    </div>
  );
}
