import { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Edit2,
  Save,
  X,
  RefreshCw,
  ChevronRight,
  Copy,
  Check,
  ChevronDown,
  Link,
  FileQuestion,
} from 'lucide-react';
import type { DeliverableId, ValidationResult } from '../../contracts';
import { DELIVERABLES } from '../../contracts';
import { formatDateTime } from '../utils/formatters';
import { formatErrorForDisplay } from '../utils/errorFormatting';

interface DeliverablePanelProps {
  deliverableId: DeliverableId;
  content: unknown;
  validated: boolean;
  generatedAt: number;
  editedAt?: number;
  validationResult?: ValidationResult;
  isStale?: boolean;
  onEdit: (field: string, value: unknown) => void;
  onRevalidate: () => Promise<void>;
  onRegenerate: (cascade: boolean) => Promise<void>;
  isRunning?: boolean;
}

function JsonViewer({
  data,
  path,
  onEdit,
  editable,
}: {
  data: unknown;
  path: string;
  onEdit: (path: string, value: unknown) => void;
  editable: boolean;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const startEdit = (currentPath: string, currentValue: unknown) => {
    setEditingPath(currentPath);
    setEditValue(typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2));
  };

  const saveEdit = () => {
    if (editingPath) {
      try {
        const parsed = editValue.startsWith('{') || editValue.startsWith('[')
          ? JSON.parse(editValue)
          : editValue;
        onEdit(editingPath, parsed);
      } catch {
        onEdit(editingPath, editValue);
      }
      setEditingPath(null);
    }
  };

  const renderValue = (value: unknown, currentPath: string, depth: number = 0): React.ReactNode => {
    if (value === null) return <span style={{ color: 'rgb(var(--text-muted))' }}>null</span>;
    if (value === undefined) return <span style={{ color: 'rgb(var(--text-muted))' }}>undefined</span>;

    if (typeof value === 'boolean') {
      return (
        <span style={{ color: value ? 'rgb(var(--success))' : 'rgb(var(--error))' }}>
          {value.toString()}
        </span>
      );
    }

    if (typeof value === 'number') {
      return <span style={{ color: 'rgb(var(--accent-primary))' }}>{value}</span>;
    }

    if (typeof value === 'string') {
      if (editingPath === currentPath) {
        return (
          <div className="flex items-center gap-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-2 py-1 text-sm rounded focus:outline-none resize-none"
              style={{
                background: 'rgb(var(--surface-base))',
                border: '1px solid rgb(var(--accent-primary))',
                color: 'rgb(var(--text-primary))',
              }}
              rows={Math.min(5, editValue.split('\n').length)}
              autoFocus
            />
            <button
              onClick={saveEdit}
              className="p-1 transition-colors"
              style={{ color: 'rgb(var(--accent-primary))' }}
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingPath(null)}
              className="p-1 transition-colors"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      }

      const displayValue = value.length > 100 ? value.slice(0, 100) + '...' : value;
      return (
        <div className="group flex items-start gap-2">
          <span style={{ color: 'rgb(var(--warning))' }}>"{displayValue}"</span>
          {editable && (
            <button
              onClick={() => startEdit(currentPath, value)}
              className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(currentPath);
      return (
        <div>
          <button
            onClick={() => toggleExpand(currentPath)}
            className="flex items-center gap-1 transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <ChevronRight
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
            <span>Array[{value.length}]</span>
          </button>
          {isExpanded && (
            <div
              className="ml-4 mt-1 space-y-1 pl-3"
              style={{ borderLeft: '1px solid rgb(var(--border-default))' }}
            >
              {value.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{index}:</span>
                  {renderValue(item, `${currentPath}[${index}]`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expandedKeys.has(currentPath) || depth === 0;
      const keys = Object.keys(value);
      return (
        <div>
          {depth > 0 && (
            <button
              onClick={() => toggleExpand(currentPath)}
              className="flex items-center gap-1 transition-colors"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
              <span>Object{`{${keys.length}}`}</span>
            </button>
          )}
          {isExpanded && (
            <div
              className={depth > 0 ? 'ml-4 mt-1 space-y-1 pl-3' : 'space-y-1'}
              style={depth > 0 ? { borderLeft: '1px solid rgb(var(--border-default))' } : undefined}
            >
              {keys.map((key) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-sm" style={{ color: 'rgb(var(--accent-primary))' }}>{key}:</span>
                  {renderValue(
                    (value as Record<string, unknown>)[key],
                    currentPath ? `${currentPath}.${key}` : key,
                    depth + 1
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span style={{ color: 'rgb(var(--text-muted))' }}>{String(value)}</span>;
  };

  return (
    <div className="font-mono text-xs">{renderValue(data, path, 0)}</div>
  );
}

export default function DeliverablePanel({
  deliverableId,
  content,
  validated,
  generatedAt,
  editedAt,
  validationResult,
  isStale,
  onEdit,
  onRevalidate,
  onRegenerate,
  isRunning,
}: DeliverablePanelProps) {
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRegenerateMenu, setShowRegenerateMenu] = useState(false);

  const meta = DELIVERABLES[deliverableId];
  const hasErrors = validationResult && !validationResult.ok;

  async function handleRevalidate() {
    setIsRevalidating(true);
    try {
      await onRevalidate();
    } finally {
      setIsRevalidating(false);
    }
  }

  async function handleRegenerate(cascade: boolean) {
    setIsRegenerating(true);
    setShowRegenerateMenu(false);
    try {
      await onRegenerate(cascade);
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <div
        className="p-4"
        style={{ borderBottom: '1px solid rgb(var(--border-default))' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{
                background: hasErrors
                  ? 'rgb(var(--error) / 0.1)'
                  : validated
                  ? 'rgb(var(--success) / 0.1)'
                  : 'rgb(var(--warning) / 0.1)',
                border: hasErrors
                  ? '1px solid rgb(var(--error) / 0.3)'
                  : validated
                  ? '1px solid rgb(var(--success) / 0.3)'
                  : '1px solid rgb(var(--warning) / 0.3)',
              }}
            >
              <FileText
                className="w-5 h-5"
                style={{
                  color: hasErrors
                    ? 'rgb(var(--error))'
                    : validated
                    ? 'rgb(var(--success))'
                    : 'rgb(var(--warning))',
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                  {meta.title}
                </h3>
                {isStale && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: 'rgb(var(--warning) / 0.1)',
                      color: 'rgb(var(--warning))',
                      border: '1px solid rgb(var(--warning) / 0.3)',
                    }}
                  >
                    <AlertCircle className="w-3 h-3" />
                    Stale
                  </span>
                )}
                <span
                  className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{
                    background: 'rgb(var(--surface-base))',
                    color: 'rgb(var(--text-muted))',
                  }}
                >
                  {meta.internal_badge}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>{meta.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'rgb(var(--text-muted))' }}
              title="Copy JSON"
            >
              {copied ? (
                <Check className="w-4 h-4" style={{ color: 'rgb(var(--success))' }} />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleRevalidate}
              disabled={isRevalidating || isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRevalidating ? 'animate-spin' : ''}`}
              />
              Revalidate
            </button>
            <div className="relative">
              <button
                onClick={() => setShowRegenerateMenu(!showRegenerateMenu)}
                disabled={isRegenerating || isRunning || deliverableId === 'PREFLIGHT' || deliverableId === 'WR9'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                style={{
                  background: 'rgb(var(--accent-primary) / 0.1)',
                  color: 'rgb(var(--accent-primary))',
                  border: '1px solid rgb(var(--accent-primary) / 0.3)',
                }}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`}
                />
                Regenerate
                <ChevronDown className="w-3 h-3" />
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
                    className="w-full px-3 py-2 text-left text-sm transition-colors"
                    style={{
                      color: 'rgb(var(--text-primary))',
                      borderBottom: '1px solid rgb(var(--border-default))',
                    }}
                  >
                    <div className="font-medium">Regenerate This Only</div>
                    <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                      Only regenerate {deliverableId}, keep others unchanged
                    </div>
                  </button>
                  <button
                    onClick={() => handleRegenerate(true)}
                    className="w-full px-3 py-2 text-left text-sm transition-colors"
                    style={{ color: 'rgb(var(--text-primary))' }}
                  >
                    <div className="font-medium">Regenerate This + Downstream</div>
                    <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                      Regenerate {deliverableId} and all dependents
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Generated: {formatDateTime(generatedAt)}</span>
          </div>
          {editedAt && (
            <div className="flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edited: {formatDateTime(editedAt)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {validated ? (
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'rgb(var(--success))' }} />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'rgb(var(--warning))' }} />
            )}
            <span style={{ color: validated ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}>
              {validated ? 'Valid' : 'Invalid'}
            </span>
          </div>
        </div>
      </div>

      {hasErrors && validationResult && (
        <div
          className="p-4 space-y-3"
          style={{
            background: 'rgb(var(--error) / 0.05)',
            borderBottom: '1px solid rgb(var(--error) / 0.2)',
          }}
        >
          <h4 className="text-sm font-medium" style={{ color: 'rgb(var(--error))' }}>
            Validation Errors ({validationResult.errors.length})
          </h4>
          <div className="space-y-2">
            {validationResult.errors.map((error, index) => {
              const formatted = formatErrorForDisplay(error);
              const ErrorIcon = formatted.icon === 'crosslink' ? Link :
                               formatted.icon === 'placeholder' ? FileQuestion :
                               AlertTriangle;

              return (
                <div
                  key={index}
                  className="p-2 rounded"
                  style={{
                    background: 'rgb(var(--surface-base))',
                    border: '1px solid rgb(var(--error) / 0.2)',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <ErrorIcon
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: 'rgb(var(--error))' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: 'rgb(var(--error))' }}>
                        {formatted.title}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
                        {formatted.description}
                      </div>
                      {formatted.hint && (
                        <div
                          className="text-xs mt-1 px-2 py-1 rounded"
                          style={{
                            background: 'rgb(var(--accent-primary) / 0.1)',
                            color: 'rgb(var(--accent-primary))',
                          }}
                        >
                          Hint: {formatted.hint}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 max-h-96 overflow-y-auto scrollbar-thin">
        <JsonViewer
          data={content}
          path=""
          onEdit={onEdit}
          editable={deliverableId !== 'WR9' && deliverableId !== 'PREFLIGHT'}
        />
      </div>
    </div>
  );
}
