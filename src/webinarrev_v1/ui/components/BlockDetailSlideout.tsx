import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Save,
  Clock,
  FileText,
  MessageSquare,
  Shield,
  ArrowRight,
  ArrowLeft,
  Eye,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import type { WR2Block } from '../../contracts';

interface BlockDetailSlideoutProps {
  block: WR2Block;
  onClose: () => void;
  onSave: (block: WR2Block) => Promise<void>;
}

export function BlockDetailSlideout({ block, onClose, onSave }: BlockDetailSlideoutProps) {
  const [editedBlock, setEditedBlock] = useState<WR2Block>({ ...block });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<'content' | 'transitions' | 'proof'>('content');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setEditedBlock({ ...block });
    setHasChanges(false);
  }, [block]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateField = useCallback(<K extends keyof WR2Block>(field: K, value: WR2Block[K]) => {
    setEditedBlock(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedBlock);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (field: 'proof_insertion_points' | 'objections_handled') => {
    const newItem = field === 'proof_insertion_points' ? 'New proof point' : 'New objection';
    updateField(field, [...editedBlock[field], newItem]);
  };

  const removeArrayItem = (field: 'proof_insertion_points' | 'objections_handled', index: number) => {
    updateField(field, editedBlock[field].filter((_, i) => i !== index));
  };

  const updateArrayItem = (field: 'proof_insertion_points' | 'objections_handled', index: number, value: string) => {
    const newArray = [...editedBlock[field]];
    newArray[index] = value;
    updateField(field, newArray);
  };

  const phaseColors = {
    beginning: { bg: 'rgb(var(--success) / 0.1)', accent: 'rgb(var(--success))' },
    middle: { bg: 'rgb(var(--accent-primary) / 0.1)', accent: 'rgb(var(--accent-primary))' },
    end: { bg: 'rgb(var(--warning) / 0.1)', accent: 'rgb(var(--warning))' },
  };

  const colors = phaseColors[editedBlock.phase];

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />

      <div
        className="fixed top-0 right-0 bottom-0 w-[540px] z-50 flex flex-col shadow-2xl animate-slide-in"
        style={{ background: 'rgb(var(--surface-elevated))' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{
            background: colors.bg,
            borderColor: 'rgb(var(--border-default))',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-mono font-bold px-2 py-1 rounded"
              style={{ background: colors.accent, color: 'white' }}
            >
              {editedBlock.block_id}
            </span>
            <span
              className="text-xs px-2 py-1 rounded-full capitalize"
              style={{
                background: 'rgb(var(--surface-base))',
                color: 'rgb(var(--text-muted))',
              }}
            >
              {editedBlock.phase}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewMode(!previewMode)} className="btn-ghost text-sm">
              {previewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button onClick={onClose} className="btn-ghost p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                Title
              </label>
              {previewMode ? (
                <p className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                  {editedBlock.title}
                </p>
              ) : (
                <input
                  type="text"
                  value={editedBlock.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="input-field text-lg font-semibold"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                Purpose
              </label>
              {previewMode ? (
                <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {editedBlock.purpose}
                </p>
              ) : (
                <textarea
                  value={editedBlock.purpose}
                  onChange={(e) => updateField('purpose', e.target.value)}
                  className="input-field min-h-[80px] resize-none"
                  rows={3}
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Duration (minutes)
                </label>
                {previewMode ? (
                  <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                    {editedBlock.timebox_minutes} minutes
                  </p>
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={editedBlock.timebox_minutes}
                    onChange={(e) => updateField('timebox_minutes', Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="input-field w-24"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-1 border-b" style={{ borderColor: 'rgb(var(--border-default))' }}>
              {(['content', 'transitions', 'proof'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                    activeSection === section
                      ? 'text-[rgb(var(--text-primary))]'
                      : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'
                  }`}
                >
                  {section === 'content' && 'Talk Track'}
                  {section === 'transitions' && 'Transitions'}
                  {section === 'proof' && 'Proof & Objections'}
                  {activeSection === section && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                      style={{ background: colors.accent }}
                    />
                  )}
                </button>
              ))}
            </div>

            {activeSection === 'content' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    Talk Track (Markdown)
                  </label>
                  {previewMode ? (
                    <div
                      className="p-4 rounded-xl text-sm whitespace-pre-wrap"
                      style={{
                        background: 'rgb(var(--surface-base))',
                        color: 'rgb(var(--text-secondary))',
                        lineHeight: 1.7,
                      }}
                    >
                      {editedBlock.talk_track_md || 'No talk track provided'}
                    </div>
                  ) : (
                    <textarea
                      value={editedBlock.talk_track_md}
                      onChange={(e) => updateField('talk_track_md', e.target.value)}
                      className="input-field min-h-[200px] font-mono text-sm resize-none"
                      placeholder="Enter talk track in markdown..."
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                    Speaker Notes (Markdown)
                  </label>
                  {previewMode ? (
                    <div
                      className="p-4 rounded-xl text-sm whitespace-pre-wrap"
                      style={{
                        background: 'rgb(var(--surface-base))',
                        color: 'rgb(var(--text-secondary))',
                        lineHeight: 1.7,
                      }}
                    >
                      {editedBlock.speaker_notes_md || 'No speaker notes provided'}
                    </div>
                  ) : (
                    <textarea
                      value={editedBlock.speaker_notes_md}
                      onChange={(e) => updateField('speaker_notes_md', e.target.value)}
                      className="input-field min-h-[120px] font-mono text-sm resize-none"
                      placeholder="Enter speaker notes in markdown..."
                    />
                  )}
                </div>
              </div>
            )}

            {activeSection === 'transitions' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                    <ArrowRight className="w-3.5 h-3.5 inline mr-1" />
                    Transition In
                  </label>
                  {previewMode ? (
                    <div
                      className="p-3 rounded-xl text-sm"
                      style={{
                        background: 'rgb(var(--success) / 0.1)',
                        border: '1px solid rgb(var(--success) / 0.2)',
                        color: 'rgb(var(--text-secondary))',
                      }}
                    >
                      {editedBlock.transition_in || 'No transition in'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editedBlock.transition_in}
                      onChange={(e) => updateField('transition_in', e.target.value)}
                      className="input-field"
                      placeholder="How to enter this block..."
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                    <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                    Transition Out
                  </label>
                  {previewMode ? (
                    <div
                      className="p-3 rounded-xl text-sm"
                      style={{
                        background: 'rgb(var(--warning) / 0.1)',
                        border: '1px solid rgb(var(--warning) / 0.2)',
                        color: 'rgb(var(--text-secondary))',
                      }}
                    >
                      {editedBlock.transition_out || 'No transition out'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editedBlock.transition_out}
                      onChange={(e) => updateField('transition_out', e.target.value)}
                      className="input-field"
                      placeholder="How to exit this block..."
                    />
                  )}
                </div>
              </div>
            )}

            {activeSection === 'proof' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
                      <Shield className="w-3.5 h-3.5 inline mr-1" />
                      Proof Insertion Points
                    </label>
                    {!previewMode && (
                      <button
                        onClick={() => addArrayItem('proof_insertion_points')}
                        className="btn-ghost text-xs py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                  {editedBlock.proof_insertion_points.length > 0 ? (
                    <div className="space-y-2">
                      {editedBlock.proof_insertion_points.map((point, i) => (
                        <ArrayItemEditor
                          key={i}
                          value={point}
                          onChange={(v) => updateArrayItem('proof_insertion_points', i, v)}
                          onRemove={() => removeArrayItem('proof_insertion_points', i)}
                          previewMode={previewMode}
                          color="accent"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'rgb(var(--text-muted))' }}>
                      No proof points
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
                      <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                      Objections Handled
                    </label>
                    {!previewMode && (
                      <button
                        onClick={() => addArrayItem('objections_handled')}
                        className="btn-ghost text-xs py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                  {editedBlock.objections_handled.length > 0 ? (
                    <div className="space-y-2">
                      {editedBlock.objections_handled.map((obj, i) => (
                        <ArrayItemEditor
                          key={i}
                          value={obj}
                          onChange={(v) => updateArrayItem('objections_handled', i, v)}
                          onRemove={() => removeArrayItem('objections_handled', i)}
                          previewMode={previewMode}
                          color="warning"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'rgb(var(--text-muted))' }}>
                      No objections handled
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{
            background: 'rgb(var(--surface-base))',
            borderColor: 'rgb(var(--border-default))',
          }}
        >
          <div className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            {hasChanges ? 'Unsaved changes' : 'No changes'}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`btn-primary ${!hasChanges ? 'opacity-50' : ''}`}
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

function ArrayItemEditor({
  value,
  onChange,
  onRemove,
  previewMode,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  previewMode: boolean;
  color: 'accent' | 'warning';
}) {
  const colors = {
    accent: { bg: 'rgb(var(--accent-primary) / 0.1)', border: 'rgb(var(--accent-primary) / 0.2)' },
    warning: { bg: 'rgb(var(--warning) / 0.1)', border: 'rgb(var(--warning) / 0.2)' },
  };

  const colorStyle = colors[color];

  if (previewMode) {
    return (
      <div
        className="p-2 rounded-lg text-sm"
        style={{
          background: colorStyle.bg,
          border: `1px solid ${colorStyle.border}`,
          color: 'rgb(var(--text-secondary))',
        }}
      >
        {value}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field flex-1 text-sm"
      />
      <button onClick={onRemove} className="btn-ghost p-2 text-[rgb(var(--error))]">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
