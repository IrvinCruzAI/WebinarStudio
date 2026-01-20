import {
  DeliverableId,
  ProjectStatus,
  CTA,
  AudienceTemperature,
} from './enums';

export interface OperatorSettings {
  sender_name?: string;
  sender_email?: string;
  reply_to_email?: string;
  primary_cta_link?: string;
  registration_link?: string;
}

export interface ProjectMetadata {
  project_id: string;
  run_id: string;
  title: string;
  status: ProjectStatus;
  created_at: number;
  updated_at: number;
  settings: {
    cta_mode: CTA;
    audience_temperature: AudienceTemperature;
    webinar_length_minutes: number;
    client_name?: string;
    speaker_name?: string;
    company_name?: string;
    contact_email?: string;
    operator?: OperatorSettings;
  };
  deliverable_pointers: {
    [key in DeliverableId]?: {
      artifact_id: string;
      validated: boolean;
      generated_at: number;
      edited_at?: number;
    };
  };
}

export interface TranscriptData {
  intake_transcript?: string;
  build_transcript: string;
  operator_notes?: string;
  created_at: number;
}

export interface NormalizationChange {
  type: 'id_padding' | 'field_removal' | 'type_coercion' | 'array_sort' | 'phase_fix';
  path: string;
  before: unknown;
  after: unknown;
  description: string;
}

export interface NormalizationLog {
  deliverableId: string;
  timestamp: number;
  changes: NormalizationChange[];
  totalChanges: number;
}

export interface ArtifactData {
  content: unknown;
  validated: boolean;
  generated_at: number;
  edited_at?: number;
  normalization_log?: NormalizationLog;
}

export interface ExportEligibility {
  canExport: boolean;
  readiness_score: number;
  pass: boolean;
  blocking_reasons: string[];
  validation_results: Record<string, { ok: boolean; errors: string[] }>;
  placeholder_scan: {
    total_count: number;
    critical_count: number;
    locations: Array<{
      artifact_id: string;
      field_path: string;
      placeholder_text: string;
      is_critical: boolean;
    }>;
  };
}
