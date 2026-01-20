/*
  # Create Webinar Processing Schema

  ## Overview
  This migration creates the database schema for the Webinar Rev application, which processes webinar transcripts through AI to generate marketing deliverables.

  ## New Tables

  ### `jobs`
  Stores webinar processing jobs with their current status and metadata
  - `id` (uuid, primary key) - Unique identifier for the job
  - `title` (text) - Webinar title
  - `status` (text) - Current status: 'processing', 'completed', 'failed'
  - `progress` (integer) - Progress percentage (0-100)
  - `current_step` (text, nullable) - Current processing step (WR1-WR5)
  - `completed_steps` (text[]) - Array of completed step IDs
  - `created_at` (timestamptz) - When the job was created
  - `updated_at` (timestamptz) - Last update timestamp
  - `transcript` (text) - Original webinar transcript
  - `webinar_title` (text) - Title from intake form
  - `webinar_length` (integer, nullable) - Length in minutes
  - `webinar_date` (text, nullable) - When webinar was held
  - `target_audience` (text, nullable) - Target audience description
  - `brand_voice` (text, nullable) - Brand voice guidelines
  - `offer_details` (text, nullable) - Details about the offer
  - `speaker_names` (text, nullable) - Speaker names
  - `additional_notes` (text, nullable) - Additional context

  ### `deliverables`
  Stores generated content deliverables for each job
  - `id` (uuid, primary key) - Unique identifier
  - `job_id` (uuid, foreign key) - References jobs table
  - `step_id` (text) - Which step generated this (WR1-WR5)
  - `deliverable_type` (text) - Type of deliverable
  - `title` (text) - Display title
  - `content` (jsonb) - The actual deliverable content
  - `created_at` (timestamptz) - When generated
  - `updated_at` (timestamptz) - Last update

  ## Security
  - Enable Row Level Security (RLS) on both tables
  - Public access policies for now (no auth yet)
  - Future: Will be restricted to authenticated users only
*/

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  progress integer NOT NULL DEFAULT 0,
  current_step text,
  completed_steps text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  transcript text NOT NULL,
  webinar_title text NOT NULL,
  webinar_length integer,
  webinar_date text,
  target_audience text,
  brand_voice text,
  offer_details text,
  speaker_names text,
  additional_notes text
);

-- Create deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  deliverable_type text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_job_id ON deliverables(job_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_step_id ON deliverables(step_id);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (temporary - will be restricted once auth is added)
CREATE POLICY "Allow public read access to jobs"
  ON jobs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to jobs"
  ON jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to jobs"
  ON jobs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from jobs"
  ON jobs FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to deliverables"
  ON deliverables FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to deliverables"
  ON deliverables FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to deliverables"
  ON deliverables FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from deliverables"
  ON deliverables FOR DELETE
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deliverables_updated_at ON deliverables;
CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();