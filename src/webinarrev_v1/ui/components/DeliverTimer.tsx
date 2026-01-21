import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatTime } from '../../utils/pacingCalculator';

interface DeliverTimerProps {
  onElapsedChange: (seconds: number) => void;
  pacingStatus?: 'on-track' | 'running-long' | 'ahead';
}

export function DeliverTimer({ onElapsedChange, pacingStatus }: DeliverTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();

      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const sessionElapsed = Math.floor((now - startTimeRef.current) / 1000);
          const totalElapsed = accumulatedTimeRef.current + sessionElapsed;
          setElapsedSeconds(totalElapsed);
          onElapsedChange(totalElapsed);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (startTimeRef.current) {
        const now = Date.now();
        const sessionElapsed = Math.floor((now - startTimeRef.current) / 1000);
        accumulatedTimeRef.current += sessionElapsed;
        startTimeRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onElapsedChange]);

  const handlePlayPause = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
    onElapsedChange(0);
  };

  const getTimerColor = () => {
    if (!pacingStatus) return 'rgb(var(--text-primary))';

    switch (pacingStatus) {
      case 'on-track':
        return '#10b981';
      case 'running-long':
        return '#ef4444';
      case 'ahead':
        return '#3b82f6';
      default:
        return 'rgb(var(--text-primary))';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="text-3xl font-mono font-bold tabular-nums"
        style={{ color: getTimerColor() }}
      >
        {formatTime(elapsedSeconds)}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handlePlayPause}
          className="p-2 rounded-lg transition-colors hover:bg-[rgb(var(--surface-hover))]"
          style={{ color: 'rgb(var(--text-primary))' }}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-lg transition-colors hover:bg-[rgb(var(--surface-hover))]"
          style={{ color: 'rgb(var(--text-muted))' }}
          aria-label="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
