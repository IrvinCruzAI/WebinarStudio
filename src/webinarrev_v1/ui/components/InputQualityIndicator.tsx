import { AlertTriangle, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import type { InputQualityResult } from '../../utils/inputQuality';

interface InputQualityIndicatorProps {
  quality: InputQualityResult;
  showDetails?: boolean;
}

export function InputQualityIndicator({ quality, showDetails = true }: InputQualityIndicatorProps) {
  const { score, level, risks, recommendations } = quality;

  const config = {
    low: {
      icon: AlertTriangle,
      color: 'rgb(var(--error))',
      bg: 'rgb(var(--error) / 0.1)',
      border: 'rgb(var(--error) / 0.2)',
      label: 'Low Quality',
    },
    medium: {
      icon: AlertCircle,
      color: 'rgb(var(--warning))',
      bg: 'rgb(var(--warning) / 0.1)',
      border: 'rgb(var(--warning) / 0.2)',
      label: 'Medium Quality',
    },
    high: {
      icon: CheckCircle2,
      color: 'rgb(var(--success))',
      bg: 'rgb(var(--success) / 0.1)',
      border: 'rgb(var(--success) / 0.2)',
      label: 'High Quality',
    },
  };

  const { icon: Icon, color, bg, border, label } = config[level];

  if (!showDetails) {
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ background: bg, border: `1px solid ${border}`, color }}
      >
        <Icon className="w-4 h-4" />
        <span>{score}/100</span>
        <span className="opacity-75">{label}</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: bg }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h4 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Input Quality Assessment
            </h4>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              Deterministic score based on input lengths
            </p>
          </div>
        </div>
        <div
          className="px-4 py-2 rounded-lg text-lg font-bold"
          style={{ background: bg, color }}
        >
          {score}/100
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard
          label="Build"
          value={quality.metrics.buildWordCount}
          unit="words"
          recommended={800}
        />
        <MetricCard
          label="Intake"
          value={quality.metrics.intakeWordCount}
          unit="words"
          recommended={300}
          optional
        />
        <MetricCard
          label="Notes"
          value={quality.metrics.notesWordCount}
          unit="words"
          recommended={50}
          optional
        />
      </div>

      {risks.length > 0 && (
        <div
          className="p-3 rounded-lg mb-3"
          style={{
            background: 'rgb(var(--error) / 0.1)',
            border: '1px solid rgb(var(--error) / 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--error))' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Risks Detected
            </span>
          </div>
          <ul className="space-y-1">
            {risks.map((risk, i) => (
              <li key={i} className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                • {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div
          className="p-3 rounded-lg"
          style={{
            background: 'rgb(var(--accent-primary) / 0.05)',
            border: '1px solid rgb(var(--border-subtle))',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Recommendations
            </span>
          </div>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  recommended: number;
  optional?: boolean;
}

function MetricCard({ label, value, unit, recommended, optional }: MetricCardProps) {
  const percentage = Math.min(100, (value / recommended) * 100);
  let statusColor = 'rgb(var(--success))';

  if (value === 0) {
    statusColor = optional ? 'rgb(var(--text-muted))' : 'rgb(var(--error))';
  } else if (value < recommended * 0.6) {
    statusColor = 'rgb(var(--error))';
  } else if (value < recommended) {
    statusColor = 'rgb(var(--warning))';
  }

  return (
    <div
      className="p-3 rounded-lg"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-subtle))',
      }}
    >
      <div className="text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
        {label}
        {optional && <span className="ml-1 opacity-60">(optional)</span>}
      </div>
      <div className="text-base font-bold mb-1" style={{ color: statusColor }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
        {unit} / {recommended} rec.
      </div>
      <div
        className="h-1 rounded-full mt-2 overflow-hidden"
        style={{ background: 'rgb(var(--border-subtle))' }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            background: statusColor,
          }}
        />
      </div>
    </div>
  );
}
