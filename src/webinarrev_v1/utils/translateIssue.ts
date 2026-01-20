import type { DeliverableId } from '../contracts';
import { DELIVERABLES } from '../contracts/deliverables';

export interface TranslatedIssue {
  title: string;
  description: string;
  assetName: string;
  actionLabel: string;
  isValid: boolean;
}

const PLACEHOLDER_FRIENDLY_NAMES: Record<string, string> = {
  '{{CLIENT_NAME}}': 'Client name',
  '{{SPEAKER_NAME}}': 'Speaker name',
  '{{COMPANY_NAME}}': 'Company name',
  '{{REGISTRATION_LINK}}': 'Registration link',
  '{{WEBINAR_DATE}}': 'Webinar date',
  '{{WEBINAR_TIME}}': 'Webinar time',
  '{{CTA_LINK}}': 'Call-to-action link',
  '{{OFFER_PRICE}}': 'Offer price',
  '{{BOOKING_LINK}}': 'Booking link',
  'link_placeholder': 'A link',
  'from_email_placeholder': 'Sender email address',
  'from_name_placeholder': 'Sender name',
  'reply_to_placeholder': 'Reply-to email',
  '[TBD]': 'Content to be determined',
  '[TODO]': 'Content to complete',
  '[INSERT': 'Content to insert',
  '[PLACEHOLDER]': 'Content to fill in',
  '[FILL': 'Content to fill in',
  '[ADD': 'Content to add',
  '_placeholder': 'Missing information',
  'XXX': 'Content to complete',
  'FIXME': 'Content to fix',
};

export function getAssetName(deliverableId: DeliverableId): string {
  const meta = DELIVERABLES[deliverableId];
  return meta?.short_title || meta?.title || deliverableId;
}

export function translatePlaceholder(placeholderText: string): string {
  const lowerText = placeholderText.toLowerCase();

  for (const [pattern, friendly] of Object.entries(PLACEHOLDER_FRIENDLY_NAMES)) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return friendly;
    }
  }

  const cleanedText = placeholderText
    .replace(/\{\{|\}\}/g, '')
    .replace(/\[|\]/g, '')
    .replace(/_/g, ' ')
    .trim();

  if (cleanedText.length > 0 && cleanedText.length < 50) {
    return cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1).toLowerCase();
  }

  return 'Missing information';
}

export function translateIssue(
  message: string,
  deliverableId: DeliverableId,
  fieldPath?: string
): TranslatedIssue {
  const assetName = getAssetName(deliverableId);

  if (message.includes('undefined') || (fieldPath && fieldPath.includes('undefined'))) {
    return {
      title: '',
      description: '',
      assetName,
      actionLabel: 'Fix',
      isValid: false,
    };
  }

  if (message === 'Asset not yet generated' || message.includes('not yet generated')) {
    return {
      title: `${assetName} not created yet`,
      description: 'This asset needs to be generated before export.',
      assetName,
      actionLabel: 'Generate',
      isValid: true,
    };
  }

  if (message === 'Validation failed' || message.includes('Validation failed')) {
    return {
      title: `${assetName} needs review`,
      description: 'Some content in this asset needs attention.',
      assetName,
      actionLabel: 'Review',
      isValid: true,
    };
  }

  if (message.startsWith('Placeholder:')) {
    const placeholderText = message.replace('Placeholder:', '').trim();
    const friendlyName = translatePlaceholder(placeholderText);

    return {
      title: `${friendlyName} is missing`,
      description: `Add the ${friendlyName.toLowerCase()} to complete this asset.`,
      assetName,
      actionLabel: 'Fill in',
      isValid: true,
    };
  }

  if (message.includes('block_id') || message.includes('Invalid enum')) {
    return {
      title: 'Block formatting issue',
      description: 'A presentation block has a formatting problem that can be auto-fixed.',
      assetName,
      actionLabel: 'Fix',
      isValid: true,
    };
  }

  if (message.includes('email_id')) {
    return {
      title: 'Email numbering issue',
      description: 'An email has an incorrect ID format.',
      assetName,
      actionLabel: 'Fix',
      isValid: true,
    };
  }

  if (message.includes('Required') || message.includes('required')) {
    const fieldName = extractFieldName(fieldPath || message);
    return {
      title: `${fieldName} is required`,
      description: `Please provide the ${fieldName.toLowerCase()}.`,
      assetName,
      actionLabel: 'Add',
      isValid: true,
    };
  }

  if (message.includes('crosslink') || message.includes('reference')) {
    return {
      title: 'Reference issue',
      description: 'This asset references content that does not exist.',
      assetName,
      actionLabel: 'Fix',
      isValid: true,
    };
  }

  return {
    title: 'Issue found',
    description: message.length > 100 ? message.substring(0, 100) + '...' : message,
    assetName,
    actionLabel: 'Review',
    isValid: true,
  };
}

function extractFieldName(text: string): string {
  const match = text.match(/["']([^"']+)["']/);
  if (match) {
    return formatFieldName(match[1]);
  }

  const pathMatch = text.match(/\.(\w+)$/);
  if (pathMatch) {
    return formatFieldName(pathMatch[1]);
  }

  return 'This field';
}

function formatFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function translateValidationError(error: string, deliverableId: DeliverableId): TranslatedIssue {
  const assetName = getAssetName(deliverableId);

  if (error.includes('missing_deliverable')) {
    return {
      title: `${assetName} not created`,
      description: 'This asset needs to be generated.',
      assetName,
      actionLabel: 'Generate',
      isValid: true,
    };
  }

  const colonIndex = error.indexOf(':');
  if (colonIndex > 0) {
    const fieldPath = error.substring(0, colonIndex);
    const errorMessage = error.substring(colonIndex + 1).trim();

    if (fieldPath.includes('undefined')) {
      return {
        title: '',
        description: '',
        assetName,
        actionLabel: '',
        isValid: false,
      };
    }

    return translateIssue(`Placeholder: ${errorMessage}`, deliverableId, fieldPath);
  }

  return translateIssue(error, deliverableId);
}

export function isValidIssue(message: string, fieldPath?: string): boolean {
  if (message.includes('undefined') || (fieldPath && fieldPath.includes('undefined'))) {
    return false;
  }

  if (!message || message.trim().length === 0) {
    return false;
  }

  return true;
}
