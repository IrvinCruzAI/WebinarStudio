import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { WR2, WR6, ProjectMetadata, DeliverableId } from '../../contracts';
import { DeliverTimer } from './DeliverTimer';
import { PacingIndicator } from './PacingIndicator';
import { DeliveryProgress } from './DeliveryProgress';
import { DeliverBlockContent } from './DeliverBlockContent';
import { calculatePacingStatus, type PacingStatus } from '../../utils/pacingCalculator';

interface DeliverModeViewProps {
  wr2: WR2;
  wr6?: WR6;
  project: ProjectMetadata;
  onNavigateToTab?: (route: { tab: string; deliverableId?: DeliverableId }) => void;
  onExitDeliverMode: () => void;
}

export function DeliverModeView({
  wr2,
  wr6,
  project,
  onNavigateToTab,
  onExitDeliverMode,
}: DeliverModeViewProps) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pacingStatus, setPacingStatus] = useState<PacingStatus | null>(null);

  const currentBlock = wr2.blocks[currentBlockIndex];

  useEffect(() => {
    const status = calculatePacingStatus(currentBlockIndex, elapsedSeconds, wr2, wr6);
    setPacingStatus(status);
  }, [currentBlockIndex, elapsedSeconds, wr2, wr6]);

  const handlePrevious = useCallback(() => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1);
    }
  }, [currentBlockIndex]);

  const handleNext = useCallback(() => {
    if (currentBlockIndex < wr2.blocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
    }
  }, [currentBlockIndex, wr2.blocks.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          e.preventDefault();
          onExitDeliverMode();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, onExitDeliverMode]);

  const getPhaseColor = () => {
    switch (currentBlock.phase) {
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

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgb(var(--surface-elevated))' }}>
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: 'rgb(var(--border-default))',
          background: 'rgb(var(--surface-base))',
        }}
      >
        <DeliveryProgress
          currentBlock={currentBlockIndex}
          totalBlocks={wr2.blocks.length}
          phase={currentBlock.phase}
        />

        <DeliverTimer
          onElapsedChange={setElapsedSeconds}
          pacingStatus={pacingStatus?.status}
        />

        <div className="flex items-center gap-3">
          <PacingIndicator pacingStatus={pacingStatus} />
          <button
            onClick={onExitDeliverMode}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{
              background: 'rgb(var(--surface-base))',
              color: 'rgb(var(--text-primary))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <X className="w-4 h-4" />
            Exit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="px-3 py-1 rounded-lg text-sm font-bold"
              style={{
                backgroundColor: getPhaseColor(),
                color: 'white',
              }}
            >
              {currentBlock.block_id}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                {currentBlock.title}
              </h1>
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                {currentBlock.phase} Phase · {currentBlock.timebox_minutes} minutes
              </p>
            </div>
          </div>

          <DeliverBlockContent block={currentBlock} onNavigateToTab={onNavigateToTab} />
        </div>
      </div>

      <div
        className="flex items-center justify-between px-6 py-4 border-t"
        style={{
          borderColor: 'rgb(var(--border-default))',
          background: 'rgb(var(--surface-base))',
        }}
      >
        <button
          onClick={handlePrevious}
          disabled={currentBlockIndex === 0}
          className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'rgb(var(--surface-hover))',
            color: 'rgb(var(--text-primary))',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          <kbd
            className="px-2 py-1 rounded text-xs font-mono"
            style={{ background: 'rgb(var(--surface-base))' }}
          >
            ←
          </kbd>
          <span className="mx-2">·</span>
          <kbd
            className="px-2 py-1 rounded text-xs font-mono"
            style={{ background: 'rgb(var(--surface-base))' }}
          >
            →
          </kbd>
          <span className="mx-3">to navigate</span>
          <span className="mx-2">·</span>
          <kbd
            className="px-2 py-1 rounded text-xs font-mono"
            style={{ background: 'rgb(var(--surface-base))' }}
          >
            Esc
          </kbd>
          <span className="mx-2">to exit</span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentBlockIndex === wr2.blocks.length - 1}
          className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'rgb(var(--accent-primary))',
            color: 'white',
          }}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
