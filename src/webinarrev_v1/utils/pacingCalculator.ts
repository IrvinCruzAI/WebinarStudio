import type { WR2, WR6 } from '../contracts/schemas';
import type { BlockId } from '../contracts/enums';

export interface PacingStatus {
  status: 'on-track' | 'running-long' | 'ahead';
  expectedElapsed: number;
  actualElapsed: number;
  delta: number;
  message: string;
}

export function calculatePacingStatus(
  currentBlockIndex: number,
  elapsedSeconds: number,
  wr2: WR2,
  wr6?: WR6
): PacingStatus {
  const actualElapsed = elapsedSeconds;
  let expectedElapsed: number;

  if (wr6 && wr6.timeline && wr6.timeline.length > 0) {
    expectedElapsed = calculateExpectedFromWR6(currentBlockIndex, wr2, wr6);
  } else {
    expectedElapsed = calculateExpectedFromWR2(currentBlockIndex, wr2);
  }

  const delta = actualElapsed - expectedElapsed;
  const toleranceSeconds = calculateTolerance(currentBlockIndex);

  let status: 'on-track' | 'running-long' | 'ahead';
  let message: string;

  if (Math.abs(delta) <= toleranceSeconds) {
    status = 'on-track';
    message = 'You are on track with your planned timing';
  } else if (delta > 0) {
    status = 'running-long';
    const deltaFormatted = formatDelta(delta);
    message = `You are ${deltaFormatted} behind schedule`;
  } else {
    status = 'ahead';
    const deltaFormatted = formatDelta(Math.abs(delta));
    message = `You are ${deltaFormatted} ahead of schedule`;
  }

  return {
    status,
    expectedElapsed,
    actualElapsed,
    delta,
    message,
  };
}

function calculateExpectedFromWR6(
  currentBlockIndex: number,
  wr2: WR2,
  wr6: WR6
): number {
  const currentBlockId = wr2.blocks[currentBlockIndex].block_id;

  const relevantSegments = wr6.timeline.filter((segment, index) => {
    const segmentBlockIndex = getBlockIndexFromId(segment.block_id, wr2);
    return segmentBlockIndex <= currentBlockIndex;
  });

  if (relevantSegments.length === 0) {
    return calculateExpectedFromWR2(currentBlockIndex, wr2);
  }

  const lastSegment = relevantSegments[relevantSegments.length - 1];
  return lastSegment.end_minute * 60;
}

function calculateExpectedFromWR2(
  currentBlockIndex: number,
  wr2: WR2
): number {
  let totalMinutes = 0;

  for (let i = 0; i <= currentBlockIndex; i++) {
    totalMinutes += wr2.blocks[i].timebox_minutes;
  }

  return totalMinutes * 60;
}

function getBlockIndexFromId(blockId: BlockId, wr2: WR2): number {
  return wr2.blocks.findIndex(block => block.block_id === blockId);
}

function calculateTolerance(currentBlockIndex: number): number {
  const baseTolerancePerBlock = 30;
  const scaledTolerance = baseTolerancePerBlock * Math.ceil((currentBlockIndex + 1) / 3);
  return Math.min(scaledTolerance, 300);
}

function formatDelta(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTime(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const hours = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
