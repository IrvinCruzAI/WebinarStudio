import {
  DeliverableId,
  ValidationResult,
  WR2,
  WR6,
  WR4,
  WR5,
  WR7,
  validateBlockPhase,
} from '../contracts';

export interface ValidationContext {
  webinarLengthMinutes?: number;
}

export interface DurationValidation {
  totalBlockMinutes: number;
  targetMinutes: number;
  percentageDiff: number;
  isWithinTolerance: boolean;
  warnings: string[];
}

export function validateCrosslinks(
  deliverableId: DeliverableId,
  content: unknown,
  dependencies: Map<DeliverableId, unknown>,
  dependencyValidation?: Map<DeliverableId, ValidationResult>,
  context?: ValidationContext
): ValidationResult {
  switch (deliverableId) {
    case 'WR2':
      return validateWR2Crosslinks(content as WR2, context);
    case 'WR4':
      return validateWR4Crosslinks(content as WR4);
    case 'WR5':
      return validateWR5Crosslinks(content as WR5);
    case 'WR6':
      return validateWR6Crosslinks(content as WR6, dependencies, dependencyValidation, context);
    case 'WR7':
      return validateWR7Crosslinks(content as WR7);
    default:
      return { ok: true, errors: [] };
  }
}

export function validateWR2Duration(content: WR2, targetMinutes: number): DurationValidation {
  const totalBlockMinutes = content.blocks.reduce(
    (sum, block) => sum + (block.timebox_minutes || 0),
    0
  );

  const percentageDiff = Math.abs(totalBlockMinutes - targetMinutes) / targetMinutes * 100;
  const isWithinTolerance = percentageDiff <= 15;
  const warnings: string[] = [];

  if (!isWithinTolerance) {
    warnings.push(
      `duration_mismatch:WR2 blocks total ${totalBlockMinutes}min but target is ${targetMinutes}min (${percentageDiff.toFixed(1)}% difference)`
    );
  }

  return {
    totalBlockMinutes,
    targetMinutes,
    percentageDiff,
    isWithinTolerance,
    warnings,
  };
}

function validateWR2Crosslinks(content: WR2, context?: ValidationContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content?.blocks || !Array.isArray(content.blocks)) {
    return { ok: false, errors: ['crosslink_missing_blocks:WR2'] };
  }

  const blockIds = content.blocks.map(b => b.block_id);
  const uniqueBlockIds = new Set(blockIds);

  if (blockIds.length !== uniqueBlockIds.size) {
    errors.push('crosslink_duplicate_block_ids:WR2');
  }

  for (const block of content.blocks) {
    if (!validateBlockPhase(block.block_id, block.phase)) {
      errors.push(`crosslink_invalid_phase:${block.block_id} should be ${getExpectedPhase(block.block_id)}`);
    }

    if (block.timebox_minutes < 1) {
      errors.push(`crosslink_invalid_timebox:${block.block_id} has timebox < 1 minute`);
    }
  }

  if (context?.webinarLengthMinutes) {
    const durationValidation = validateWR2Duration(content, context.webinarLengthMinutes);
    if (!durationValidation.isWithinTolerance) {
      warnings.push(...durationValidation.warnings);
    }
  }

  return {
    ok: errors.length === 0,
    errors: [...errors, ...warnings],
  };
}

function getExpectedPhase(blockId: string): string {
  const num = parseInt(blockId.replace('B', ''), 10);
  if (num <= 7) return 'beginning';
  if (num <= 14) return 'middle';
  return 'end';
}

function validateWR4Crosslinks(content: WR4): ValidationResult {
  const errors: string[] = [];

  if (!content?.emails || !Array.isArray(content.emails)) {
    return { ok: false, errors: ['crosslink_missing_emails:WR4'] };
  }

  const emailIds = content.emails.map(e => e.email_id);
  const uniqueEmailIds = new Set(emailIds);

  if (emailIds.length !== uniqueEmailIds.size) {
    errors.push('crosslink_duplicate_email_ids:WR4');
  }

  if (content.emails.length < 8 || content.emails.length > 10) {
    errors.push(`crosslink_email_count_invalid:WR4 (expected 8-10, got ${content.emails.length})`);
  }

  return { ok: errors.length === 0, errors };
}

function validateWR5Crosslinks(content: WR5): ValidationResult {
  const errors: string[] = [];

  const linkedinPosts = content?.linkedin_posts ?? [];
  const xPosts = content?.x_posts ?? [];
  const lastChanceBlurbs = content?.last_chance_blurbs ?? [];

  if (!Array.isArray(linkedinPosts) || !Array.isArray(xPosts) || !Array.isArray(lastChanceBlurbs)) {
    return { ok: false, errors: ['crosslink_missing_social_arrays:WR5'] };
  }

  const allSocialIds = [
    ...linkedinPosts.map(p => p.social_id),
    ...xPosts.map(p => p.social_id),
    ...lastChanceBlurbs.map(p => p.social_id),
  ];

  const uniqueSocialIds = new Set(allSocialIds);

  if (allSocialIds.length !== uniqueSocialIds.size) {
    errors.push('crosslink_duplicate_social_ids:WR5');
  }

  const totalCount = allSocialIds.length;
  if (totalCount < 6 || totalCount > 18) {
    errors.push(`crosslink_social_count_invalid:WR5 (expected 6-18, got ${totalCount})`);
  }

  return { ok: errors.length === 0, errors };
}

function validateWR6Crosslinks(
  content: WR6,
  dependencies: Map<DeliverableId, unknown>,
  dependencyValidation?: Map<DeliverableId, ValidationResult>,
  context?: ValidationContext
): ValidationResult {
  const errors: string[] = [];

  if (!content?.timeline || !Array.isArray(content.timeline)) {
    return { ok: false, errors: ['crosslink_missing_timeline:WR6'] };
  }

  const wr2 = dependencies.get('WR2') as WR2 | undefined;

  if (!wr2) {
    errors.push('crosslink_missing_dependency:WR2');
    return { ok: false, errors };
  }

  if (!wr2.blocks || !Array.isArray(wr2.blocks)) {
    errors.push('crosslink_dependency_invalid:WR2 blocks missing');
    return { ok: false, errors };
  }

  if (dependencyValidation) {
    const wr2Validation = dependencyValidation.get('WR2');
    if (wr2Validation && !wr2Validation.ok) {
      errors.push('crosslink_dependency_invalid:WR2 must be valid before validating WR6');
      return { ok: false, errors };
    }
  }

  const validBlockIds = new Set(wr2.blocks.map(b => b.block_id));

  for (const segment of content.timeline) {
    if (!validBlockIds.has(segment.block_id)) {
      errors.push(`crosslink_invalid_block_id:${segment.block_id} not found in WR2`);
    }

    if (segment.start_minute >= segment.end_minute) {
      errors.push(`crosslink_invalid_time_bounds:${segment.segment_title} (start >= end)`);
    }

    if (segment.end_minute > content.total_duration_minutes) {
      errors.push(`crosslink_time_exceeds_duration:${segment.segment_title}`);
    }
  }

  if (context?.webinarLengthMinutes) {
    if (content.total_duration_minutes !== context.webinarLengthMinutes) {
      const diff = Math.abs(content.total_duration_minutes - context.webinarLengthMinutes);
      const percentDiff = (diff / context.webinarLengthMinutes) * 100;
      if (percentDiff > 10) {
        errors.push(
          `crosslink_duration_mismatch:WR6 total_duration_minutes (${content.total_duration_minutes}) differs from target (${context.webinarLengthMinutes})`
        );
      }
    }
  }

  const sortedTimeline = [...content.timeline].sort((a, b) => a.start_minute - b.start_minute);
  for (let i = 1; i < sortedTimeline.length; i++) {
    const prev = sortedTimeline[i - 1];
    const curr = sortedTimeline[i];
    if (curr.start_minute < prev.end_minute) {
      errors.push(
        `crosslink_overlapping_segments:${prev.segment_title} and ${curr.segment_title}`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

function validateWR7Crosslinks(content: WR7): ValidationResult {
  const errors: string[] = [];

  const preWebinar = content?.pre_webinar ?? [];
  const liveWebinar = content?.live_webinar ?? [];
  const postWebinar = content?.post_webinar ?? [];

  if (!Array.isArray(preWebinar) || !Array.isArray(liveWebinar) || !Array.isArray(postWebinar)) {
    return { ok: false, errors: ['crosslink_missing_checklist_arrays:WR7'] };
  }

  const allChecklistIds = [
    ...preWebinar.map(item => item.checklist_id),
    ...liveWebinar.map(item => item.checklist_id),
    ...postWebinar.map(item => item.checklist_id),
  ];

  const uniqueChecklistIds = new Set(allChecklistIds);

  if (allChecklistIds.length !== uniqueChecklistIds.size) {
    errors.push('crosslink_duplicate_checklist_ids:WR7');
  }

  for (const item of preWebinar) {
    if (!item.checklist_id.startsWith('CL_pre_')) {
      errors.push(`crosslink_invalid_checklist_category:${item.checklist_id} should start with CL_pre_`);
    }
  }

  for (const item of liveWebinar) {
    if (!item.checklist_id.startsWith('CL_live_')) {
      errors.push(`crosslink_invalid_checklist_category:${item.checklist_id} should start with CL_live_`);
    }
  }

  for (const item of postWebinar) {
    if (!item.checklist_id.startsWith('CL_post_')) {
      errors.push(`crosslink_invalid_checklist_category:${item.checklist_id} should start with CL_post_`);
    }
  }

  return { ok: errors.length === 0, errors };
}
