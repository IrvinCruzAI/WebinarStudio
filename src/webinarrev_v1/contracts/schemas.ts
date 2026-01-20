import { z } from 'zod';
import {
  BlockIdEnum,
  BlockPhaseEnum,
  CTAEnum,
  RiskFlagEnum,
} from './enums';

export const QAReportSchema = z.object({
  assumptions: z.array(z.string()),
  placeholders: z.array(z.string()),
  claims_requiring_proof: z.array(z.string()),
}).strict();

export type QAReport = z.infer<typeof QAReportSchema>;

export const PreflightAISchema = z.object({
  status: z.enum(['can_proceed', 'blocked']),
  readiness: z.object({
    score: z.number().int().min(0).max(100),
    rationale: z.string().min(1),
  }).strict(),
  missing_context: z.array(z.object({
    field: z.string(),
    why_it_matters: z.string(),
    example_answer: z.string(),
  }).strict()),
  assumptions: z.array(z.string()),
  recommended_questions: z.array(z.string()),
}).strict();

export const PreflightStoredSchema = PreflightAISchema.extend({
  risk_flags: z.array(RiskFlagEnum),
}).strict();

export type PreflightStored = z.infer<typeof PreflightStoredSchema>;

export const ExecutiveSummarySchema = z.object({
  overview: z.string(),
  key_points: z.array(z.string()),
}).strict();

export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>;

export const WR1Schema = z.object({
  parsed_intake: z.object({
    client_name: z.string().nullable(),
    company: z.string().nullable(),
    webinar_title: z.string().nullable(),
    offer: z.string().nullable(),
    target_audience: z.string().nullable(),
    tone: z.string().nullable(),
    primary_cta_type: CTAEnum.nullable(),
    speaker_name: z.string().nullable(),
    speaker_title: z.string().nullable(),
  }).strict(),
  executive_summary: ExecutiveSummarySchema.optional(),
  edited_fields: z.array(z.string()).optional(),
  cleaned_transcript: z.string(),
  structured_notes: z.array(z.string()),
  main_themes: z.array(z.string()),
  speaker_insights: z.array(z.string()),
  proof_points: z.array(z.object({
    type: z.enum(['testimonial', 'metric', 'case_study']),
    content: z.string(),
    source: z.string().nullable(),
  }).strict()),
  qa: QAReportSchema,
}).strict();

export type WR1 = z.infer<typeof WR1Schema>;

export const WR2BlockSchema = z.object({
  block_id: BlockIdEnum,
  phase: BlockPhaseEnum,
  title: z.string(),
  purpose: z.string(),
  talk_track_md: z.string(),
  speaker_notes_md: z.string(),
  transition_in: z.string(),
  transition_out: z.string(),
  timebox_minutes: z.number().int().min(1).max(60),
  proof_insertion_points: z.array(z.string()),
  objections_handled: z.array(z.string()),
}).strict();

export type WR2Block = z.infer<typeof WR2BlockSchema>;

export const WR2Schema = z.object({
  blocks: z.array(WR2BlockSchema).length(21),
  qa: QAReportSchema,
}).strict();

export type WR2 = z.infer<typeof WR2Schema>;

export const WR3Schema = z.object({
  hero_headline: z.string(),
  subheadline: z.string(),
  bullets: z.array(z.string()).min(3).max(7),
  agenda_preview: z.array(z.object({
    segment: z.string(),
    timebox_minutes: z.number().int(),
    promise: z.string(),
  }).strict()),
  proof_blocks: z.array(z.object({
    type: z.enum(['testimonial', 'metric', 'case_study']),
    content: z.string(),
    needs_source: z.boolean(),
  }).strict()),
  speaker_bio: z.object({
    one_liner: z.string(),
    credibility_bullets: z.array(z.string()),
  }).strict(),
  cta_block: z.object({
    headline: z.string(),
    body: z.string(),
    button_label: z.string(),
    link_placeholder: z.string(),
  }).strict(),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  }).strict()),
  who_its_for: z.array(z.string()),
  who_its_not_for: z.array(z.string()),
  legal_disclaimer_md: z.string(),
  qa: QAReportSchema,
}).strict();

export type WR3 = z.infer<typeof WR3Schema>;

export const WR4EmailSchema = z.object({
  email_id: z.string().regex(/^E(0[1-9]|10)$/),
  timing: z.string(),
  subject: z.string(),
  preview_text: z.string(),
  body_markdown: z.string(),
  primary_cta_label: z.string(),
  primary_cta_link_placeholder: z.string(),
}).strict();

export const WR4Schema = z.object({
  send_rules: z.object({
    from_name_placeholder: z.string(),
    from_email_placeholder: z.string(),
    reply_to_placeholder: z.string(),
  }).strict(),
  emails: z.array(WR4EmailSchema).min(8).max(10),
  qa: QAReportSchema,
}).strict();

export type WR4 = z.infer<typeof WR4Schema>;

export const WR5Schema = z.object({
  linkedin_posts: z.array(z.object({
    social_id: z.string().regex(/^S(0[1-9]|1[0-8])$/),
    hook: z.string(),
    body: z.string(),
    cta_line: z.string(),
  }).strict()).min(3).max(8),
  x_posts: z.array(z.object({
    social_id: z.string().regex(/^S(0[1-9]|1[0-8])$/),
    body: z.string(),
  }).strict()).min(2).max(6),
  last_chance_blurbs: z.array(z.object({
    social_id: z.string().regex(/^S(0[1-9]|1[0-8])$/),
    body: z.string(),
  }).strict()).min(1).max(4),
  qa: QAReportSchema,
}).strict();

export type WR5 = z.infer<typeof WR5Schema>;

export const WR6TimelineSegmentSchema = z.object({
  start_minute: z.number().int().min(0),
  end_minute: z.number().int().min(1),
  segment_title: z.string(),
  block_id: BlockIdEnum,
  description: z.string(),
  coach_cue: z.string(),
  fallback_if_cold: z.string(),
  time_check: z.string(),
}).strict();

export const WR6Schema = z.object({
  total_duration_minutes: z.number().int().min(15).max(180),
  timeline: z.array(WR6TimelineSegmentSchema).min(1),
  qa: QAReportSchema,
}).strict();

export type WR6 = z.infer<typeof WR6Schema>;

export const WR7ChecklistItemSchema = z.object({
  checklist_id: z.string().regex(/^CL_(pre|live|post)_\d{3}$/),
  task: z.string(),
  timing: z.string(),
  notes: z.string(),
}).strict();

export const WR7Schema = z.object({
  pre_webinar: z.array(WR7ChecklistItemSchema),
  live_webinar: z.array(WR7ChecklistItemSchema),
  post_webinar: z.array(WR7ChecklistItemSchema),
  qa: QAReportSchema,
}).strict();

export type WR7 = z.infer<typeof WR7Schema>;

export const WR8Schema = z.object({
  gamma_prompt: z.string().min(100),
  slide_count_recommendation: z.number().int().min(5).max(50),
  visual_direction: z.string(),
  key_slides: z.array(z.object({
    slide_number: z.number().int(),
    title: z.string(),
    purpose: z.string(),
    content_points: z.array(z.string()),
  }).strict()),
  qa: QAReportSchema,
}).strict();

export type WR8 = z.infer<typeof WR8Schema>;

export const ValidationResultSchema = z.object({
  ok: z.boolean(),
  errors: z.array(z.string()),
}).strict();

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const PlaceholderLocationSchema = z.object({
  artifact_id: z.string(),
  field_path: z.string(),
  placeholder_text: z.string(),
  is_critical: z.boolean(),
}).strict();

export type PlaceholderLocation = z.infer<typeof PlaceholderLocationSchema>;

export const PlaceholderScanResultSchema = z.object({
  total_count: z.number().int().min(0),
  critical_count: z.number().int().min(0),
  locations: z.array(PlaceholderLocationSchema),
}).strict();

export type PlaceholderScanResult = z.infer<typeof PlaceholderScanResultSchema>;

export const WR9Schema = z.object({
  readiness_score: z.number().int().min(0).max(100),
  pass: z.boolean(),
  blocking_reasons: z.array(z.string()),
  validation_results: z.record(ValidationResultSchema),
  placeholder_scan: PlaceholderScanResultSchema,
  recommended_next_actions: z.array(z.string()),
}).strict();

export type WR9 = z.infer<typeof WR9Schema>;
