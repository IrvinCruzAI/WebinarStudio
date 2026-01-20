import { ArrowLeft, Play, Loader2, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ProjectMetadata, DeliverableId } from '../../contracts';
import { DELIVERABLES } from '../../contracts/deliverables';
import type { PipelineProgress } from '../../pipeline/orchestrator';

interface ProjectHeaderProps {
  project: ProjectMetadata;
  isPipelineRunning: boolean;
  pipelineProgress: PipelineProgress | null;
  onBack: () => void;
  onRunPipeline: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'dossier', label: 'Client Profile' },
  { id: 'framework', label: 'Framework' },
  { id: 'assets', label: 'Assets' },
  { id: 'qa-export', label: 'QA & Export' },
];

export function ProjectHeader({
  project,
  isPipelineRunning,
  pipelineProgress,
  onBack,
  onRunPipeline,
  activeTab,
  onTabChange,
}: ProjectHeaderProps) {
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
            <h1
              className="text-lg font-semibold"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              {project.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={project.status} />
              {isPipelineRunning && pipelineProgress && (
                <span
                  className="text-xs"
                  style={{ color: 'rgb(var(--text-muted))' }}
                >
                  {getStageLabel(pipelineProgress.deliverableId, pipelineProgress.status)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPipelineRunning && pipelineProgress ? (
            <PipelineProgressDisplay progress={pipelineProgress} />
          ) : (
            <button
              onClick={onRunPipeline}
              className="btn-primary text-sm"
              disabled={project.status === 'generating'}
            >
              <Play className="w-4 h-4" />
              Run Pipeline
            </button>
          )}
        </div>
      </div>

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
    </header>
  );
}

function StatusBadge({ status }: { status: ProjectMetadata['status'] }) {
  const config: Record<string, { class: string; label: string }> = {
    draft: { class: 'badge-neutral', label: 'Draft' },
    generating: { class: 'badge-accent', label: 'Generating' },
    review: { class: 'badge-warning', label: 'Review' },
    ready: { class: 'badge-success', label: 'Ready' },
    blocked: { class: 'badge-error', label: 'Blocked' },
    exportable: { class: 'badge-success', label: 'Exportable' },
    failed: { class: 'badge-error', label: 'Failed' },
  };

  const { class: className, label } = config[status] || config.draft;

  return <span className={`badge ${className}`}>{label}</span>;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className="w-32 h-2 rounded-full overflow-hidden"
      style={{ background: 'rgb(var(--surface-base))' }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          background: 'linear-gradient(90deg, rgb(var(--accent-primary)), rgb(var(--accent-secondary)))',
        }}
      />
    </div>
  );
}

function getStageLabel(deliverableId: DeliverableId, status: string): string {
  const meta = DELIVERABLES[deliverableId];
  const statusLabels: Record<string, string> = {
    generating: 'Generating',
    validating: 'Validating',
    repairing: 'Repairing',
    complete: 'Complete',
    error: 'Error',
  };
  const statusLabel = statusLabels[status] || '';
  return statusLabel ? `${statusLabel} ${meta?.short_title || deliverableId}` : meta?.short_title || deliverableId;
}

const TOTAL_PIPELINE_STAGES = 10;

function PipelineProgressDisplay({ progress }: { progress: PipelineProgress }) {
  const meta = DELIVERABLES[progress.deliverableId];
  const stageName = meta?.short_title || progress.deliverableId;
  const stageIndex = Object.keys(DELIVERABLES).indexOf(progress.deliverableId);
  const progressPercent = Math.round(((stageIndex + 1) / TOTAL_PIPELINE_STAGES) * 100);

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Loader2 }> = {
    pending: { label: 'Queued', color: 'rgb(var(--text-muted))', icon: Loader2 },
    generating: { label: 'Generating', color: 'rgb(var(--accent-primary))', icon: Loader2 },
    repairing: { label: 'Repairing', color: 'rgb(var(--warning))', icon: Wrench },
    validating: { label: 'Validating', color: 'rgb(var(--accent-secondary))', icon: Loader2 },
    complete: { label: 'Complete', color: 'rgb(var(--success))', icon: CheckCircle2 },
    error: { label: 'Error', color: 'rgb(var(--error))', icon: AlertTriangle },
  };

  const config = statusConfig[progress.status] || statusConfig.pending;
  const Icon = config.icon;

  const isAnimated = progress.status === 'generating' || progress.status === 'validating' || progress.status === 'repairing';

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 rounded-xl"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={`w-4 h-4 ${isAnimated ? 'animate-spin' : ''}`}
          style={{ color: config.color }}
        />
        <div className="flex flex-col">
          <span
            className="text-sm font-medium"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            {config.label}: {stageName}
            {progress.status === 'repairing' && progress.repairAttempt && (
              <span className="text-xs ml-1" style={{ color: 'rgb(var(--text-muted))' }}>
                (attempt {progress.repairAttempt}/{progress.maxRepairAttempts || 3})
              </span>
            )}
          </span>
          <span
            className="text-xs"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            Stage {stageIndex + 1} of {TOTAL_PIPELINE_STAGES}
          </span>
        </div>
      </div>
      <ProgressBar progress={progressPercent} />
    </div>
  );
}
