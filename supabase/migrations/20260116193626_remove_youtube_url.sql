/*
  # Remove YouTube URL Column

  1. Changes to jobs table
    - Remove youtube_url column if it exists

  2. Security
    - No RLS changes needed
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'youtube_url'
  ) THEN
    ALTER TABLE jobs DROP COLUMN youtube_url;
  END IF;
END $$;
