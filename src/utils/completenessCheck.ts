import { WebinarIntake, CompletenessCheck } from '../types';

export const calculateCompleteness = (
  intake: Partial<WebinarIntake>,
  transcript: string
): CompletenessCheck => {
  const requiredFields = [
    { key: 'clientName', label: 'Client Name' },
    { key: 'company', label: 'Company' },
    { key: 'webinarTitle', label: 'Webinar Title' },
    { key: 'offer', label: 'Offer' },
    { key: 'targetAudience', label: 'Target Audience' },
    { key: 'primaryCTAType', label: 'Primary CTA Type' },
    { key: 'transcript', label: 'Transcript', value: transcript }
  ];

  const optionalFields = [
    { key: 'tone', label: 'Desired Tone' },
    { key: 'primaryCTALink', label: 'CTA Link' },
    { key: 'webinarDate', label: 'Webinar Date' },
    { key: 'webinarLengthMinutes', label: 'Webinar Length' },
    { key: 'speakerName', label: 'Speaker Name' },
    { key: 'speakerTitle', label: 'Speaker Title' },
    { key: 'notes', label: 'Additional Notes' }
  ];

  const requiredMissing: string[] = [];
  const optionalMissing: string[] = [];
  const warnings: string[] = [];
  let filledFields = 0;

  requiredFields.forEach(field => {
    const value = field.value !== undefined ? field.value : intake[field.key as keyof WebinarIntake];
    if (value && (typeof value === 'string' ? value.trim() : true)) {
      filledFields++;
    } else {
      requiredMissing.push(field.label);
    }
  });

  optionalFields.forEach(field => {
    const value = intake[field.key as keyof WebinarIntake];
    if (value && (typeof value === 'string' ? value.trim() : true)) {
      filledFields++;
    } else {
      optionalMissing.push(field.label);
    }
  });

  if (!transcript || transcript.trim().length < 100) {
    warnings.push('Transcript is very short. Generated deliverables may lack detail.');
  }

  if (!intake.speakerName) {
    warnings.push('Speaker name missing. Copy will use generic placeholders.');
  }

  if (!intake.webinarDate) {
    warnings.push('Webinar date missing. Email timing will use relative placeholders.');
  }

  if (!intake.primaryCTALink) {
    warnings.push('CTA link missing. All CTA buttons will show placeholder URLs.');
  }

  if (!intake.tone) {
    warnings.push('Tone not specified. Copy will default to "Professional".');
  }

  const totalFields = requiredFields.length + optionalFields.length;
  const score = Math.round((filledFields / totalFields) * 100);

  return {
    score,
    totalFields,
    filledFields,
    requiredMissing,
    optionalMissing,
    warnings
  };
};

export const getCompletenessColor = (score: number): string => {
  if (score >= 85) return 'text-green-600 dark:text-green-400';
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

export const getCompletenessBgColor = (score: number): string => {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};
