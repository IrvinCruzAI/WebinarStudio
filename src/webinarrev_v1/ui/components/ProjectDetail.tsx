import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  LayoutGrid,
  Shield,
  FileText,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  Play,
} from 'lucide-react';
import type {
  ProjectMetadata,
  DeliverableId,
  WR1,
  WR2,
  WR3,
  ExportEligibility,
  BlockId,
  ValidationResult,
} from '../../contracts';
import Framework21Board from './Framework21Board';
import ProofVault from './ProofVault';
import DeliverablePanel from './DeliverablePanel';
import ExportPanel from './ExportPanel';
import OperatorDebugPanel from './OperatorDebugPanel';
import PipelineProgressPanel from './PipelineProgressPanel';
import RegenerationConfirmModal from './RegenerationConfirmModal';
import { checkStaleness } from '../../utils/stalenessDetection';
import { PipelineProgress } from '../../pipeline/orchestrator';

interface ProjectDetailProps {
  project: ProjectMetadata;
  artifacts: Map<DeliverableId, { content: unknown; validated: boolean; generated_at: number; edited_at?: number }>;
  onBack: () => void;
  onRunPipeline: () => Promise<void>;
  onEditDeliverable: (deliverableId: DeliverableId, field: string, value: unknown) => Promise<void>;
  onRevalidateDeliverable: (deliverableId: DeliverableId) => Promise<ValidationResult>;
  onRegenerateDeliverable: (deliverableId: DeliverableId, cascade: boolean) => Promise<void>;
  onExportDocx: (deliverableId: DeliverableId) => Promise<void>;
  onExportZip: () => Promise<void>;
  onCancelPipeline: () => void;
  isRunning?: boolean;
  pipelineProgress: PipelineProgress[];
}

type TabId = 'framework' | 'proofs' | 'deliverables' | 'export';

const STATUS_CONFIG = {
  preflight_blocked: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    label: 'Blocked',
  },
  generating: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    label: 'Generating',
  },
  review: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    label: 'Review',
  },
  ready: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    label: 'Ready',
  },
  failed: {
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    label: 'Failed',
  },
};

const DELIVERABLE_ORDER: DeliverableId[] = [
  'PREFLIGHT',
  'WR1',
  'WR2',
  'WR3',
  'WR4',
  'WR5',
  'WR6',
  'WR7',
  'WR8',
  'WR9',
];

function getStaleBlocks(
  wr2: WR2 | null,
  wr2EditedAt: number | undefined,
  wr1GeneratedAt: number | undefined
): Set<BlockId> {
  if (!wr2 || !wr1GeneratedAt || !wr2EditedAt) return new Set();
  if (wr2EditedAt < wr1GeneratedAt) {
    return new Set(wr2.blocks.map((b) => b.block_id));
  }
  return new Set();
}


export default function ProjectDetail({
  project,
  artifacts,
  onBack,
  onRunPipeline,
  onEditDeliverable,
  onRevalidateDeliverable,
  onRegenerateDeliverable,
  onExportDocx,
  onExportZip,
  onCancelPipeline,
  isRunning,
  pipelineProgress,
}: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>('framework');
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<DeliverableId | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<BlockId | null>(null);
  const [validationResults, setValidationResults] = useState<Map<DeliverableId, ValidationResult>>(new Map());
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [regenerationModal, setRegenerationModal] = useState<{ deliverableId: DeliverableId; cascade: boolean } | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugPanelVisible(prev => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const status = STATUS_CONFIG[project.status];
  const wr1 = artifacts.get('WR1')?.content as WR1 | undefined;
  const wr2 = artifacts.get('WR2')?.content as WR2 | undefined;
  const wr3 = artifacts.get('WR3')?.content as WR3 | undefined;

  const wr2Artifact = artifacts.get('WR2');
  const wr1Artifact = artifacts.get('WR1');
  const staleBlocks = getStaleBlocks(
    wr2 ?? null,
    wr2Artifact?.edited_at,
    wr1Artifact?.generated_at
  );

  const wr9Artifact = artifacts.get('WR9');
  const debugEligibility: ExportEligibility | null = wr9Artifact?.content
    ? {
        canExport: (wr9Artifact.content as { pass: boolean }).pass,
        readiness_score: (wr9Artifact.content as { readiness_score: number }).readiness_score,
        pass: (wr9Artifact.content as { pass: boolean }).pass,
        blocking_reasons: (wr9Artifact.content as { blocking_reasons: string[] }).blocking_reasons,
        validation_results: (wr9Artifact.content as { validation_results: Record<string, { ok: boolean; errors: string[] }> }).validation_results,
        placeholder_scan: (wr9Artifact.content as { placeholder_scan: ExportEligibility['placeholder_scan'] }).placeholder_scan,
      }
    : null;

  const completedCount = DELIVERABLE_ORDER.filter((id) => artifacts.has(id)).length;
  const validatedCount = DELIVERABLE_ORDER.filter(
    (id) => artifacts.get(id)?.validated
  ).length;

  async function handleUpdateProofSource(index: number, source: string) {
    if (!wr1) return;
    await onEditDeliverable('WR1', `proof_points[${index}].source`, source);
  }

  async function handleUpdateLandingProofSource(index: number, source: string) {
    if (!wr3) return;
    await onEditDeliverable('WR3', `proof_blocks[${index}].source`, source);
  }

  async function handleRevalidate(deliverableId: DeliverableId) {
    const result = await onRevalidateDeliverable(deliverableId);
    setValidationResults((prev) => new Map(prev).set(deliverableId, result));
    return result;
  }

  function handleRegenerateRequest(deliverableId: DeliverableId, cascade: boolean) {
    setRegenerationModal({ deliverableId, cascade });
  }

  async function handleRegenerateConfirm() {
    if (!regenerationModal) return;
    setRegenerationModal(null);
    await onRegenerateDeliverable(regenerationModal.deliverableId, regenerationModal.cascade);
  }

  function computeAffectedDeliverables(targetId: DeliverableId, cascade: boolean): DeliverableId[] {
    const affected: DeliverableId[] = [targetId];

    if (!cascade) {
      affected.push('WR9');
      return affected;
    }

    const DEPENDENCY_MAP: Record<DeliverableId, DeliverableId[]> = {
      'PREFLIGHT': [],
      'WR1': [],
      'WR2': [],
      'WR3': [],
      'WR4': [],
      'WR5': [],
      'WR6': [],
      'WR7': [],
      'WR8': [],
      'WR9': [],
    };

    DEPENDENCY_MAP['WR1'] = [];
    DEPENDENCY_MAP['WR2'] = [];
    DEPENDENCY_MAP['WR3'] = ['WR8'];
    DEPENDENCY_MAP['WR4'] = [];
    DEPENDENCY_MAP['WR5'] = [];
    DEPENDENCY_MAP['WR6'] = [];
    DEPENDENCY_MAP['WR7'] = [];
    DEPENDENCY_MAP['WR8'] = [];

    const addDownstream = (id: DeliverableId) => {
      const downstream = DEPENDENCY_MAP[id] || [];
      for (const depId of downstream) {
        if (!affected.includes(depId)) {
          affected.push(depId);
          addDownstream(depId);
        }
      }
    };

    if (targetId === 'WR1') {
      affected.push('WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8');
    } else if (targetId === 'WR2') {
      affected.push('WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8');
    } else {
      addDownstream(targetId);
    }

    affected.push('WR9');
    return affected;
  }

  const selectedDeliverableStaleness = selectedDeliverableId
    ? checkStaleness(selectedDeliverableId, artifacts)
    : null;

  const hasProgressErrors = pipelineProgress.some(p => p.status === 'error');

  const tabs: Array<{ id: TabId; label: string; icon: typeof LayoutGrid }> = [
    { id: 'framework', label: 'Framework', icon: LayoutGrid },
    { id: 'proofs', label: 'ProofVault', icon: Shield },
    { id: 'deliverables', label: 'Deliverables', icon: FileText },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <div className="space-y-6">
      {(isRunning || hasProgressErrors) && (
        <PipelineProgressPanel
          progress={pipelineProgress}
          isRunning={isRunning || false}
          onCancel={onCancelPipeline}
          hasErrors={hasProgressErrors}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{project.title}</h2>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg}`}
              >
                <span className={status.color}>{status.label}</span>
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
              <span>
                {completedCount}/{DELIVERABLE_ORDER.length} deliverables
              </span>
              <span className="h-4 w-px bg-slate-700" />
              <span>{validatedCount} validated</span>
              <span className="h-4 w-px bg-slate-700" />
              <span>{project.settings.webinar_length_minutes} min</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunPipeline}
            disabled={isRunning || project.status === 'generating'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isRunning || project.status === 'generating'
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-400 hover:to-cyan-500 shadow-lg shadow-teal-500/20'
            }`}
          >
            {isRunning || project.status === 'generating' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/50 border border-slate-700/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'framework' && (
          <Framework21Board
            wr2Data={wr2 ?? null}
            onBlockSelect={setSelectedBlockId}
            selectedBlockId={selectedBlockId}
            staleBlocks={staleBlocks}
          />
        )}

        {activeTab === 'proofs' && (
          <ProofVault
            wr1Data={wr1 ?? null}
            wr3Data={wr3 ?? null}
            onUpdateProofSource={handleUpdateProofSource}
            onUpdateLandingProofSource={handleUpdateLandingProofSource}
          />
        )}

        {activeTab === 'deliverables' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/50 border border-slate-700/50 overflow-x-auto">
              {DELIVERABLE_ORDER.map((id) => {
                const artifact = artifacts.get(id);
                const isSelected = selectedDeliverableId === id;
                const hasArtifact = !!artifact;

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedDeliverableId(id)}
                    disabled={!hasArtifact}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-slate-700 text-white'
                        : hasArtifact
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        : 'text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {hasArtifact ? (
                      artifact.validated ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    {id}
                  </button>
                );
              })}
            </div>

            {selectedDeliverableId && artifacts.has(selectedDeliverableId) && (
              <DeliverablePanel
                deliverableId={selectedDeliverableId}
                content={artifacts.get(selectedDeliverableId)!.content}
                validated={artifacts.get(selectedDeliverableId)!.validated}
                generatedAt={artifacts.get(selectedDeliverableId)!.generated_at}
                editedAt={artifacts.get(selectedDeliverableId)!.edited_at}
                validationResult={validationResults.get(selectedDeliverableId)}
                isStale={selectedDeliverableStaleness?.isStale}
                onEdit={(field, value) =>
                  onEditDeliverable(selectedDeliverableId, field, value)
                }
                onRevalidate={() => handleRevalidate(selectedDeliverableId)}
                onRegenerate={(cascade) => handleRegenerateRequest(selectedDeliverableId, cascade)}
                isRunning={isRunning}
              />
            )}

            {!selectedDeliverableId && (
              <div className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  Select a Deliverable
                </h3>
                <p className="text-slate-500">
                  Choose a deliverable above to view and edit its contents
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <ExportPanel
            projectId={project.project_id}
            runId={project.run_id}
            artifacts={artifacts}
            onExportDocx={onExportDocx}
            onExportZip={onExportZip}
          />
        )}
      </div>

      {import.meta.env.DEV && (
        <OperatorDebugPanel
          exportEligibility={debugEligibility}
          artifacts={artifacts}
          isVisible={debugPanelVisible}
        />
      )}

      {regenerationModal && (
        <RegenerationConfirmModal
          targetDeliverableId={regenerationModal.deliverableId}
          cascade={regenerationModal.cascade}
          affectedDeliverables={computeAffectedDeliverables(
            regenerationModal.deliverableId,
            regenerationModal.cascade
          )}
          artifacts={artifacts}
          onConfirm={handleRegenerateConfirm}
          onCancel={() => setRegenerationModal(null)}
        />
      )}
    </div>
  );
}
