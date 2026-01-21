import { AlertCircle, ArrowRight } from 'lucide-react';
import { translateIssue } from '../../utils/translateIssue';
import type { DeliverableId } from '../../contracts';

interface InlineMissingInfoCalloutProps {
  placeholderText: string;
  fieldPath?: string;
  deliverableId: DeliverableId;
  onFix?: (route: { tab: string; deliverableId?: DeliverableId }) => void;
}

export function InlineMissingInfoCallout({
  placeholderText,
  fieldPath,
  deliverableId,
  onFix,
}: InlineMissingInfoCalloutProps) {
  const issue = translateIssue(`Placeholder: ${placeholderText}`, deliverableId, fieldPath);

  const handleFix = () => {
    if (onFix && issue.route) {
      onFix(issue.route);
    }
  };

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm my-1"
      style={{
        background: 'rgb(var(--warning) / 0.1)',
        border: '1px solid rgb(var(--warning) / 0.3)',
      }}
    >
      <AlertCircle
        className="w-4 h-4 flex-shrink-0"
        style={{ color: 'rgb(var(--warning))' }}
      />
      <span style={{ color: 'rgb(var(--text-primary))' }}>
        {issue.title}
      </span>
      {onFix && issue.route && (
        <button
          onClick={handleFix}
          className="ml-2 px-2 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1"
          style={{
            background: 'rgb(var(--warning))',
            color: 'white',
          }}
        >
          Fix
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
