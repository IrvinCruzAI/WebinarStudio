import { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Package,
  FileText,
  RefreshCw,
  Archive,
  Shield,
  Loader2,
  ChevronDown,
  Settings,
  Clock,
} from 'lucide-react';
import type { ProjectMetadata, DeliverableId } from '../../contracts';
import { DELIVERABLES, UI_DELIVERABLE_ORDER } from '../../contracts/deliverables';
import { computeExportEligibility, type ExportEligibility } from '../../export/eligibilityComputer';
import { ReadinessWizard, transformIssuesToReadinessIssues, type ReadinessIssue } from '../components/ReadinessWizard';

interface QAExportTabProps {
  project: ProjectMetadata;
  artifacts: Map<DeliverableId, {
    content: unknown;
    validated: boolean;
    generated_at: number;
    edited_at?: number;
  }>;
  onExportZip: () => Promise<void>;
  onExportDocx: (id: DeliverableId) => Promise<void>;
  onNavigateToTab: (tab: string, targetDeliverableId?: DeliverableId) => void;
  onRevalidateAll: () => Promise<void>;
}

type ExportType = 'client' | 'operator';

export function QAExportTab({
  project,
  artifacts,
  onExportZip,
  onExportDocx,
  onNavigateToTab,
  onRevalidateAll,
}: QAExportTabProps) {
  const [eligibility, setEligibility] = useState<ExportEligibility | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<Array<{ type: ExportType; timestamp: number }>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const clientDeliverables = useMemo(() =>
    UI_DELIVERABLE_ORDER.filter(id => DELIVERABLES[id].exportable),
    []
  );

  const issues = useMemo(() =>
    transformIssuesToReadinessIssues(artifacts, clientDeliverables),
    [artifacts, clientDeliverables]
  );

  useEffect(() => {
    checkEligibility();
  }, [project.project_id, project.run_id, artifacts]);

  const checkEligibility = async () => {
    if (!project.run_id) {
      setEligibility(null);
      setIsCheckingEligibility(false);
      return;
    }

    setIsCheckingEligibility(true);
    try {
      const result = await computeExportEligibility(project.project_id, project.run_id);
      setEligibility(result);
    } catch (error) {
      console.error('Failed to compute eligibility:', error);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleRescan = async () => {
    setIsScanning(true);
    try {
      await onRevalidateAll();
      await checkEligibility();
    } finally {
      setIsScanning(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportZip();
      setExportHistory(prev => [{ type: 'client', timestamp: Date.now() }, ...prev]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOperatorExport = async () => {
    setIsExporting(true);
    try {
      await onExportZip();
      setExportHistory(prev => [{ type: 'operator', timestamp: Date.now() }, ...prev]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFixIssue = (issue: ReadinessIssue) => {
    if (issue.type === 'missing') {
      onNavigateToTab('setup');
      return;
    }

    if (issue.deliverableId === 'WR1') {
      onNavigateToTab('dossier');
    } else if (issue.deliverableId === 'WR2') {
      onNavigateToTab('framework');
    } else {
      onNavigateToTab('assets', issue.deliverableId);
    }
  };

  const readinessScore = eligibility?.readiness_score || 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
            Export Center
          </h2>
          <p style={{ color: 'rgb(var(--text-muted))' }}>
            Get your deliverables ready for your client
          </p>
        </div>

        <ReadinessWizard
          issues={issues}
          readinessScore={readinessScore}
          isScanning={isScanning || isCheckingEligibility}
          onFixIssue={handleFixIssue}
          onRescan={handleRescan}
          onExport={handleExport}
          isExporting={isExporting}
        />

        <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgb(var(--border-subtle))' }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[rgb(var(--surface-glass))]"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Advanced Options</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <OperatorExportCard
                onExport={handleOperatorExport}
                isExporting={isExporting}
              />

              {exportHistory.length > 0 && (
                <ExportHistorySection history={exportHistory} />
              )}

              <IndividualExportsSection
                artifacts={artifacts}
                deliverables={clientDeliverables}
                onExportDocx={onExportDocx}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OperatorExportCard({
  onExport,
  isExporting,
}: {
  onExport: () => void;
  isExporting: boolean;
}) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{ background: 'rgb(var(--surface-base))' }}
        >
          <Shield className="w-6 h-6" style={{ color: 'rgb(var(--text-muted))' }} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
            Operator Package
          </h4>
          <p className="text-sm mb-3" style={{ color: 'rgb(var(--text-muted))' }}>
            Full package including QA data, internal notes, and coach cues. Not for client delivery.
          </p>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="btn-secondary text-sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Operator Package
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportHistorySection({ history }: { history: Array<{ type: ExportType; timestamp: number }> }) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <h3 className="font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
        Recent Exports
      </h3>
      <div className="space-y-2">
        {history.slice(0, 5).map((entry, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: 'rgb(var(--surface-base))' }}
          >
            <div className="flex items-center gap-3">
              <Archive className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
              <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                {entry.type === 'client' ? 'Client Package' : 'Operator Package'}
              </span>
            </div>
            <span className="text-sm flex items-center gap-2" style={{ color: 'rgb(var(--text-muted))' }}>
              <Clock className="w-3.5 h-3.5" />
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndividualExportsSection({
  artifacts,
  deliverables,
  onExportDocx,
}: {
  artifacts: Map<DeliverableId, { validated: boolean }>;
  deliverables: DeliverableId[];
  onExportDocx: (id: DeliverableId) => Promise<void>;
}) {
  const [exportingId, setExportingId] = useState<DeliverableId | null>(null);

  const handleExport = async (id: DeliverableId) => {
    setExportingId(id);
    try {
      await onExportDocx(id);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <h3 className="font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
        Individual Documents
      </h3>
      <div className="space-y-2">
        {deliverables.map(id => {
          const meta = DELIVERABLES[id];
          const artifact = artifacts.get(id);
          const isValid = artifact?.validated;
          const isExporting = exportingId === id;

          return (
            <div
              key={id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: 'rgb(var(--surface-base))' }}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
                <span style={{ color: 'rgb(var(--text-primary))' }}>{meta.short_title}</span>
              </div>
              <button
                onClick={() => handleExport(id)}
                disabled={!isValid || isExporting}
                className="btn-ghost text-sm"
                style={{ color: isValid ? 'rgb(var(--accent-primary))' : 'rgb(var(--text-muted))' }}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    DOCX
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
