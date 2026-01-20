export interface InputQualityResult {
  score: number;
  level: 'low' | 'medium' | 'high';
  risks: string[];
  recommendations: string[];
  metrics: {
    buildWordCount: number;
    buildCharCount: number;
    intakeWordCount: number;
    intakeCharCount: number;
    notesWordCount: number;
    notesCharCount: number;
  };
}

export interface GoodExample {
  title: string;
  description: string;
  example: string;
}

const THRESHOLDS = {
  build: {
    min_words: 500,
    recommended_words: 800,
    min_chars: 2500,
    weight: 0.6,
  },
  intake: {
    min_words: 200,
    recommended_words: 300,
    min_chars: 1000,
    weight: 0.25,
  },
  notes: {
    min_words: 20,
    recommended_words: 50,
    min_chars: 100,
    weight: 0.15,
  },
};

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countCharacters(text: string): number {
  if (!text) return 0;
  return text.trim().length;
}

export function assessInputQuality(
  buildTranscript: string,
  intakeTranscript: string,
  operatorNotes: string
): InputQualityResult {
  const buildWords = countWords(buildTranscript);
  const buildChars = countCharacters(buildTranscript);
  const intakeWords = countWords(intakeTranscript);
  const intakeChars = countCharacters(intakeTranscript);
  const notesWords = countWords(operatorNotes);
  const notesChars = countCharacters(operatorNotes);

  const risks: string[] = [];
  const recommendations: string[] = [];

  let buildScore = 0;
  if (buildWords === 0) {
    risks.push('Build transcript is empty - pipeline will fail');
    buildScore = 0;
  } else if (buildWords < THRESHOLDS.build.min_words) {
    risks.push(`Build transcript too short (${buildWords} words, minimum ${THRESHOLDS.build.min_words})`);
    buildScore = (buildWords / THRESHOLDS.build.min_words) * 50;
  } else if (buildWords < THRESHOLDS.build.recommended_words) {
    recommendations.push(`Build transcript is below recommended length (${buildWords}/${THRESHOLDS.build.recommended_words} words)`);
    buildScore = 50 + ((buildWords - THRESHOLDS.build.min_words) / (THRESHOLDS.build.recommended_words - THRESHOLDS.build.min_words)) * 50;
  } else {
    buildScore = 100;
  }

  let intakeScore = 0;
  if (intakeWords === 0) {
    recommendations.push('Intake transcript not provided - using build transcript only');
    intakeScore = 50;
  } else if (intakeWords < THRESHOLDS.intake.min_words) {
    recommendations.push(`Intake transcript could be more detailed (${intakeWords}/${THRESHOLDS.intake.recommended_words} words)`);
    intakeScore = 50 + (intakeWords / THRESHOLDS.intake.min_words) * 50;
  } else if (intakeWords < THRESHOLDS.intake.recommended_words) {
    intakeScore = 75 + ((intakeWords - THRESHOLDS.intake.min_words) / (THRESHOLDS.intake.recommended_words - THRESHOLDS.intake.min_words)) * 25;
  } else {
    intakeScore = 100;
  }

  let notesScore = 0;
  if (notesWords === 0) {
    recommendations.push('Operator notes not provided - consider adding context or special instructions');
    notesScore = 50;
  } else if (notesWords < THRESHOLDS.notes.min_words) {
    recommendations.push(`Operator notes are brief (${notesWords}/${THRESHOLDS.notes.recommended_words} words)`);
    notesScore = 50 + (notesWords / THRESHOLDS.notes.min_words) * 50;
  } else if (notesWords < THRESHOLDS.notes.recommended_words) {
    notesScore = 75 + ((notesWords - THRESHOLDS.notes.min_words) / (THRESHOLDS.notes.recommended_words - THRESHOLDS.notes.min_words)) * 25;
  } else {
    notesScore = 100;
  }

  const weightedScore = Math.round(
    buildScore * THRESHOLDS.build.weight +
    intakeScore * THRESHOLDS.intake.weight +
    notesScore * THRESHOLDS.notes.weight
  );

  let level: 'low' | 'medium' | 'high';
  if (weightedScore < 50) {
    level = 'low';
  } else if (weightedScore < 75) {
    level = 'medium';
  } else {
    level = 'high';
  }

  if (buildWords > 0 && buildWords < THRESHOLDS.build.recommended_words) {
    recommendations.push('Add more context from the webinar recording to reach 800+ words');
  }

  if (intakeWords > 0 && intakeWords < THRESHOLDS.intake.recommended_words) {
    recommendations.push('Expand intake notes with client goals, audience details, and key requirements');
  }

  if (notesWords > 0 && notesWords < THRESHOLDS.notes.recommended_words) {
    recommendations.push('Add operator insights about tone, style preferences, or special considerations');
  }

  return {
    score: weightedScore,
    level,
    risks,
    recommendations,
    metrics: {
      buildWordCount: buildWords,
      buildCharCount: buildChars,
      intakeWordCount: intakeWords,
      intakeCharCount: intakeChars,
      notesWordCount: notesWords,
      notesCharCount: notesChars,
    },
  };
}

export const BUILD_TRANSCRIPT_EXAMPLES: GoodExample[] = [
  {
    title: 'Webinar Recording Transcript',
    description: 'Full transcript from the actual webinar recording with speaker content',
    example: `[Speaker introduction]
Welcome everyone to today's webinar on accelerating sales pipeline with automation...

[Main content]
The three pillars we'll cover today are: qualification, nurturing, and conversion...
Let me share a story about one of our clients who struggled with manual follow-ups...

[Demonstration section]
As you can see on my screen, when a lead enters the system...

[Q&A section]
Great question about integration with existing CRM systems...

[Closing]
Thank you all for joining. Remember, the key takeaway is...`,
  },
  {
    title: 'Podcast Episode Transcript',
    description: 'Transcript from a podcast discussing the topic in depth',
    example: `Host: Today we're diving into the world of automated sales with our guest...

Guest: Thanks for having me. I've been in B2B sales for 15 years and the shift to automation has been remarkable...

Host: Walk us through what that looks like in practice...

Guest: Absolutely. Imagine a lead comes in at 2 AM on Saturday. In the old model, they'd wait until Monday...`,
  },
];

export const INTAKE_TRANSCRIPT_EXAMPLES: GoodExample[] = [
  {
    title: 'Client Intake Call Notes',
    description: 'Notes from initial call with client discussing their needs and goals',
    example: `Client: Sarah Johnson, VP Sales at TechCorp
Company: B2B SaaS, $50M ARR, 200 employees

Webinar Goal: Generate 500+ qualified leads for their new enterprise tier
Target Audience: VP/Director of Sales at companies with 50-500 employees
Pain Point: Current manual sales process can't scale with growth
Desired Outcome: Book 50+ demos within 2 weeks of webinar

Key Requirements:
- Professional, data-driven tone
- Must include ROI calculator
- Case study from similar company
- Integration with Salesforce
- Offer: Free 30-day trial + setup consultation`,
  },
  {
    title: 'Project Brief Summary',
    description: 'Written brief provided by client or extracted from email/documents',
    example: `Project: Sales Automation Webinar
Client: TechCorp
Date: March 15, 2024

Objectives:
1. Position TechCorp as thought leader in sales automation
2. Demonstrate platform capabilities
3. Generate qualified leads for Q2 pipeline

Audience Profile:
- Job titles: VP/Director of Sales, Revenue Ops
- Company size: 50-500 employees
- Industry: B2B SaaS, Professional Services
- Pain: Manual processes, lack of visibility, slow follow-up

Unique Selling Points:
- AI-powered lead scoring (patent pending)
- Native integrations with all major CRMs
- 10x faster implementation than competitors
- $2.1M average revenue lift (based on customer data)`,
  },
];

export interface MissingSettingsResult {
  missingSettings: string[];
  hasMissingSettings: boolean;
}

export function getMissingRecommendedSettings(
  operatorSettings: {
    sender_name?: string;
    sender_email?: string;
    reply_to_email?: string;
    primary_cta_link?: string;
    registration_link?: string;
  } | undefined,
  ctaMode: string
): MissingSettingsResult {
  const missing: string[] = [];

  if (!operatorSettings?.sender_name) {
    missing.push('Sender Name (for emails)');
  }
  if (!operatorSettings?.sender_email) {
    missing.push('Sender Email (for emails)');
  }

  if (ctaMode === 'book_call' || ctaMode === 'hybrid') {
    if (!operatorSettings?.primary_cta_link) {
      missing.push('Primary CTA Link (booking page)');
    }
  }

  if (ctaMode === 'buy_now' || ctaMode === 'hybrid') {
    if (!operatorSettings?.primary_cta_link) {
      missing.push('Primary CTA Link (purchase page)');
    }
    if (!operatorSettings?.registration_link) {
      missing.push('Registration Link');
    }
  }

  return {
    missingSettings: missing,
    hasMissingSettings: missing.length > 0,
  };
}

export const OPERATOR_NOTES_EXAMPLES: GoodExample[] = [
  {
    title: 'Style & Tone Guidance',
    description: 'Operator observations about preferred style and special considerations',
    example: `Tone: Professional but conversational - client emphasized "no corporate speak"

Special Instructions:
- Client is sensitive about competitor mentions (avoid direct names)
- Strong preference for data-driven claims with citations
- Wants warm, friendly speaker bio (not stuffy exec bio)

Visual Brand:
- Primary color: Navy blue (#1a365d)
- Avoid red/orange (competitor colors)
- Prefers charts over bullet lists

Audience Considerations:
- This audience is technical - don't oversimplify
- They've seen generic webinars - needs to feel fresh
- Time-constrained, so value density over entertainment`,
  },
  {
    title: 'Context & Constraints',
    description: 'Important context that affects deliverable creation',
    example: `Timeline: Tight - webinar goes live in 10 days

Constraints:
- Cannot promise specific ROI numbers (legal review required)
- Must include disclaimer about results varying
- CTA needs legal-approved language (see shared doc)

Assets Available:
- 3 customer case studies (need to pick best one)
- 12 testimonial quotes
- Q3 benchmark report (fresh data)

Client Quirks:
- CEO will personally review everything
- They're picky about grammar and style consistency
- Previous vendor delivered generic content - they hated it`,
  },
];
