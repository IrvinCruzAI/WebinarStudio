import {
  DeliverableId,
  PlaceholderScanResult,
  PlaceholderLocation,
  WR3,
} from '../contracts';

const CRITICAL_PLACEHOLDERS = [
  'link_placeholder',
];

const PLACEHOLDER_PATTERNS = [
  /\{\{[^}]+\}\}/g,
  /\[TBD\]/gi,
  /\[TODO\]/gi,
  /\[INSERT[^\]]*\]/gi,
  /\[PLACEHOLDER\]/gi,
  /\[FILL[^\]]*\]/gi,
  /\[ADD[^\]]*\]/gi,
  /_placeholder/gi,
  /XXX/g,
  /FIXME/gi,
];

const WR6_NON_CRITICAL_FIELDS = new Set([
  'coach_cue',
  'fallback_if_cold',
  'time_check',
]);

function isCriticalField(fieldPath: string, deliverableId: DeliverableId): boolean {
  if (deliverableId === 'WR6') {
    const parts = fieldPath.split('.');
    const fieldName = (parts[parts.length - 1] || '').replace(/\[\d+\]$/, '');
    if (fieldName && WR6_NON_CRITICAL_FIELDS.has(fieldName)) {
      return false;
    }
  }
  return true;
}

function isCriticalPlaceholder(text: string): boolean {
  return CRITICAL_PLACEHOLDERS.some(p => text.toLowerCase().includes(p.toLowerCase()));
}

function findPlaceholdersInString(
  text: string,
  artifactId: string,
  fieldPath: string,
  deliverableId: DeliverableId,
  locations: PlaceholderLocation[]
): void {
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const placeholderText = match[0];
      const isCritical = isCriticalPlaceholder(placeholderText) && isCriticalField(fieldPath, deliverableId);
      locations.push({
        artifact_id: artifactId,
        field_path: fieldPath,
        placeholder_text: placeholderText,
        is_critical: isCritical,
      });
    }
  }
}

function scanObject(
  obj: unknown,
  artifactId: string,
  basePath: string,
  deliverableId: DeliverableId,
  locations: PlaceholderLocation[]
): void {
  if (typeof obj === 'string') {
    findPlaceholdersInString(obj, artifactId, basePath, deliverableId, locations);
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      scanObject(item, artifactId, `${basePath}[${index}]`, deliverableId, locations);
    });
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = basePath ? `${basePath}.${key}` : key;
      scanObject(value, artifactId, newPath, deliverableId, locations);
    }
  }
}

function scanWR3Proof(content: WR3, artifactId: string, locations: PlaceholderLocation[]): void {
  content.proof_blocks.forEach((block, index) => {
    if (block.needs_source) {
      locations.push({
        artifact_id: artifactId,
        field_path: `proof_blocks[${index}]`,
        placeholder_text: 'needs_source=true',
        is_critical: true,
      });
    }
  });
}

export function scanPlaceholders(
  artifacts: Map<DeliverableId, { content: unknown; artifact_id: string }>
): PlaceholderScanResult {
  const locations: PlaceholderLocation[] = [];

  for (const [deliverableId, artifact] of artifacts) {
    if (deliverableId === 'PREFLIGHT' || deliverableId === 'WR9') {
      continue;
    }

    scanObject(artifact.content, artifact.artifact_id, '', deliverableId, locations);

    if (deliverableId === 'WR3') {
      scanWR3Proof(artifact.content as WR3, artifact.artifact_id, locations);
    }
  }

  const criticalCount = locations.filter(loc => loc.is_critical).length;

  return {
    total_count: locations.length,
    critical_count: criticalCount,
    locations,
  };
}

export async function scanPlaceholdersForProject(
  projectId: string,
  runId: string,
  loadArtifactFn: (artifactId: string) => Promise<{ content: unknown } | null>
): Promise<PlaceholderScanResult> {
  const deliverableIds: DeliverableId[] = ['WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'];
  const artifacts = new Map<DeliverableId, { content: unknown; artifact_id: string }>();

  for (const deliverableId of deliverableIds) {
    const artifactId = `${projectId}:${runId}:${deliverableId}:v1`;
    const artifact = await loadArtifactFn(artifactId);

    if (artifact) {
      artifacts.set(deliverableId, { content: artifact.content, artifact_id: artifactId });
    }
  }

  return scanPlaceholders(artifacts);
}
