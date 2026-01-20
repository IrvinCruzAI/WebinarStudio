import { runOpenRouterStep } from './openRouterApi';
import { WebinarIntake } from '../types';

export const parseAndPrefillFromTranscript = async (
  transcript: string,
  notes?: string
): Promise<Partial<WebinarIntake>> => {
  const systemPrompt = `You are an expert intake form assistant. Extract structured client information from an intake call transcript.

Return ONLY valid JSON with this exact structure:
{
  "clientName": "string or null",
  "company": "string or null",
  "webinarTitle": "string or null",
  "offer": "string or null",
  "targetAudience": "string or null",
  "tone": "Professional | Friendly | Direct | Bold or null",
  "primaryCTAType": "book_call | buy | waitlist | download or null",
  "primaryCTALink": "string or null",
  "webinarDate": "YYYY-MM-DD or null",
  "webinarLengthMinutes": number or null,
  "speakerName": "string or null",
  "speakerTitle": "string or null"
}

EXTRACTION RULES:
- Extract ONLY what is explicitly stated or clearly implied
- Use null for anything not found
- For tone, infer from brand personality described
- For primaryCTAType, infer from offer type (consulting/done-for-you = book_call, product/course = buy, beta/launch = waitlist, lead magnet = download)
- Clean and normalize all extracted text
- If multiple values exist for a field, use the most recent or definitive one

Do NOT fabricate information. If something is ambiguous or missing, use null.`;

  const result = await runOpenRouterStep('parse-prefill', {
    transcript,
    notes: notes || '',
    systemPrompt
  });

  const cleaned: Partial<WebinarIntake> = {};

  if (result.clientName) cleaned.clientName = result.clientName;
  if (result.company) cleaned.company = result.company;
  if (result.webinarTitle) cleaned.webinarTitle = result.webinarTitle;
  if (result.offer) cleaned.offer = result.offer;
  if (result.targetAudience) cleaned.targetAudience = result.targetAudience;
  if (result.tone) cleaned.tone = result.tone;
  if (result.primaryCTAType) cleaned.primaryCTAType = result.primaryCTAType;
  if (result.primaryCTALink) cleaned.primaryCTALink = result.primaryCTALink;
  if (result.webinarDate) cleaned.webinarDate = result.webinarDate;
  if (result.webinarLengthMinutes) cleaned.webinarLengthMinutes = result.webinarLengthMinutes;
  if (result.speakerName) cleaned.speakerName = result.speakerName;
  if (result.speakerTitle) cleaned.speakerTitle = result.speakerTitle;

  return cleaned;
};
