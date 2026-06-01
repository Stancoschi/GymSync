import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/types/database";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  actorId?: string;
  entityId?: string;
}

/**
 * Creates a notification for a user.
 * Silent — never throws so callers don't break if this fails.
 */
export async function createNotification({
  userId,
  type,
  actorId,
  entityId,
}: CreateNotificationParams): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      actor_id: actorId ?? null,
      entity_id: entityId ?? null,
      read: false,
    });
  } catch {
    // Swallow — notifications are non-critical
  }
}
