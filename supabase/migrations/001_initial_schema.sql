-- RoSummary — Initial Schema
-- Run this once in Supabase SQL Editor: https://supabase.com/dashboard/project/qanimnkmimiuynugckpo/sql

-- meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nueva Reunión',
  date TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  audio_url TEXT,
  transcript TEXT,
  summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  participants TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'ready', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat messages per meeting
CREATE TABLE IF NOT EXISTS meeting_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_meetings" ON meetings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_messages" ON meeting_messages
  FOR ALL USING (
    meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid())
  ) WITH CHECK (
    meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS meetings_user_id_idx ON meetings(user_id);
CREATE INDEX IF NOT EXISTS meetings_date_idx ON meetings(date DESC);
CREATE INDEX IF NOT EXISTS meeting_messages_meeting_id_idx ON meeting_messages(meeting_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meetings_updated_at ON meetings;
CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-audio', 'meeting-audio', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users_upload_audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'meeting-audio' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_read_own_audio" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'meeting-audio' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_delete_own_audio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'meeting-audio' AND auth.uid()::text = (storage.foldername(name))[1]
  );
