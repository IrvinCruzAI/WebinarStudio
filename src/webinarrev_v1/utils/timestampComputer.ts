import type { WR2, WR6, BlockId } from '../contracts';

export interface TimestampInfo {
  startMinute: number;
  endMinute: number;
  duration: number;
}

export function computeBlockTimestamps(
  wr2: WR2,
  wr6?: WR6
): Map<BlockId, TimestampInfo> {
  const timestamps = new Map<BlockId, TimestampInfo>();

  if (wr6?.timeline && canReconcileTimeline(wr2, wr6)) {
    for (const segment of wr6.timeline) {
      timestamps.set(segment.block_id, {
        startMinute: segment.start_minute,
        endMinute: segment.end_minute,
        duration: segment.end_minute - segment.start_minute,
      });
    }
    return timestamps;
  }

  let cumulativeTime = 0;
  for (const block of wr2.blocks) {
    timestamps.set(block.block_id, {
      startMinute: cumulativeTime,
      endMinute: cumulativeTime + block.timebox_minutes,
      duration: block.timebox_minutes,
    });
    cumulativeTime += block.timebox_minutes;
  }

  return timestamps;
}

function canReconcileTimeline(wr2: WR2, wr6: WR6): boolean {
  if (!wr6.timeline || wr6.timeline.length === 0) {
    return false;
  }

  const timelineBlockIds = new Set(wr6.timeline.map(seg => seg.block_id));
  const wr2BlockIds = new Set(wr2.blocks.map(b => b.block_id));

  for (const blockId of wr2BlockIds) {
    if (!timelineBlockIds.has(blockId)) {
      return false;
    }
  }

  return true;
}

export function formatTimestamp(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes % 1) * 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimestampRange(start: number, end: number): string {
  return `${formatTimestamp(start)} - ${formatTimestamp(end)}`;
}
