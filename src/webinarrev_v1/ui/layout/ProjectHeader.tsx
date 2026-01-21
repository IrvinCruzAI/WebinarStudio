import { ArrowLeft, Play, Building2, User, Clock } from 'lucide-react';
import { useState } from 'react';
import type { ProjectMetadata } from '../../contracts';
import type { PipelineProgress } from '../../pipeline/orchestrator';
import PipelineProgressPanel from '../components/PipelineProgressPanel';
import { checkRequiredSettings, type SettingsWarning } from '../../utils/settingsChecker';
import { SettingsWarningModal } from '../modals/SettingsWarningModal';

interface ProjectHeaderProps {
  project: ProjectMetadata;
  isPipelineRunning: boolean;
  pipelineProgress: PipelineProgress[];
  onBack: () => void;
  onRunPipeline: () => void;
  onCancelPipeline: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'dossier', label: 'Client Profile' },
  { id: 'framework', label: 'Framework' },
  { id: 'assets', label: 'Assets' },
  { id: 'qa-export', label: 'QA & Export' },
  { id: 'project-setup', label: 'Project Setup' },
];

export function ProjectHeader({
  project,
  isPipelineRunning,
  pipelineProgress,
  onBack,
  onRunPipeline,
  onCancelPipeline,
  activeTab,
  onTabChange,
}: ProjectHeaderProps) {
  const [showSettingsWarning, setShowSettingsWarning] = useState(false);
  const [settingsWarnings, setSettingsWarnings] = useState<SettingsWarning[]>([]);
  const hasErrors = pipelineProgress.some(p => p.status === 'error');

  const handleRunPipeline = () => {
    const warnings = checkRequiredSettings(project.settings?.operator || {});
    if (warnings.length > 0) {
      setSettingsWarnings(warnings);
      setShowSettingsWarning(true);
    } else {
      onRunPipeline();
    }
  };

  const handleGenerateAnyway = () => {
    setShowSettingsWarning(false);
    onRunPipeline();
  };

  const handleConfigureSettings = () => {
    setShowSettingsWarning(false);
    onTabChange('project-setup');
  };

  const infoItems: Array<{ icon?: typeof Building2; label: string }> = [];

  if (project.settings?.client_name) {
    infoItems.push({ icon: User, label: project.settings.client_name });
  }
  if (project.settings?.company_name) {
    infoItems.push({ icon: Building2, label: project.settings.company_name });
  }
  if (project.settings?.webinar_length_minutes) {
    infoItems.push({ icon: Clock, label: `${project.settings.webinar_length_minutes} min` });
  }

  return (
    <header
      className="border-b flex-shrink-0"
      style={{
        background: 'rgb(var(--surface-elevated))',
        borderColor: 'rgb(var(--border-default))',
      }}
    >
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-lg font-semibold"
                style={{ color: 'rgb(var(--text-primary))' }}
              >
                {project.title}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            {infoItems.length > 0 && (
              <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                {infoItems.map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="mx-1">|</span>}
                    {item.icon && <item.icon className="w-3 h-3" />}
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isPipelineRunning && pipelineProgress.length === 0 && (
            <button
              onClick={handleRunPipeline}
              className="btn-primary text-sm"
              disabled={project.status === 'generating'}
            >
              <Play className="w-4 h-4" />
              Run Pipeline
            </button>
          )}
        </div>
      </div>

      {(isPipelineRunning || pipelineProgress.length > 0) && (
        <div className="px-6 pb-4">
          <PipelineProgressPanel
            progress={pipelineProgress}
            isRunning={isPipelineRunning}
            onCancel={onCancelPipeline}
            hasErrors={hasErrors}
          />
        </div>
      )}

      <div className="px-6">
        <nav className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative
                ${activeTab === tab.id
                  ? 'text-[rgb(var(--text-primary))]'
                  : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'
                }
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: 'rgb(var(--accent-primary))' }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      <SettingsWarningModal
        isOpen={showSettingsWarning}
        warnings={settingsWarnings}
        onClose={() => setShowSettingsWarning(false)}
        onGenerateAnyway={handleGenerateAnyway}
        onConfigureSettings={handleConfigureSettings}
      />
    </header>
  );
}

function StatusBadge({ status }: { status: ProjectMetadata['status'] }) {
  const config: Record<string, { class: string; label: string }> = {
    preflight_blocked: { class: 'badge-error', label: 'Blocked' },
    generating: { class: 'badge-accent', label: 'Generating' },
    review: { class: 'badge-warning', label: 'Review' },
    ready: { class: 'badge-success', label: 'Ready' },
    failed: { class: 'badge-error', label: 'Failed' },
  };

  const { class: className, label } = config[status] || config.review;

  return <span className={`badge ${className}`}>{label}</span>;
}
