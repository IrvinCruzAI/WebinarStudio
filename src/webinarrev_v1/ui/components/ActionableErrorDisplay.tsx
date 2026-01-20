import { useState, useMemo } from 'react';
import {
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Wrench,
  RefreshCw,
  Navigation,
  Zap,
} from 'lucide-react';
import type { DeliverableId } from '../../contracts';
import { DELIVERABLES } from '../../contracts/deliverables';

export interface PipelineError {
  message: string;
  deliverableId?: DeliverableId;
  details?: string[];
  errorType?: 'api' | 'schema' | 'crosslink' | 'preflight' | 'unknown';
}

interface ParsedError {
  fieldPath: string;
  message: string;
  friendlyTitle: string;
  suggestion: string;
  isAutoFixable: boolean;
  originalError: string;
}

function parseErrorString(error: string, deliverableId?: DeliverableId): ParsedError {
  const fieldPathMatch = error.match(/^([a-zA-Z_][a-zA-Z0-9_[\].]*?):\s*(.+)$/);
  const fieldPath = fieldPathMatch ? fieldPathMatch[1] : '';
  const errorMessage = fieldPathMatch ? fieldPathMatch[2] : error;

  let friendlyTitle = 'Validation Error';
  let suggestion = 'Review and correct this field.';
  let isAutoFixable = false;

  if (error.includes('block_id') || error.includes('Invalid enum value')) {
    if (deliverableId === 'WR2' || deliverableId === 'WR6') {
      friendlyTitle = 'Invalid Block ID Format';
      suggestion = 'Block IDs must be B01-B21 with leading zeros.';
      isAutoFixable = true;
    }
  }

  if (error.includes('email_id')) {
    friendlyTitle = 'Invalid Email ID Format';
    suggestion = 'Email IDs must be E01-E10 with leading zeros.';
    isAutoFixable = true;
  }

  if (error.includes('social_id')) {
    friendlyTitle = 'Invalid Social Post ID Format';
    suggestion = 'Social IDs must be S01-S18 with leading zeros.';
    isAutoFixable = true;
  }

  if (error.includes('checklist_id')) {
    friendlyTitle = 'Invalid Checklist ID Format';
    suggestion = 'Checklist IDs must use format CL_pre_001, CL_live_001, or CL_post_001.';
    isAutoFixable = true;
  }

  if (error.includes('Required') || error.includes('required')) {
    friendlyTitle = 'Missing Required Field';
    suggestion = `The field "${fieldPath}" is required but was not provided.`;
  }

  if (error.includes('Expected number') || error.includes('expected number')) {
    friendlyTitle = 'Invalid Number';
    suggestion = 'This field requires a numeric value.';
    isAutoFixable = true;
  }

  if (error.includes('Unrecognized key') || error.includes('unrecognized_keys')) {
    friendlyTitle = 'Unknown Field';
    suggestion = 'An unexpected field was found. This will be automatically removed.';
    isAutoFixable = true;
  }

  if (error.includes('timebox_minutes')) {
    friendlyTitle = 'Invalid Duration';
    suggestion = 'Duration must be a number between 1 and 60 minutes.';
  }

  if (error.includes('Array must contain')) {
    friendlyTitle = 'Invalid Array Length';
    const countMatch = error.match(/at least (\d+)/);
    if (countMatch) {
      suggestion = `This array requires at least ${countMatch[1]} items.`;
    }
  }

  if (error.includes('crosslink') || error.includes('reference')) {
    friendlyTitle = 'Invalid Reference';
    suggestion = 'This field references something that does not exist.';
  }

  return {
    fieldPath,
    message: errorMessage,
    friendlyTitle,
    suggestion,
    isAutoFixable,
    originalError: error,
  };
}

interface ActionableErrorDisplayProps {
  error: string | null;
  pipelineError: PipelineError | null;
  onDismiss: () => void;
  onNavigateToFix?: (deliverableId: DeliverableId, fieldPath?: string) => void;
  onAutoFix?: (deliverableId: DeliverableId) => Promise<void>;
  onRegenerate?: (deliverableId: DeliverableId) => Promise<void>;
}

export function ActionableErrorDisplay({
  error,
  pipelineError,
  onDismiss,
  onNavigateToFix,
  onAutoFix,
  onRegenerate,
}: ActionableErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const parsedErrors = useMemo(() => {
    if (!pipelineError?.details) return [];
    return pipelineError.details.map(detail =>
      parseErrorString(detail, pipelineError.deliverableId)
    );
  }, [pipelineError?.details, pipelineError?.deliverableId]);

  const hasAutoFixableErrors = parsedErrors.some(e => e.isAutoFixable);

  if (!error && !pipelineError) return null;

  const hasDetails = parsedErrors.length > 0;
  const deliverableName = pipelineError?.deliverableId
    ? DELIVERABLES[pipelineError.deliverableId]?.title || pipelineError.deliverableId
    : null;

  const errorTypeLabels: Record<string, string> = {
    api: 'API Error',
    schema: 'Validation Error',
    crosslink: 'Reference Error',
    preflight: 'Preflight Blocked',
    unknown: 'Unknown Error',
  };

  const errorTypeLabel = pipelineError?.errorType
    ? errorTypeLabels[pipelineError.errorType] || 'Error'
    : 'Error';

  const handleAutoFix = async () => {
    if (!pipelineError?.deliverableId || !onAutoFix) return;
    setIsAutoFixing(true);
    try {
      await onAutoFix(pipelineError.deliverableId);
    } finally {
      setIsAutoFixing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!pipelineError?.deliverableId || !onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate(pipelineError.deliverableId);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      className="mx-6 mt-4 rounded-xl overflow-hidden"
      style={{
        background: 'rgb(var(--error) / 0.1)',
        border: '1px solid rgb(var(--error) / 0.2)',
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--error))' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{
              background: 'rgb(var(--error) / 0.2)',
              color: 'rgb(var(--error))',
            }}>
              {errorTypeLabel}
            </span>
            {deliverableName && (
              <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                in {deliverableName}
              </span>
            )}
            {hasAutoFixableErrors && (
              <span className="text-xs px-2 py-0.5 rounded flex items-center gap-1" style={{
                background: 'rgb(var(--success) / 0.1)',
                color: 'rgb(var(--success))',
              }}>
                <Zap className="w-3 h-3" />
                Auto-fixable
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
            {error || pipelineError?.message}
          </p>
          {hasDetails && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? 'Hide' : 'Show'} {parsedErrors.length} error details
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasAutoFixableErrors && onAutoFix && pipelineError?.deliverableId && (
            <button
              onClick={handleAutoFix}
              disabled={isAutoFixing}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: 'rgb(var(--success) / 0.1)',
                color: 'rgb(var(--success))',
                opacity: isAutoFixing ? 0.5 : 1,
              }}
            >
              <Wrench className="w-3 h-3" />
              {isAutoFixing ? 'Fixing...' : 'Auto-Fix'}
            </button>
          )}
          {pipelineError?.deliverableId && onNavigateToFix && (
            <button
              onClick={() => onNavigateToFix(pipelineError.deliverableId!)}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: 'rgb(var(--accent-primary) / 0.1)',
                color: 'rgb(var(--accent-primary))',
              }}
            >
              <Navigation className="w-3 h-3" />
              Jump to Fix
            </button>
          )}
          {pipelineError?.deliverableId && onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: 'rgb(var(--warning) / 0.1)',
                color: 'rgb(var(--warning))',
                opacity: isRegenerating ? 0.5 : 1,
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg transition-colors hover:bg-[rgb(var(--error)/0.1)]"
          >
            <X className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
          </button>
        </div>
      </div>

      {showDetails && hasDetails && (
        <div className="px-4 pb-4 pt-0">
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'rgb(var(--surface-base))' }}
          >
            {parsedErrors.map((parsedError, i) => (
              <div
                key={i}
                className="p-3 border-b last:border-b-0"
                style={{ borderColor: 'rgb(var(--border-subtle))' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'rgb(var(--error))' }}>
                        {parsedError.friendlyTitle}
                      </span>
                      {parsedError.fieldPath && (
                        <span
                          className="text-xs font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgb(var(--surface-elevated))',
                            color: 'rgb(var(--text-muted))',
                          }}
                        >
                          {parsedError.fieldPath}
                        </span>
                      )}
                      {parsedError.isAutoFixable && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                          style={{
                            background: 'rgb(var(--success) / 0.1)',
                            color: 'rgb(var(--success))',
                          }}
                        >
                          <Zap className="w-2.5 h-2.5" />
                          Fixable
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                      {parsedError.suggestion}
                    </p>
                    <p
                      className="text-xs mt-1 font-mono"
                      style={{ color: 'rgb(var(--text-secondary))' }}
                    >
                      {parsedError.originalError}
                    </p>
                  </div>
                  {parsedError.fieldPath && onNavigateToFix && pipelineError?.deliverableId && (
                    <button
                      onClick={() => onNavigateToFix(pipelineError.deliverableId!, parsedError.fieldPath)}
                      className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                      style={{
                        background: 'rgb(var(--accent-primary) / 0.1)',
                        color: 'rgb(var(--accent-primary))',
                      }}
                      title="Jump to field"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
