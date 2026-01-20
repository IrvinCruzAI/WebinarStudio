import { AlertTriangle, X, Settings as SettingsIcon } from 'lucide-react';
import type { MissingSettingsWarning } from '../../utils/settingsChecker';

interface SettingsWarningModalProps {
  isOpen: boolean;
  warnings: MissingSettingsWarning[];
  onClose: () => void;
  onProceedAnyway: () => void;
  onGoToSettings: () => void;
}

export function SettingsWarningModal({
  isOpen,
  warnings,
  onClose,
  onProceedAnyway,
  onGoToSettings,
}: SettingsWarningModalProps) {
  if (!isOpen || warnings.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-xl p-6"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div
            className="p-3 rounded-xl"
            style={{
              background: 'rgb(var(--warning) / 0.1)',
              border: '1px solid rgb(var(--warning) / 0.2)',
            }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: 'rgb(var(--warning))' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
              Settings Recommended
            </h3>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
              {warnings.length} setting{warnings.length !== 1 ? 's' : ''} not configured. Generated
              content will include placeholders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 rounded-lg hover:bg-[rgb(var(--surface-base))] transition-colors"
          >
            <X className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {warnings.map((warning, i) => (
            <div
              key={i}
              className="p-3 rounded-lg"
              style={{
                background: 'rgb(var(--surface-base))',
                border: '1px solid rgb(var(--border-subtle))',
              }}
            >
              <div className="font-medium text-sm mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
                {warning.label}
              </div>
              <div className="text-xs mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                {warning.why}
              </div>
              <div className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                Used in: {warning.usedIn.join(', ')}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onProceedAnyway}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid rgb(var(--border-default))',
              color: 'rgb(var(--text-primary))',
            }}
          >
            Generate Anyway
          </button>
          <button
            onClick={onGoToSettings}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            style={{
              background: 'rgb(var(--accent-primary))',
              color: 'white',
            }}
          >
            <SettingsIcon className="w-4 h-4" />
            Configure Settings
          </button>
        </div>
      </div>
    </div>
  );
}
