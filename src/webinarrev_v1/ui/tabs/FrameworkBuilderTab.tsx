import { useState, useMemo } from 'react';
import {
  Play,
  Clock,
  FileText,
  AlertTriangle,
  ChevronDown,
  MessageSquare,
  Shield,
  RefreshCw,
} from 'lucide-react';
import type { ProjectMetadata, DeliverableId, WR2, WR2Block, BlockId, BlockPhase, WR6 } from '../../contracts';
import { PHASE_MAPPING } from '../../contracts/enums';
import { BlockDetailSlideout } from '../components/BlockDetailSlideout';
import { DurationTrustDashboard } from '../components/DurationTrustDashboard';
import { checkRequiredSettings, type SettingsWarning } from '../../utils/settingsChecker';
import { SettingsWarningModal } from '../modals/SettingsWarningModal';

interface FrameworkBuilderTabProps {
  project: ProjectMetadata;
  artifacts: Map<DeliverableId, {
    content: unknown;
    validated: boolean;
    generated_at: number;
    edited_at?: number;
  }>;
  isPipelineRunning: boolean;
  onRunPipeline: () => void;
  onEditDeliverable: (id: DeliverableId, field: string, value: unknown) => Promise<void>;
  onRegenerate?: (id: DeliverableId, cascade: boolean) => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
}

export function FrameworkBuilderTab({
  project,
  artifacts,
  isPipelineRunning,
  onRunPipeline,
  onEditDeliverable,
  onRegenerate,
  onNavigateToTab,
}: FrameworkBuilderTabProps) {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [jumpToBlock, setJumpToBlock] = useState<string>('');
  const [showRegenerateMenu, setShowRegenerateMenu] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showSettingsWarning, setShowSettingsWarning] = useState(false);
  const [settingsWarnings, setSettingsWarnings] = useState<SettingsWarning[]>([]);

  const wr2Artifact = artifacts.get('WR2');
  const wr1Artifact = artifacts.get('WR1');
  const wr6Artifact = artifacts.get('WR6');
  const wr2 = wr2Artifact?.content as WR2 | undefined;
  const wr6 = wr6Artifact?.content as WR6 | undefined;

  const isStale = wr1Artifact && wr2Artifact &&
    (wr1Artifact.edited_at || wr1Artifact.generated_at) > wr2Artifact.generated_at;

  const handleFitToDuration = async (adjustedBlocks: WR2Block[]) => {
    if (!wr2) return;
    const newWr2: WR2 = { ...wr2, blocks: adjustedBlocks };
    await onEditDeliverable('WR2', '', newWr2);
  };

  const { beginning, middle, end, totalDuration, phaseStats } = useMemo(() => {
    if (!wr2?.blocks) {
      return {
        beginning: [],
        middle: [],
        end: [],
        totalDuration: 0,
        phaseStats: { beginning: 0, middle: 0, end: 0 }
      };
    }

    const beginningBlocks = wr2.blocks.filter(b => b.phase === 'beginning');
    const middleBlocks = wr2.blocks.filter(b => b.phase === 'middle');
    const endBlocks = wr2.blocks.filter(b => b.phase === 'end');

    const total = wr2.blocks.reduce((sum, b) => sum + b.timebox_minutes, 0);
    const stats = {
      beginning: beginningBlocks.reduce((sum, b) => sum + b.timebox_minutes, 0),
      middle: middleBlocks.reduce((sum, b) => sum + b.timebox_minutes, 0),
      end: endBlocks.reduce((sum, b) => sum + b.timebox_minutes, 0),
    };

    return { beginning: beginningBlocks, middle: middleBlocks, end: endBlocks, totalDuration: total, phaseStats: stats };
  }, [wr2]);

  const handleBlockClick = (blockId: BlockId) => {
    if (!wr2?.blocks) return;
    const index = wr2.blocks.findIndex(b => b.block_id === blockId);
    if (index !== -1) {
      setSelectedBlockIndex(index);
    }
  };

  const handleJumpToBlock = (blockId: string) => {
    if (!blockId) return;
    handleBlockClick(blockId as BlockId);
    setJumpToBlock('');
  };

  const handleSaveBlock = async (updatedBlock: WR2Block) => {
    if (selectedBlockIndex === null || !wr2) return;
    await onEditDeliverable('WR2', `blocks[${selectedBlockIndex}]`, updatedBlock);
  };

  const handleRegenerate = async (cascade: boolean) => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    setShowRegenerateMenu(false);
    try {
      await onRegenerate('WR2', cascade);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRunPipeline = () => {
    const warnings = checkRequiredSettings(project.settings?.operator || {});
    if (warnings.length > 0) {
      setSettingsWarnings(warnings);
      setShowSettingsWarning(true);
    } else {
      onRunPipeline();
    }
  };

  const handleGenerateAnyway = () => {
    setShowSettingsWarning(false);
    onRunPipeline();
  };

  const handleConfigureSettings = () => {
    setShowSettingsWarning(false);
    if (onNavigateToTab) {
      onNavigateToTab('project-setup');
    }
  };

  if (!wr2) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: 'rgb(var(--surface-elevated))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <FileText
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: 'rgb(var(--text-muted))' }}
            />
            <p className="text-lg font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              No Framework Generated
            </p>
            <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
              Run the pipeline to generate the 21-block framework
            </p>
            <button
              onClick={handleRunPipeline}
              disabled={isPipelineRunning}
              className="btn-primary"
            >
              <Play className="w-4 h-4" />
              Run Pipeline
            </button>
          </div>
        </div>
        <SettingsWarningModal
          isOpen={showSettingsWarning}
          warnings={settingsWarnings}
          onClose={() => setShowSettingsWarning(false)}
          onGenerateAnyway={handleGenerateAnyway}
          onConfigureSettings={handleConfigureSettings}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b"
        style={{
          background: 'rgb(var(--surface-elevated))',
          borderColor: 'rgb(var(--border-default))',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                Framework Builder
              </h2>
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                WR2 - 21 blocks organized in 7-7-7 phases
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onRegenerate && (
                <div className="relative">
                  <button
                    onClick={() => setShowRegenerateMenu(!showRegenerateMenu)}
                    disabled={isRegenerating || isPipelineRunning}
                    className="btn-secondary text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                  {showRegenerateMenu && (
                    <div
                      className="absolute right-0 mt-1 w-64 rounded-lg shadow-lg overflow-hidden z-10"
                      style={{
                        background: 'rgb(var(--surface-elevated))',
                        border: '1px solid rgb(var(--border-default))',
                      }}
                    >
                      <button
                        onClick={() => handleRegenerate(false)}
                        className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[rgb(var(--surface-glass))]"
                        style={{
                          color: 'rgb(var(--text-primary))',
                          borderBottom: '1px solid rgb(var(--border-default))',
                        }}
                      >
                        <div className="font-medium">Regenerate Framework Only</div>
                        <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                          Only regenerate WR2, keep assets unchanged
                        </div>
                      </button>
                      <button
                        onClick={() => handleRegenerate(true)}
                        className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[rgb(var(--surface-glass))]"
                        style={{ color: 'rgb(var(--text-primary))' }}
                      >
                        <div className="font-medium">Regenerate Framework + All Assets</div>
                        <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                          Regenerate WR2 and all downstream deliverables (WR3-WR9)
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="relative">
                <select
                  value={jumpToBlock}
                  onChange={(e) => handleJumpToBlock(e.target.value)}
                  aria-label="Jump to block"
                  className="input-field text-sm py-2 pr-8 appearance-none cursor-pointer"
                  style={{ minWidth: '160px' }}
                >
                  <option value="">Jump to block...</option>
                  {wr2.blocks.map((block) => (
                    <option key={block.block_id} value={block.block_id}>
                      {block.block_id} - {block.title.slice(0, 30)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgb(var(--text-muted))' }}
                />
              </div>
            </div>
          </div>

          {isStale && (
            <div
              className="p-3 rounded-xl flex items-center justify-between mb-4"
              style={{
                background: 'rgb(var(--warning) / 0.1)',
                border: '1px solid rgb(var(--warning) / 0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
                <span className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                  Client profile (WR1) was modified. Framework may be outdated.
                </span>
              </div>
              <button onClick={handleRunPipeline} disabled={isPipelineRunning} className="btn-primary text-sm">
                <Play className="w-4 h-4" />
                Re-run
              </button>
            </div>
          )}

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                {totalDuration} min total
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(var(--success))' }} />
                Beginning: {phaseStats.beginning}m
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(var(--accent-primary))' }} />
                Middle: {phaseStats.middle}m
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(var(--warning))' }} />
                End: {phaseStats.end}m
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs px-2 py-1 rounded-full" style={{
                background: 'rgb(var(--surface-base))',
                color: 'rgb(var(--text-muted))'
              }}>
                {project.settings.cta_mode}
              </span>
              <span className="text-xs px-2 py-1 rounded-full" style={{
                background: 'rgb(var(--surface-base))',
                color: 'rgb(var(--text-muted))'
              }}>
                {project.settings.audience_temperature}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <DurationTrustDashboard
              targetDuration={project.settings.webinar_length_minutes}
              wr2={wr2}
              wr6={wr6}
              onFitToDuration={handleFitToDuration}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-6">
            <PhaseColumn
              phase="beginning"
              title="Beginning"
              subtitle="Hook & Setup"
              blocks={beginning}
              onBlockClick={handleBlockClick}
              color="success"
            />
            <PhaseColumn
              phase="middle"
              title="Middle"
              subtitle="Content & Proof"
              blocks={middle}
              onBlockClick={handleBlockClick}
              color="accent"
            />
            <PhaseColumn
              phase="end"
              title="End"
              subtitle="Close & CTA"
              blocks={end}
              onBlockClick={handleBlockClick}
              color="warning"
            />
          </div>
        </div>
      </div>

      {selectedBlockIndex !== null && wr2.blocks[selectedBlockIndex] && (
        <BlockDetailSlideout
          block={wr2.blocks[selectedBlockIndex]}
          onClose={() => setSelectedBlockIndex(null)}
          onSave={handleSaveBlock}
        />
      )}

      <SettingsWarningModal
        isOpen={showSettingsWarning}
        warnings={settingsWarnings}
        onClose={() => setShowSettingsWarning(false)}
        onGenerateAnyway={handleGenerateAnyway}
        onConfigureSettings={handleConfigureSettings}
      />
    </div>
  );
}

interface PhaseColumnProps {
  phase: BlockPhase;
  title: string;
  subtitle: string;
  blocks: WR2Block[];
  onBlockClick: (blockId: BlockId) => void;
  color: 'success' | 'accent' | 'warning';
}

function PhaseColumn({ phase, title, subtitle, blocks, onBlockClick, color }: PhaseColumnProps) {
  const colorMap = {
    success: { bg: 'rgb(var(--success) / 0.1)', border: 'rgb(var(--success) / 0.2)', accent: 'rgb(var(--success))' },
    accent: { bg: 'rgb(var(--accent-primary) / 0.1)', border: 'rgb(var(--accent-primary) / 0.2)', accent: 'rgb(var(--accent-primary))' },
    warning: { bg: 'rgb(var(--warning) / 0.1)', border: 'rgb(var(--warning) / 0.2)', accent: 'rgb(var(--warning))' },
  };

  const colors = colorMap[color];
  const expectedBlockIds = PHASE_MAPPING[phase];

  return (
    <div>
      <div
        className="p-3 rounded-t-xl flex items-center justify-between"
        style={{ background: colors.bg, borderBottom: `2px solid ${colors.accent}` }}
      >
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            {subtitle}
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: colors.accent, color: 'white' }}>
          {expectedBlockIds.length} blocks
        </span>
      </div>
      <div
        className="space-y-2 p-2 rounded-b-xl"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: `1px solid rgb(var(--border-default))`,
          borderTop: 'none',
          minHeight: '400px',
        }}
      >
        {blocks.map((block) => (
          <BlockCard
            key={block.block_id}
            block={block}
            onClick={() => onBlockClick(block.block_id)}
            accentColor={colors.accent}
          />
        ))}
      </div>
    </div>
  );
}

interface BlockCardProps {
  block: WR2Block;
  onClick: () => void;
  accentColor: string;
}

function BlockCard({ block, onClick, accentColor }: BlockCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-subtle))',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
          style={{ background: accentColor, color: 'white' }}
        >
          {block.block_id}
        </span>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
          <Clock className="w-3 h-3" />
          {block.timebox_minutes}m
        </div>
      </div>

      <h4
        className="text-sm font-medium mb-1 line-clamp-2"
        style={{ color: 'rgb(var(--text-primary))' }}
      >
        {block.title}
      </h4>

      <p
        className="text-xs line-clamp-2 mb-2"
        style={{ color: 'rgb(var(--text-muted))' }}
      >
        {block.purpose}
      </p>

      <div className="flex items-center gap-3">
        {block.proof_insertion_points.length > 0 && (
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: 'rgb(var(--accent-primary))' }}
          >
            <Shield className="w-3 h-3" />
            {block.proof_insertion_points.length}
          </div>
        )}
        {block.objections_handled.length > 0 && (
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: 'rgb(var(--warning))' }}
          >
            <MessageSquare className="w-3 h-3" />
            {block.objections_handled.length}
          </div>
        )}
      </div>
    </button>
  );
}
