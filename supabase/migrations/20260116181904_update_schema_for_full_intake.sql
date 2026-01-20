/*
  # Update Schema for Full WebinarRev Intake

  1. Changes to jobs table
    - Add all new intake fields required by the spec:
      - clientName, brandName, offerDescription, primaryCTA, ctaLink
      - speakerName, speakerBio, offerPrice, proofPoints, topObjections
      - desiredTone, constraints, notes, youtubeUrl
    - Remove old fields that don't match new schema
  
  2. Changes to deliverables table
    - Update deliverable_type to support new types
    - Add quality_score and warnings columns
  
  3. Security
    - Maintain existing RLS policies
*/

-- Add new intake fields to jobs table
DO $$
BEGIN
  -- Client and brand info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'client_name') THEN
    ALTER TABLE jobs ADD COLUMN client_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'brand_name') THEN
    ALTER TABLE jobs ADD COLUMN brand_name text;
  END IF;
  
  -- Offer details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'offer_description') THEN
    ALTER TABLE jobs ADD COLUMN offer_description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'primary_cta') THEN
    ALTER TABLE jobs ADD COLUMN primary_cta text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'cta_link') THEN
    ALTER TABLE jobs ADD COLUMN cta_link text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'offer_price') THEN
    ALTER TABLE jobs ADD COLUMN offer_price text;
  END IF;
  
  -- Speaker info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'speaker_name') THEN
    ALTER TABLE jobs ADD COLUMN speaker_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'speaker_bio') THEN
    ALTER TABLE jobs ADD COLUMN speaker_bio text;
  END IF;
  
  -- Messaging components
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'proof_points') THEN
    ALTER TABLE jobs ADD COLUMN proof_points text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'top_objections') THEN
    ALTER TABLE jobs ADD COLUMN top_objections text[];
  END IF;
  
  -- Voice and style
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'desired_tone') THEN
    ALTER TABLE jobs ADD COLUMN desired_tone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'constraints') THEN
    ALTER TABLE jobs ADD COLUMN constraints text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'notes') THEN
    ALTER TABLE jobs ADD COLUMN notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'youtube_url') THEN
    ALTER TABLE jobs ADD COLUMN youtube_url text;
  END IF;
END $$;

-- Add quality tracking to deliverables table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'quality_score') THEN
    ALTER TABLE deliverables ADD COLUMN quality_score integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'warnings') THEN
    ALTER TABLE deliverables ADD COLUMN warnings text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'missing_inputs') THEN
    ALTER TABLE deliverables ADD COLUMN missing_inputs text[];
  END IF;
END $$;
