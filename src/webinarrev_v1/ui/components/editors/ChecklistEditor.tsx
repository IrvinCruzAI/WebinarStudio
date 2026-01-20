import { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  Clock,
  CheckSquare,
  Calendar,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { WR7 } from '../../../contracts';

interface ChecklistEditorProps {
  content: WR7;
  onEdit: (field: string, value: unknown) => Promise<void>;
  initialEditMode?: boolean;
}

type PhaseKey = 'pre_webinar' | 'live_webinar' | 'post_webinar';

const PHASE_CONFIG = {
  pre_webinar: {
    title: 'Pre-Webinar Checklist',
    icon: Calendar,
    color: 'rgb(var(--accent-primary))',
    bgColor: 'rgb(var(--accent-primary) / 0.1)',
  },
  live_webinar: {
    title: 'Live Webinar Checklist',
    icon: Clock,
    color: 'rgb(var(--success))',
    bgColor: 'rgb(var(--success) / 0.1)',
  },
  post_webinar: {
    title: 'Post-Webinar Checklist',
    icon: CheckSquare,
    color: 'rgb(var(--warning))',
    bgColor: 'rgb(var(--warning) / 0.1)',
  },
};

export function ChecklistEditor({ content, onEdit, initialEditMode = false }: ChecklistEditorProps) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const [expandedPhases, setExpandedPhases] = useState<Record<PhaseKey, boolean>>({
    pre_webinar: true,
    live_webinar: true,
    post_webinar: true,
  });

  useEffect(() => {
    setEditMode(initialEditMode);
  }, [initialEditMode]);

  if (!content?.pre_webinar || !content?.live_webinar || !content?.post_webinar) {
    return (
      <div className="h-full flex items-center justify-center">
        <div
          className="text-center p-8 rounded-xl"
          style={{
            background: 'rgb(var(--surface-elevated))',
            border: '1px solid rgb(var(--border-default))',
          }}
        >
          <AlertTriangle
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'rgb(var(--warning))' }}
          />
          <p className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
            Invalid Checklist Content
          </p>
        </div>
      </div>
    );
  }

  const togglePhase = (phase: PhaseKey) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  const handleTaskEdit = async (phase: PhaseKey, index: number, field: string, value: string) => {
    const items = [...content[phase]];
    items[index] = { ...items[index], [field]: value };
    await onEdit(phase, items);
  };

  const phases: PhaseKey[] = ['pre_webinar', 'live_webinar', 'post_webinar'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5" style={{ color: 'rgb(var(--accent-primary))' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
            Execution Checklist
          </h3>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="btn-secondary text-sm"
        >
          {editMode ? (
            <>
              <Eye className="w-4 h-4" />
              Preview Mode
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              Edit Mode
            </>
          )}
        </button>
      </div>

      {phases.map(phase => {
        const config = PHASE_CONFIG[phase];
        const Icon = config.icon;
        const items = content[phase] || [];
        const isExpanded = expandedPhases[phase];

        return (
          <div
            key={phase}
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgb(var(--surface-elevated))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <button
              onClick={() => togglePhase(phase)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[rgb(var(--surface-glass))] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: config.bgColor,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                    {config.title}
                  </h4>
                  <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                    {items.length} {items.length === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
              )}
            </button>

            {isExpanded && (
              <div
                className="px-6 pb-4 border-t"
                style={{ borderColor: 'rgb(var(--border-default))' }}
              >
                <div className="space-y-3 mt-4">
                  {items.map((item, index) => (
                    <div
                      key={item.checklist_id}
                      className="p-4 rounded-lg"
                      style={{
                        background: 'rgb(var(--surface-base))',
                        border: '1px solid rgb(var(--border-default))',
                      }}
                    >
                      {editMode ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                              Task
                            </label>
                            <input
                              type="text"
                              value={item.task}
                              onChange={(e) => handleTaskEdit(phase, index, 'task', e.target.value)}
                              className="input w-full"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                Timing
                              </label>
                              <input
                                type="text"
                                value={item.timing}
                                onChange={(e) => handleTaskEdit(phase, index, 'timing', e.target.value)}
                                className="input w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                                ID
                              </label>
                              <input
                                type="text"
                                value={item.checklist_id}
                                disabled
                                className="input w-full opacity-50 cursor-not-allowed"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                              Notes
                            </label>
                            <textarea
                              value={item.notes}
                              onChange={(e) => handleTaskEdit(phase, index, 'notes', e.target.value)}
                              rows={2}
                              className="input w-full resize-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: config.color }} />
                                <p className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                                  {item.task}
                                </p>
                              </div>
                              {item.notes && (
                                <div
                                  className="text-sm pl-6 p-2 rounded"
                                  style={{
                                    background: 'rgb(var(--surface-elevated))',
                                    color: 'rgb(var(--text-secondary))',
                                  }}
                                >
                                  <FileText className="w-3 h-3 inline mr-1" style={{ color: 'rgb(var(--text-muted))' }} />
                                  {item.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                                style={{
                                  background: config.bgColor,
                                  color: config.color,
                                }}
                              >
                                <Clock className="w-3 h-3" />
                                {item.timing}
                              </div>
                              <span
                                className="text-[10px] font-mono"
                                style={{ color: 'rgb(var(--text-muted))' }}
                              >
                                {item.checklist_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
