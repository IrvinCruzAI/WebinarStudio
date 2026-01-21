import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import type { WR2, BlockId } from '../../contracts';
import { hasPlaceholders } from '../../utils/stageDirectionsFormatter';

interface AttentionSummaryProps {
  wr2: WR2;
  onBlockClick?: (blockId: BlockId) => void;
}

interface BlockIssue {
  blockId: BlockId;
  title: string;
  issues: string[];
}

function analyzeBlocks(wr2: WR2): {
  needsAttention: BlockIssue[];
  warnings: number;
  errors: number;
} {
  const needsAttention: BlockIssue[] = [];
  let warnings = 0;
  let errors = 0;

  wr2.blocks.forEach(block => {
    const issues: string[] = [];

    const hasTitlePlaceholder = hasPlaceholders(block.title);
    const hasPurposePlaceholder = hasPlaceholders(block.purpose);
    const hasTalkTrackPlaceholder = hasPlaceholders(block.talk_track_md);

    if (hasTitlePlaceholder || hasPurposePlaceholder || hasTalkTrackPlaceholder) {
      issues.push('Contains placeholders');
      errors++;
    }

    if (!block.talk_track_md || block.talk_track_md.trim().length === 0) {
      issues.push('Missing talk track');
      errors++;
    } else {
      const wordCount = block.talk_track_md.split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount < 30) {
        issues.push('Talk track seems short');
        warnings++;
      }
    }

    if (block.proof_insertion_points.length === 0 && block.phase === 'middle') {
      issues.push('No proof points');
      warnings++;
    }

    if (!block.transition_in || !block.transition_out) {
      issues.push('Missing transitions');
      warnings++;
    }

    if (issues.length > 0) {
      needsAttention.push({
        blockId: block.block_id,
        title: block.title,
        issues,
      });
    }
  });

  return { needsAttention, warnings, errors };
}

export function AttentionSummary({ wr2, onBlockClick }: AttentionSummaryProps) {
  const analysis = analyzeBlocks(wr2);

  if (analysis.needsAttention.length === 0) {
    return (
      <div
        className="p-3 rounded-xl flex items-center gap-2"
        style={{
          background: 'rgb(var(--success) / 0.1)',
          border: '1px solid rgb(var(--success) / 0.2)',
        }}
      >
        <CheckCircle2 className="w-4 h-4" style={{ color: 'rgb(var(--success))' }} />
        <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
          All blocks look good
        </span>
      </div>
    );
  }

  const hasErrors = analysis.errors > 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: hasErrors ? 'rgb(var(--error) / 0.1)' : 'rgb(var(--warning) / 0.1)',
        border: `1px solid ${hasErrors ? 'rgb(var(--error) / 0.2)' : 'rgb(var(--warning) / 0.2)'}`,
      }}
    >
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <AlertCircle className="w-4 h-4" style={{ color: 'rgb(var(--error))' }} />
          ) : (
            <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
          )}
          <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
            {analysis.needsAttention.length} block{analysis.needsAttention.length !== 1 ? 's' : ''} need attention
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {analysis.errors > 0 && (
            <span
              className="px-2 py-1 rounded-full"
              style={{
                background: 'rgb(var(--error) / 0.2)',
                color: 'rgb(var(--error))',
              }}
            >
              {analysis.errors} error{analysis.errors !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {analysis.needsAttention.length <= 5 && (
        <div
          className="px-3 pb-3 space-y-1"
          style={{ borderTop: `1px solid ${hasErrors ? 'rgb(var(--error) / 0.2)' : 'rgb(var(--warning) / 0.2)'}` }}
        >
          {analysis.needsAttention.map(item => (
            <button
              key={item.blockId}
              onClick={() => onBlockClick?.(item.blockId)}
              className="w-full text-left p-2 rounded-lg transition-colors hover:bg-[rgb(var(--surface-glass))]"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: hasErrors ? 'rgb(var(--error))' : 'rgb(var(--warning))',
                    color: 'white'
                  }}
                >
                  {item.blockId}
                </span>
                <span className="text-xs flex-1 truncate" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {item.issues.join(', ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
