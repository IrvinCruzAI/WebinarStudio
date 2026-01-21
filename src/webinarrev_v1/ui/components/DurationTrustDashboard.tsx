import { useMemo, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scale,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';
import type { WR2, WR6, WR2Block } from '../../contracts';

interface DurationTrustDashboardProps {
  targetDuration: number;
  wr2?: WR2;
  wr6?: WR6;
  onFitToDuration?: (adjustedBlocks: WR2Block[]) => Promise<void>;
}

interface DurationAnalysis {
  targetMinutes: number;
  wr2TotalMinutes: number;
  wr6TotalMinutes: number | null;
  wr2DiffPercent: number;
  wr2Status: 'optimal' | 'warning' | 'critical';
  phaseTotals: {
    beginning: number;
    middle: number;
    end: number;
  };
  phasePercentages: {
    beginning: number;
    middle: number;
    end: number;
  };
  isAligned: boolean;
}

function analyzeDuration(targetDuration: number, wr2?: WR2, wr6?: WR6): DurationAnalysis {
  const wr2TotalMinutes = wr2?.blocks.reduce((sum, b) => sum + b.timebox_minutes, 0) || 0;
  const wr6TotalMinutes = wr6?.total_duration_minutes || null;

  const wr2DiffPercent = targetDuration > 0
    ? ((wr2TotalMinutes - targetDuration) / targetDuration) * 100
    : 0;

  let wr2Status: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (Math.abs(wr2DiffPercent) > 15) {
    wr2Status = 'critical';
  } else if (Math.abs(wr2DiffPercent) > 5) {
    wr2Status = 'warning';
  }

  const phaseTotals = {
    beginning: wr2?.blocks.filter(b => b.phase === 'beginning').reduce((sum, b) => sum + b.timebox_minutes, 0) || 0,
    middle: wr2?.blocks.filter(b => b.phase === 'middle').reduce((sum, b) => sum + b.timebox_minutes, 0) || 0,
    end: wr2?.blocks.filter(b => b.phase === 'end').reduce((sum, b) => sum + b.timebox_minutes, 0) || 0,
  };

  const totalPhase = phaseTotals.beginning + phaseTotals.middle + phaseTotals.end;
  const phasePercentages = {
    beginning: totalPhase > 0 ? (phaseTotals.beginning / totalPhase) * 100 : 0,
    middle: totalPhase > 0 ? (phaseTotals.middle / totalPhase) * 100 : 0,
    end: totalPhase > 0 ? (phaseTotals.end / totalPhase) * 100 : 0,
  };

  return {
    targetMinutes: targetDuration,
    wr2TotalMinutes,
    wr6TotalMinutes,
    wr2DiffPercent,
    wr2Status,
    phaseTotals,
    phasePercentages,
    isAligned: wr2Status === 'optimal',
  };
}

export function fitToDuration(blocks: WR2Block[], targetMinutes: number): { adjustedBlocks: WR2Block[]; changes: Array<{ blockId: string; before: number; after: number }> } {
  const currentTotal = blocks.reduce((sum, b) => sum + b.timebox_minutes, 0);
  if (currentTotal === 0 || currentTotal === targetMinutes) {
    return { adjustedBlocks: blocks, changes: [] };
  }

  const multiplier = targetMinutes / currentTotal;
  const changes: Array<{ blockId: string; before: number; after: number }> = [];
  let runningTotal = 0;

  const adjustedBlocks = blocks.map((block, index) => {
    if (index === blocks.length - 1) {
      const remaining = targetMinutes - runningTotal;
      const adjusted = Math.max(1, Math.min(60, remaining));
      if (adjusted !== block.timebox_minutes) {
        changes.push({ blockId: block.block_id, before: block.timebox_minutes, after: adjusted });
      }
      return { ...block, timebox_minutes: adjusted };
    }

    let adjusted = Math.round(block.timebox_minutes * multiplier);
    adjusted = Math.max(1, Math.min(60, adjusted));
    runningTotal += adjusted;

    if (adjusted !== block.timebox_minutes) {
      changes.push({ blockId: block.block_id, before: block.timebox_minutes, after: adjusted });
    }

    return { ...block, timebox_minutes: adjusted };
  });

  return { adjustedBlocks, changes };
}

export function DurationTrustDashboard({
  targetDuration,
  wr2,
  wr6,
  onFitToDuration,
}: DurationTrustDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const analysis = useMemo(
    () => analyzeDuration(targetDuration, wr2, wr6),
    [targetDuration, wr2, wr6]
  );

  const { adjustedBlocks, changes } = useMemo(() => {
    if (!wr2?.blocks) return { adjustedBlocks: [], changes: [] };
    return fitToDuration(wr2.blocks, targetDuration);
  }, [wr2?.blocks, targetDuration]);

  const handleFitToDuration = async () => {
    if (!onFitToDuration || adjustedBlocks.length === 0) return;
    setIsApplying(true);
    try {
      await onFitToDuration(adjustedBlocks);
      setShowPreview(false);
    } finally {
      setIsApplying(false);
    }
  };

  const statusConfig = {
    optimal: {
      icon: CheckCircle2,
      color: 'rgb(var(--success))',
      bg: 'rgb(var(--success) / 0.1)',
      border: 'rgb(var(--success) / 0.2)',
      label: 'Duration Aligned',
    },
    warning: {
      icon: AlertTriangle,
      color: 'rgb(var(--warning))',
      bg: 'rgb(var(--warning) / 0.1)',
      border: 'rgb(var(--warning) / 0.2)',
      label: 'Duration Mismatch',
    },
    critical: {
      icon: XCircle,
      color: 'rgb(var(--error))',
      bg: 'rgb(var(--error) / 0.1)',
      border: 'rgb(var(--error) / 0.2)',
      label: 'Critical Mismatch',
    },
  };

  const status = statusConfig[analysis.wr2Status];
  const StatusIcon = status.icon;

  if (!wr2) {
    return null;
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: status.bg,
        border: `1px solid ${status.border}`,
      }}
    >
      <div className="w-full p-3 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div
            className="p-2 rounded-lg"
            style={{ background: status.color + '20' }}
          >
            <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                {status.label}
              </span>
              {analysis.wr2DiffPercent !== 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: status.color + '20', color: status.color }}
                >
                  {analysis.wr2DiffPercent > 0 ? '+' : ''}{analysis.wr2DiffPercent.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Target: {analysis.targetMinutes}m
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Actual: {analysis.wr2TotalMinutes}m
              </span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(var(--text-muted))' }} />
          ) : (
            <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(var(--text-muted))' }} />
          )}
        </button>

        {analysis.wr2Status !== 'optimal' && onFitToDuration && (
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-2 flex-shrink-0"
            style={{
              background: 'rgb(var(--accent-primary))',
              color: 'white',
            }}
          >
            <Scale className="w-3 h-3" />
            Fit to Duration
          </button>
        )}
      </div>

      {isExpanded && (
        <div
          className="px-3 pb-3 space-y-3"
          style={{ borderTop: `1px solid ${status.border}` }}
        >
          <div className="pt-3">
            <div className="text-xs font-medium mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
              Duration Comparison
            </div>
            <div className="space-y-2">
              <DurationBar
                label="Target"
                value={analysis.targetMinutes}
                maxValue={Math.max(analysis.targetMinutes, analysis.wr2TotalMinutes, analysis.wr6TotalMinutes || 0) * 1.1}
                color="rgb(var(--success))"
              />
              <DurationBar
                label="WR2 Framework"
                value={analysis.wr2TotalMinutes}
                maxValue={Math.max(analysis.targetMinutes, analysis.wr2TotalMinutes, analysis.wr6TotalMinutes || 0) * 1.1}
                color="rgb(var(--accent-primary))"
              />
              {analysis.wr6TotalMinutes !== null && (
                <DurationBar
                  label="WR6 Timeline"
                  value={analysis.wr6TotalMinutes}
                  maxValue={Math.max(analysis.targetMinutes, analysis.wr2TotalMinutes, analysis.wr6TotalMinutes) * 1.1}
                  color="rgb(var(--warning))"
                />
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
              Phase Breakdown
            </div>
            <div className="flex h-6 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-center text-xs font-medium text-white"
                style={{
                  width: `${analysis.phasePercentages.beginning}%`,
                  background: 'rgb(var(--success))',
                  minWidth: analysis.phasePercentages.beginning > 0 ? '40px' : '0',
                }}
              >
                {analysis.phaseTotals.beginning}m
              </div>
              <div
                className="flex items-center justify-center text-xs font-medium text-white"
                style={{
                  width: `${analysis.phasePercentages.middle}%`,
                  background: 'rgb(var(--accent-primary))',
                  minWidth: analysis.phasePercentages.middle > 0 ? '40px' : '0',
                }}
              >
                {analysis.phaseTotals.middle}m
              </div>
              <div
                className="flex items-center justify-center text-xs font-medium text-white"
                style={{
                  width: `${analysis.phasePercentages.end}%`,
                  background: 'rgb(var(--warning))',
                  minWidth: analysis.phasePercentages.end > 0 ? '40px' : '0',
                }}
              >
                {analysis.phaseTotals.end}m
              </div>
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
              <span>Beginning ({analysis.phasePercentages.beginning.toFixed(0)}%)</span>
              <span>Middle ({analysis.phasePercentages.middle.toFixed(0)}%)</span>
              <span>End ({analysis.phasePercentages.end.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowPreview(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl p-6"
            style={{ background: 'rgb(var(--surface-elevated))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
              Fit to Duration Preview
            </h3>

            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgb(var(--surface-base))' }}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span style={{ color: 'rgb(var(--text-muted))' }}>Current Total</span>
                <span style={{ color: 'rgb(var(--text-primary))' }}>{analysis.wr2TotalMinutes}m</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span style={{ color: 'rgb(var(--text-muted))' }}>Target Duration</span>
                <span style={{ color: 'rgb(var(--text-primary))' }}>{targetDuration}m</span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span style={{ color: 'rgb(var(--text-muted))' }}>Adjustment</span>
                <span style={{ color: 'rgb(var(--accent-primary))' }}>
                  {analysis.wr2DiffPercent > 0 ? '-' : '+'}{Math.abs(analysis.wr2TotalMinutes - targetDuration)}m
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                Blocks to Adjust ({changes.length})
              </div>
              <div
                className="max-h-60 overflow-y-auto space-y-1 p-2 rounded-lg"
                style={{ background: 'rgb(var(--surface-base))' }}
              >
                {changes.length === 0 ? (
                  <div className="text-sm text-center py-4" style={{ color: 'rgb(var(--text-muted))' }}>
                    No changes needed
                  </div>
                ) : (
                  changes.map((change) => (
                    <div
                      key={change.blockId}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <span
                        className="font-mono font-medium px-2 py-0.5 rounded"
                        style={{ background: 'rgb(var(--accent-primary) / 0.1)', color: 'rgb(var(--accent-primary))' }}
                      >
                        {change.blockId}
                      </span>
                      <span style={{ color: 'rgb(var(--text-muted))' }}>
                        {change.before}m → {change.after}m
                        <span
                          className="ml-2"
                          style={{ color: change.after > change.before ? 'rgb(var(--success))' : 'rgb(var(--error))' }}
                        >
                          ({change.after > change.before ? '+' : ''}{change.after - change.before}m)
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm rounded-lg"
                style={{
                  background: 'rgb(var(--surface-base))',
                  color: 'rgb(var(--text-primary))',
                  border: '1px solid rgb(var(--border-default))',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFitToDuration}
                disabled={isApplying || changes.length === 0}
                className="px-4 py-2 text-sm rounded-lg font-medium flex items-center gap-2"
                style={{
                  background: 'rgb(var(--accent-primary))',
                  color: 'white',
                  opacity: isApplying || changes.length === 0 ? 0.5 : 1,
                }}
              >
                {isApplying ? 'Applying...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DurationBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

function DurationBar({ label, value, maxValue, color }: DurationBarProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
        {label}
      </div>
      <div
        className="flex-1 h-5 rounded-lg overflow-hidden"
        style={{ background: 'rgb(var(--surface-base))' }}
      >
        <div
          className="h-full rounded-lg flex items-center justify-end pr-2 text-xs font-medium text-white"
          style={{
            width: `${percentage}%`,
            background: color,
            minWidth: '30px',
          }}
        >
          {value}m
        </div>
      </div>
    </div>
  );
}
