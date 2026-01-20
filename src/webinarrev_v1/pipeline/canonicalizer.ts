import type { DeliverableId } from '../contracts/enums';
import { PHASE_MAPPING } from '../contracts/enums';

export interface NormalizationChange {
  type: 'id_padding' | 'field_removal' | 'type_coercion' | 'array_sort' | 'phase_fix';
  path: string;
  before: unknown;
  after: unknown;
  description: string;
}

export interface NormalizationLog {
  deliverableId: string;
  timestamp: number;
  changes: NormalizationChange[];
  totalChanges: number;
}

const ALLOWED_FIELDS: Record<string, Record<string, string[]>> = {
  PREFLIGHT: {
    _root: ['status', 'readiness', 'missing_context', 'assumptions', 'recommended_questions', 'risk_flags'],
    readiness: ['score', 'rationale'],
    'missing_context[]': ['field', 'why_it_matters', 'example_answer'],
  },
  WR1: {
    _root: ['parsed_intake', 'executive_summary', 'cleaned_transcript', 'structured_notes', 'main_themes', 'speaker_insights', 'proof_points', 'qa', 'edited_fields'],
    parsed_intake: ['client_name', 'company', 'webinar_title', 'offer', 'target_audience', 'tone', 'primary_cta_type', 'speaker_name', 'speaker_title'],
    executive_summary: ['overview', 'key_points'],
    'proof_points[]': ['type', 'content', 'source'],
    qa: ['assumptions', 'placeholders', 'claims_requiring_proof'],
  },
  WR2: {
    _root: ['blocks', 'qa'],
    'blocks[]': ['block_id', 'phase', 'title', 'purpose', 'talk_track_md', 'speaker_notes_md', 'transition_in', 'transition_out', 'timebox_minutes', 'proof_insertion_points', 'objections_handled'],
    qa: ['assumptions', 'placeholders', 'claims_requiring_proof'],
  },
  WR3: {
    _root: ['hero_headline', 'subheadline', 'bullets', 'agenda_preview', 'proof_blocks', 'speaker_bio', 'cta_block', 'faq', 'who_its_for', 'who_its_not_for', 'legal_disclaimer_md', 'qa'],
    'agenda_preview[]': ['segment', 'timebox_minutes', 'promise'],
    'proof_blocks[]': ['type', 'content', 'needs_source'],
    speaker_bio: ['one_liner', 'credibility_bullets'],
    cta_block: ['headline', 'body', 'button_label', 'link_placeholder'],
    'faq[]': ['question', 'answer'],
    qa: ['assumptions', 'placeholders', 'claims_requiring_proof'],
  },
  WR4: {
    _root: ['send_rules', 'emails', 'qa'],
    send_rules: ['from_name_placeholder', 'from_email_placeholder', 'reply_to_placeholder'],
    'emails[]': ['email_id', 'timing', 'subject', 'preview_text', 'body_markdown', 'primary_cta_label', 'primary_cta_link_placeholder'],
    qa: ['assumptions', 'placeholders', 'claims_requiring_proof'],
  },
  WR5: {
    _root: ['linkedin_posts', 'x_posts', 'last_chance_blurbs', 'qa'],
    'linkedin_posts[]': ['social_id', 'hook', 'body', 'cta_line'],
    'x_posts[]': ['social_id', 'body'],
    'last_chance_blurbs[]': ['social_id', 'body'],
    qa: ['assumptions', 'placeholders', 'claims_requiring_proof'],
  },
  WR6: {
    _root: ['total_duration_minutes', 'timeline', 'qa'],
    'timeline[]': ['start_minute', 'end_minute', 'segment_title', 'block_id', 'description', 'coach_cue', 'fallback_if_cold', 'time_check'],
    qa: ['assumptions', 'placeholders', 'claims_requiring_proof'],
  },
  WR7: {
    _root: ['pre_webinar', 'live_webinar', 'post_webinar', 'qa'],
    'pre_webinar[]': ['checklist_id', 'task', 'timing', 'notes'],
    'live_webinar[]': ['checklist_id', 'task', 'timing', 'notes'],
    'post_webinar[]': ['checklist_id', 'task', 'timing', 'notes'],
    qa: ['assumptions', 'placeholders', 'claims_requiring_proof'],
  },
  WR8: {
    _root: ['gamma_prompt', 'slide_count_recommendation', 'visual_direction', 'key_slides', 'qa'],
    'key_slides[]': ['slide_number', 'title', 'purpose', 'content_points'],
    qa: ['assumptions', 'placeholders', 'claims_requiring_proof'],
  },
  WR9: {
    _root: ['readiness_score', 'pass', 'blocking_reasons', 'validation_results', 'placeholder_scan', 'recommended_next_actions'],
    placeholder_scan: ['total_count', 'critical_count', 'locations'],
    'locations[]': ['artifact_id', 'field_path', 'placeholder_text', 'is_critical'],
  },
};

function padBlockId(id: string): string | null {
  const match = id.match(/^B(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 21) return null;
  return `B${num.toString().padStart(2, '0')}`;
}

function padEmailId(id: string): string | null {
  const match = id.match(/^E(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 10) return null;
  return `E${num.toString().padStart(2, '0')}`;
}

function padSocialId(id: string): string | null {
  const match = id.match(/^S(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 18) return null;
  return `S${num.toString().padStart(2, '0')}`;
}

function padChecklistId(id: string): string | null {
  const match = id.match(/^CL_(pre|live|post)_(\d+)$/);
  if (!match) return null;
  const [, category, numStr] = match;
  const num = parseInt(numStr, 10);
  if (num < 1 || num > 999) return null;
  return `CL_${category}_${num.toString().padStart(3, '0')}`;
}

function getPhaseForBlockId(blockId: string): string | null {
  if (PHASE_MAPPING.beginning.includes(blockId as never)) return 'beginning';
  if (PHASE_MAPPING.middle.includes(blockId as never)) return 'middle';
  if (PHASE_MAPPING.end.includes(blockId as never)) return 'end';
  return null;
}

function coerceToNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
  }
  return null;
}

function coerceToBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0) return false;
  return null;
}

function stripUnknownFields(
  obj: Record<string, unknown>,
  allowedFields: string[],
  path: string,
  changes: NormalizationChange[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const existingKeys = Object.keys(obj);

  for (const key of existingKeys) {
    if (allowedFields.includes(key)) {
      result[key] = obj[key];
    } else {
      changes.push({
        type: 'field_removal',
        path: path ? `${path}.${key}` : key,
        before: obj[key],
        after: undefined,
        description: `Removed unknown field "${key}"`,
      });
    }
  }

  return result;
}

function canonicalizeWR2(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.WR2._root, '', changes);

  if (Array.isArray(result.blocks)) {
    result.blocks = result.blocks.map((block: unknown, idx: number) => {
      if (!block || typeof block !== 'object') return block;
      const blockObj = block as Record<string, unknown>;

      let strippedBlock = stripUnknownFields(
        blockObj,
        ALLOWED_FIELDS.WR2['blocks[]'],
        `blocks[${idx}]`,
        changes
      );

      if (typeof strippedBlock.block_id === 'string') {
        const paddedId = padBlockId(strippedBlock.block_id);
        if (paddedId && paddedId !== strippedBlock.block_id) {
          changes.push({
            type: 'id_padding',
            path: `blocks[${idx}].block_id`,
            before: strippedBlock.block_id,
            after: paddedId,
            description: `Padded block ID: ${strippedBlock.block_id} -> ${paddedId}`,
          });
          strippedBlock.block_id = paddedId;
        }

        const correctPhase = getPhaseForBlockId(strippedBlock.block_id as string);
        if (correctPhase && strippedBlock.phase !== correctPhase) {
          changes.push({
            type: 'phase_fix',
            path: `blocks[${idx}].phase`,
            before: strippedBlock.phase,
            after: correctPhase,
            description: `Fixed phase for ${strippedBlock.block_id}: ${strippedBlock.phase} -> ${correctPhase}`,
          });
          strippedBlock.phase = correctPhase;
        }
      }

      if (strippedBlock.timebox_minutes !== undefined) {
        const coerced = coerceToNumber(strippedBlock.timebox_minutes);
        if (coerced !== null && coerced !== strippedBlock.timebox_minutes) {
          changes.push({
            type: 'type_coercion',
            path: `blocks[${idx}].timebox_minutes`,
            before: strippedBlock.timebox_minutes,
            after: coerced,
            description: `Coerced timebox_minutes to number`,
          });
          strippedBlock.timebox_minutes = coerced;
        }
      }

      return strippedBlock;
    });

    const blocksBefore = JSON.stringify(result.blocks);
    result.blocks = (result.blocks as Array<{ block_id: string }>).sort((a, b) => {
      const aNum = parseInt(a.block_id?.replace('B', '') || '0', 10);
      const bNum = parseInt(b.block_id?.replace('B', '') || '0', 10);
      return aNum - bNum;
    });

    if (JSON.stringify(result.blocks) !== blocksBefore) {
      changes.push({
        type: 'array_sort',
        path: 'blocks',
        before: 'unsorted',
        after: 'sorted by block_id',
        description: 'Sorted blocks array by block_id',
      });
    }
  }

  if (result.qa && typeof result.qa === 'object') {
    result.qa = stripUnknownFields(
      result.qa as Record<string, unknown>,
      ALLOWED_FIELDS.WR2.qa,
      'qa',
      changes
    );
  }

  return result;
}

function canonicalizeWR3(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.WR3._root, '', changes);

  if (Array.isArray(result.agenda_preview)) {
    result.agenda_preview = result.agenda_preview.map((item: unknown, idx: number) => {
      if (!item || typeof item !== 'object') return item;
      let stripped = stripUnknownFields(
        item as Record<string, unknown>,
        ALLOWED_FIELDS.WR3['agenda_preview[]'],
        `agenda_preview[${idx}]`,
        changes
      );

      if (stripped.timebox_minutes !== undefined) {
        const coerced = coerceToNumber(stripped.timebox_minutes);
        if (coerced !== null && coerced !== stripped.timebox_minutes) {
          changes.push({
            type: 'type_coercion',
            path: `agenda_preview[${idx}].timebox_minutes`,
            before: stripped.timebox_minutes,
            after: coerced,
            description: `Coerced timebox_minutes to number`,
          });
          stripped.timebox_minutes = coerced;
        }
      }
      return stripped;
    });
  }

  if (Array.isArray(result.proof_blocks)) {
    result.proof_blocks = result.proof_blocks.map((item: unknown, idx: number) => {
      if (!item || typeof item !== 'object') return item;
      let stripped = stripUnknownFields(
        item as Record<string, unknown>,
        ALLOWED_FIELDS.WR3['proof_blocks[]'],
        `proof_blocks[${idx}]`,
        changes
      );

      if (stripped.needs_source !== undefined) {
        const coerced = coerceToBoolean(stripped.needs_source);
        if (coerced !== null && coerced !== stripped.needs_source) {
          changes.push({
            type: 'type_coercion',
            path: `proof_blocks[${idx}].needs_source`,
            before: stripped.needs_source,
            after: coerced,
            description: `Coerced needs_source to boolean`,
          });
          stripped.needs_source = coerced;
        }
      }
      return stripped;
    });
  }

  if (result.speaker_bio && typeof result.speaker_bio === 'object') {
    result.speaker_bio = stripUnknownFields(
      result.speaker_bio as Record<string, unknown>,
      ALLOWED_FIELDS.WR3.speaker_bio,
      'speaker_bio',
      changes
    );
  }

  if (result.cta_block && typeof result.cta_block === 'object') {
    result.cta_block = stripUnknownFields(
      result.cta_block as Record<string, unknown>,
      ALLOWED_FIELDS.WR3.cta_block,
      'cta_block',
      changes
    );
  }

  if (Array.isArray(result.faq)) {
    result.faq = result.faq.map((item: unknown, idx: number) => {
      if (!item || typeof item !== 'object') return item;
      return stripUnknownFields(
        item as Record<string, unknown>,
        ALLOWED_FIELDS.WR3['faq[]'],
        `faq[${idx}]`,
        changes
      );
    });
  }

  if (result.qa && typeof result.qa === 'object') {
    result.qa = stripUnknownFields(
      result.qa as Record<string, unknown>,
      ALLOWED_FIELDS.WR3.qa,
      'qa',
      changes
    );
  }

  return result;
}

function canonicalizeWR4(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.WR4._root, '', changes);

  if (result.send_rules && typeof result.send_rules === 'object') {
    result.send_rules = stripUnknownFields(
      result.send_rules as Record<string, unknown>,
      ALLOWED_FIELDS.WR4.send_rules,
      'send_rules',
      changes
    );
  }

  if (Array.isArray(result.emails)) {
    result.emails = result.emails.map((email: unknown, idx: number) => {
      if (!email || typeof email !== 'object') return email;
      let strippedEmail = stripUnknownFields(
        email as Record<string, unknown>,
        ALLOWED_FIELDS.WR4['emails[]'],
        `emails[${idx}]`,
        changes
      );

      if (typeof strippedEmail.email_id === 'string') {
        const paddedId = padEmailId(strippedEmail.email_id);
        if (paddedId && paddedId !== strippedEmail.email_id) {
          changes.push({
            type: 'id_padding',
            path: `emails[${idx}].email_id`,
            before: strippedEmail.email_id,
            after: paddedId,
            description: `Padded email ID: ${strippedEmail.email_id} -> ${paddedId}`,
          });
          strippedEmail.email_id = paddedId;
        }
      }

      return strippedEmail;
    });

    const emailsBefore = JSON.stringify(result.emails);
    result.emails = (result.emails as Array<{ email_id: string }>).sort((a, b) => {
      const aNum = parseInt(a.email_id?.replace('E', '') || '0', 10);
      const bNum = parseInt(b.email_id?.replace('E', '') || '0', 10);
      return aNum - bNum;
    });

    if (JSON.stringify(result.emails) !== emailsBefore) {
      changes.push({
        type: 'array_sort',
        path: 'emails',
        before: 'unsorted',
        after: 'sorted by email_id',
        description: 'Sorted emails array by email_id',
      });
    }
  }

  if (result.qa && typeof result.qa === 'object') {
    result.qa = stripUnknownFields(
      result.qa as Record<string, unknown>,
      ALLOWED_FIELDS.WR4.qa,
      'qa',
      changes
    );
  }

  return result;
}

function canonicalizeSocialPostArray(
  posts: unknown[],
  allowedFields: string[],
  arrayPath: string,
  changes: NormalizationChange[]
): unknown[] {
  return posts.map((post: unknown, idx: number) => {
    if (!post || typeof post !== 'object') return post;
    let strippedPost = stripUnknownFields(
      post as Record<string, unknown>,
      allowedFields,
      `${arrayPath}[${idx}]`,
      changes
    );

    if (typeof strippedPost.social_id === 'string') {
      const paddedId = padSocialId(strippedPost.social_id);
      if (paddedId && paddedId !== strippedPost.social_id) {
        changes.push({
          type: 'id_padding',
          path: `${arrayPath}[${idx}].social_id`,
          before: strippedPost.social_id,
          after: paddedId,
          description: `Padded social ID: ${strippedPost.social_id} -> ${paddedId}`,
        });
        strippedPost.social_id = paddedId;
      }
    }

    return strippedPost;
  });
}

function canonicalizeWR5(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.WR5._root, '', changes);

  if (Array.isArray(result.linkedin_posts)) {
    result.linkedin_posts = canonicalizeSocialPostArray(
      result.linkedin_posts,
      ALLOWED_FIELDS.WR5['linkedin_posts[]'],
      'linkedin_posts',
      changes
    );
  }

  if (Array.isArray(result.x_posts)) {
    result.x_posts = canonicalizeSocialPostArray(
      result.x_posts,
      ALLOWED_FIELDS.WR5['x_posts[]'],
      'x_posts',
      changes
    );
  }

  if (Array.isArray(result.last_chance_blurbs)) {
    result.last_chance_blurbs = canonicalizeSocialPostArray(
      result.last_chance_blurbs,
      ALLOWED_FIELDS.WR5['last_chance_blurbs[]'],
      'last_chance_blurbs',
      changes
    );
  }

  if (result.qa && typeof result.qa === 'object') {
    result.qa = stripUnknownFields(
      result.qa as Record<string, unknown>,
      ALLOWED_FIELDS.WR5.qa,
      'qa',
      changes
    );
  }

  return result;
}

function canonicalizeWR6(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.WR6._root, '', changes);

  if (result.total_duration_minutes !== undefined) {
    const coerced = coerceToNumber(result.total_duration_minutes);
    if (coerced !== null && coerced !== result.total_duration_minutes) {
      changes.push({
        type: 'type_coercion',
        path: 'total_duration_minutes',
        before: result.total_duration_minutes,
        after: coerced,
        description: `Coerced total_duration_minutes to number`,
      });
      result.total_duration_minutes = coerced;
    }
  }

  if (Array.isArray(result.timeline)) {
    result.timeline = result.timeline.map((segment: unknown, idx: number) => {
      if (!segment || typeof segment !== 'object') return segment;
      let strippedSegment = stripUnknownFields(
        segment as Record<string, unknown>,
        ALLOWED_FIELDS.WR6['timeline[]'],
        `timeline[${idx}]`,
        changes
      );

      if (typeof strippedSegment.block_id === 'string') {
        const paddedId = padBlockId(strippedSegment.block_id);
        if (paddedId && paddedId !== strippedSegment.block_id) {
          changes.push({
            type: 'id_padding',
            path: `timeline[${idx}].block_id`,
            before: strippedSegment.block_id,
            after: paddedId,
            description: `Padded block ID: ${strippedSegment.block_id} -> ${paddedId}`,
          });
          strippedSegment.block_id = paddedId;
        }
      }

      for (const field of ['start_minute', 'end_minute']) {
        if (strippedSegment[field] !== undefined) {
          const coerced = coerceToNumber(strippedSegment[field]);
          if (coerced !== null && coerced !== strippedSegment[field]) {
            changes.push({
              type: 'type_coercion',
              path: `timeline[${idx}].${field}`,
              before: strippedSegment[field],
              after: coerced,
              description: `Coerced ${field} to number`,
            });
            strippedSegment[field] = coerced;
          }
        }
      }

      return strippedSegment;
    });

    const timelineBefore = JSON.stringify(result.timeline);
    result.timeline = (result.timeline as Array<{ start_minute: number }>).sort(
      (a, b) => (a.start_minute || 0) - (b.start_minute || 0)
    );

    if (JSON.stringify(result.timeline) !== timelineBefore) {
      changes.push({
        type: 'array_sort',
        path: 'timeline',
        before: 'unsorted',
        after: 'sorted by start_minute',
        description: 'Sorted timeline array by start_minute',
      });
    }
  }

  if (result.qa && typeof result.qa === 'object') {
    result.qa = stripUnknownFields(
      result.qa as Record<string, unknown>,
      ALLOWED_FIELDS.WR6.qa,
      'qa',
      changes
    );
  }

  return result;
}

function canonicalizeChecklistArray(
  items: unknown[],
  category: 'pre' | 'live' | 'post',
  arrayPath: string,
  changes: NormalizationChange[]
): unknown[] {
  const allowedFields = ALLOWED_FIELDS.WR7[`${arrayPath}[]`];

  return items.map((item: unknown, idx: number) => {
    if (!item || typeof item !== 'object') return item;
    let strippedItem = stripUnknownFields(
      item as Record<string, unknown>,
      allowedFields,
      `${arrayPath}[${idx}]`,
      changes
    );

    if (typeof strippedItem.checklist_id === 'string') {
      const paddedId = padChecklistId(strippedItem.checklist_id);
      if (paddedId && paddedId !== strippedItem.checklist_id) {
        changes.push({
          type: 'id_padding',
          path: `${arrayPath}[${idx}].checklist_id`,
          before: strippedItem.checklist_id,
          after: paddedId,
          description: `Padded checklist ID: ${strippedItem.checklist_id} -> ${paddedId}`,
        });
        strippedItem.checklist_id = paddedId;
      }

      const expectedPrefix = `CL_${category}_`;
      if (typeof strippedItem.checklist_id === 'string' && !strippedItem.checklist_id.startsWith(expectedPrefix)) {
        const numMatch = strippedItem.checklist_id.match(/\d+$/);
        if (numMatch) {
          const newId = `CL_${category}_${numMatch[0].padStart(3, '0')}`;
          changes.push({
            type: 'id_padding',
            path: `${arrayPath}[${idx}].checklist_id`,
            before: strippedItem.checklist_id,
            after: newId,
            description: `Fixed checklist ID category: ${strippedItem.checklist_id} -> ${newId}`,
          });
          strippedItem.checklist_id = newId;
        }
      }
    }

    return strippedItem;
  });
}

function canonicalizeWR7(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.WR7._root, '', changes);

  if (Array.isArray(result.pre_webinar)) {
    result.pre_webinar = canonicalizeChecklistArray(
      result.pre_webinar,
      'pre',
      'pre_webinar',
      changes
    );
  }

  if (Array.isArray(result.live_webinar)) {
    result.live_webinar = canonicalizeChecklistArray(
      result.live_webinar,
      'live',
      'live_webinar',
      changes
    );
  }

  if (Array.isArray(result.post_webinar)) {
    result.post_webinar = canonicalizeChecklistArray(
      result.post_webinar,
      'post',
      'post_webinar',
      changes
    );
  }

  if (result.qa && typeof result.qa === 'object') {
    result.qa = stripUnknownFields(
      result.qa as Record<string, unknown>,
      ALLOWED_FIELDS.WR7.qa,
      'qa',
      changes
    );
  }

  return result;
}

function canonicalizeWR8(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.WR8._root, '', changes);

  if (result.slide_count_recommendation !== undefined) {
    const coerced = coerceToNumber(result.slide_count_recommendation);
    if (coerced !== null && coerced !== result.slide_count_recommendation) {
      changes.push({
        type: 'type_coercion',
        path: 'slide_count_recommendation',
        before: result.slide_count_recommendation,
        after: coerced,
        description: `Coerced slide_count_recommendation to number`,
      });
      result.slide_count_recommendation = coerced;
    }
  }

  if (Array.isArray(result.key_slides)) {
    result.key_slides = result.key_slides.map((slide: unknown, idx: number) => {
      if (!slide || typeof slide !== 'object') return slide;
      let strippedSlide = stripUnknownFields(
        slide as Record<string, unknown>,
        ALLOWED_FIELDS.WR8['key_slides[]'],
        `key_slides[${idx}]`,
        changes
      );

      if (strippedSlide.slide_number !== undefined) {
        const coerced = coerceToNumber(strippedSlide.slide_number);
        if (coerced !== null && coerced !== strippedSlide.slide_number) {
          changes.push({
            type: 'type_coercion',
            path: `key_slides[${idx}].slide_number`,
            before: strippedSlide.slide_number,
            after: coerced,
            description: `Coerced slide_number to number`,
          });
          strippedSlide.slide_number = coerced;
        }
      }

      return strippedSlide;
    });
  }

  if (result.qa && typeof result.qa === 'object') {
    result.qa = stripUnknownFields(
      result.qa as Record<string, unknown>,
      ALLOWED_FIELDS.WR8.qa,
      'qa',
      changes
    );
  }

  return result;
}

function canonicalizeWR1(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.WR1._root, '', changes);

  if (result.parsed_intake && typeof result.parsed_intake === 'object') {
    result.parsed_intake = stripUnknownFields(
      result.parsed_intake as Record<string, unknown>,
      ALLOWED_FIELDS.WR1.parsed_intake,
      'parsed_intake',
      changes
    );
  }

  if (result.executive_summary && typeof result.executive_summary === 'object') {
    result.executive_summary = stripUnknownFields(
      result.executive_summary as Record<string, unknown>,
      ALLOWED_FIELDS.WR1.executive_summary,
      'executive_summary',
      changes
    );
  }

  if (Array.isArray(result.proof_points)) {
    result.proof_points = result.proof_points.map((item: unknown, idx: number) => {
      if (!item || typeof item !== 'object') return item;
      return stripUnknownFields(
        item as Record<string, unknown>,
        ALLOWED_FIELDS.WR1['proof_points[]'],
        `proof_points[${idx}]`,
        changes
      );
    });
  }

  if (result.qa && typeof result.qa === 'object') {
    result.qa = stripUnknownFields(
      result.qa as Record<string, unknown>,
      ALLOWED_FIELDS.WR1.qa,
      'qa',
      changes
    );
  }

  return result;
}

function canonicalizePreflight(content: unknown, changes: NormalizationChange[]): unknown {
  if (!content || typeof content !== 'object') return content;
  const obj = content as Record<string, unknown>;

  let result = stripUnknownFields(obj, ALLOWED_FIELDS.PREFLIGHT._root, '', changes);

  if (result.readiness && typeof result.readiness === 'object') {
    result.readiness = stripUnknownFields(
      result.readiness as Record<string, unknown>,
      ALLOWED_FIELDS.PREFLIGHT.readiness,
      'readiness',
      changes
    );

    const readiness = result.readiness as Record<string, unknown>;
    if (readiness.score !== undefined) {
      const coerced = coerceToNumber(readiness.score);
      if (coerced !== null && coerced !== readiness.score) {
        changes.push({
          type: 'type_coercion',
          path: 'readiness.score',
          before: readiness.score,
          after: coerced,
          description: `Coerced readiness.score to number`,
        });
        readiness.score = coerced;
      }
    }
  }

  if (Array.isArray(result.missing_context)) {
    result.missing_context = result.missing_context.map((item: unknown, idx: number) => {
      if (!item || typeof item !== 'object') return item;
      return stripUnknownFields(
        item as Record<string, unknown>,
        ALLOWED_FIELDS.PREFLIGHT['missing_context[]'],
        `missing_context[${idx}]`,
        changes
      );
    });
  }

  return result;
}

export function canonicalizeDeliverable(
  deliverableId: DeliverableId | string,
  content: unknown
): { canonicalized: unknown; log: NormalizationLog } {
  const changes: NormalizationChange[] = [];
  let canonicalized: unknown;

  switch (deliverableId) {
    case 'PREFLIGHT':
      canonicalized = canonicalizePreflight(content, changes);
      break;
    case 'WR1':
      canonicalized = canonicalizeWR1(content, changes);
      break;
    case 'WR2':
      canonicalized = canonicalizeWR2(content, changes);
      break;
    case 'WR3':
      canonicalized = canonicalizeWR3(content, changes);
      break;
    case 'WR4':
      canonicalized = canonicalizeWR4(content, changes);
      break;
    case 'WR5':
      canonicalized = canonicalizeWR5(content, changes);
      break;
    case 'WR6':
      canonicalized = canonicalizeWR6(content, changes);
      break;
    case 'WR7':
      canonicalized = canonicalizeWR7(content, changes);
      break;
    case 'WR8':
      canonicalized = canonicalizeWR8(content, changes);
      break;
    case 'WR9':
      canonicalized = content;
      break;
    default:
      canonicalized = content;
  }

  const log: NormalizationLog = {
    deliverableId,
    timestamp: Date.now(),
    changes,
    totalChanges: changes.length,
  };

  if (changes.length > 0) {
    console.log(`[Canonicalizer] ${deliverableId}: Made ${changes.length} normalization changes`);
    changes.forEach(c => console.log(`  - ${c.description}`));
  }

  return { canonicalized, log };
}

export function formatNormalizationLog(log: NormalizationLog): string {
  if (log.totalChanges === 0) {
    return 'No normalization changes needed.';
  }

  const grouped: Record<string, NormalizationChange[]> = {};
  for (const change of log.changes) {
    if (!grouped[change.type]) {
      grouped[change.type] = [];
    }
    grouped[change.type].push(change);
  }

  const lines: string[] = [`Normalization Log (${log.totalChanges} changes):`];

  const typeLabels: Record<string, string> = {
    id_padding: 'ID Padding',
    field_removal: 'Removed Fields',
    type_coercion: 'Type Coercion',
    array_sort: 'Array Sorting',
    phase_fix: 'Phase Corrections',
  };

  for (const [type, changes] of Object.entries(grouped)) {
    lines.push(`\n${typeLabels[type] || type}:`);
    for (const change of changes) {
      lines.push(`  - ${change.description}`);
    }
  }

  return lines.join('\n');
}
