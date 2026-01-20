import { runOpenRouterStep } from './openRouterApi';
import { processingSteps } from '../constants';
import { ProcessingResult, WebinarIntake, QAReport } from '../types';
import { useJobContext } from '../context/JobContext';
import { WR1Schema, WR2Schema, WR3Schema, WR4Schema, WR5Schema } from './schemas';
import { z } from 'zod';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function validateAndRepair<T>(
  rawOutput: any,
  schema: z.ZodSchema<T>,
  stepId: string,
  context: any
): Promise<T> {
  try {
    return schema.parse(rawOutput);
  } catch (error) {
    console.warn(`Validation failed for ${stepId}, attempting repair...`, error);

    const repairPrompt = `The previous JSON output failed validation. Here are the errors:

${error instanceof z.ZodError ? JSON.stringify(error.errors, null, 2) : String(error)}

INVALID OUTPUT:
${JSON.stringify(rawOutput, null, 2)}

Please return a CORRECTED JSON object that matches the required schema exactly. Output only valid JSON with no markdown fences or commentary.`;

    const repairResult = await runOpenRouterStep(`${stepId}-repair`, {
      ...context,
      systemPrompt: repairPrompt
    });

    return schema.parse(repairResult);
  }
}

export const startProcessingJob = async (
  jobId: string,
  intake: WebinarIntake,
  transcript: string
) => {
  const { updateJob } = useJobContext.getState();

  let results: ProcessingResult[] = [];
  let globalQA: QAReport = {
    assumptions: [],
    placeholders: [],
    claimsRequiringProof: []
  };

  console.log(`[Job ${jobId}] Starting processing job...`);

  try {
    console.log(`[Job ${jobId}] Starting WR1: Parse & Normalize`);
    await updateJob(jobId, {
      currentStep: 'WR1: Parse & Normalize',
      progress: 5
    });

    const wr1Prompt = `You are an expert intake analyst. Parse and normalize the webinar transcript and intake form data.

Return ONLY valid JSON matching this EXACT structure:
{
  "meta": {
    "model": "string",
    "generatedAtISO": "ISO 8601 date",
    "version": "1.0"
  },
  "parsedIntake": {
    "clientName": "string or null if not found",
    "company": "string or null",
    "webinarTitle": "string or null",
    "offer": "string or null",
    "targetAudience": "string or null",
    "tone": "Professional | Friendly | Direct | Bold or null",
    "primaryCTAType": "book_call | buy | waitlist | download or null",
    "speakerName": "string or null",
    "speakerTitle": "string or null"
  },
  "cleanedTranscript": "cleaned transcript text",
  "structuredNotes": ["bullet point 1", "bullet point 2"],
  "mainThemes": ["theme 1", "theme 2", "theme 3"],
  "speakerInsights": ["insight 1", "insight 2"],
  "qa": {
    "assumptions": ["assumption 1 if any"],
    "placeholders": ["field name that needs filling"],
    "claimsRequiringProof": ["claim that needs evidence"]
  }
}

EXTRACTION RULES:
- Extract ONLY what is explicitly stated in the transcript
- Use null for fields not found
- Do NOT invent information
- If something is ambiguous, note it in qa.assumptions
- If a field is missing, add it to qa.placeholders
- If transcript mentions metrics/testimonials without proof, add to qa.claimsRequiringProof

TRANSCRIPT:
${transcript}

INTAKE DATA:
${JSON.stringify(intake, null, 2)}`;

    const wr1RawResult = await runOpenRouterStep('WR1', {
      transcript,
      intake,
      systemPrompt: wr1Prompt
    });

    const wr1Result = await validateAndRepair(wr1RawResult, WR1Schema, 'WR1', { transcript, intake });

    globalQA.assumptions.push(...wr1Result.qa.assumptions);
    globalQA.placeholders.push(...wr1Result.qa.placeholders);
    globalQA.claimsRequiringProof.push(...wr1Result.qa.claimsRequiringProof);

    results.push({
      stepId: 'WR1',
      deliverableType: 'normalized_content',
      title: 'Normalized Content',
      content: wr1Result
    });

    await updateJob(jobId, {
      completedSteps: ['WR1'],
      currentStep: 'WR2: Content Summary',
      progress: 20,
      results,
      qa: globalQA
    });

    await sleep(1500);

    const wr2Prompt = `You are an expert content strategist. Create a comprehensive content summary and outline.

Return ONLY valid JSON matching this EXACT structure:
{
  "meta": {
    "model": "string",
    "generatedAtISO": "ISO 8601 date",
    "version": "1.0"
  },
  "oneLineValue": "One sentence value proposition",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "contentOutline": [
    {
      "section": "Section name",
      "duration": "10 minutes",
      "keyPoints": ["point 1", "point 2"]
    }
  ],
  "audienceProfile": "Description of target audience",
  "recommendedAngles": ["angle 1", "angle 2", "angle 3"],
  "qa": {
    "assumptions": [],
    "placeholders": [],
    "claimsRequiringProof": []
  }
}

Create a strategic summary based on the normalized content.

NORMALIZED CONTENT:
${JSON.stringify(wr1Result, null, 2)}

INTAKE:
${JSON.stringify(intake, null, 2)}`;

    const wr2RawResult = await runOpenRouterStep('WR2', {
      normalizedContent: wr1Result,
      intake,
      systemPrompt: wr2Prompt
    });

    const wr2Result = await validateAndRepair(wr2RawResult, WR2Schema, 'WR2', { normalizedContent: wr1Result, intake });

    globalQA.assumptions.push(...wr2Result.qa.assumptions);
    globalQA.placeholders.push(...wr2Result.qa.placeholders);
    globalQA.claimsRequiringProof.push(...wr2Result.qa.claimsRequiringProof);

    results.push({
      stepId: 'WR2',
      deliverableType: 'content_summary',
      title: 'Content Summary & Outline',
      content: wr2Result
    });

    await updateJob(jobId, {
      completedSteps: ['WR1', 'WR2'],
      currentStep: 'WR3: Run of Show',
      progress: 40,
      results,
      qa: globalQA
    });

    await sleep(1500);

    const wr3Prompt = `You are an expert webinar producer. Create a detailed minute-by-minute run-of-show.

Return ONLY valid JSON matching this EXACT structure:
{
  "meta": {
    "model": "string",
    "generatedAtISO": "ISO 8601 date",
    "version": "1.0"
  },
  "totalDuration": 60,
  "segments": [
    {
      "startTime": "00:00",
      "duration": 5,
      "segment": "Opening Hook",
      "description": "Detailed description",
      "speakerNotes": "What to say and do",
      "ctaMoment": false,
      "transition": "How to transition to next segment"
    }
  ],
  "qa": {
    "assumptions": [],
    "placeholders": [],
    "claimsRequiringProof": []
  }
}

Create a production-ready run-of-show with timing, speaker notes, and CTA moments.
Total duration: ${intake.webinarLengthMinutes || 60} minutes

CONTENT SUMMARY:
${JSON.stringify(wr2Result, null, 2)}

INTAKE:
${JSON.stringify(intake, null, 2)}`;

    const wr3RawResult = await runOpenRouterStep('WR3', {
      contentSummary: wr2Result,
      intake,
      systemPrompt: wr3Prompt
    });

    const wr3Result = await validateAndRepair(wr3RawResult, WR3Schema, 'WR3', { contentSummary: wr2Result, intake });

    globalQA.assumptions.push(...wr3Result.qa.assumptions);
    globalQA.placeholders.push(...wr3Result.qa.placeholders);
    globalQA.claimsRequiringProof.push(...wr3Result.qa.claimsRequiringProof);

    results.push({
      stepId: 'WR3',
      deliverableType: 'run_of_show',
      title: 'Run of Show',
      content: wr3Result
    });

    await updateJob(jobId, {
      completedSteps: ['WR1', 'WR2', 'WR3'],
      currentStep: 'WR4: Copy Pack',
      progress: 60,
      results,
      qa: globalQA
    });

    await sleep(1500);

    const wr4Prompt = `You are an expert direct-response copywriter. Create a comprehensive copy pack for webinar promotion.

Return ONLY valid JSON matching this EXACT structure (THIS IS CRITICAL):

{
  "meta": {
    "version": "1.0",
    "tone": "${intake.tone || 'Professional'}",
    "primary_cta_type": "${intake.primaryCTAType || 'book_call'}",
    "primary_cta_link_placeholder": "${intake.primaryCTALink || '[INSERT CTA LINK]'}",
    "webinar_title": "${intake.webinarTitle || '[INSERT WEBINAR TITLE]'}",
    "audience_summary": "Brief audience description"
  },
  "variables": {
    "client_name": "${intake.clientName || '[INSERT CLIENT NAME]'}",
    "company": "${intake.company || '[INSERT COMPANY]'}",
    "speaker_name": "${intake.speakerName || '[INSERT SPEAKER NAME]'}",
    "speaker_title": "${intake.speakerTitle || '[INSERT SPEAKER TITLE]'}",
    "webinar_date": "${intake.webinarDate || '[INSERT DATE]'}",
    "webinar_time": "[INSERT TIME + TZ]",
    "webinar_length_minutes": ${intake.webinarLengthMinutes || 60},
    "offer": "${intake.offer || '[INSERT OFFER]'}",
    "cta_link": "${intake.primaryCTALink || '[INSERT CTA LINK]'}"
  },
  "landing_page": {
    "headlines": ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"],
    "subheads": ["subhead 1", "subhead 2", "subhead 3"],
    "hero_bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
    "what_youll_learn": ["learn 1", "learn 2", "learn 3", "learn 4", "learn 5"],
    "who_its_for": ["persona 1", "persona 2", "persona 3"],
    "who_its_not_for": ["not for 1", "not for 2", "not for 3"],
    "agenda_preview": [
      {"segment": "Opening", "timebox_minutes": 10, "promise": "What they'll get"}
    ],
    "speaker_bio": {
      "one_liner": "Credible positioning statement",
      "credibility_bullets": ["credential 1", "credential 2", "credential 3"]
    },
    "proof_blocks": [
      {"type": "testimonial", "content": "[INSERT TESTIMONIAL]", "needs_source": true}
    ],
    "cta_blocks": [
      {"headline": "CTA headline", "body": "CTA body text", "button_label": "Reserve My Spot"}
    ],
    "faq": [
      {"question": "Question", "answer": "Answer"}
    ],
    "compliance_notes": ["note if needed"]
  },
  "email_campaign": {
    "send_rules": {
      "from_name_placeholder": "[INSERT FROM NAME]",
      "from_email_placeholder": "[INSERT FROM EMAIL]",
      "reply_to_placeholder": "[INSERT REPLY-TO]"
    },
    "emails": [
      {
        "id": "confirm_01",
        "timing": "immediate_after_registration",
        "subject": "Subject line",
        "preview_text": "Preview text",
        "body_markdown": "Email body in markdown",
        "primary_cta_label": "Add to Calendar",
        "primary_cta_link_placeholder": "[CALENDAR LINK]"
      },
      {
        "id": "reminder_24h",
        "timing": "24_hours_before",
        "subject": "Subject",
        "preview_text": "Preview",
        "body_markdown": "Body",
        "primary_cta_label": "Join Webinar",
        "primary_cta_link_placeholder": "[WEBINAR LINK]"
      },
      {
        "id": "reminder_morning_of",
        "timing": "morning_of_event",
        "subject": "Subject",
        "preview_text": "Preview",
        "body_markdown": "Body",
        "primary_cta_label": "Join Webinar",
        "primary_cta_link_placeholder": "[WEBINAR LINK]"
      },
      {
        "id": "reminder_15m",
        "timing": "15_minutes_before",
        "subject": "Subject",
        "preview_text": "Preview",
        "body_markdown": "Body",
        "primary_cta_label": "Join Now",
        "primary_cta_link_placeholder": "[WEBINAR LINK]"
      },
      {
        "id": "post_attended_01",
        "timing": "2_hours_after_event_attended",
        "subject": "Subject",
        "preview_text": "Preview",
        "body_markdown": "Body",
        "primary_cta_label": "Book Your Call",
        "primary_cta_link_placeholder": "[CTA LINK]"
      },
      {
        "id": "post_noshow_replay_01",
        "timing": "2_hours_after_event_no_show",
        "subject": "Subject",
        "preview_text": "Preview",
        "body_markdown": "Body",
        "primary_cta_label": "Watch Replay",
        "primary_cta_link_placeholder": "[REPLAY LINK]"
      }
    ]
  },
  "social_promo": {
    "linkedin_posts": [
      {"id": "li_01", "hook": "Hook", "body": "Body", "cta_line": "CTA"},
      {"id": "li_02", "hook": "Hook", "body": "Body", "cta_line": "CTA"},
      {"id": "li_03", "hook": "Hook", "body": "Body", "cta_line": "CTA"}
    ],
    "x_posts": [
      {"id": "x_01", "body": "Tweet body"},
      {"id": "x_02", "body": "Tweet body"},
      {"id": "x_03", "body": "Tweet body"}
    ],
    "last_chance_blurbs": [
      {"id": "lc_01", "body": "Last chance message"},
      {"id": "lc_02", "body": "Last chance message"}
    ]
  },
  "sms_optional": {
    "enabled": true,
    "messages": [
      {"timing": "24_hours_before", "body": "SMS body under 160 chars"},
      {"timing": "15_minutes_before", "body": "SMS body under 160 chars"}
    ]
  },
  "qa": {
    "assumptions": ["assumption 1"],
    "placeholders": ["placeholder 1"],
    "claimsRequiringProof": ["claim 1"]
  }
}

CRITICAL COPY RULES:
- DO NOT invent metrics, testimonials, or proof. Use "[INSERT X]" placeholders.
- Copy must be specific and concrete, not generic competitor-safe language.
- Emails should be scannable with short paragraphs and clear CTAs.
- Landing page needs 5+ headlines, 3+ subheads, strong bullets.
- All 6 email types are REQUIRED (confirm, 24h reminder, morning, 15m, post-attended, post-noshow).
- Social posts must be platform-appropriate (LinkedIn = professional, X = punchy, Last Chance = urgent).

CONTEXT:
${JSON.stringify({ wr1Result, wr2Result, wr3Result, intake }, null, 2)}`;

    console.log(`[Job ${jobId}] Calling OpenRouter API for WR4 (this may take 2-3 minutes)...`);
    const wr4RawResult = await runOpenRouterStep('WR4', {
      normalizedContent: wr1Result,
      contentSummary: wr2Result,
      runOfShow: wr3Result,
      intake,
      systemPrompt: wr4Prompt
    }, 3, 180000);

    const wr4Result = await validateAndRepair(wr4RawResult, WR4Schema, 'WR4', {
      normalizedContent: wr1Result,
      contentSummary: wr2Result,
      runOfShow: wr3Result,
      intake
    });

    globalQA.assumptions.push(...wr4Result.qa.assumptions);
    globalQA.placeholders.push(...wr4Result.qa.placeholders);
    globalQA.claimsRequiringProof.push(...wr4Result.qa.claimsRequiringProof);

    results.push({
      stepId: 'WR4',
      deliverableType: 'copy_pack',
      title: 'Copy Pack (LP + Emails + Social)',
      content: wr4Result
    });

    await updateJob(jobId, {
      completedSteps: ['WR1', 'WR2', 'WR3', 'WR4'],
      currentStep: 'WR5: Checklist',
      progress: 80,
      results,
      qa: globalQA
    });

    await sleep(1500);

    const wr5Prompt = `You are an expert webinar project manager. Create a comprehensive execution checklist.

Return ONLY valid JSON matching this EXACT structure:
{
  "meta": {
    "model": "string",
    "generatedAtISO": "ISO 8601 date",
    "version": "1.0"
  },
  "preWebinar": [
    {"task": "Task description", "timing": "2 weeks before", "completed": false}
  ],
  "duringWebinar": [
    {"task": "Task description", "timing": "00:00-00:05", "completed": false}
  ],
  "postWebinar": [
    {"task": "Task description", "timing": "Within 2 hours", "completed": false}
  ],
  "qa": {
    "assumptions": [],
    "placeholders": [],
    "claimsRequiringProof": []
  }
}

Create actionable checklists covering all phases. Include 8-12 tasks per section.

CONTEXT:
${JSON.stringify({ wr2Result, wr3Result, intake }, null, 2)}`;

    const wr5RawResult = await runOpenRouterStep('WR5', {
      contentSummary: wr2Result,
      runOfShow: wr3Result,
      intake,
      systemPrompt: wr5Prompt
    });

    const wr5Result = await validateAndRepair(wr5RawResult, WR5Schema, 'WR5', {
      contentSummary: wr2Result,
      runOfShow: wr3Result,
      intake
    });

    globalQA.assumptions.push(...wr5Result.qa.assumptions);
    globalQA.placeholders.push(...wr5Result.qa.placeholders);
    globalQA.claimsRequiringProof.push(...wr5Result.qa.claimsRequiringProof);

    results.push({
      stepId: 'WR5',
      deliverableType: 'webinar_checklist',
      title: 'Webinar Checklist',
      content: wr5Result
    });

    await updateJob(jobId, {
      completedSteps: ['WR1', 'WR2', 'WR3', 'WR4', 'WR5'],
      currentStep: null,
      status: 'completed',
      progress: 100,
      results,
      qa: globalQA
    });

    console.log(`[Job ${jobId}] All steps completed successfully!`);
    return true;
  } catch (error) {
    console.error(`[Job ${jobId}] Error in job processing:`, error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[Job ${jobId}] Error details:`, {
      message: errorMessage,
      stack: errorStack
    });

    await updateJob(jobId, {
      status: 'failed',
      results,
      error: errorMessage,
      qa: globalQA
    });

    return false;
  }
};

export const regenerateDeliverable = async (
  jobId: string,
  stepId: 'WR2' | 'WR3' | 'WR4' | 'WR5',
  job: any
) => {
  const { updateJob } = useJobContext.getState();

  try {
    const wr1Result = job.results.find((r: any) => r.stepId === 'WR1')?.content;
    const wr2Result = job.results.find((r: any) => r.stepId === 'WR2')?.content;
    const wr3Result = job.results.find((r: any) => r.stepId === 'WR3')?.content;

    let newResult: ProcessingResult | null = null;

    await updateJob(jobId, {
      currentStep: `Regenerating ${stepId}...`,
      progress: 50
    });

    if (stepId === 'WR2') {
      const wr2Prompt = `You are an expert content strategist. Create a comprehensive content summary and outline.

Return ONLY valid JSON matching the exact WR2 schema structure.

NORMALIZED CONTENT:
${JSON.stringify(wr1Result, null, 2)}

INTAKE:
${JSON.stringify(job.intake, null, 2)}`;

      const rawResult = await runOpenRouterStep('WR2-regen', {
        normalizedContent: wr1Result,
        intake: job.intake,
        systemPrompt: wr2Prompt
      });

      const validated = await validateAndRepair(rawResult, WR2Schema, 'WR2', {
        normalizedContent: wr1Result,
        intake: job.intake
      });

      newResult = {
        stepId: 'WR2',
        deliverableType: 'content_summary',
        title: 'Content Summary & Outline',
        content: validated
      };
    }

    if (newResult) {
      const updatedResults = job.results.map((r: any) =>
        r.stepId === stepId ? newResult : r
      );

      await updateJob(jobId, {
        results: updatedResults,
        currentStep: null,
        progress: 100
      });
    }

    return true;
  } catch (error) {
    console.error(`Error regenerating ${stepId}:`, error);
    await updateJob(jobId, {
      currentStep: null,
      error: `Failed to regenerate ${stepId}`
    });
    return false;
  }
};
