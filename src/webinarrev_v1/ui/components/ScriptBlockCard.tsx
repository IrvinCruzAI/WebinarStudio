import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Clock,
  Edit2,
  Shield,
  MessageSquare,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { WR2Block, DeliverableId } from '../../contracts';
import type { TimestampInfo } from '../../utils/timestampComputer';
import { formatTimestampRange } from '../../utils/timestampComputer';
import { formatStageDirections, hasPlaceholders } from '../../utils/stageDirectionsFormatter';
import { InlineMissingInfoCallout } from './InlineMissingInfoCallout';

interface ScriptBlockCardProps {
  block: WR2Block;
  timestamp: TimestampInfo;
  onEdit: () => void;
  onNavigateToTab?: (tab: string) => void;
  searchQuery?: string;
}

export function ScriptBlockCard({
  block,
  timestamp,
  onEdit,
  onNavigateToTab,
  searchQuery,
}: ScriptBlockCardProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const phaseColors = {
    beginning: { bg: 'rgb(var(--success) / 0.1)', accent: 'rgb(var(--success))' },
    middle: { bg: 'rgb(var(--accent-primary) / 0.1)', accent: 'rgb(var(--accent-primary))' },
    end: { bg: 'rgb(var(--warning) / 0.1)', accent: 'rgb(var(--warning))' },
  };

  const colors = phaseColors[block.phase];

  const stageDirections = formatStageDirections(
    block.purpose,
    block.transition_in,
    block.transition_out
  );

  const hasTalkTrackPlaceholders = hasPlaceholders(block.talk_track_md);
  const hasStageDirectionPlaceholders = hasPlaceholders(stageDirections);

  const handleFixRoute = (route: { tab: string; deliverableId?: DeliverableId }) => {
    if (onNavigateToTab) {
      onNavigateToTab(route.tab === 'setup' ? 'project-setup' : route.tab);
    }
  };

  const highlightText = (text: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return text;
    }

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          style={{
            background: 'rgb(var(--warning) / 0.4)',
            color: 'rgb(var(--text-primary))',
            padding: '0 2px',
            borderRadius: '2px',
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      id={`block-${block.block_id}`}
      className="scroll-mt-24 rounded-xl overflow-hidden"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background: colors.bg,
          borderBottom: `2px solid ${colors.accent}`,
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="text-lg font-mono font-bold px-3 py-1 rounded"
            style={{ background: colors.accent, color: 'white' }}
          >
            {block.block_id}
          </span>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
              {highlightText(block.title)}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              <span className="capitalize">{block.phase}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {block.timebox_minutes} min
              </span>
              <span className="font-mono">
                {formatTimestampRange(timestamp.startMinute, timestamp.endMinute)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="btn-ghost text-sm"
        >
          <Edit2 className="w-4 h-4" />
          Edit Block
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
            What to Say
          </h4>
          {hasTalkTrackPlaceholders && (
            <InlineMissingInfoCallout
              placeholderText={block.talk_track_md}
              fieldPath={`blocks.${block.block_id}.talk_track_md`}
              deliverableId="WR2"
              onFix={handleFixRoute}
            />
          )}
          <div
            className="prose prose-sm max-w-none"
            style={{
              color: 'rgb(var(--text-secondary))',
              lineHeight: 1.8,
            }}
          >
            <ReactMarkdown>{block.talk_track_md}</ReactMarkdown>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3 italic" style={{ color: 'rgb(var(--text-muted))' }}>
            Stage Directions
          </h4>
          {hasStageDirectionPlaceholders && (
            <InlineMissingInfoCallout
              placeholderText={stageDirections}
              fieldPath={`blocks.${block.block_id}.purpose`}
              deliverableId="WR2"
              onFix={handleFixRoute}
            />
          )}
          <div
            className="whitespace-pre-wrap text-sm"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            <ReactMarkdown>{stageDirections}</ReactMarkdown>
          </div>
        </div>

        {block.proof_insertion_points.length > 0 && (
          <div>
            <h4
              className="text-base font-semibold mb-2 flex items-center gap-2"
              style={{ color: 'rgb(var(--accent-primary))' }}
            >
              <Shield className="w-4 h-4" />
              Proof Points to Insert
            </h4>
            <ul className="space-y-1 ml-6">
              {block.proof_insertion_points.map((point, idx) => (
                <li
                  key={idx}
                  className="text-sm list-disc"
                  style={{ color: 'rgb(var(--text-secondary))' }}
                >
                  {highlightText(point)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {block.objections_handled.length > 0 && (
          <div>
            <h4
              className="text-base font-semibold mb-2 flex items-center gap-2"
              style={{ color: 'rgb(var(--warning))' }}
            >
              <MessageSquare className="w-4 h-4" />
              Objections to Address
            </h4>
            <ul className="space-y-1 ml-6">
              {block.objections_handled.map((objection, idx) => (
                <li
                  key={idx}
                  className="text-sm list-disc"
                  style={{ color: 'rgb(var(--text-secondary))' }}
                >
                  {highlightText(objection)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {block.transition_out && (
          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
              Transition Out
            </h4>
            <p className="text-sm italic" style={{ color: 'rgb(var(--text-secondary))' }}>
              {highlightText(block.transition_out)}
            </p>
          </div>
        )}

        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs flex items-center gap-1 transition-colors"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          {showTechnicalDetails ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          Technical Details
        </button>

        {showTechnicalDetails && (
          <div
            className="p-4 rounded text-xs font-mono"
            style={{
              background: 'rgb(var(--surface-base))',
              color: 'rgb(var(--text-muted))',
            }}
          >
            <div className="space-y-2">
              <div>
                <span className="font-bold">Block ID:</span> {block.block_id}
              </div>
              <div>
                <span className="font-bold">Phase:</span> {block.phase}
              </div>
              <div>
                <span className="font-bold">Timebox:</span> {block.timebox_minutes} minutes
              </div>
              <div>
                <span className="font-bold">Timestamp:</span> {formatTimestampRange(timestamp.startMinute, timestamp.endMinute)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
