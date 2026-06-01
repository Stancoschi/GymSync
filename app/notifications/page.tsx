import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "./actions";
import Link from "next/link";
import type { Metadata } from "next";
import type { NotificationType } from "@/types/database";

export const metadata: Metadata = { title: "Notifications" };

// Local type matching exactly what the query selects.
// actor comes as an array from Supabase FK join.
type NotificationItem = {
  id: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  entity_id: string | null;
  actor: Array<{ full_name: string | null; username: string | null; avatar_url: string | null }> | null;
};

function getActor(n: NotificationItem) {
  if (Array.isArray(n.actor)) return n.actor[0] ?? null;
  return n.actor;
}

function notificationLabel(n: NotificationItem): string {
  const a = getActor(n);
  const name = a?.full_name ?? a?.username ?? "Someone";
  switch (n.type) {
    case "friend_request": return `${name} sent you a friend request`;
    case "friend_accepted": return `${name} accepted your friend request`;
    case "session_joined": return `${name} joined your gym session`;
    default: return "New notification";
  }
}

function notificationHref(n: NotificationItem): string {
  switch (n.type) {
    case "friend_request":
    case "friend_accepted":
      return "/friends";
    case "session_joined":
      return n.entity_id ? `/sessions/${n.entity_id}` : "/sessions";
    default:
      return "/notifications";
  }
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: raw } = await supabase
    .from("notifications")
    .select(`id, type, read, created_at, entity_id, actor:actor_id ( full_name, username, avatar_url )`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (raw ?? []) as unknown as NotificationItem[];
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <main className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button type="submit" className="text-sm text-primary hover:underline">
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
          <span className="text-4xl mb-3">🔔</span>
          <p className="font-medium">You&apos;re all caught up</p>
          <p className="text-sm mt-1">Notifications will appear here</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={notificationHref(n)}
                className={`flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-muted transition-colors ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{notificationLabel(n)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
