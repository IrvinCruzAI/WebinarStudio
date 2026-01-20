import { useState } from 'react';
import {
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Shield,
  Target,
} from 'lucide-react';
import type { WR2, BlockPhase, BlockId } from '../../contracts';
import { PHASE_MAPPING } from '../../contracts';

interface Framework21BoardProps {
  wr2Data: WR2 | null;
  onBlockSelect: (blockId: BlockId) => void;
  selectedBlockId?: BlockId | null;
  staleBlocks?: Set<BlockId>;
}

const PHASE_CONFIG: Record<
  BlockPhase,
  { label: string; color: string; gradient: string; bgGradient: string }
> = {
  beginning: {
    label: 'Beginning',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-teal-500',
    bgGradient: 'from-cyan-500/5 to-teal-500/5',
  },
  middle: {
    label: 'Middle',
    color: 'text-teal-400',
    gradient: 'from-teal-500 to-emerald-500',
    bgGradient: 'from-teal-500/5 to-emerald-500/5',
  },
  end: {
    label: 'End',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-green-500',
    bgGradient: 'from-emerald-500/5 to-green-500/5',
  },
};

function getBlockNumber(blockId: BlockId): number {
  return parseInt(blockId.replace('B', ''), 10);
}

interface BlockCardProps {
  block: WR2['blocks'][number];
  isSelected: boolean;
  isStale: boolean;
  onClick: () => void;
}

function BlockCard({ block, isSelected, isStale, onClick }: BlockCardProps) {
  const phaseConfig = PHASE_CONFIG[block.phase];
  const blockNum = getBlockNumber(block.block_id);

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left rounded-xl border transition-all duration-200 ${
        isSelected
          ? `border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/50`
          : `border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50`
      }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-gradient-to-br ${phaseConfig.gradient} text-white`}
          >
            {blockNum}
          </div>
          <div className="flex items-center gap-1">
            {isStale && (
              <div className="p-1 rounded-full bg-amber-500/20">
                <AlertCircle className="w-3 h-3 text-amber-400" />
              </div>
            )}
            {block.proof_insertion_points.length > 0 && (
              <div className="p-1 rounded-full bg-cyan-500/20">
                <Shield className="w-3 h-3 text-cyan-400" />
              </div>
            )}
          </div>
        </div>

        <h4 className="text-sm font-medium text-white mb-1 line-clamp-1 group-hover:text-teal-300 transition-colors">
          {block.title}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-2">{block.purpose}</p>

        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{block.timebox_minutes}m</span>
          </div>
          {block.objections_handled.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Target className="w-3 h-3" />
              <span>{block.objections_handled.length}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Framework21Board({
  wr2Data,
  onBlockSelect,
  selectedBlockId,
  staleBlocks = new Set(),
}: Framework21BoardProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<BlockPhase>>(
    new Set(['beginning', 'middle', 'end'])
  );

  const togglePhase = (phase: BlockPhase) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  const getBlocksForPhase = (phase: BlockPhase) => {
    if (!wr2Data) return [];
    const phaseBlockIds = PHASE_MAPPING[phase];
    return wr2Data.blocks.filter((block) =>
      phaseBlockIds.includes(block.block_id)
    );
  };

  if (!wr2Data) {
    return (
      <div className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
        <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">
          Framework Not Generated
        </h3>
        <p className="text-slate-500">
          Run the pipeline to generate the 21-block framework
        </p>
      </div>
    );
  }

  const phases: BlockPhase[] = ['beginning', 'middle', 'end'];
  const totalTime = wr2Data.blocks.reduce((sum, b) => sum + b.timebox_minutes, 0);
  const staleCount = staleBlocks.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">21-Block Framework</h3>
          <p className="text-sm text-slate-400">
            {totalTime} minutes total
            {staleCount > 0 && (
              <span className="text-amber-400 ml-2">
                ({staleCount} stale block{staleCount > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Proof point</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Stale</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {phases.map((phase) => {
          const config = PHASE_CONFIG[phase];
          const blocks = getBlocksForPhase(phase);
          const isExpanded = expandedPhases.has(phase);
          const phaseTime = blocks.reduce((sum, b) => sum + b.timebox_minutes, 0);
          const phaseStaleCount = blocks.filter((b) =>
            staleBlocks.has(b.block_id)
          ).length;

          return (
            <div
              key={phase}
              className={`rounded-xl border border-slate-700/50 overflow-hidden bg-gradient-to-br ${config.bgGradient}`}
            >
              <button
                onClick={() => togglePhase(phase)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}
                  >
                    <span className="text-white text-xs font-bold">
                      {phase === 'beginning' ? '1-7' : phase === 'middle' ? '8-14' : '15-21'}
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className={`font-semibold ${config.color}`}>
                      {config.label}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {blocks.length} blocks / {phaseTime} min
                      {phaseStaleCount > 0 && (
                        <span className="text-amber-400 ml-1">
                          ({phaseStaleCount} stale)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-slate-500 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-7 gap-2">
                    {blocks.map((block) => (
                      <BlockCard
                        key={block.block_id}
                        block={block}
                        isSelected={selectedBlockId === block.block_id}
                        isStale={staleBlocks.has(block.block_id)}
                        onClick={() => onBlockSelect(block.block_id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
