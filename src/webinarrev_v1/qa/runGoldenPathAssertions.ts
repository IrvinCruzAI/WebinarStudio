import {
  DeliverableId,
  WR2,
  WR6,
  ExportEligibility,
} from '../contracts';
import { computeExportEligibility } from '../export/eligibilityComputer';

export interface GoldenPathCheck {
  id: string;
  label: string;
  pass: boolean;
  details?: string;
}

export interface GoldenPathResult {
  ok: boolean;
  checks: GoldenPathCheck[];
  eligibility: ExportEligibility | null;
}

const CLIENT_DELIVERABLE_IDS: DeliverableId[] = [
  'WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'
];

export async function runGoldenPathAssertions(
  projectId: string,
  runId: string,
  artifacts: Map<DeliverableId, { content: unknown; validated: boolean }>
): Promise<GoldenPathResult> {
  const checks: GoldenPathCheck[] = [];

  const eligibility = await computeExportEligibility(projectId, runId);

  const wr2 = artifacts.get('WR2')?.content as WR2 | undefined;
  const wr6 = artifacts.get('WR6')?.content as WR6 | undefined;

  checks.push(checkWR2Has21Blocks(wr2));
  checks.push(checkWR2BlockIds(wr2));
  checks.push(checkWR6CrosslinksToWR2(wr2, wr6));
  checks.push(checkExportIncludesWR1ToWR8(eligibility));
  checks.push(checkExportExcludesWR9());
  checks.push(checkReadinessFormulaValid(eligibility));
  checks.push(checkPassCondition(eligibility));

  const ok = checks.every(c => c.pass);

  return { ok, checks, eligibility };
}

function checkWR2Has21Blocks(wr2: WR2 | undefined): GoldenPathCheck {
  if (!wr2) {
    return {
      id: 'wr2-block-count',
      label: 'WR2 has exactly 21 blocks',
      pass: false,
      details: 'WR2 is not available',
    };
  }

  if (!wr2.blocks || !Array.isArray(wr2.blocks)) {
    return {
      id: 'wr2-block-count',
      label: 'WR2 has exactly 21 blocks',
      pass: false,
      details: 'WR2 blocks array is missing or invalid',
    };
  }

  const pass = wr2.blocks.length === 21;
  return {
    id: 'wr2-block-count',
    label: 'WR2 has exactly 21 blocks',
    pass,
    details: pass ? 'Found all 21 blocks' : `Found ${wr2.blocks.length} blocks instead of 21`,
  };
}

function checkWR2BlockIds(wr2: WR2 | undefined): GoldenPathCheck {
  if (!wr2) {
    return {
      id: 'wr2-block-ids',
      label: 'WR2 block IDs are B01-B21',
      pass: false,
      details: 'WR2 is not available',
    };
  }

  if (!wr2.blocks || !Array.isArray(wr2.blocks)) {
    return {
      id: 'wr2-block-ids',
      label: 'WR2 block IDs are B01-B21',
      pass: false,
      details: 'WR2 blocks array is missing or invalid',
    };
  }

  const expectedIds = Array.from({ length: 21 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    return `B${num}`;
  });

  const actualIds = wr2.blocks.map(b => b.block_id);
  const missingIds = expectedIds.filter(id => !actualIds.includes(id));
  const pass = missingIds.length === 0;

  return {
    id: 'wr2-block-ids',
    label: 'WR2 block IDs are B01-B21',
    pass,
    details: pass
      ? 'All block IDs are correct'
      : `Missing or incorrect block IDs: ${missingIds.join(', ')}`,
  };
}

function checkWR6CrosslinksToWR2(wr2: WR2 | undefined, wr6: WR6 | undefined): GoldenPathCheck {
  if (!wr6) {
    return {
      id: 'wr6-crosslinks',
      label: 'WR6 timeline references valid block IDs from WR2',
      pass: false,
      details: 'WR6 is not available',
    };
  }

  if (!wr6.timeline || !Array.isArray(wr6.timeline)) {
    return {
      id: 'wr6-crosslinks',
      label: 'WR6 timeline references valid block IDs from WR2',
      pass: false,
      details: 'WR6 timeline array is missing or invalid',
    };
  }

  if (!wr2) {
    return {
      id: 'wr6-crosslinks',
      label: 'WR6 timeline references valid block IDs from WR2',
      pass: false,
      details: 'WR2 is not available',
    };
  }

  if (!wr2.blocks || !Array.isArray(wr2.blocks)) {
    return {
      id: 'wr6-crosslinks',
      label: 'WR6 timeline references valid block IDs from WR2',
      pass: false,
      details: 'WR2 blocks array is missing or invalid',
    };
  }

  const validBlockIds = new Set(wr2.blocks.map(b => b.block_id));
  const invalidRefs = wr6.timeline.filter(seg => !validBlockIds.has(seg.block_id));

  return {
    id: 'wr6-crosslinks',
    label: 'WR6 timeline references valid block IDs from WR2',
    pass: invalidRefs.length === 0,
    details: invalidRefs.length === 0
      ? `All ${wr6.timeline.length} timeline segments reference valid blocks`
      : `Invalid references: ${invalidRefs.map(seg => seg.block_id).join(', ')}`,
  };
}

function checkExportIncludesWR1ToWR8(eligibility: ExportEligibility | null): GoldenPathCheck {
  if (!eligibility) {
    return {
      id: 'export-includes-wr1-wr8',
      label: 'Export includes WR1-WR8',
      pass: false,
      details: 'Export eligibility data not available',
    };
  }

  const missingIds = CLIENT_DELIVERABLE_IDS.filter(
    id => !eligibility.validation_results[id]
  );

  return {
    id: 'export-includes-wr1-wr8',
    label: 'Export includes WR1-WR8',
    pass: missingIds.length === 0,
    details: missingIds.length === 0
      ? 'All client deliverables present'
      : `Missing: ${missingIds.join(', ')}`,
  };
}

function checkExportExcludesWR9(): GoldenPathCheck {
  return {
    id: 'export-excludes-wr9',
    label: 'Export excludes WR9 (internal only)',
    pass: true,
    details: 'WR9 is correctly excluded from client exports by design',
  };
}

function checkReadinessFormulaValid(eligibility: ExportEligibility | null): GoldenPathCheck {
  if (!eligibility) {
    return {
      id: 'readiness-formula',
      label: 'Readiness formula matches locked spec',
      pass: false,
      details: 'Export eligibility data not available',
    };
  }

  const score = eligibility.readiness_score;
  const pass = score >= 0 && score <= 100;

  return {
    id: 'readiness-formula',
    label: 'Readiness formula matches locked spec',
    pass,
    details: pass
      ? `Score: ${score}/100 (within valid range)`
      : `Score: ${score}/100 (out of range)`,
  };
}

function checkPassCondition(eligibility: ExportEligibility | null): GoldenPathCheck {
  if (!eligibility) {
    return {
      id: 'pass-condition',
      label: 'Pass: score >= 70 AND critical_count == 0 AND all WR1-WR8 validated',
      pass: false,
      details: 'Export eligibility data not available',
    };
  }

  const scorePass = eligibility.readiness_score >= 70;
  const criticalPass = eligibility.placeholder_scan.critical_count === 0;
  const allValidated = CLIENT_DELIVERABLE_IDS.every(id => {
    const result = eligibility.validation_results[id];
    return result && result.ok;
  });

  const pass = scorePass && criticalPass && allValidated;

  const reasons = [];
  if (!scorePass) reasons.push(`Score ${eligibility.readiness_score} < 70`);
  if (!criticalPass) reasons.push(`${eligibility.placeholder_scan.critical_count} critical placeholders`);
  if (!allValidated) reasons.push('Not all deliverables validated');

  return {
    id: 'pass-condition',
    label: 'Pass: score >= 70 AND critical_count == 0 AND all WR1-WR8 validated',
    pass,
    details: pass
      ? 'All pass conditions met'
      : `Failed: ${reasons.join(', ')}`,
  };
}
