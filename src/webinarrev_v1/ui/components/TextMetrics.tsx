import { FileText } from 'lucide-react';
import { countWords, countCharacters } from '../../utils/inputQuality';

interface TextMetricsProps {
  text: string;
  minWords?: number;
  recommendedWords?: number;
  showCharCount?: boolean;
  compact?: boolean;
}

export function TextMetrics({
  text,
  minWords,
  recommendedWords,
  showCharCount = true,
  compact = false,
}: TextMetricsProps) {
  const wordCount = countWords(text);
  const charCount = countCharacters(text);

  let status: 'empty' | 'low' | 'medium' | 'good' = 'good';
  let statusColor = 'rgb(var(--success))';

  if (wordCount === 0) {
    status = 'empty';
    statusColor = 'rgb(var(--text-muted))';
  } else if (minWords && wordCount < minWords) {
    status = 'low';
    statusColor = 'rgb(var(--error))';
  } else if (recommendedWords && wordCount < recommendedWords) {
    status = 'medium';
    statusColor = 'rgb(var(--warning))';
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span style={{ color: statusColor, fontWeight: 500 }}>
          {wordCount} words
        </span>
        {showCharCount && (
          <span style={{ color: 'rgb(var(--text-muted))' }}>
            {charCount.toLocaleString()} chars
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-subtle))',
      }}
    >
      <FileText className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-muted))' }} />
      <div className="flex items-center gap-3">
        <div>
          <span style={{ color: statusColor, fontWeight: 600 }}>
            {wordCount}
          </span>
          <span style={{ color: 'rgb(var(--text-muted))', marginLeft: '0.25rem' }}>
            words
          </span>
          {recommendedWords && wordCount < recommendedWords && (
            <span style={{ color: 'rgb(var(--text-muted))', marginLeft: '0.25rem' }}>
              / {recommendedWords} recommended
            </span>
          )}
        </div>
        {showCharCount && (
          <>
            <span style={{ color: 'rgb(var(--border-default))' }}>•</span>
            <div>
              <span style={{ color: 'rgb(var(--text-secondary))' }}>
                {charCount.toLocaleString()}
              </span>
              <span style={{ color: 'rgb(var(--text-muted))', marginLeft: '0.25rem' }}>
                characters
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
