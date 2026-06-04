"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Dumbbell, Salad, CalendarDays,
  Rss, Users, Trophy, Search, Bell, Settings
} from "lucide-react";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/workouts",   label: "Workouts",   Icon: Dumbbell },
  { href: "/nutrition",  label: "Nutrition",  Icon: Salad },
  { href: "/sessions",   label: "Sessions",   Icon: CalendarDays },
  { href: "/feed",       label: "Feed",       Icon: Rss },
  { href: "/friends",    label: "Friends",    Icon: Users },
  { href: "/challenges", label: "Challenges", Icon: Trophy },
  { href: "/search",     label: "Search",     Icon: Search },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-3 space-y-0.5">
      {navItems.map(({ href, label, Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
            }`}
          >
            <Icon
              size={16}
              strokeWidth={isActive ? 2.5 : 2}
              className={`shrink-0 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}
            />
            {label}
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const bottomItems = [
    navItems[0],
    navItems[1],
    navItems[3],
    navItems[4],
    navItems[7],
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-sidebar/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
      {bottomItems.map(({ href, label, Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarFooterLinks() {
  const pathname = usePathname();
  return (
    <div className="space-y-0.5">
      {([
        { href: "/notifications", label: "Notifications", Icon: Bell },
        { href: "/settings",      label: "Settings",      Icon: Settings },
      ] as const).map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            pathname.startsWith(href)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          }`}
        >
          <Icon size={16} strokeWidth={2} className="shrink-0" />
          {label}
        </Link>
      ))}
    </div>
  );
}
