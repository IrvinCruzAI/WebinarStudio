/*
  # Update Schema for New WebinarRev Intake Structure

  1. Changes to jobs table
    - Rename and update fields to match new WebinarIntake interface:
      - company (replaces brand_name)
      - offer (replaces offer_description)
      - tone (replaces desired_tone)
      - primary_cta_type (replaces primary_cta)
      - primary_cta_link (replaces cta_link)
      - speaker_title (replaces speaker_bio)
    - Remove obsolete fields: proof_points, top_objections, offer_price, constraints
    - Add QA tracking fields

  2. Security
    - Maintain existing RLS policies
*/

DO $$
BEGIN
  -- Add company column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'company') THEN
    ALTER TABLE jobs ADD COLUMN company text;
  END IF;

  -- Add offer column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'offer') THEN
    ALTER TABLE jobs ADD COLUMN offer text;
  END IF;

  -- Add tone column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'tone') THEN
    ALTER TABLE jobs ADD COLUMN tone text;
  END IF;

  -- Add primary_cta_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'primary_cta_type') THEN
    ALTER TABLE jobs ADD COLUMN primary_cta_type text;
  END IF;

  -- Add primary_cta_link column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'primary_cta_link') THEN
    ALTER TABLE jobs ADD COLUMN primary_cta_link text;
  END IF;

  -- Add speaker_title column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'speaker_title') THEN
    ALTER TABLE jobs ADD COLUMN speaker_title text;
  END IF;

  -- Add QA tracking fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'qa_assumptions') THEN
    ALTER TABLE jobs ADD COLUMN qa_assumptions text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'qa_placeholders') THEN
    ALTER TABLE jobs ADD COLUMN qa_placeholders text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'qa_claims_requiring_proof') THEN
    ALTER TABLE jobs ADD COLUMN qa_claims_requiring_proof text[];
  END IF;

  -- Add error column for failed jobs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'error') THEN
    ALTER TABLE jobs ADD COLUMN error text;
  END IF;
END $$;

-- Migrate existing data if columns exist
DO $$
BEGIN
  -- Migrate brand_name to company
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'brand_name') THEN
    UPDATE jobs SET company = brand_name WHERE company IS NULL AND brand_name IS NOT NULL;
  END IF;

  -- Migrate offer_description to offer
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'offer_description') THEN
    UPDATE jobs SET offer = offer_description WHERE offer IS NULL AND offer_description IS NOT NULL;
  END IF;

  -- Migrate desired_tone to tone
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'desired_tone') THEN
    UPDATE jobs SET tone = desired_tone WHERE tone IS NULL AND desired_tone IS NOT NULL;
  END IF;

  -- Migrate primary_cta to primary_cta_type
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'primary_cta') THEN
    UPDATE jobs SET primary_cta_type = primary_cta WHERE primary_cta_type IS NULL AND primary_cta IS NOT NULL;
  END IF;

  -- Migrate cta_link to primary_cta_link
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'cta_link') THEN
    UPDATE jobs SET primary_cta_link = cta_link WHERE primary_cta_link IS NULL AND cta_link IS NOT NULL;
  END IF;

  -- Migrate speaker_bio to speaker_title (this is a best-effort migration, bio != title)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'speaker_bio') THEN
    UPDATE jobs SET speaker_title = speaker_bio WHERE speaker_title IS NULL AND speaker_bio IS NOT NULL;
  END IF;
END $$;
