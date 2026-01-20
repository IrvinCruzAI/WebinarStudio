import type { DeliverableId, ProjectMetadata } from '../contracts';

export type QASource = 'BUG' | 'SETTINGS_REQUIRED' | 'INPUT_MISSING' | 'MODEL_UNCERTAIN';

export type SeverityHint = 'Must Fix' | 'Review';

export interface TaggedIssue {
  source: QASource;
  deliverableId: DeliverableId;
  message: string;
  fieldPath?: string;
  rawToken?: string;
  canonicalToken?: string;
  severity: 'critical' | 'warning';
  severityHint: SeverityHint;
}

export interface QASummary {
  settings_required: { count: number; top_fields: string[] };
  model_uncertain: { count: number; top_fields: string[] };
  input_missing: { count: number; top_fields: string[] };
  bugs: { count: number; filtered_count: number; top_fields: string[] };
}

const OPERATOR_FIELD_PATTERNS: RegExp[] = [
  /\.cta_block\.link_placeholder$/,
  /registration_link_placeholder$/,
  /link_placeholder$/,
];

interface InputMissingTrigger {
  check: (settings: ProjectMetadata['settings']) => boolean;
  fields: string[];
}

const INPUT_MISSING_TRIGGERS: InputMissingTrigger[] = [
  {
    check: (settings) => !settings.client_name || settings.client_name.trim() === '',
    fields: ['client_name', '{{CLIENT_NAME}}', 'client name'],
  },
  {
    check: (settings) => !settings.company_name || settings.company_name.trim() === '',
    fields: ['company_name', '{{COMPANY_NAME}}', 'company name'],
  },
  {
    check: (settings) => !settings.speaker_name || settings.speaker_name.trim() === '',
    fields: ['speaker_name', '{{SPEAKER_NAME}}', 'speaker name'],
  },
  {
    check: (settings) => settings.webinar_length_minutes <= 0 || !settings.webinar_length_minutes,
    fields: ['webinar_length', 'duration', 'length'],
  },
];

function isValidDeliverableIdFormat(id: string): boolean {
  return /^WR[1-9]$|^PREFLIGHT$/.test(id);
}

function isValidArtifactIdFormat(artifactId: string): boolean {
  if (!artifactId || artifactId.includes('undefined') || artifactId.includes('null')) {
    return false;
  }
  const parts = artifactId.split(':');
  if (parts.length !== 4) return false;
  const [, , deliverableId] = parts;
  return isValidDeliverableIdFormat(deliverableId);
}

function containsBugIndicators(message: string, fieldPath?: string): boolean {
  const bugPatterns = [
    'undefined',
    'null',
    'NaN',
    '[object Object]',
  ];

  const lowerMessage = message.toLowerCase();
  const lowerPath = (fieldPath || '').toLowerCase();

  for (const pattern of bugPatterns) {
    if (lowerMessage.includes(pattern) || lowerPath.includes(pattern)) {
      return true;
    }
  }

  return false;
}

function matchesOperatorFieldPattern(fieldPath: string): boolean {
  for (const pattern of OPERATOR_FIELD_PATTERNS) {
    if (pattern.test(fieldPath)) {
      return true;
    }
  }
  return false;
}

function isInputMissingIssue(
  message: string,
  fieldPath: string | undefined,
  settings: ProjectMetadata['settings']
): boolean {
  const lowerMessage = message.toLowerCase();
  const lowerPath = (fieldPath || '').toLowerCase();

  for (const trigger of INPUT_MISSING_TRIGGERS) {
    if (trigger.check(settings)) {
      for (const field of trigger.fields) {
        if (lowerMessage.includes(field.toLowerCase()) || lowerPath.includes(field.toLowerCase())) {
          return true;
        }
      }
    }
  }

  return false;
}

export function classifyIssueSource(
  message: string,
  fieldPath: string | undefined,
  deliverableId: DeliverableId,
  settings: ProjectMetadata['settings']
): QASource {
  if (containsBugIndicators(message, fieldPath)) {
    return 'BUG';
  }

  if (!isValidDeliverableIdFormat(deliverableId)) {
    return 'BUG';
  }

  if (fieldPath && matchesOperatorFieldPattern(fieldPath)) {
    return 'SETTINGS_REQUIRED';
  }

  if (isInputMissingIssue(message, fieldPath, settings)) {
    return 'INPUT_MISSING';
  }

  return 'MODEL_UNCERTAIN';
}

export interface RawIssue {
  type: 'validation' | 'placeholder';
  severity: 'critical' | 'warning';
  deliverableId: DeliverableId;
  message: string;
  fieldPath?: string;
}

export interface TaggingResult {
  taggedIssues: TaggedIssue[];
  summary: QASummary;
  bugFilteredCount: number;
}

export function tagIssues(
  issues: RawIssue[],
  settings: ProjectMetadata['settings']
): TaggingResult {
  const taggedIssues: TaggedIssue[] = [];
  let bugFilteredCount = 0;

  const summaryCounters = {
    settings_required: new Map<string, number>(),
    model_uncertain: new Map<string, number>(),
    input_missing: new Map<string, number>(),
    bugs: new Map<string, number>(),
  };

  for (const issue of issues) {
    const source = classifyIssueSource(
      issue.message,
      issue.fieldPath,
      issue.deliverableId,
      settings
    );

    if (source === 'BUG') {
      bugFilteredCount++;
      const fieldKey = extractFieldKey(issue.fieldPath || issue.message);
      summaryCounters.bugs.set(fieldKey, (summaryCounters.bugs.get(fieldKey) || 0) + 1);
      continue;
    }

    const severityHint: SeverityHint = source === 'MODEL_UNCERTAIN' ? 'Review' : 'Must Fix';

    const tagged: TaggedIssue = {
      source,
      deliverableId: issue.deliverableId,
      message: issue.message,
      fieldPath: issue.fieldPath,
      severity: issue.severity,
      severityHint,
    };

    if (issue.message.startsWith('Placeholder:')) {
      const rawToken = issue.message.replace('Placeholder:', '').trim();
      tagged.rawToken = rawToken;
      tagged.canonicalToken = normalizeToCanonical(rawToken);
    }

    taggedIssues.push(tagged);

    const fieldKey = extractFieldKey(issue.fieldPath || issue.message);
    switch (source) {
      case 'SETTINGS_REQUIRED':
        summaryCounters.settings_required.set(
          fieldKey,
          (summaryCounters.settings_required.get(fieldKey) || 0) + 1
        );
        break;
      case 'INPUT_MISSING':
        summaryCounters.input_missing.set(
          fieldKey,
          (summaryCounters.input_missing.get(fieldKey) || 0) + 1
        );
        break;
      case 'MODEL_UNCERTAIN':
        summaryCounters.model_uncertain.set(
          fieldKey,
          (summaryCounters.model_uncertain.get(fieldKey) || 0) + 1
        );
        break;
    }
  }

  const summary: QASummary = {
    settings_required: {
      count: taggedIssues.filter(i => i.source === 'SETTINGS_REQUIRED').length,
      top_fields: getTopFields(summaryCounters.settings_required, 5),
    },
    model_uncertain: {
      count: taggedIssues.filter(i => i.source === 'MODEL_UNCERTAIN').length,
      top_fields: getTopFields(summaryCounters.model_uncertain, 5),
    },
    input_missing: {
      count: taggedIssues.filter(i => i.source === 'INPUT_MISSING').length,
      top_fields: getTopFields(summaryCounters.input_missing, 5),
    },
    bugs: {
      count: bugFilteredCount,
      filtered_count: bugFilteredCount,
      top_fields: getTopFields(summaryCounters.bugs, 5),
    },
  };

  return { taggedIssues, summary, bugFilteredCount };
}

function extractFieldKey(pathOrMessage: string): string {
  const match = pathOrMessage.match(/\.(\w+_placeholder)$/);
  if (match) return match[1];

  const placeholderMatch = pathOrMessage.match(/\{\{([^}]+)\}\}/);
  if (placeholderMatch) return placeholderMatch[1];

  const bracketMatch = pathOrMessage.match(/\[([A-Z][A-Z_\s]+)\]/i);
  if (bracketMatch) return bracketMatch[1].toLowerCase().replace(/\s+/g, '_');

  const lastPart = pathOrMessage.split('.').pop() || pathOrMessage;
  return lastPart.replace(/\[\d+\]/g, '').substring(0, 30);
}

function getTopFields(counter: Map<string, number>, limit: number): string[] {
  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([field]) => field);
}

function normalizeToCanonical(rawToken: string): string {
  let normalized = rawToken.trim();

  if (/^\[INSERT\s*(.+)\]$/i.test(normalized)) {
    const match = normalized.match(/^\[INSERT\s*(.+)\]$/i);
    if (match) {
      normalized = `[[MISSING:${match[1].trim().toUpperCase()}]]`;
    }
  } else if (/^\[FILL\s*(.+)\]$/i.test(normalized)) {
    const match = normalized.match(/^\[FILL\s*(.+)\]$/i);
    if (match) {
      normalized = `[[MISSING:${match[1].trim().toUpperCase()}]]`;
    }
  } else if (/^\[ADD\s*(.+)\]$/i.test(normalized)) {
    const match = normalized.match(/^\[ADD\s*(.+)\]$/i);
    if (match) {
      normalized = `[[MISSING:${match[1].trim().toUpperCase()}]]`;
    }
  } else if (/^\[PLACEHOLDER\]$/i.test(normalized)) {
    normalized = '[[MISSING:PLACEHOLDER]]';
  } else if (/^\{\{(.+)\}\}$/.test(normalized)) {
    const match = normalized.match(/^\{\{(.+)\}\}$/);
    if (match) {
      normalized = `[[MISSING:${match[1].trim().toUpperCase()}]]`;
    }
  } else if (/^_placeholder$/i.test(normalized) || /_placeholder$/i.test(normalized)) {
    const fieldName = normalized.replace(/_placeholder$/i, '').replace(/^_/, '');
    normalized = `[[MISSING:${fieldName.toUpperCase()}]]`;
  }

  return normalized;
}

export function groupIssuesBySource(taggedIssues: TaggedIssue[]): Record<QASource, TaggedIssue[]> {
  const grouped: Record<QASource, TaggedIssue[]> = {
    BUG: [],
    SETTINGS_REQUIRED: [],
    INPUT_MISSING: [],
    MODEL_UNCERTAIN: [],
  };

  for (const issue of taggedIssues) {
    grouped[issue.source].push(issue);
  }

  return grouped;
}

export function getSourceDisplayInfo(source: QASource): {
  title: string;
  description: string;
  colorKey: 'error' | 'warning' | 'info' | 'neutral';
} {
  switch (source) {
    case 'BUG':
      return {
        title: 'Bugs',
        description: 'Technical issues that need developer attention',
        colorKey: 'error',
      };
    case 'SETTINGS_REQUIRED':
      return {
        title: 'Settings Required',
        description: 'Configure these in project settings before export',
        colorKey: 'info',
      };
    case 'INPUT_MISSING':
      return {
        title: 'Missing Inputs',
        description: 'Project details needed from intake or setup',
        colorKey: 'warning',
      };
    case 'MODEL_UNCERTAIN':
      return {
        title: 'To Fill In',
        description: 'Content the AI could not determine from transcripts',
        colorKey: 'neutral',
      };
  }
}
