import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Copy,
  RefreshCw,
  ChevronRight,
  FileText,
  AlertTriangle,
  Download,
  Play,
  Eye,
  Code,
  Pencil,
  ChevronDown,
} from 'lucide-react';
import type { DeliverableId, ValidationResult, WR3, WR4, WR5, WR6, WR7, WR8 } from '../../contracts';
import { DELIVERABLES, type DeliverableCategory } from '../../contracts/deliverables';
import { formatDateTime } from '../utils/formatters';
import { LandingPageEditor } from '../components/editors/LandingPageEditor';
import { EmailCampaignEditor } from '../components/editors/EmailCampaignEditor';
import { SocialPostsEditor } from '../components/editors/SocialPostsEditor';
import { TimelineEditor } from '../components/editors/TimelineEditor';
import { ChecklistEditor } from '../components/editors/ChecklistEditor';
import { DeckPromptEditor } from '../components/editors/DeckPromptEditor';
import { checkRequiredSettings, type SettingsWarning } from '../../utils/settingsChecker';
import { SettingsWarningModal } from '../modals/SettingsWarningModal';

type ViewMode = 'preview' | 'edit' | 'json';

const ASSETS_DELIVERABLES: DeliverableId[] = ['WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'];

interface AssetsTabProps {
  project?: { settings?: { operator?: Record<string, unknown> } };
  artifacts: Map<DeliverableId, {
    content: unknown;
    validated: boolean;
    generated_at: number;
    edited_at?: number;
  }>;
  onRevalidate: (id: DeliverableId) => Promise<ValidationResult>;
  onExportDocx: (id: DeliverableId) => Promise<void>;
  onEditDeliverable?: (id: DeliverableId, field: string, value: unknown) => Promise<void>;
  onRegenerate?: (id: DeliverableId, cascade: boolean) => Promise<void>;
  isPipelineRunning?: boolean;
  onRunPipeline?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export function AssetsTab({
  project,
  artifacts,
  onRevalidate,
  onExportDocx,
  onEditDeliverable,
  onRegenerate,
  isPipelineRunning,
  onRunPipeline,
  onNavigateToTab,
}: AssetsTabProps) {
  const [selectedAsset, setSelectedAsset] = useState<DeliverableId | null>(null);
  const [isRevalidating, setIsRevalidating] = useState<DeliverableId | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<DeliverableCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [showRegenerateMenu, setShowRegenerateMenu] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showSettingsWarning, setShowSettingsWarning] = useState(false);
  const [settingsWarnings, setSettingsWarnings] = useState<SettingsWarning[]>([]);

  const wr1Artifact = artifacts.get('WR1');
  const wr2Artifact = artifacts.get('WR2');

  const upstreamEditedAt = Math.max(
    wr1Artifact?.edited_at || wr1Artifact?.generated_at || 0,
    wr2Artifact?.edited_at || wr2Artifact?.generated_at || 0
  );

  const filteredDeliverables = categoryFilter === 'all'
    ? ASSETS_DELIVERABLES
    : ASSETS_DELIVERABLES.filter(id => DELIVERABLES[id].category === categoryFilter);

  const categories: DeliverableCategory[] = ['Marketing', 'Delivery'];

  const handleRevalidate = async (id: DeliverableId) => {
    setIsRevalidating(id);
    try {
      await onRevalidate(id);
    } finally {
      setIsRevalidating(null);
    }
  };

  const handleRegenerate = async (cascade: boolean) => {
    if (!selectedAsset || !onRegenerate) return;
    setIsRegenerating(true);
    setShowRegenerateMenu(false);
    try {
      await onRegenerate(selectedAsset, cascade);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRunPipeline = () => {
    if (!onRunPipeline) return;
    const warnings = checkRequiredSettings(project?.settings?.operator || {});
    if (warnings.length > 0) {
      setSettingsWarnings(warnings);
      setShowSettingsWarning(true);
    } else {
      onRunPipeline();
    }
  };

  const handleGenerateAnyway = () => {
    setShowSettingsWarning(false);
    if (onRunPipeline) {
      onRunPipeline();
    }
  };

  const handleConfigureSettings = () => {
    setShowSettingsWarning(false);
    if (onNavigateToTab) {
      onNavigateToTab('project-setup');
    }
  };

  const selectedArtifact = selectedAsset ? artifacts.get(selectedAsset) : null;
  const selectedMeta = selectedAsset ? DELIVERABLES[selectedAsset] : null;

  const anyAssetStale = ASSETS_DELIVERABLES.some(id => {
    const artifact = artifacts.get(id);
    return artifact && upstreamEditedAt > artifact.generated_at;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {anyAssetStale && onRunPipeline && (
        <div
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{
            background: 'rgb(var(--warning) / 0.1)',
            borderBottom: '1px solid rgb(var(--warning) / 0.2)',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
            <span className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
              Client profile or framework was modified. Assets may be outdated.
            </span>
          </div>
          <button onClick={handleRunPipeline} disabled={isPipelineRunning} className="btn-primary text-sm">
            <Play className="w-4 h-4" />
            Re-run Pipeline
          </button>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
      <div
        className="w-80 flex-shrink-0 border-r overflow-y-auto scrollbar-thin"
        style={{
          background: 'rgb(var(--surface-elevated))',
          borderColor: 'rgb(var(--border-default))',
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'rgb(var(--border-default))' }}>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-[rgb(var(--accent-primary))] text-white'
                  : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-glass))]'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[rgb(var(--accent-primary))] text-white'
                    : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-glass))]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2">
          {filteredDeliverables.map(id => {
            const meta = DELIVERABLES[id];
            const artifact = artifacts.get(id);
            const isSelected = selectedAsset === id;

            return (
              <button
                key={id}
                onClick={() => setSelectedAsset(id)}
                className={`
                  w-full text-left p-3 rounded-xl mb-1 transition-all
                  ${isSelected
                    ? 'bg-[rgb(var(--accent-primary)/0.1)] border border-[rgb(var(--accent-primary)/0.3)]'
                    : 'hover:bg-[rgb(var(--surface-glass))] border border-transparent'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon artifact={artifact} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium text-sm truncate"
                        style={{ color: 'rgb(var(--text-primary))' }}
                      >
                        {meta.title}
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgb(var(--surface-base))',
                          color: 'rgb(var(--text-muted))',
                        }}
                      >
                        {meta.internal_badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        {meta.category}
                      </span>
                      {artifact?.edited_at && (
                        <span
                          className="text-xs flex items-center gap-1"
                          style={{ color: 'rgb(var(--warning))' }}
                        >
                          <Edit3 className="w-3 h-3" />
                          Edited
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                    style={{ color: 'rgb(var(--text-muted))' }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {selectedAsset && selectedMeta ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: 'rgb(var(--text-primary))' }}
                  >
                    {selectedMeta.title}
                  </h2>
                  <span className="badge badge-neutral">
                    {selectedMeta.internal_badge}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                  {selectedMeta.category}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                <button
                  onClick={() => handleRevalidate(selectedAsset)}
                  disabled={isRevalidating === selectedAsset || !selectedArtifact || isPipelineRunning}
                  className="btn-secondary text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isRevalidating === selectedAsset ? 'animate-spin' : ''}`} />
                  Revalidate
                </button>
                {onRegenerate && selectedAsset && selectedAsset !== 'WR9' && (
                  <div className="relative">
                    <button
                      onClick={() => setShowRegenerateMenu(!showRegenerateMenu)}
                      disabled={isRegenerating || isPipelineRunning}
                      className="btn-secondary text-sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                      Regenerate
                      <ChevronDown className="w-3 h-3 ml-1" />
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
                          className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[rgb(var(--surface-glass))]"
                          style={{
                            color: 'rgb(var(--text-primary))',
                            borderBottom: '1px solid rgb(var(--border-default))',
                          }}
                        >
                          <div className="font-medium">Regenerate This Only</div>
                          <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                            Only regenerate {selectedAsset}, keep others unchanged
                          </div>
                        </button>
                        <button
                          onClick={() => handleRegenerate(true)}
                          className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[rgb(var(--surface-glass))]"
                          style={{ color: 'rgb(var(--text-primary))' }}
                        >
                          <div className="font-medium">Regenerate This + Downstream</div>
                          <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                            Regenerate {selectedAsset} and all dependents
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => onExportDocx(selectedAsset)}
                  disabled={!selectedArtifact?.validated}
                  className="btn-primary text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export DOCX
                </button>
              </div>
            </div>

            {selectedArtifact ? (
              <AssetViewer
                deliverableId={selectedAsset}
                artifact={selectedArtifact}
                viewMode={viewMode}
                onEdit={onEditDeliverable}
              />
            ) : (
              <EmptyAssetState />
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: 'rgb(var(--text-muted))' }}
              />
              <p
                className="text-lg font-medium mb-2"
                style={{ color: 'rgb(var(--text-primary))' }}
              >
                Select an asset
              </p>
              <p
                className="text-sm"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Choose an asset from the list to view its contents
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
      <SettingsWarningModal
        isOpen={showSettingsWarning}
        warnings={settingsWarnings}
        onClose={() => setShowSettingsWarning(false)}
        onGenerateAnyway={handleGenerateAnyway}
        onConfigureSettings={handleConfigureSettings}
      />
    </div>
  );
}

function StatusIcon({ artifact }: { artifact: { validated: boolean } | undefined }) {
  if (!artifact) {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: 'rgb(var(--surface-base))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <Clock className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
      </div>
    );
  }

  if (artifact.validated) {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: 'rgb(var(--success) / 0.1)',
          border: '1px solid rgb(var(--success) / 0.2)',
        }}
      >
        <CheckCircle2 className="w-4 h-4" style={{ color: 'rgb(var(--success))' }} />
      </div>
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{
        background: 'rgb(var(--error) / 0.1)',
        border: '1px solid rgb(var(--error) / 0.2)',
      }}
    >
      <XCircle className="w-4 h-4" style={{ color: 'rgb(var(--error))' }} />
    </div>
  );
}

function ViewModeToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const modes: { id: ViewMode; icon: typeof Eye; label: string }[] = [
    { id: 'preview', icon: Eye, label: 'Preview' },
    { id: 'edit', icon: Pencil, label: 'Edit' },
    { id: 'json', icon: Code, label: 'JSON' },
  ];

  return (
    <div
      className="flex rounded-lg p-0.5"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${viewMode === id
              ? 'bg-[rgb(var(--accent-primary))] text-white'
              : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
            }
          `}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

function AssetViewer({
  deliverableId,
  artifact,
  viewMode,
  onEdit,
}: {
  deliverableId: DeliverableId;
  artifact: { content: unknown; validated: boolean; generated_at: number; edited_at?: number };
  viewMode: ViewMode;
  onEdit?: (id: DeliverableId, field: string, value: unknown) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(artifact.content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = async (field: string, value: unknown) => {
    if (onEdit) {
      await onEdit(deliverableId, field, value);
    }
  };

  const renderEditor = () => {
    const isEditMode = viewMode === 'edit';

    switch (deliverableId) {
      case 'WR3':
        return (
          <LandingPageEditor
            content={artifact.content as WR3}
            onEdit={handleEdit}
            initialEditMode={isEditMode}
          />
        );
      case 'WR4':
        return (
          <EmailCampaignEditor
            content={artifact.content as WR4}
            onEdit={handleEdit}
            initialEditMode={isEditMode}
          />
        );
      case 'WR5':
        return (
          <SocialPostsEditor
            content={artifact.content as WR5}
            onEdit={handleEdit}
            initialEditMode={isEditMode}
          />
        );
      case 'WR6':
        return (
          <TimelineEditor
            content={artifact.content as WR6}
            onEdit={handleEdit}
            initialEditMode={isEditMode}
          />
        );
      case 'WR7':
        return (
          <ChecklistEditor
            content={artifact.content as WR7}
            onEdit={handleEdit}
            initialEditMode={isEditMode}
          />
        );
      case 'WR8':
        return (
          <DeckPromptEditor
            content={artifact.content as WR8}
            onEdit={handleEdit}
            initialEditMode={isEditMode}
          />
        );
      default:
        return <JsonViewer content={artifact.content} onCopy={handleCopy} copied={copied} />;
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{
          background: artifact.validated
            ? 'rgb(var(--success) / 0.05)'
            : 'rgb(var(--error) / 0.05)',
          border: artifact.validated
            ? '1px solid rgb(var(--success) / 0.15)'
            : '1px solid rgb(var(--error) / 0.15)',
        }}
      >
        {artifact.validated ? (
          <CheckCircle2 className="w-5 h-5" style={{ color: 'rgb(var(--success))' }} />
        ) : (
          <AlertTriangle className="w-5 h-5" style={{ color: 'rgb(var(--error))' }} />
        )}
        <div className="flex-1">
          <p
            className="font-medium text-sm"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            {artifact.validated ? 'Validation Passed' : 'Validation Failed'}
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            Generated {formatDateTime(artifact.generated_at)}
            {artifact.edited_at && ` | Edited ${formatDateTime(artifact.edited_at)}`}
          </p>
        </div>
      </div>

      {viewMode === 'json' ? (
        <JsonViewer content={artifact.content} onCopy={handleCopy} copied={copied} />
      ) : (
        renderEditor()
      )}
    </div>
  );
}

function JsonViewer({
  content,
  onCopy,
  copied,
}: {
  content: unknown;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
          JSON Content
        </span>
        <button onClick={onCopy} className="btn-ghost text-xs py-1.5">
          <Copy className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>
      <div
        className="p-4 max-h-[600px] overflow-y-auto scrollbar-thin"
        style={{ background: 'rgb(var(--surface-base))' }}
      >
        <pre
          className="text-xs font-mono whitespace-pre-wrap"
          style={{ color: 'rgb(var(--text-secondary))' }}
        >
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function EmptyAssetState() {
  return (
    <div
      className="text-center py-16 rounded-xl"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <Clock
        className="w-12 h-12 mx-auto mb-4"
        style={{ color: 'rgb(var(--text-muted))' }}
      />
      <p
        className="font-medium mb-2"
        style={{ color: 'rgb(var(--text-primary))' }}
      >
        Not yet generated
      </p>
      <p
        className="text-sm"
        style={{ color: 'rgb(var(--text-muted))' }}
      >
        Run the pipeline to generate this asset
      </p>
    </div>
  );
}
