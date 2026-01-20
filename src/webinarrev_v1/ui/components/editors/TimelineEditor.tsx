import { useState, useMemo, useEffect } from 'react';
import {
  Edit3,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Mic,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import type { WR6TimelineSegment } from '../../../contracts/schemas';
import { PHASE_MAPPING } from '../../../contracts/enums';

type WR6Content = {
  total_duration_minutes: number;
  timeline: WR6TimelineSegment[];
  qa: { assumptions: string[]; placeholders: string[]; claims_requiring_proof: string[] };
};

interface TimelineEditorProps {
  content: WR6Content;
  onEdit: (field: string, value: unknown) => Promise<void>;
  initialEditMode?: boolean;
}

function getPhaseForBlock(blockId: string): 'beginning' | 'middle' | 'end' {
  if (PHASE_MAPPING.beginning.includes(blockId as never)) return 'beginning';
  if (PHASE_MAPPING.middle.includes(blockId as never)) return 'middle';
  return 'end';
}

const PHASE_COLORS = {
  beginning: { bg: 'rgb(var(--success))', light: 'rgb(var(--success) / 0.2)' },
  middle: { bg: 'rgb(var(--accent-primary))', light: 'rgb(var(--accent-primary) / 0.2)' },
  end: { bg: 'rgb(var(--warning))', light: 'rgb(var(--warning) / 0.2)' },
};

export function TimelineEditor({ content, onEdit, initialEditMode = false }: TimelineEditorProps) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());

  useEffect(() => {
    setEditMode(initialEditMode);
  }, [initialEditMode]);

  if (!content?.timeline || content.timeline.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgb(var(--text-muted))' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
            No timeline content available
          </p>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Timeline data has not been generated yet.
          </p>
        </div>
      </div>
    );
  }

  const toggleSegment = (index: number) => {
    setExpandedSegments(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const analysis = useMemo(() => {
    const segmentMinutes = content.timeline.reduce(
      (sum, seg) => sum + (seg.end_minute - seg.start_minute),
      0
    );
    const lastSegmentEnd = content.timeline.length > 0
      ? Math.max(...content.timeline.map(s => s.end_minute))
      : 0;
    const hasGaps = content.timeline.some((seg, i) => {
      if (i === 0) return seg.start_minute !== 0;
      const prev = content.timeline[i - 1];
      return seg.start_minute !== prev.end_minute;
    });
    const isAligned = lastSegmentEnd === content.total_duration_minutes && !hasGaps;

    return {
      segmentMinutes,
      lastSegmentEnd,
      hasGaps,
      isAligned,
      coveragePercent: content.total_duration_minutes > 0
        ? (segmentMinutes / content.total_duration_minutes) * 100
        : 0,
    };
  }, [content]);

  const phaseTotals = useMemo(() => {
    return content.timeline.reduce(
      (acc, seg) => {
        const phase = getPhaseForBlock(seg.block_id);
        const duration = seg.end_minute - seg.start_minute;
        acc[phase] += duration;
        return acc;
      },
      { beginning: 0, middle: 0, end: 0 }
    );
  }, [content.timeline]);

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        <div className="flex items-center gap-4">
          <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
            Run of Show Timeline
          </h3>
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full"
            style={{
              background: analysis.isAligned ? 'rgb(var(--success) / 0.1)' : 'rgb(var(--warning) / 0.1)',
            }}
          >
            {analysis.isAligned ? (
              <CheckCircle2 className="w-4 h-4" style={{ color: 'rgb(var(--success))' }} />
            ) : (
              <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
            )}
            <span
              className="text-sm font-medium"
              style={{ color: analysis.isAligned ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}
            >
              {content.total_duration_minutes}m total
            </span>
          </div>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: editMode ? 'rgb(var(--accent-primary))' : 'rgb(var(--surface-elevated))',
            color: editMode ? 'white' : 'rgb(var(--text-primary))',
            border: '1px solid rgb(var(--border-default))',
          }}
        >
          {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          {editMode ? 'Preview' : 'Edit'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-3 border-b sticky top-0 z-10"
          style={{ background: 'rgb(var(--surface-elevated))', borderColor: 'rgb(var(--border-default))' }}
        >
          <div className="flex h-8 rounded-lg overflow-hidden">
            {content.timeline.map((segment, i) => {
              const phase = getPhaseForBlock(segment.block_id);
              const duration = segment.end_minute - segment.start_minute;
              const widthPercent = (duration / content.total_duration_minutes) * 100;

              return (
                <div
                  key={i}
                  className="relative flex items-center justify-center text-xs font-medium transition-all cursor-pointer hover:brightness-110"
                  style={{
                    width: `${widthPercent}%`,
                    background: PHASE_COLORS[phase].bg,
                    color: 'white',
                    minWidth: widthPercent > 3 ? '20px' : '4px',
                  }}
                  onClick={() => toggleSegment(i)}
                  title={`${segment.segment_title} (${duration}m)`}
                >
                  {widthPercent > 8 && (
                    <span className="truncate px-1">{segment.block_id}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: PHASE_COLORS.beginning.bg }} />
                Beginning: {phaseTotals.beginning}m
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: PHASE_COLORS.middle.bg }} />
                Middle: {phaseTotals.middle}m
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: PHASE_COLORS.end.bg }} />
                End: {phaseTotals.end}m
              </span>
            </div>
            <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              {content.timeline.length} segments | {analysis.coveragePercent.toFixed(0)}% coverage
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div
                className="absolute left-6 top-0 bottom-0 w-0.5"
                style={{ background: 'rgb(var(--border-default))' }}
              />

              <div className="space-y-3">
                {content.timeline.map((segment, i) => {
                  const phase = getPhaseForBlock(segment.block_id);
                  const duration = segment.end_minute - segment.start_minute;
                  const isExpanded = expandedSegments.has(i);

                  return (
                    <div key={i} className="relative pl-12">
                      <div
                        className="absolute left-4 w-4 h-4 rounded-full border-2 z-10"
                        style={{
                          background: 'rgb(var(--surface-base))',
                          borderColor: PHASE_COLORS[phase].bg,
                        }}
                      />

                      <div
                        className="rounded-xl overflow-hidden"
                        style={{
                          background: 'rgb(var(--surface-elevated))',
                          border: `1px solid ${PHASE_COLORS[phase].light}`,
                        }}
                      >
                        <button
                          onClick={() => toggleSegment(i)}
                          className="w-full flex items-center justify-between p-3 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center gap-2 px-2 py-1 rounded-lg"
                              style={{ background: PHASE_COLORS[phase].light }}
                            >
                              <Clock className="w-3 h-3" style={{ color: PHASE_COLORS[phase].bg }} />
                              <span className="text-xs font-medium" style={{ color: PHASE_COLORS[phase].bg }}>
                                {segment.start_minute}-{segment.end_minute}m
                              </span>
                            </div>
                            <span
                              className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                              style={{ background: PHASE_COLORS[phase].bg, color: 'white' }}
                            >
                              {segment.block_id}
                            </span>
                            <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                              {segment.segment_title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              background: 'rgb(var(--surface-base))',
                              color: 'rgb(var(--text-muted))',
                            }}>
                              {duration}m
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
                            ) : (
                              <ChevronDown className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div
                            className="p-4 border-t space-y-4"
                            style={{ borderColor: 'rgb(var(--border-subtle))' }}
                          >
                            <div>
                              <label className="text-xs font-medium flex items-center gap-1 mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                <Mic className="w-3 h-3" /> Description
                              </label>
                              {editMode ? (
                                <textarea
                                  value={segment.description}
                                  onChange={(e) => {
                                    const newTimeline = [...content.timeline];
                                    newTimeline[i] = { ...segment, description: e.target.value };
                                    onEdit('timeline', newTimeline);
                                  }}
                                  className="w-full bg-transparent border rounded-lg p-2 resize-none focus:outline-none text-sm"
                                  style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-default))' }}
                                  rows={2}
                                />
                              ) : (
                                <p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                                  {segment.description}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-medium flex items-center gap-1 mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                <MessageSquare className="w-3 h-3" /> Coach Cue
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  value={segment.coach_cue}
                                  onChange={(e) => {
                                    const newTimeline = [...content.timeline];
                                    newTimeline[i] = { ...segment, coach_cue: e.target.value };
                                    onEdit('timeline', newTimeline);
                                  }}
                                  className="w-full bg-transparent border rounded-lg p-2 focus:outline-none text-sm"
                                  style={{ color: 'rgb(var(--accent-primary))', borderColor: 'rgb(var(--border-default))' }}
                                />
                              ) : (
                                <p className="text-sm" style={{ color: 'rgb(var(--accent-primary))' }}>
                                  {segment.coach_cue}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-medium flex items-center gap-1 mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                <RefreshCw className="w-3 h-3" /> Fallback if Cold
                              </label>
                              {editMode ? (
                                <textarea
                                  value={segment.fallback_if_cold}
                                  onChange={(e) => {
                                    const newTimeline = [...content.timeline];
                                    newTimeline[i] = { ...segment, fallback_if_cold: e.target.value };
                                    onEdit('timeline', newTimeline);
                                  }}
                                  className="w-full bg-transparent border rounded-lg p-2 resize-none focus:outline-none text-sm"
                                  style={{ color: 'rgb(var(--warning))', borderColor: 'rgb(var(--border-default))' }}
                                  rows={2}
                                />
                              ) : (
                                <p className="text-sm" style={{ color: 'rgb(var(--warning))' }}>
                                  {segment.fallback_if_cold}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-medium flex items-center gap-1 mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                <Clock className="w-3 h-3" /> Time Check
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  value={segment.time_check}
                                  onChange={(e) => {
                                    const newTimeline = [...content.timeline];
                                    newTimeline[i] = { ...segment, time_check: e.target.value };
                                    onEdit('timeline', newTimeline);
                                  }}
                                  className="w-full bg-transparent border rounded-lg p-2 focus:outline-none text-sm"
                                  style={{ color: 'rgb(var(--text-muted))', borderColor: 'rgb(var(--border-default))' }}
                                />
                              ) : (
                                <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                                  {segment.time_check}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
