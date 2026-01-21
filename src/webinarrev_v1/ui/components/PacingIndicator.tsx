import type { PacingStatus } from '../../utils/pacingCalculator';

interface PacingIndicatorProps {
  pacingStatus: PacingStatus | null;
}

export function PacingIndicator({ pacingStatus }: PacingIndicatorProps) {
  if (!pacingStatus) {
    return null;
  }

  const { status, delta } = pacingStatus;

  const getStatusConfig = () => {
    switch (status) {
      case 'on-track':
        return {
          bg: '#10b981',
          text: '#ffffff',
          label: 'On Track',
        };
      case 'running-long':
        return {
          bg: '#ef4444',
          text: '#ffffff',
          label: `Running Long +${formatDelta(delta)}`,
        };
      case 'ahead':
        return {
          bg: '#3b82f6',
          text: '#ffffff',
          label: `Ahead -${formatDelta(Math.abs(delta))}`,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
      title={pacingStatus.message}
    >
      {config.label}
    </div>
  );
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
