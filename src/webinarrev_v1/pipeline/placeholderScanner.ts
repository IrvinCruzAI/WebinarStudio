import {
  DeliverableId,
  PlaceholderScanResult,
  PlaceholderLocation,
  WR3,
} from '../contracts';

const IS_DEV = import.meta.env.MODE === 'development';

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

function isValidArtifactId(artifactId: string): boolean {
  if (!artifactId || typeof artifactId !== 'string') {
    return false;
  }

  if (artifactId.includes('undefined') || artifactId.includes('null')) {
    if (IS_DEV) {
      console.warn('[placeholderScanner] Invalid artifact_id contains "undefined" or "null":', artifactId);
    }
    return false;
  }

  const parts = artifactId.split(':');
  if (parts.length !== 4) {
    if (IS_DEV) {
      console.warn('[placeholderScanner] Invalid artifact_id format (expected 4 parts):', artifactId);
    }
    return false;
  }

  const [projectId, runId, deliverableId, version] = parts;
  if (!projectId || !runId || !deliverableId || !version) {
    if (IS_DEV) {
      console.warn('[placeholderScanner] Invalid artifact_id has empty parts:', artifactId);
    }
    return false;
  }

  const validDeliverablePattern = /^WR[1-9]$|^PREFLIGHT$/;
  if (!validDeliverablePattern.test(deliverableId)) {
    if (IS_DEV) {
      console.warn('[placeholderScanner] Invalid deliverable_id in artifact_id:', deliverableId, 'from', artifactId);
    }
    return false;
  }

  return true;
}

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
  let malformedCount = 0;

  for (const [deliverableId, artifact] of artifacts) {
    if (deliverableId === 'PREFLIGHT' || deliverableId === 'WR9') {
      continue;
    }

    if (!isValidArtifactId(artifact.artifact_id)) {
      malformedCount++;
      if (IS_DEV) {
        console.warn('[placeholderScanner] Skipping malformed artifact:', { deliverableId, artifact_id: artifact.artifact_id });
      }
      continue;
    }

    scanObject(artifact.content, artifact.artifact_id, '', deliverableId, locations);

    if (deliverableId === 'WR3') {
      scanWR3Proof(artifact.content as WR3, artifact.artifact_id, locations);
    }
  }

  if (IS_DEV && malformedCount > 0) {
    console.warn(`[placeholderScanner] Filtered ${malformedCount} malformed artifact(s) from scan`);
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

  const scanResult = scanPlaceholders(artifacts);

  if (IS_DEV) {
    assertValidPlaceholderScan(scanResult);
  }

  return scanResult;
}

export function assertValidPlaceholderScan(scanResult: PlaceholderScanResult): void {
  if (!IS_DEV) {
    return;
  }

  const issues: string[] = [];

  for (const location of scanResult.locations) {
    if (location.artifact_id.includes('undefined')) {
      issues.push(`Location has "undefined" in artifact_id: ${location.artifact_id} at ${location.field_path}`);
    }

    if (location.artifact_id.includes('null')) {
      issues.push(`Location has "null" in artifact_id: ${location.artifact_id} at ${location.field_path}`);
    }

    if (!isValidArtifactId(location.artifact_id)) {
      issues.push(`Location has invalid artifact_id format: ${location.artifact_id}`);
    }

    if (location.field_path.includes('undefined')) {
      issues.push(`Location has "undefined" in field_path: ${location.field_path} for ${location.artifact_id}`);
    }

    if (typeof location.is_critical !== 'boolean') {
      issues.push(`Location has non-boolean is_critical: ${location.is_critical} for ${location.field_path}`);
    }

    const criticalInPath = location.field_path.toLowerCase().includes('link') ||
                           location.placeholder_text.toLowerCase().includes('link');
    const isCritical = location.is_critical;

    if (criticalInPath && !isCritical) {
      if (location.field_path.includes('cta_block') ||
          location.placeholder_text.includes('link_placeholder')) {
        issues.push(`Possible critical flag inconsistency: ${location.field_path} has link but is_critical=${isCritical}`);
      }
    }
  }

  if (scanResult.critical_count < 0) {
    issues.push(`Invalid critical_count: ${scanResult.critical_count} (must be >= 0)`);
  }

  if (scanResult.total_count < scanResult.critical_count) {
    issues.push(`Invalid counts: total_count (${scanResult.total_count}) < critical_count (${scanResult.critical_count})`);
  }

  if (scanResult.total_count !== scanResult.locations.length) {
    issues.push(`Count mismatch: total_count=${scanResult.total_count} but locations.length=${scanResult.locations.length}`);
  }

  const actualCriticalCount = scanResult.locations.filter(loc => loc.is_critical).length;
  if (actualCriticalCount !== scanResult.critical_count) {
    issues.push(`Critical count mismatch: critical_count=${scanResult.critical_count} but actual=${actualCriticalCount}`);
  }

  if (issues.length > 0) {
    console.error('[placeholderScanner] Runtime assertion failed!');
    console.error('Issues found:', issues);
    console.error('Scan result:', scanResult);
    throw new Error(`placeholderScanner runtime assertion failed: ${issues.length} issue(s) detected. See console for details.`);
  }
}
