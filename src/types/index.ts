export type ToneOption = 'Professional' | 'Friendly' | 'Direct' | 'Bold';
export type CTAOption = 'book_call' | 'buy' | 'waitlist' | 'download';

export interface WebinarIntake {
  clientName: string;
  company: string;
  webinarTitle: string;
  offer: string;
  targetAudience: string;
  tone: ToneOption;
  primaryCTAType: CTAOption;
  primaryCTALink?: string;
  webinarDate?: string;
  webinarLengthMinutes?: number;
  speakerName?: string;
  speakerTitle?: string;
  notes?: string;
  transcript?: string;
}

export interface QAReport {
  assumptions: string[];
  placeholders: string[];
  claimsRequiringProof: string[];
}

export interface StepMeta {
  model: string;
  generatedAtISO: string;
  version: string;
}

export interface WR1NormalizedContent {
  meta: StepMeta;
  parsedIntake: Partial<WebinarIntake>;
  cleanedTranscript: string;
  structuredNotes: string[];
  mainThemes: string[];
  speakerInsights: string[];
  qa: QAReport;
}

export interface WR2ContentSummary {
  meta: StepMeta;
  oneLineValue: string;
  keyTakeaways: string[];
  contentOutline: {
    section: string;
    duration: string;
    keyPoints: string[];
  }[];
  audienceProfile: string;
  recommendedAngles: string[];
  qa: QAReport;
}

export interface WR3RunOfShow {
  meta: StepMeta;
  totalDuration: number;
  segments: {
    startTime: string;
    duration: number;
    segment: string;
    description: string;
    speakerNotes: string;
    ctaMoment?: boolean;
    transition?: string;
  }[];
  qa: QAReport;
}

export interface WR4CopyPack {
  meta: {
    version: string;
    tone: ToneOption;
    primary_cta_type: CTAOption;
    primary_cta_link_placeholder: string;
    webinar_title: string;
    audience_summary: string;
  };
  variables: {
    client_name: string;
    company: string;
    speaker_name: string;
    speaker_title: string;
    webinar_date: string;
    webinar_time: string;
    webinar_length_minutes: number;
    offer: string;
    cta_link: string;
  };
  landing_page: {
    headlines: string[];
    subheads: string[];
    hero_bullets: string[];
    what_youll_learn: string[];
    who_its_for: string[];
    who_its_not_for: string[];
    agenda_preview: {
      segment: string;
      timebox_minutes: number;
      promise: string;
    }[];
    speaker_bio: {
      one_liner: string;
      credibility_bullets: string[];
    };
    proof_blocks: {
      type: 'testimonial' | 'metric' | 'case_study';
      content: string;
      needs_source: boolean;
    }[];
    cta_blocks: {
      headline: string;
      body: string;
      button_label: string;
    }[];
    faq: {
      question: string;
      answer: string;
    }[];
    compliance_notes: string[];
  };
  email_campaign: {
    send_rules: {
      from_name_placeholder: string;
      from_email_placeholder: string;
      reply_to_placeholder: string;
    };
    emails: {
      id: string;
      timing: string;
      subject: string;
      preview_text: string;
      body_markdown: string;
      primary_cta_label: string;
      primary_cta_link_placeholder: string;
    }[];
  };
  social_promo: {
    linkedin_posts: {
      id: string;
      hook: string;
      body: string;
      cta_line: string;
    }[];
    x_posts: {
      id: string;
      body: string;
    }[];
    last_chance_blurbs: {
      id: string;
      body: string;
    }[];
  };
  sms_optional: {
    enabled: boolean;
    messages: {
      timing: string;
      body: string;
    }[];
  };
  qa: QAReport;
}

export interface WR5Checklist {
  meta: StepMeta;
  preWebinar: {
    task: string;
    timing: string;
    completed?: boolean;
  }[];
  duringWebinar: {
    task: string;
    timing: string;
    completed?: boolean;
  }[];
  postWebinar: {
    task: string;
    timing: string;
    completed?: boolean;
  }[];
  qa: QAReport;
}

export interface ProcessingResult {
  stepId: 'WR1' | 'WR2' | 'WR3' | 'WR4' | 'WR5';
  deliverableType: string;
  title: string;
  content: WR1NormalizedContent | WR2ContentSummary | WR3RunOfShow | WR4CopyPack | WR5Checklist;
}

export interface Job {
  id: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string | null;
  completedSteps: string[];
  results: ProcessingResult[];
  createdAt: string;
  intake: WebinarIntake;
  transcript: string;
  qa: QAReport;
  error?: string;
}

export interface DeliverableDefinition {
  id: string;
  stepId: 'WR1' | 'WR2' | 'WR3' | 'WR4' | 'WR5';
  name: string;
  description: string;
}

export interface DeliverableStatus {
  id: string;
  name: string;
  status: 'queued' | 'active' | 'completed' | 'error';
}

export interface JobContextType {
  jobs: Job[];
  activeJob: string | null;
  createJob: (intake: WebinarIntake, transcript: string) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  retryJob: (id: string) => Promise<void>;
  regenerateDeliverable: (jobId: string, stepId: 'WR2' | 'WR3' | 'WR4' | 'WR5') => Promise<void>;
  setActiveJob: (id: string | null) => void;
  loadJobsFromStorage: () => Promise<void>;
}

export interface CompletenessCheck {
  score: number;
  totalFields: number;
  filledFields: number;
  requiredMissing: string[];
  optionalMissing: string[];
  warnings: string[];
}
