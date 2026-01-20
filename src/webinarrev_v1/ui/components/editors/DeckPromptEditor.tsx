import { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  Presentation,
  Palette,
  List,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import type { WR8 } from '../../../contracts';

interface DeckPromptEditorProps {
  content: WR8;
  onEdit: (field: string, value: unknown) => Promise<void>;
  initialEditMode?: boolean;
}

export function DeckPromptEditor({ content, onEdit, initialEditMode = false }: DeckPromptEditorProps) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const [expandedSlides, setExpandedSlides] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditMode(initialEditMode);
  }, [initialEditMode]);

  if (!content?.gamma_prompt) {
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
            Invalid Deck Prompt Content
          </p>
        </div>
      </div>
    );
  }

  const toggleSlide = (index: number) => {
    setExpandedSlides(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(content.gamma_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = async (field: string, value: unknown) => {
    await onEdit(field, value);
  };

  const handleSlideEdit = async (index: number, field: string, value: unknown) => {
    const slides = [...content.key_slides];
    slides[index] = { ...slides[index], [field]: value };
    await onEdit('key_slides', slides);
  };

  const handleSlidePointEdit = async (slideIndex: number, pointIndex: number, value: string) => {
    const slides = [...content.key_slides];
    const points = [...slides[slideIndex].content_points];
    points[pointIndex] = value;
    slides[slideIndex] = { ...slides[slideIndex], content_points: points };
    await onEdit('key_slides', slides);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5" style={{ color: 'rgb(var(--accent-primary))' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
            Deck Prompt for Gamma.app
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

      <div
        className="p-6 rounded-xl"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: 'rgb(var(--accent-primary))' }} />
            <h4 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Gamma Prompt
            </h4>
          </div>
          <button
            onClick={handleCopyPrompt}
            className="btn-ghost text-xs"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Prompt
              </>
            )}
          </button>
        </div>

        {editMode ? (
          <textarea
            value={content.gamma_prompt}
            onChange={(e) => handleEdit('gamma_prompt', e.target.value)}
            rows={8}
            className="input w-full resize-none font-mono text-sm"
          />
        ) : (
          <div
            className="p-4 rounded-lg text-sm whitespace-pre-wrap font-mono"
            style={{
              background: 'rgb(var(--surface-base))',
              color: 'rgb(var(--text-secondary))',
            }}
          >
            {content.gamma_prompt}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgb(var(--surface-elevated))',
            border: '1px solid rgb(var(--border-default))',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <List className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
            <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
              Recommended Slides
            </span>
          </div>
          {editMode ? (
            <input
              type="number"
              value={content.slide_count_recommendation}
              onChange={(e) => handleEdit('slide_count_recommendation', parseInt(e.target.value))}
              min={5}
              max={50}
              className="input w-full"
            />
          ) : (
            <p className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
              {content.slide_count_recommendation} slides
            </p>
          )}
        </div>

        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgb(var(--surface-elevated))',
            border: '1px solid rgb(var(--border-default))',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
            <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
              Visual Direction
            </span>
          </div>
          {editMode ? (
            <input
              type="text"
              value={content.visual_direction}
              onChange={(e) => handleEdit('visual_direction', e.target.value)}
              className="input w-full"
            />
          ) : (
            <p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
              {content.visual_direction}
            </p>
          )}
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--border-default))' }}>
          <div className="flex items-center gap-2">
            <Presentation className="w-5 h-5" style={{ color: 'rgb(var(--accent-primary))' }} />
            <h4 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Key Slides Breakdown
            </h4>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background: 'rgb(var(--surface-base))',
                color: 'rgb(var(--text-muted))',
              }}
            >
              {content.key_slides?.length || 0} slides
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {content.key_slides?.map((slide, index) => {
            const isExpanded = expandedSlides.has(index);

            return (
              <div
                key={index}
                className="rounded-lg overflow-hidden"
                style={{
                  background: 'rgb(var(--surface-base))',
                  border: '1px solid rgb(var(--border-default))',
                }}
              >
                <button
                  onClick={() => toggleSlide(index)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-[rgb(var(--surface-glass))] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{
                        background: 'rgb(var(--accent-primary) / 0.15)',
                        color: 'rgb(var(--accent-primary))',
                      }}
                    >
                      {slide.slide_number}
                    </div>
                    <div className="text-left">
                      <p className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                        {slide.title}
                      </p>
                      <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                        {slide.content_points.length} content {slide.content_points.length === 1 ? 'point' : 'points'}
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
                    className="px-4 pb-4 border-t"
                    style={{ borderColor: 'rgb(var(--border-default))' }}
                  >
                    <div className="space-y-3 mt-3">
                      {editMode ? (
                        <>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                              Title
                            </label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => handleSlideEdit(index, 'title', e.target.value)}
                              className="input w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                              Purpose
                            </label>
                            <textarea
                              value={slide.purpose}
                              onChange={(e) => handleSlideEdit(index, 'purpose', e.target.value)}
                              rows={2}
                              className="input w-full resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                              Content Points
                            </label>
                            <div className="space-y-2">
                              {slide.content_points.map((point, pointIndex) => (
                                <input
                                  key={pointIndex}
                                  type="text"
                                  value={point}
                                  onChange={(e) => handleSlidePointEdit(index, pointIndex, e.target.value)}
                                  className="input w-full text-sm"
                                  placeholder={`Point ${pointIndex + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
                              Purpose
                            </p>
                            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                              {slide.purpose}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                              Content Points
                            </p>
                            <ul className="space-y-1">
                              {slide.content_points.map((point, pointIndex) => (
                                <li
                                  key={pointIndex}
                                  className="flex items-start gap-2 text-sm"
                                  style={{ color: 'rgb(var(--text-secondary))' }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                    style={{ background: 'rgb(var(--accent-primary))' }}
                                  />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
