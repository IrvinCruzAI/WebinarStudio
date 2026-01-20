import { Clock, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { PipelineProgress } from '../../pipeline/orchestrator';
import type { DeliverableId } from '../../contracts';

interface PipelineProgressPanelProps {
  progress: PipelineProgress[];
  isRunning: boolean;
  onCancel: () => void;
  hasErrors: boolean;
}

const STAGE_ORDER: DeliverableId[] = [
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
];

function getStatusColor(status: PipelineProgress['status']): string {
  switch (status) {
    case 'pending':
      return 'rgb(var(--text-muted))';
    case 'generating':
      return 'rgb(var(--accent-primary))';
    case 'repairing':
      return 'rgb(var(--warning))';
    case 'validating':
      return 'rgb(var(--accent-secondary))';
    case 'complete':
      return 'rgb(var(--success))';
    case 'error':
      return 'rgb(var(--error))';
    default:
      return 'rgb(var(--text-muted))';
  }
}

function getStatusIcon(status: PipelineProgress['status'], repairAttempt?: number, maxRepairAttempts?: number) {
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3" />;
    case 'generating':
      return <Loader2 className="w-3 h-3 animate-spin" />;
    case 'repairing':
      return (
        <div className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          {repairAttempt && maxRepairAttempts && (
            <span className="text-[10px] font-mono">
              {repairAttempt}/{maxRepairAttempts}
            </span>
          )}
        </div>
      );
    case 'validating':
      return <Loader2 className="w-3 h-3 animate-spin" />;
    case 'complete':
      return <CheckCircle2 className="w-3 h-3" />;
    case 'error':
      return <AlertCircle className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
}

function getStatusLabel(status: PipelineProgress['status']): string {
  switch (status) {
    case 'pending':
      return 'Queued';
    case 'generating':
      return 'Generating';
    case 'repairing':
      return 'Repairing';
    case 'validating':
      return 'Validating';
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

export default function PipelineProgressPanel({
  progress,
  isRunning,
  onCancel,
  hasErrors,
}: PipelineProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning || hasErrors) {
      setIsExpanded(true);
    } else if (!isRunning && !hasErrors && progress.length > 0) {
      const timer = setTimeout(() => setIsExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isRunning, hasErrors, progress.length]);

  if (!isRunning && !hasErrors && progress.length === 0) {
    return null;
  }

  const progressMap = new Map<DeliverableId, PipelineProgress>();
  for (const p of progress) {
    progressMap.set(p.deliverableId, p);
  }

  const formatElapsed = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3
              className="text-sm font-semibold"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              Pipeline Progress
            </h3>
            {isRunning && (
              <span
                className="text-xs"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Elapsed: {formatElapsed(elapsedSeconds)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={onCancel}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: 'rgb(var(--error) / 0.1)',
                  color: 'rgb(var(--error))',
                  border: '1px solid rgb(var(--error) / 0.3)',
                }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 transition-colors"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              <X className={`w-4 h-4 transition-transform ${isExpanded ? '' : 'rotate-45'}`} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="flex items-center gap-2 flex-wrap">
            {STAGE_ORDER.map((deliverableId) => {
              const p = progressMap.get(deliverableId);
              const status = p?.status || 'pending';
              const color = getStatusColor(status);

              return (
                <div
                  key={deliverableId}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-colors"
                  style={{
                    background: `${color.replace(')', ' / 0.1)')}`,
                    border: `1px solid ${color.replace(')', ' / 0.3)')}`,
                    color,
                  }}
                  title={`${deliverableId}: ${getStatusLabel(status)}`}
                >
                  {getStatusIcon(status, p?.repairAttempt, p?.maxRepairAttempts)}
                  <span>{deliverableId}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
