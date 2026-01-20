import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  FileText,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { ExportEligibility, DeliverableId } from '../../contracts';
import { computeExportEligibility } from '../../export/eligibilityComputer';
import { runGoldenPathAssertions, GoldenPathCheck } from '../../qa/runGoldenPathAssertions';
import GoldenPathChecklist from './GoldenPathChecklist';

interface ExportPanelProps {
  projectId: string;
  runId: string;
  artifacts: Map<DeliverableId, { content: unknown; validated: boolean }>;
  onExportDocx: (deliverableId: DeliverableId) => Promise<void>;
  onExportZip: () => Promise<void>;
}

const EXPORTABLE_DELIVERABLES: Array<{
  id: DeliverableId;
  name: string;
  description: string;
}> = [
  { id: 'WR2', name: 'Framework', description: '21-block presentation structure' },
  { id: 'WR3', name: 'Landing Page', description: 'Registration page copy' },
  { id: 'WR4', name: 'Email Campaign', description: 'Promotional emails' },
  { id: 'WR5', name: 'Social Media', description: 'Social posts' },
  { id: 'WR6', name: 'Run of Show', description: 'Timeline' },
  { id: 'WR7', name: 'Checklist', description: 'Task lists' },
  { id: 'WR8', name: 'Slide Deck', description: 'Gamma prompt' },
];

export default function ExportPanel({
  projectId,
  runId,
  artifacts,
  onExportDocx,
  onExportZip,
}: ExportPanelProps) {
  const [exportingId, setExportingId] = useState<DeliverableId | 'zip' | null>(null);
  const [eligibility, setEligibility] = useState<ExportEligibility | null>(null);
  const [goldenPathChecks, setGoldenPathChecks] = useState<GoldenPathCheck[]>([]);
  const [isRecomputing, setIsRecomputing] = useState(false);

  const recomputeEligibility = useCallback(async () => {
    setIsRecomputing(true);
    try {
      const result = await runGoldenPathAssertions(projectId, runId, artifacts);
      setEligibility(result.eligibility);
      setGoldenPathChecks(result.checks);
    } catch (error) {
      console.error('Failed to compute eligibility:', error);
    } finally {
      setIsRecomputing(false);
    }
  }, [projectId, runId, artifacts]);

  useEffect(() => {
    recomputeEligibility();
  }, [recomputeEligibility]);

  async function handleExportDocx(id: DeliverableId) {
    setExportingId(id);
    try {
      const freshEligibility = await computeExportEligibility(projectId, runId);
      if (!freshEligibility.canExport) {
        setEligibility(freshEligibility);
        return;
      }
      await onExportDocx(id);
    } finally {
      setExportingId(null);
    }
  }

  async function handleExportZip() {
    setExportingId('zip');
    try {
      const freshEligibility = await computeExportEligibility(projectId, runId);
      if (!freshEligibility.canExport) {
        setEligibility(freshEligibility);
        return;
      }
      await onExportZip();
    } finally {
      setExportingId(null);
    }
  }

  const canExport = eligibility?.canExport ?? false;
  const readinessScore = eligibility?.readiness_score ?? 0;
  const blockingReasons = eligibility?.blocking_reasons ?? [];
  const placeholderCount = eligibility?.placeholder_scan?.critical_count ?? 0;

  return (
    <div className="space-y-4">
      <div className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                canExport
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-amber-500/10 border border-amber-500/30'
              }`}
            >
              {canExport ? (
                <Unlock className="w-5 h-5 text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">Export Status</h3>
              <p className="text-sm text-slate-400">
                {isRecomputing
                  ? 'Recomputing...'
                  : canExport
                  ? 'Ready for client export'
                  : 'Resolve issues before export'}
              </p>
            </div>
          </div>
          <button
            onClick={recomputeEligibility}
            disabled={isRecomputing}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh eligibility"
          >
            <RefreshCw className={`w-4 h-4 ${isRecomputing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-400">Readiness Score</span>
              <span
                className={`text-sm font-medium ${
                  readinessScore >= 70
                    ? 'text-emerald-400'
                    : readinessScore >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {readinessScore}/100
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  readinessScore >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                    : readinessScore >= 50
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>

          {placeholderCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-300">
                {placeholderCount} critical placeholder{placeholderCount > 1 ? 's' : ''} need to be filled
              </span>
            </div>
          )}

          {blockingReasons.length > 0 && (
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <h4 className="text-sm font-medium text-red-400 mb-2">
                Blocking Issues
              </h4>
              <ul className="space-y-1">
                {blockingReasons.map((reason, index) => (
                  <li key={index} className="text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <GoldenPathChecklist
        checks={goldenPathChecks}
        isLoading={isRecomputing}
      />

      <div className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white">Export Options</h3>
        </div>

        <div className="p-4">
          <button
            onClick={handleExportZip}
            disabled={!canExport || exportingId !== null || isRecomputing}
            className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
              canExport && !isRecomputing
                ? 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/30 hover:from-teal-500/20 hover:to-cyan-500/20 text-teal-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {exportingId === 'zip' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Archive className="w-5 h-5" />
            )}
            <span className="font-medium">Export All as ZIP</span>
          </button>
        </div>

        <div className="px-4 pb-4">
          <p className="text-xs text-slate-500 mb-3">Or export individual deliverables:</p>
          <div className="grid grid-cols-2 gap-2">
            {EXPORTABLE_DELIVERABLES.map((item) => {
              const validation = eligibility?.validation_results?.[item.id];
              const isValid = validation?.ok ?? false;

              return (
                <button
                  key={item.id}
                  onClick={() => handleExportDocx(item.id)}
                  disabled={!canExport || !isValid || exportingId !== null || isRecomputing}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                    canExport && isValid && !isRecomputing
                      ? 'border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 hover:border-slate-600'
                      : 'border-slate-800 bg-slate-900/20 cursor-not-allowed opacity-50'
                  }`}
                >
                  {exportingId === item.id ? (
                    <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white">
                        {item.id}
                      </span>
                      {isValid ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{item.name}</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-500" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
