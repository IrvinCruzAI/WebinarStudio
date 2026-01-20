import { z } from 'zod';

export const DeliverableIdEnum = z.enum([
  'PREFLIGHT',
  'WR1',
  'WR2',
  'WR3',
  'WR4',
  'WR5',
  'WR6',
  'WR7',
  'WR8',
  'WR9',
]);

export type DeliverableId = z.infer<typeof DeliverableIdEnum>;

export const BlockIdEnum = z.enum([
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07',
  'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14',
  'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21',
]);

export type BlockId = z.infer<typeof BlockIdEnum>;

export const BlockPhaseEnum = z.enum(['beginning', 'middle', 'end']);

export type BlockPhase = z.infer<typeof BlockPhaseEnum>;

export const CTAEnum = z.enum(['book_call', 'buy_now', 'hybrid']);

export type CTA = z.infer<typeof CTAEnum>;

export const RiskFlagEnum = z.enum([
  'offer_missing',
  'icp_missing',
  'proof_missing',
  'cta_unclear',
  'mechanism_unclear',
]);

export type RiskFlag = z.infer<typeof RiskFlagEnum>;

export const ProjectStatusEnum = z.enum([
  'preflight_blocked',
  'generating',
  'review',
  'ready',
  'failed',
]);

export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const AudienceTemperatureEnum = z.enum(['cold', 'warm', 'hot']);

export type AudienceTemperature = z.infer<typeof AudienceTemperatureEnum>;

export const PHASE_MAPPING = {
  beginning: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07'],
  middle: ['B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14'],
  end: ['B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21'],
} as const;

export function validateBlockPhase(blockId: BlockId, phase: BlockPhase): boolean {
  return PHASE_MAPPING[phase].includes(blockId);
}
