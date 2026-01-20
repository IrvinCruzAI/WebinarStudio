const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const runOpenRouterStep = async (
  stepId: string,
  data: any,
  maxRetries = 5,
  timeoutMs = 120000
): Promise<any> => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
  }

  console.log(`[${stepId}] Starting with model: ${model} (timeout: ${timeoutMs/1000}s)`);

  const systemPrompt = data.systemPrompt || getSystemPromptForStep(stepId);
  const { systemPrompt: _, ...dataWithoutSystemPrompt } = data;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`[${stepId}] Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms...`);
        await sleep(delayMs);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'webinarstudio',
            'X-Title': 'WebinarStudio',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: JSON.stringify(dataWithoutSystemPrompt)
              }
            ]
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          const errorBody = await response.text();
          console.warn(`[${stepId}] Rate limit hit. Response:`, errorBody);

          if (attempt < maxRetries) {
            continue;
          }
          throw new Error(`Rate limit exceeded after ${maxRetries} retries. Please try again in a few minutes.`);
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[${stepId}] API error (${response.status}):`, errorBody);
          throw new Error(`API call failed (${response.status}): ${errorBody.substring(0, 200)}`);
        }

        const responseData = await response.json();
        console.log(`[${stepId}] Received response from API`);

        if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
          throw new Error(`Invalid response structure from API: ${JSON.stringify(responseData).substring(0, 200)}`);
        }

        let content = responseData.choices[0].message.content;

        try {
          const parsed = JSON.parse(content);
          console.log(`[${stepId}] Successfully parsed JSON response`);
          return parsed;
        } catch (parseError) {
          console.warn(`[${stepId}] Initial JSON parse failed, attempting to sanitize...`);

          let sanitizedContent = content
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .trim();

          sanitizedContent = sanitizedContent.substring(sanitizedContent.indexOf('{'));

          const lastBrace = sanitizedContent.lastIndexOf('}');
          if (lastBrace !== -1) {
            sanitizedContent = sanitizedContent.substring(0, lastBrace + 1);
          }

          if (!sanitizedContent.startsWith('{')) {
            sanitizedContent = '{' + sanitizedContent;
          }
          if (!sanitizedContent.endsWith('}')) {
            sanitizedContent = sanitizedContent + '}';
          }

          if (!/^{.*}$/.test(sanitizedContent)) {
            throw new Error('Invalid JSON structure after sanitization');
          }

          const parsed = JSON.parse(sanitizedContent);
          console.log(`[${stepId}] Successfully parsed sanitized JSON`);
          return parsed;
        }
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`[${stepId}] Request timed out after ${timeoutMs/1000} seconds`);
          if (attempt < maxRetries) {
            continue;
          }
          throw new Error(`Request timed out after ${maxRetries} retries (${timeoutMs/1000}s each). The API may be slow or unavailable.`);
        }
        throw error;
      }
    } catch (error) {
      console.error(`[${stepId}] Error on attempt ${attempt + 1}:`, error);

      if (attempt < maxRetries && error instanceof Error &&
          (error.message.includes('Rate limit') ||
           error.message.includes('429') ||
           error.message.includes('timed out'))) {
        continue;
      }

      if (attempt === maxRetries) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[${stepId}] Failed after ${maxRetries} retries:`, errorMsg);
        throw new Error(`Failed to complete ${stepId}: ${errorMsg}`);
      }

      throw error;
    }
  }

  throw new Error(`Failed to complete step ${stepId} after ${maxRetries} retries`);
};

const getSystemPromptForStep = (stepId: string): string => {
  switch (stepId) {
    case 'WR1':
      return `You are an expert content processor. You will receive a webinar transcript and intake information. Your job is to:
1. Clean the transcript by removing filler words, promotional segments, and irrelevant content
2. Extract structured notes and key talking points
3. Identify the main themes and topics covered

Output ONLY valid JSON in this exact format:
{
  "cleanedTranscript": "The cleaned, readable transcript text",
  "structuredNotes": ["Note 1", "Note 2", ...],
  "mainThemes": ["Theme 1", "Theme 2", ...],
  "speakerInsights": ["Insight 1", "Insight 2", ...]
}`;

    case 'WR2':
      return `You are a content strategist expert. Based on the normalized content and intake information provided, create a comprehensive content summary. Focus on extracting actionable insights that will resonate with the target audience.

Consider the brand voice, target audience, and offer when crafting takeaways.

Output ONLY valid JSON in this exact format:
{
  "keyTakeaways": ["Takeaway 1 - specific and actionable", "Takeaway 2", ...],
  "sessionOutline": [
    {"section": "Section Title", "description": "What this section covers and key points"},
    ...
  ],
  "recommendedAngles": ["Marketing angle 1 that aligns with the offer", "Angle 2", ...]
}

Ensure:
- 5-7 key takeaways that are specific, not generic
- 4-6 session outline sections
- 3-5 recommended marketing angles that connect content to the offer`;

    case 'WR3':
      return `You are a webinar production expert. Based on the content summary and intake information, create a detailed run-of-show document. Consider the webinar length if provided, otherwise assume 60 minutes.

The run-of-show should include strategic CTA moments and smooth transitions between segments.

Output ONLY valid JSON in this exact format:
{
  "totalDuration": 60,
  "segments": [
    {
      "startTime": "00:00",
      "duration": 5,
      "segment": "Opening & Hook",
      "description": "What happens in this segment",
      "speakerNotes": "Specific notes for the speaker",
      "ctaMoment": false,
      "transition": "Transition to next segment"
    },
    ...
  ]
}

Include these types of segments:
- Opening hook (2-5 min)
- Introduction/credibility (3-5 min)
- Main content sections (break into 3-4 teaching blocks)
- Q&A or interactive element (5-10 min)
- Offer/CTA presentation (5-10 min)
- Closing (2-3 min)

Mark ctaMoment: true for segments that include calls-to-action.`;

    case 'WR4':
      return `You are a direct-response copywriter expert. Based on the content summary, run-of-show, and intake information, create a complete copy pack.

Use direct-response copywriting fundamentals:
- Clear, specific benefits over features
- Proof and credibility elements
- Objection handling
- Strong, action-oriented CTAs
- Scannable formatting with bullets

Output ONLY valid JSON in this exact format:
{
  "landingPage": {
    "headline": "Compelling headline that addresses the main pain point",
    "subheadline": "Supporting statement that builds on headline",
    "bullets": ["Benefit 1 with specificity", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5"],
    "cta": "Action-oriented button text",
    "testimonialPlaceholder": "Suggested testimonial format/focus"
  },
  "emailSequence": [
    {
      "subject": "Email subject line",
      "preheader": "Preview text",
      "body": "Full email body with proper formatting. Use line breaks for readability.",
      "dayNumber": 1
    },
    ...
  ],
  "socialPosts": [
    {
      "platform": "LinkedIn",
      "content": "Post content optimized for this platform",
      "hashtags": ["relevant", "hashtags"]
    },
    ...
  ]
}

Create:
- Landing page copy that sells the transformation
- 3-email sequence (invite, reminder, last chance)
- 4 social posts (LinkedIn, Twitter/X, Instagram, Facebook)`;

    case 'WR5':
      return `You are a webinar operations expert. Based on all the information provided, create a comprehensive checklist for webinar success.

Output ONLY valid JSON in this exact format:
{
  "preWebinar": [
    {"task": "Task description", "timing": "When to complete (e.g., '1 week before')"},
    ...
  ],
  "duringWebinar": [
    {"task": "Task description", "timing": "When during webinar (e.g., 'At start')"},
    ...
  ],
  "postWebinar": [
    {"task": "Task description", "timing": "When after (e.g., 'Within 24 hours')"},
    ...
  ]
}

Include tasks for:
Pre-webinar (8-12 tasks):
- Technical setup and testing
- Promotion and registration
- Content preparation
- Team coordination

During-webinar (5-8 tasks):
- Technical monitoring
- Engagement activities
- CTA delivery
- Q&A management

Post-webinar (6-10 tasks):
- Follow-up sequences
- Replay distribution
- Lead nurturing
- Performance analysis`;

    default:
      return `Process the input data for step ${stepId} and return structured information as valid JSON.`;
  }
};
