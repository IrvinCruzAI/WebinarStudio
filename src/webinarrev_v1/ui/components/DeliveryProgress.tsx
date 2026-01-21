import type { BlockPhase } from '../../contracts/enums';

interface DeliveryProgressProps {
  currentBlock: number;
  totalBlocks: number;
  phase: BlockPhase;
}

export function DeliveryProgress({ currentBlock, totalBlocks, phase }: DeliveryProgressProps) {
  const progressPercent = ((currentBlock + 1) / totalBlocks) * 100;

  const getPhaseColor = () => {
    switch (phase) {
      case 'Beginning':
        return '#3b82f6';
      case 'Middle':
        return '#8b5cf6';
      case 'End':
        return '#10b981';
      default:
        return '#3b82f6';
    }
  };

  const getPhaseLabel = () => {
    return `${phase} Phase`;
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-start">
        <div className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
          Block {currentBlock + 1} of {totalBlocks}
        </div>
        <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
          {getPhaseLabel()}
        </div>
      </div>
      <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'rgb(var(--surface-base))' }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: getPhaseColor(),
          }}
        />
      </div>
    </div>
  );
}
