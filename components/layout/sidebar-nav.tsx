"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/workouts", label: "Workouts", icon: "◈" },
  { href: "/nutrition", label: "Nutrition", icon: "◉" },
  { href: "/sessions", label: "Sessions", icon: "◎" },
  { href: "/feed", label: "Feed", icon: "◈" },
  { href: "/friends", label: "Friends", icon: "◌" },
  { href: "/challenges", label: "Challenges", icon: "◆" },
  { href: "/profile", label: "Profile", icon: "○" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-sidebar-accent text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary"
            }`}
          >
            <span className="text-base leading-none text-primary">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const bottomItems = [
    { href: "/dashboard", label: "Dashboard", icon: "⊞" },
    { href: "/workouts", label: "Workouts", icon: "◈" },
    { href: "/sessions", label: "Sessions", icon: "◎" },
    { href: "/feed", label: "Feed", icon: "◈" },
    { href: "/profile", label: "Profile", icon: "○" },
  ];

  // Hide BottomNav during live workout session (it covers the Finish button)
  if (pathname.includes("/session")) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-sidebar border-t border-border flex items-center justify-around px-1"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {bottomItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-lg transition-colors min-w-[56px] min-h-[56px] justify-center ${
              isActive ? "text-primary" : "text-sidebar-foreground"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
