import type { WR2, WR6, BlockId } from '../contracts';
import type { TimestampInfo } from '../utils/timestampComputer';
import { formatTimestampRange } from '../utils/timestampComputer';
import { formatStageDirections } from '../utils/stageDirectionsFormatter';

export function generateScriptMarkdown(
  wr2: WR2,
  wr6: WR6 | undefined,
  projectTitle: string,
  timestamps: Map<BlockId, TimestampInfo>
): string {
  const lines: string[] = [];

  lines.push(`# Webinar Script: ${projectTitle}`);
  lines.push('');
  lines.push(`Generated on ${new Date().toLocaleDateString()}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## Table of Contents');
  lines.push('');
  for (const block of wr2.blocks) {
    const anchor = block.block_id.toLowerCase() + '-' + block.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    lines.push(`- [${block.block_id}: ${block.title}](#${anchor})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const block of wr2.blocks) {
    const timestamp = timestamps.get(block.block_id);

    lines.push(`## ${block.block_id}: ${block.title}`);
    lines.push('');

    if (timestamp) {
      lines.push(
        `**Phase:** ${block.phase.charAt(0).toUpperCase() + block.phase.slice(1)} | ` +
        `**Duration:** ${block.timebox_minutes} min | ` +
        `**Timestamp:** ${formatTimestampRange(timestamp.startMinute, timestamp.endMinute)}`
      );
    } else {
      lines.push(
        `**Phase:** ${block.phase.charAt(0).toUpperCase() + block.phase.slice(1)} | ` +
        `**Duration:** ${block.timebox_minutes} min`
      );
    }
    lines.push('');

    lines.push('### What to Say');
    lines.push('');
    lines.push(sanitizeContent(block.talk_track_md));
    lines.push('');

    const stageDirections = formatStageDirections(
      block.purpose,
      block.transition_in,
      block.transition_out
    );
    if (stageDirections.trim().length > 0) {
      lines.push('### Stage Directions');
      lines.push('');
      lines.push(sanitizeContent(stageDirections));
      lines.push('');
    }

    if (block.proof_insertion_points.length > 0) {
      lines.push('### Proof Points');
      lines.push('');
      for (const point of block.proof_insertion_points) {
        lines.push(`- ${sanitizeContent(point)}`);
      }
      lines.push('');
    }

    if (block.objections_handled.length > 0) {
      lines.push('### Objections to Address');
      lines.push('');
      for (const objection of block.objections_handled) {
        lines.push(`- ${sanitizeContent(objection)}`);
      }
      lines.push('');
    }

    if (block.transition_out && block.transition_out.trim().length > 0) {
      lines.push('### Transition');
      lines.push('');
      lines.push(sanitizeContent(block.transition_out));
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*End of script for ${projectTitle}*`);

  return lines.join('\n');
}

function sanitizeContent(text: string): string {
  return text
    .replace(/\{\{([^}]+)\}\}/g, '[Missing: $1]')
    .replace(/\[TBD\]/gi, '[Missing: Content to be determined]')
    .replace(/\[TODO\]/gi, '[Missing: Content to complete]')
    .replace(/\[INSERT[^\]]*\]/gi, '[Missing: Content to insert]')
    .replace(/\[PLACEHOLDER\]/gi, '[Missing: Content to fill in]')
    .replace(/\[FILL[^\]]*\]/gi, '[Missing: Content to fill in]')
    .replace(/\[ADD[^\]]*\]/gi, '[Missing: Content to add]')
    .replace(/_placeholder/g, '[Missing: Information needed]')
    .replace(/XXX/g, '[Missing: Content to complete]')
    .replace(/FIXME/gi, '[Missing: Content to fix]');
}
