import { z } from 'zod';

export const QAReportSchema = z.object({
  assumptions: z.array(z.string()),
  placeholders: z.array(z.string()),
  claimsRequiringProof: z.array(z.string()),
});

export const StepMetaSchema = z.object({
  model: z.string(),
  generatedAtISO: z.string(),
  version: z.string(),
});

export const WR1Schema = z.object({
  meta: StepMetaSchema,
  parsedIntake: z.object({
    clientName: z.string().optional(),
    company: z.string().optional(),
    webinarTitle: z.string().optional(),
    offer: z.string().optional(),
    targetAudience: z.string().optional(),
    tone: z.enum(['Professional', 'Friendly', 'Direct', 'Bold']).optional(),
    primaryCTAType: z.enum(['book_call', 'buy', 'waitlist', 'download']).optional(),
    speakerName: z.string().optional(),
    speakerTitle: z.string().optional(),
  }).passthrough(),
  cleanedTranscript: z.string(),
  structuredNotes: z.array(z.string()),
  mainThemes: z.array(z.string()),
  speakerInsights: z.array(z.string()),
  qa: QAReportSchema,
});

export const WR2Schema = z.object({
  meta: StepMetaSchema,
  oneLineValue: z.string(),
  keyTakeaways: z.array(z.string()),
  contentOutline: z.array(
    z.object({
      section: z.string(),
      duration: z.string(),
      keyPoints: z.array(z.string()),
    })
  ),
  audienceProfile: z.string(),
  recommendedAngles: z.array(z.string()),
  qa: QAReportSchema,
});

export const WR3Schema = z.object({
  meta: StepMetaSchema,
  totalDuration: z.number(),
  segments: z.array(
    z.object({
      startTime: z.string(),
      duration: z.number(),
      segment: z.string(),
      description: z.string(),
      speakerNotes: z.string(),
      ctaMoment: z.boolean().optional(),
      transition: z.string().optional(),
    })
  ),
  qa: QAReportSchema,
});

export const WR4Schema = z.object({
  meta: z.object({
    version: z.string(),
    tone: z.enum(['Professional', 'Friendly', 'Direct', 'Bold']),
    primary_cta_type: z.enum(['book_call', 'buy', 'waitlist', 'download']),
    primary_cta_link_placeholder: z.string(),
    webinar_title: z.string(),
    audience_summary: z.string(),
  }),
  variables: z.object({
    client_name: z.string(),
    company: z.string(),
    speaker_name: z.string(),
    speaker_title: z.string(),
    webinar_date: z.string(),
    webinar_time: z.string(),
    webinar_length_minutes: z.number(),
    offer: z.string(),
    cta_link: z.string(),
  }),
  landing_page: z.object({
    headlines: z.array(z.string()).min(1),
    subheads: z.array(z.string()).min(1),
    hero_bullets: z.array(z.string()).min(1),
    what_youll_learn: z.array(z.string()).min(1),
    who_its_for: z.array(z.string()).min(1),
    who_its_not_for: z.array(z.string()).min(1),
    agenda_preview: z.array(
      z.object({
        segment: z.string(),
        timebox_minutes: z.number(),
        promise: z.string(),
      })
    ).min(1),
    speaker_bio: z.object({
      one_liner: z.string(),
      credibility_bullets: z.array(z.string()).min(1),
    }),
    proof_blocks: z.array(
      z.object({
        type: z.enum(['testimonial', 'metric', 'case_study']),
        content: z.string(),
        needs_source: z.boolean(),
      })
    ).min(1),
    cta_blocks: z.array(
      z.object({
        headline: z.string(),
        body: z.string(),
        button_label: z.string(),
      })
    ).min(1),
    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ).min(1),
    compliance_notes: z.array(z.string()).default([]),
  }),
  email_campaign: z.object({
    send_rules: z.object({
      from_name_placeholder: z.string(),
      from_email_placeholder: z.string(),
      reply_to_placeholder: z.string(),
    }),
    emails: z.array(
      z.object({
        id: z.string(),
        timing: z.string(),
        subject: z.string(),
        preview_text: z.string(),
        body_markdown: z.string(),
        primary_cta_label: z.string(),
        primary_cta_link_placeholder: z.string(),
      })
    ).min(4),
  }),
  social_promo: z.object({
    linkedin_posts: z.array(
      z.object({
        id: z.string(),
        hook: z.string(),
        body: z.string(),
        cta_line: z.string(),
      })
    ).min(2),
    x_posts: z.array(
      z.object({
        id: z.string(),
        body: z.string(),
      })
    ).min(2),
    last_chance_blurbs: z.array(
      z.object({
        id: z.string(),
        body: z.string(),
      })
    ).min(1),
  }),
  sms_optional: z.object({
    enabled: z.boolean(),
    messages: z.array(
      z.object({
        timing: z.string(),
        body: z.string(),
      })
    ).optional().default([]),
  }),
  qa: QAReportSchema,
});

export const WR5Schema = z.object({
  meta: StepMetaSchema,
  preWebinar: z.array(
    z.object({
      task: z.string(),
      timing: z.string(),
      completed: z.boolean().optional(),
    })
  ),
  duringWebinar: z.array(
    z.object({
      task: z.string(),
      timing: z.string(),
      completed: z.boolean().optional(),
    })
  ),
  postWebinar: z.array(
    z.object({
      task: z.string(),
      timing: z.string(),
      completed: z.boolean().optional(),
    })
  ),
  qa: QAReportSchema,
});
