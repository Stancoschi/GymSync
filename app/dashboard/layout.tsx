import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/layout/logout-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SidebarNav, BottomNav } from "@/components/layout/sidebar-nav";
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
        <div className="px-6 py-5 border-b border-border">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Gym<span className="text-primary">Sync</span>
          </span>
        </div>

        {/* Nav links */}
        <SidebarNav />

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border space-y-2">
          <Link
            href="/notifications"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <span className="text-base leading-none">🔔</span>
            Notifications
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <span className="text-base leading-none">⚙</span>
            Settings
          </Link>
          <div className="px-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="border-b border-border px-5 py-3.5 flex items-center justify-between md:justify-end bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {/* Mobile logo */}
          <span className="text-lg font-bold tracking-tight text-foreground md:hidden">
            Gym<span className="text-primary">Sync</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-7">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <BottomNav />
    </div>
  );
}
