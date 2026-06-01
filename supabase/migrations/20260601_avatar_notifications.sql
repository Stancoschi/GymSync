-- ============================================================
-- Migration: avatar_url in profiles + notifications table
-- ============================================================

-- 1. Add avatar_url column to profiles (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'session_joined')),
  actor_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_id     UUID,   -- session_id / friend_request_id depending on type
  read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, read)
  WHERE read = FALSE;

-- 3. Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can mark their own notifications read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Supabase Storage: avatars bucket (run in SQL editor if not using CLI)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', TRUE)
-- ON CONFLICT DO NOTHING;

-- Storage RLS policies for avatars bucket:
-- SELECT (public): anyone can view avatars
-- INSERT / UPDATE: authenticated user can only upload to their own folder (user_id/*)
