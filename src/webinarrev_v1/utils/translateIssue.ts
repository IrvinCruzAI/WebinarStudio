import type { DeliverableId } from '../contracts';
import { DELIVERABLES } from '../contracts/deliverables';

export type SeverityHint = 'Must Fix' | 'Review';

export interface TranslatedIssue {
  title: string;
  description: string;
  assetName: string;
  actionLabel: string;
  isValid: boolean;
  severityHint?: SeverityHint;
  oneSentenceFix?: string;
  route?: { tab: string; deliverableId?: DeliverableId };
}

interface FieldLabelEntry {
  label: string;
  why: string;
  actionText: string;
  route: { tab: string; deliverableId?: DeliverableId };
  severityHint: SeverityHint;
  oneSentenceFix: string;
  usedBy?: string[];
}

const FIELD_LABEL_MAP: Record<string, FieldLabelEntry> = {
  from_name_placeholder: {
    label: 'Sender Name',
    why: 'Appears in email headers',
    actionText: 'Add in Settings',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Enter the name that should appear as the email sender',
    usedBy: ['WR4 Emails'],
  },
  from_email_placeholder: {
    label: 'Sender Email',
    why: 'Required for email delivery',
    actionText: 'Add in Settings',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Enter the email address to send from',
    usedBy: ['WR4 Emails'],
  },
  reply_to_placeholder: {
    label: 'Reply-To Email',
    why: 'Where replies go when recipients respond',
    actionText: 'Add in Settings',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Enter the email address for receiving replies',
    usedBy: ['WR4 Emails'],
  },
  link_placeholder: {
    label: 'CTA Link',
    why: 'Button destination for signups',
    actionText: 'Add in Settings',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Paste the URL where the CTA button should link',
    usedBy: ['WR3 Landing Page', 'WR4 Emails', 'WR6 Run of Show'],
  },
  primary_cta_link_placeholder: {
    label: 'Primary CTA Link',
    why: 'Main call-to-action button destination',
    actionText: 'Add in Settings',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Paste the URL where the main CTA button should link',
    usedBy: ['WR3 Landing Page', 'WR4 Emails'],
  },
  registration_link_placeholder: {
    label: 'Registration Link',
    why: 'Where attendees sign up for the webinar',
    actionText: 'Add in Settings',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Paste the webinar registration page URL',
    usedBy: ['WR3 Landing Page', 'WR4 Emails'],
  },
  client_name: {
    label: 'Client Name',
    why: 'Used throughout all deliverables',
    actionText: 'Update intake',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Add the client name in project intake',
    usedBy: ['All deliverables'],
  },
  company_name: {
    label: 'Company Name',
    why: 'Appears in branding and copy',
    actionText: 'Update intake',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Add the company name in project intake',
    usedBy: ['All deliverables'],
  },
  speaker_name: {
    label: 'Speaker Name',
    why: 'Appears in presenter credits',
    actionText: 'Update intake',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Add the speaker name in project intake',
    usedBy: ['WR5 Deck Prompt', 'WR6 Run of Show'],
  },
  webinar_date: {
    label: 'Webinar Date',
    why: 'Needed for countdown and scheduling',
    actionText: 'Add in Settings',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Set the webinar date in project settings',
    usedBy: ['WR3 Landing Page', 'WR4 Emails'],
  },
  webinar_time: {
    label: 'Webinar Time',
    why: 'Needed for scheduling information',
    actionText: 'Add in Settings',
    route: { tab: 'setup' },
    severityHint: 'Must Fix',
    oneSentenceFix: 'Set the webinar time in project settings',
    usedBy: ['WR3 Landing Page', 'WR4 Emails'],
  },
};

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

const OPERATOR_FIELD_PATTERNS: RegExp[] = [
  /\.send_rules\.from_(name|email)_placeholder$/,
  /\.send_rules\.reply_to_placeholder$/,
  /\.cta_block\.link_placeholder$/,
  /primary_cta_link_placeholder$/,
  /registration_link_placeholder$/,
  /from_name_placeholder$/,
  /from_email_placeholder$/,
  /reply_to_placeholder$/,
  /link_placeholder$/,
];

export function isOperatorRequiredField(path: string): boolean {
  for (const pattern of OPERATOR_FIELD_PATTERNS) {
    if (pattern.test(path)) {
      return true;
    }
  }
  return false;
}

export function getFieldLabelEntry(fieldPath: string): FieldLabelEntry | null {
  for (const pattern of OPERATOR_FIELD_PATTERNS) {
    if (pattern.test(fieldPath)) {
      const match = fieldPath.match(/(\w+_placeholder)$/);
      if (match && FIELD_LABEL_MAP[match[1]]) {
        return FIELD_LABEL_MAP[match[1]];
      }
    }
  }

  for (const [key, entry] of Object.entries(FIELD_LABEL_MAP)) {
    if (fieldPath.includes(key)) {
      return entry;
    }
  }

  return null;
}

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
      severityHint: 'Must Fix',
      oneSentenceFix: 'Run the pipeline to generate this deliverable',
    };
  }

  if (message === 'Validation failed' || message.includes('Validation failed')) {
    return {
      title: `${assetName} needs review`,
      description: 'Some content in this asset needs attention.',
      assetName,
      actionLabel: 'Review',
      isValid: true,
      severityHint: 'Review',
      oneSentenceFix: 'Check this deliverable for issues',
    };
  }

  if (message.startsWith('Placeholder:')) {
    const placeholderText = message.replace('Placeholder:', '').trim();

    if (fieldPath) {
      const labelEntry = getFieldLabelEntry(fieldPath);
      if (labelEntry) {
        return {
          title: `${labelEntry.label} is missing`,
          description: labelEntry.why,
          assetName,
          actionLabel: labelEntry.actionText,
          isValid: true,
          severityHint: labelEntry.severityHint,
          oneSentenceFix: labelEntry.oneSentenceFix,
          route: labelEntry.route,
        };
      }
    }

    const friendlyName = translatePlaceholder(placeholderText);

    return {
      title: `${friendlyName} is missing`,
      description: `Add the ${friendlyName.toLowerCase()} to complete this asset.`,
      assetName,
      actionLabel: 'Fill in',
      isValid: true,
      severityHint: 'Review',
      oneSentenceFix: `Enter the ${friendlyName.toLowerCase()}`,
    };
  }

  if (message.includes('block_id') || message.includes('Invalid enum')) {
    return {
      title: 'Block formatting issue',
      description: 'A presentation block has a formatting problem that can be auto-fixed.',
      assetName,
      actionLabel: 'Fix',
      isValid: true,
      severityHint: 'Review',
      oneSentenceFix: 'This may auto-fix on regeneration',
    };
  }

  if (message.includes('email_id')) {
    return {
      title: 'Email numbering issue',
      description: 'An email has an incorrect ID format.',
      assetName,
      actionLabel: 'Fix',
      isValid: true,
      severityHint: 'Review',
      oneSentenceFix: 'This may auto-fix on regeneration',
    };
  }

  if (message.includes('Required') || message.includes('required')) {
    const fieldName = extractFieldName(fieldPath || message);

    if (fieldPath) {
      const labelEntry = getFieldLabelEntry(fieldPath);
      if (labelEntry) {
        return {
          title: `${labelEntry.label} is required`,
          description: labelEntry.why,
          assetName,
          actionLabel: labelEntry.actionText,
          isValid: true,
          severityHint: labelEntry.severityHint,
          oneSentenceFix: labelEntry.oneSentenceFix,
          route: labelEntry.route,
        };
      }
    }

    return {
      title: `${fieldName} is required`,
      description: `Please provide the ${fieldName.toLowerCase()}.`,
      assetName,
      actionLabel: 'Add',
      isValid: true,
      severityHint: 'Must Fix',
      oneSentenceFix: `Enter the ${fieldName.toLowerCase()}`,
    };
  }

  if (message.includes('crosslink') || message.includes('reference')) {
    return {
      title: 'Reference issue',
      description: 'This asset references content that does not exist.',
      assetName,
      actionLabel: 'Fix',
      isValid: true,
      severityHint: 'Review',
      oneSentenceFix: 'Check that referenced content exists',
    };
  }

  return {
    title: 'Issue found',
    description: message.length > 100 ? message.substring(0, 100) + '...' : message,
    assetName,
    actionLabel: 'Review',
    isValid: true,
    severityHint: 'Review',
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
