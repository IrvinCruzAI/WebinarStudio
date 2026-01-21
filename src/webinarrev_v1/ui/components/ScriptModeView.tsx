import { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Play,
} from 'lucide-react';
import type { WR2, WR6, BlockId, ProjectMetadata } from '../../contracts';
import { ScriptBlockCard } from './ScriptBlockCard';
import { computeBlockTimestamps } from '../../utils/timestampComputer';
import { generateScriptMarkdown } from '../../export/scriptMarkdownGenerator';

interface ScriptModeViewProps {
  wr2: WR2;
  wr6?: WR6;
  project: ProjectMetadata;
  onBlockEdit: (blockId: BlockId) => void;
  onNavigateToTab?: (tab: string) => void;
  onRunPipeline?: () => void;
}

export function ScriptModeView({
  wr2,
  wr6,
  project,
  onBlockEdit,
  onNavigateToTab,
  onRunPipeline,
}: ScriptModeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<BlockId | null>(null);

  const validation = useMemo(() => {
    const expectedBlockIds: BlockId[] = [
      'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07',
      'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14',
      'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21',
    ];

    const actualBlockIds = new Set(wr2.blocks.map(b => b.block_id));
    const missingBlocks = expectedBlockIds.filter(id => !actualBlockIds.has(id));

    return {
      valid: missingBlocks.length === 0 && wr2.blocks.length === 21,
      missingBlocks,
    };
  }, [wr2]);

  const timestamps = useMemo(() => {
    return computeBlockTimestamps(wr2, wr6);
  }, [wr2, wr6]);

  const filteredBlocks = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return wr2.blocks;
    }

    const query = searchQuery.toLowerCase();
    return wr2.blocks.filter(block =>
      block.block_id.toLowerCase().includes(query) ||
      block.title.toLowerCase().includes(query) ||
      block.purpose.toLowerCase().includes(query) ||
      block.talk_track_md.toLowerCase().includes(query) ||
      block.proof_insertion_points.some(p => p.toLowerCase().includes(query)) ||
      block.objections_handled.some(o => o.toLowerCase().includes(query))
    );
  }, [wr2.blocks, searchQuery]);

  const handleCopyScript = async () => {
    const markdown = generateScriptMarkdown(
      wr2,
      wr6,
      project.project_name,
      timestamps
    );

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadScript = () => {
    const markdown = generateScriptMarkdown(
      wr2,
      wr6,
      project.project_name,
      timestamps
    );

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.project_name}-script.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleJumpToBlock = (blockId: BlockId) => {
    setActiveBlockId(blockId);
    const element = document.getElementById(`block-${blockId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setActiveBlockId(null), 3000);
    }
  };

  if (!validation.valid) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="p-6 rounded-xl"
            style={{
              background: 'rgb(var(--error) / 0.1)',
              border: '1px solid rgb(var(--error) / 0.3)',
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color: 'rgb(var(--error))' }} />
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                  Framework is Incomplete
                </h3>
                <p className="text-sm mb-3" style={{ color: 'rgb(var(--text-secondary))' }}>
                  The framework must have exactly 21 blocks (B01-B21) to generate a script.
                </p>
                {validation.missingBlocks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
                      Missing blocks:
                    </p>
                    <p className="text-sm font-mono" style={{ color: 'rgb(var(--text-muted))' }}>
                      {validation.missingBlocks.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {onRunPipeline && (
              <button
                onClick={onRunPipeline}
                className="btn-primary"
              >
                <Play className="w-4 h-4" />
                Regenerate Framework
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const usingWR6 = wr6?.timeline && wr6.timeline.length > 0;

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="hidden lg:block w-48 flex-shrink-0 overflow-y-auto border-r" style={{ borderColor: 'rgb(var(--border-default))' }}>
        <div className="sticky top-0 p-4" style={{ background: 'rgb(var(--surface-elevated))' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'rgb(var(--text-muted))' }}>
            Jump to Block
          </h3>
          <div className="space-y-1">
            {wr2.blocks.map((block) => (
              <button
                key={block.block_id}
                onClick={() => handleJumpToBlock(block.block_id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeBlockId === block.block_id
                    ? 'bg-[rgb(var(--accent-primary)/0.2)] text-[rgb(var(--text-primary))] font-medium'
                    : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-glass))]'
                }`}
              >
                {block.block_id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex-shrink-0 px-6 py-4 border-b"
          style={{
            background: 'rgb(var(--surface-elevated))',
            borderColor: 'rgb(var(--border-default))',
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'rgb(var(--text-muted))' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search script..."
                  className="input-field pl-10 w-full"
                />
              </div>
              <button
                onClick={handleCopyScript}
                className="btn-secondary text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Script'}
              </button>
              <button
                onClick={handleDownloadScript}
                className="btn-secondary text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            {!usingWR6 && (
              <div
                className="p-3 rounded-lg flex items-center gap-2 text-sm"
                style={{
                  background: 'rgb(var(--accent-primary) / 0.1)',
                  border: '1px solid rgb(var(--accent-primary) / 0.2)',
                  color: 'rgb(var(--text-secondary))',
                }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
                Using estimated timing from framework (WR6 timeline not available)
              </div>
            )}

            {searchQuery && (
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                Found {filteredBlocks.length} of {wr2.blocks.length} blocks
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {filteredBlocks.map((block) => {
              const timestamp = timestamps.get(block.block_id);
              if (!timestamp) return null;

              return (
                <ScriptBlockCard
                  key={block.block_id}
                  block={block}
                  timestamp={timestamp}
                  onEdit={() => onBlockEdit(block.block_id)}
                  onNavigateToTab={onNavigateToTab}
                  searchQuery={searchQuery}
                  isActive={activeBlockId === block.block_id}
                />
              );
            })}

            {filteredBlocks.length === 0 && searchQuery && (
              <div className="text-center py-16">
                <p className="text-lg" style={{ color: 'rgb(var(--text-muted))' }}>
                  No blocks match your search
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
