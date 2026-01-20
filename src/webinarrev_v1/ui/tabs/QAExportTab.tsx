import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  Package,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  Clock,
  Archive,
  Shield,
  Loader2,
  Edit3,
  Settings,
  Info,
  ChevronDown,
  ChevronRight,
  Bug,
} from 'lucide-react';
import type { ProjectMetadata, DeliverableId } from '../../contracts';
import { DELIVERABLES, UI_DELIVERABLE_ORDER } from '../../contracts/deliverables';
import { computeExportEligibility, type ExportEligibility } from '../../export/eligibilityComputer';
import {
  translateIssue,
  translatePlaceholder,
  getAssetName,
  isValidIssue,
  type TranslatedIssue,
} from '../../utils/translateIssue';
import {
  tagIssues,
  groupIssuesBySource,
  getSourceDisplayInfo,
  type RawIssue,
  type TaggedIssue,
  type QASource,
  type QASummary,
} from '../../utils/qaSourceTagger';

interface PlaceholderMatch {
  deliverableId: string;
  path: string;
  text: string;
  critical: boolean;
}

function scanForPlaceholders(content: unknown): PlaceholderMatch[] {
  const matches: PlaceholderMatch[] = [];
  const patterns = [
    /\{\{[^}]+\}\}/g,
    /\[TBD\]/gi,
    /\[TODO\]/gi,
    /\[INSERT[^\]]*\]/gi,
    /\[PLACEHOLDER\]/gi,
    /\[FILL[^\]]*\]/gi,
    /\[ADD[^\]]*\]/gi,
    /_placeholder/gi,
    /XXX/g,
    /FIXME/gi,
  ];

  const criticalPatterns = [
    'link_placeholder',
  ];

  function scan(obj: unknown, path: string) {
    if (typeof obj === 'string') {
      for (const pattern of patterns) {
        const found = obj.matchAll(pattern);
        for (const match of found) {
          const text = match[0];
          const critical = criticalPatterns.some(p => text.toLowerCase().includes(p.toLowerCase()));
          matches.push({ deliverableId: '', path, text, critical });
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => scan(item, `${path}[${i}]`));
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        scan(value, path ? `${path}.${key}` : key);
      }
    }
  }

  scan(content, '');
  return matches;
}

interface Issue {
  type: 'validation' | 'placeholder';
  severity: 'critical' | 'warning';
  deliverableId: DeliverableId;
  message: string;
  fieldPath?: string;
}

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
  const [issues, setIssues] = useState<Issue[]>([]);
  const [placeholders, setPlaceholders] = useState<PlaceholderMatch[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExportType, setSelectedExportType] = useState<ExportType>('client');
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<Array<{ type: ExportType; timestamp: number }>>([]);
  const [bugFilteredCount, setBugFilteredCount] = useState(0);
  const [qaSummary, setQaSummary] = useState<QASummary | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<QASource>>(
    new Set(['SETTINGS_REQUIRED', 'INPUT_MISSING', 'MODEL_UNCERTAIN'])
  );

  const checkEligibility = useCallback(async () => {
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
  }, [project.project_id, project.run_id]);

  const scanIssues = useCallback(async () => {
    setIsScanning(true);
    const foundIssues: Issue[] = [];
    const foundPlaceholders: PlaceholderMatch[] = [];

    const clientDeliverables = UI_DELIVERABLE_ORDER.filter(id => DELIVERABLES[id].exportable);

    for (const id of clientDeliverables) {
      const artifact = artifacts.get(id);

      if (!artifact) {
        foundIssues.push({
          type: 'validation',
          severity: 'critical',
          deliverableId: id,
          message: 'Asset not yet generated',
        });
        continue;
      }

      if (!artifact.validated) {
        foundIssues.push({
          type: 'validation',
          severity: 'critical',
          deliverableId: id,
          message: 'Validation failed',
        });
      }

      const matches = scanForPlaceholders(artifact.content);
      foundPlaceholders.push(...matches.map(m => ({ ...m, deliverableId: id })));

      matches.forEach(match => {
        foundIssues.push({
          type: 'placeholder',
          severity: match.critical ? 'critical' : 'warning',
          deliverableId: id,
          message: `Placeholder: ${match.text}`,
          fieldPath: match.path,
        });
      });
    }

    setIssues(foundIssues);
    setPlaceholders(foundPlaceholders);
    setIsScanning(false);
  }, [artifacts]);

  useEffect(() => {
    checkEligibility();
    scanIssues();
  }, [checkEligibility, scanIssues]);

  const taggedResult = useMemo(() => {
    const rawIssues: RawIssue[] = issues.map(issue => ({
      type: issue.type,
      severity: issue.severity,
      deliverableId: issue.deliverableId,
      message: issue.message,
      fieldPath: issue.fieldPath,
    }));
    return tagIssues(rawIssues, project.settings);
  }, [issues, project.settings]);

  useEffect(() => {
    setBugFilteredCount(taggedResult.bugFilteredCount);
    setQaSummary(taggedResult.summary);
  }, [taggedResult]);

  const groupedBySource = useMemo(() => {
    return groupIssuesBySource(taggedResult.taggedIssues);
  }, [taggedResult.taggedIssues]);

  const toggleSourceExpanded = (source: QASource) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    });
  };

  const handleRescan = async () => {
    await scanIssues();
    await checkEligibility();
    await onRevalidateAll();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportZip();
      setExportHistory(prev => [{ type: selectedExportType, timestamp: Date.now() }, ...prev]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNavigateToFix = (deliverableId: DeliverableId) => {
    if (deliverableId === 'WR1') {
      onNavigateToTab('dossier');
    } else if (deliverableId === 'WR2') {
      onNavigateToTab('framework');
    } else {
      onNavigateToTab('assets', deliverableId);
    }
  };

  const validIssues = issues.filter(issue => isValidIssue(issue.message, issue.fieldPath));

  const filteredIssues = validIssues.filter(issue => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const translated = translateIssue(issue.message, issue.deliverableId, issue.fieldPath);
      return (
        translated.title.toLowerCase().includes(searchLower) ||
        translated.description.toLowerCase().includes(searchLower) ||
        DELIVERABLES[issue.deliverableId].title.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const criticalCount = validIssues.filter(i => i.severity === 'critical').length;
  const warningCount = validIssues.filter(i => i.severity === 'warning').length;

  const validPlaceholders = placeholders.filter(p => !p.path.includes('undefined') && p.text.trim().length > 0);

  const groupedIssues = filteredIssues.reduce((acc, issue) => {
    const key = issue.deliverableId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(issue);
    return acc;
  }, {} as Record<DeliverableId, Issue[]>);

  const clientDeliverables = UI_DELIVERABLE_ORDER.filter(id => DELIVERABLES[id].exportable);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
              QA & Export
            </h2>
            {criticalCount + warningCount > 0 ? (
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                {criticalCount > 0 ? `${criticalCount} item${criticalCount !== 1 ? 's' : ''} need${criticalCount === 1 ? 's' : ''} your attention` : `${warningCount} item${warningCount !== 1 ? 's' : ''} to review`}
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'rgb(var(--success))' }}>
                Ready to export
              </p>
            )}
          </div>
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="btn-secondary text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Check Again
          </button>
        </div>

        <ReadinessSection
          eligibility={eligibility}
          isChecking={isCheckingEligibility}
          qaSummary={qaSummary}
          bugFilteredCount={bugFilteredCount}
        />

        {isScanning ? (
          <div
            className="p-8 text-center rounded-2xl"
            style={{
              background: 'rgb(var(--surface-elevated))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <RefreshCw
              className="w-8 h-8 mx-auto mb-3 animate-spin"
              style={{ color: 'rgb(var(--accent-primary))' }}
            />
            <p style={{ color: 'rgb(var(--text-muted))' }}>Scanning for issues...</p>
          </div>
        ) : taggedResult.taggedIssues.length === 0 ? (
          <div
            className="p-8 text-center rounded-2xl"
            style={{
              background: 'rgb(var(--surface-elevated))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <CheckCircle2
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: 'rgb(var(--success))' }}
            />
            <p className="font-medium mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
              No issues found
            </p>
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              All assets are ready for export
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(['SETTINGS_REQUIRED', 'INPUT_MISSING', 'MODEL_UNCERTAIN'] as const).map(source => {
              const sourceIssues = groupedBySource[source];
              if (sourceIssues.length === 0) return null;

              return (
                <SourceGroupSection
                  key={source}
                  source={source}
                  issues={sourceIssues}
                  expanded={expandedSources.has(source)}
                  onToggle={() => toggleSourceExpanded(source)}
                  onNavigate={handleNavigateToFix}
                />
              );
            })}

            {bugFilteredCount > 0 && (
              <BugAlertSection count={bugFilteredCount} />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <ExportTypeCard
            type="client"
            selected={selectedExportType === 'client'}
            enabled={eligibility?.canExport || false}
            onSelect={() => eligibility?.canExport && setSelectedExportType('client')}
          />
          <ExportTypeCard
            type="operator"
            selected={selectedExportType === 'operator'}
            enabled={true}
            onSelect={() => setSelectedExportType('operator')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            {selectedExportType === 'client'
              ? 'Client-safe package with sanitized content'
              : 'Full operator package including QA data'}
          </div>
          <button
            onClick={handleExport}
            disabled={(selectedExportType === 'client' && !eligibility?.canExport) || isExporting}
            className={`btn-primary ${(selectedExportType === 'client' && !eligibility?.canExport) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {selectedExportType === 'client' ? 'Client' : 'Operator'} Package
              </>
            )}
          </button>
        </div>

        {exportHistory.length > 0 && (
          <ExportHistorySection history={exportHistory} />
        )}

        <IndividualExportsSection
          artifacts={artifacts}
          deliverables={clientDeliverables}
          onExportDocx={onExportDocx}
        />
      </div>
    </div>
  );
}

function ReadinessSection({
  eligibility,
  isChecking,
  qaSummary,
  bugFilteredCount,
}: {
  eligibility: ExportEligibility | null;
  isChecking: boolean;
  qaSummary: QASummary | null;
  bugFilteredCount: number;
}) {
  if (isChecking) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const score = eligibility?.readiness_score || 0;
  const isReady = eligibility?.canExport || false;

  const settingsCount = qaSummary?.settings_required.count || 0;
  const inputMissingCount = qaSummary?.input_missing.count || 0;
  const toFillCount = qaSummary?.model_uncertain.count || 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div
        className="p-4 rounded-xl"
        style={{
          background: isReady ? 'rgb(var(--success) / 0.1)' : 'rgb(var(--error) / 0.1)',
          border: isReady ? '1px solid rgb(var(--success) / 0.2)' : '1px solid rgb(var(--error) / 0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgb(var(--border-default))"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={isReady ? 'rgb(var(--success))' : 'rgb(var(--error))'}
                strokeWidth="3"
                strokeDasharray={`${score}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                {score}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Readiness</p>
            <p className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              {isReady ? 'Ready' : 'Blocked'}
            </p>
          </div>
        </div>
      </div>

      <SummaryCard
        icon={Settings}
        label="Settings Required"
        count={settingsCount}
        color="info"
      />
      <SummaryCard
        icon={AlertTriangle}
        label="Missing Inputs"
        count={inputMissingCount}
        color="warning"
      />
      <SummaryCard
        icon={Edit3}
        label="To Fill In"
        count={toFillCount}
        color="neutral"
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: typeof XCircle;
  label: string;
  count: number;
  color: 'error' | 'warning' | 'neutral' | 'info';
}) {
  const colorStyles = {
    error: { bg: 'rgb(var(--error) / 0.1)', border: 'rgb(var(--error) / 0.2)', icon: 'rgb(var(--error))' },
    warning: { bg: 'rgb(var(--warning) / 0.1)', border: 'rgb(var(--warning) / 0.2)', icon: 'rgb(var(--warning))' },
    neutral: { bg: 'rgb(var(--surface-elevated))', border: 'rgb(var(--border-default))', icon: 'rgb(var(--text-muted))' },
    info: { bg: 'rgb(var(--accent-primary) / 0.1)', border: 'rgb(var(--accent-primary) / 0.2)', icon: 'rgb(var(--accent-primary))' },
  };

  const styles = colorStyles[color];

  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" style={{ color: styles.icon }} />
        <div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
            {count}
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

function IssueGroup({
  deliverableId,
  issues,
  onNavigate,
}: {
  deliverableId: DeliverableId;
  issues: Issue[];
  onNavigate: (id: DeliverableId) => void;
}) {
  const meta = DELIVERABLES[deliverableId];
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const assetName = meta.short_title || meta.title;

  const translatedIssues = issues.map(issue => ({
    ...issue,
    translated: translateIssue(issue.message, issue.deliverableId, issue.fieldPath),
  })).filter(issue => issue.translated.isValid);

  if (translatedIssues.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
            {assetName}
          </span>
          {criticalCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{
              background: 'rgb(var(--error) / 0.1)',
              color: 'rgb(var(--error))'
            }}>
              {criticalCount} must fix
            </span>
          )}
        </div>
        <button
          onClick={() => onNavigate(deliverableId)}
          className="btn-ghost text-xs"
          style={{ color: 'rgb(var(--accent-primary))' }}
        >
          Go to {assetName}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {translatedIssues.map((issue, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ background: 'rgb(var(--surface-base))' }}
          >
            {issue.severity === 'critical' ? (
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--error))' }} />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--warning))' }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                {issue.translated.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                {issue.translated.description}
              </p>
            </div>
            <button
              onClick={() => onNavigate(deliverableId)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                background: 'rgb(var(--accent-primary) / 0.1)',
                color: 'rgb(var(--accent-primary))'
              }}
            >
              {issue.translated.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceGroupSection({
  source,
  issues,
  expanded,
  onToggle,
  onNavigate,
}: {
  source: QASource;
  issues: TaggedIssue[];
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (id: DeliverableId) => void;
}) {
  const displayInfo = getSourceDisplayInfo(source);

  const colorStyles: Record<typeof displayInfo.colorKey, { bg: string; border: string; icon: string; headerBg: string }> = {
    error: {
      bg: 'rgb(var(--error) / 0.05)',
      border: 'rgb(var(--error) / 0.2)',
      icon: 'rgb(var(--error))',
      headerBg: 'rgb(var(--error) / 0.1)',
    },
    warning: {
      bg: 'rgb(var(--warning) / 0.05)',
      border: 'rgb(var(--warning) / 0.2)',
      icon: 'rgb(var(--warning))',
      headerBg: 'rgb(var(--warning) / 0.1)',
    },
    info: {
      bg: 'rgb(var(--accent-primary) / 0.05)',
      border: 'rgb(var(--accent-primary) / 0.2)',
      icon: 'rgb(var(--accent-primary))',
      headerBg: 'rgb(var(--accent-primary) / 0.1)',
    },
    neutral: {
      bg: 'rgb(var(--surface-elevated))',
      border: 'rgb(var(--border-default))',
      icon: 'rgb(var(--text-muted))',
      headerBg: 'rgb(var(--surface-glass))',
    },
  };

  const styles = colorStyles[displayInfo.colorKey];

  const SourceIcon = source === 'SETTINGS_REQUIRED' ? Settings :
                     source === 'INPUT_MISSING' ? AlertTriangle :
                     source === 'MODEL_UNCERTAIN' ? Edit3 : Info;

  const groupedByDeliverable = issues.reduce((acc, issue) => {
    const key = issue.deliverableId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(issue);
    return acc;
  }, {} as Record<DeliverableId, TaggedIssue[]>);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 transition-colors hover:opacity-90"
        style={{ background: styles.headerBg }}
      >
        <div className="flex items-center gap-3">
          <SourceIcon className="w-5 h-5" style={{ color: styles.icon }} />
          <div className="text-left">
            <span className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              {displayInfo.title}
            </span>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ background: styles.border, color: 'rgb(var(--text-primary))' }}
            >
              {issues.length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            {displayInfo.description}
          </span>
          {expanded ? (
            <ChevronDown className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
          ) : (
            <ChevronRight className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {Object.entries(groupedByDeliverable).map(([deliverableId, deliverableIssues]) => {
            const assetName = getAssetName(deliverableId as DeliverableId);

            return (
              <div key={deliverableId}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                    {assetName}
                  </span>
                  <button
                    onClick={() => onNavigate(deliverableId as DeliverableId)}
                    className="btn-ghost text-xs"
                    style={{ color: 'rgb(var(--accent-primary))' }}
                  >
                    Go to {assetName}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {deliverableIssues.map((issue, i) => {
                    const translated = translateIssue(issue.message, issue.deliverableId, issue.fieldPath);
                    if (!translated.isValid) return null;

                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ background: 'rgb(var(--surface-base))' }}
                      >
                        <SourceIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: styles.icon }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                              {translated.title}
                            </p>
                            {translated.severityHint === 'Must Fix' && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'rgb(var(--error) / 0.1)',
                                  color: 'rgb(var(--error))',
                                }}
                              >
                                Must Fix
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                            {translated.oneSentenceFix || translated.description}
                          </p>
                        </div>
                        <button
                          onClick={() => onNavigate(deliverableId as DeliverableId)}
                          className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                          style={{
                            background: 'rgb(var(--accent-primary) / 0.1)',
                            color: 'rgb(var(--accent-primary))',
                          }}
                        >
                          {translated.actionLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BugAlertSection({ count }: { count: number }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'rgb(var(--error) / 0.05)',
        border: '1px solid rgb(var(--error) / 0.2)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug className="w-5 h-5" style={{ color: 'rgb(var(--error))' }} />
          <div>
            <p className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
              {count} technical issue{count !== 1 ? 's' : ''} filtered
            </p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              These are internal errors that have been hidden from the main view
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="btn-ghost text-xs"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          {showDetails ? 'Hide' : 'Show'} in Debug Panel
        </button>
      </div>
      {showDetails && (
        <div
          className="mt-3 p-3 rounded-lg text-xs font-mono"
          style={{
            background: 'rgb(var(--surface-base))',
            color: 'rgb(var(--text-muted))',
          }}
        >
          <p>Bug count: {count}</p>
          <p className="mt-1">Check the Debug Panel for details on malformed paths or undefined references.</p>
        </div>
      )}
    </div>
  );
}

interface GroupedPlaceholder {
  fieldName: string;
  occurrences: number;
  critical: boolean;
  deliverableIds: Set<string>;
  samplePath: string;
  sampleText: string;
}

function PlaceholderManager({
  placeholders,
  onNavigateToFix,
}: {
  placeholders: PlaceholderMatch[];
  onNavigateToFix: (id: DeliverableId) => void;
}) {
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const filtered = showCriticalOnly ? placeholders.filter(p => p.critical) : placeholders;

  const dedupedByField = filtered.reduce((acc, p) => {
    const fieldName = translatePlaceholder(p.text, p.path);
    const key = `${fieldName}`;

    if (!acc[key]) {
      acc[key] = {
        fieldName,
        occurrences: 0,
        critical: p.critical,
        deliverableIds: new Set(),
        samplePath: p.path,
        sampleText: p.text,
      };
    }

    acc[key].occurrences++;
    acc[key].deliverableIds.add(p.deliverableId);
    acc[key].critical = acc[key].critical || p.critical;

    return acc;
  }, {} as Record<string, GroupedPlaceholder>);

  const groupedByAsset = Object.values(dedupedByField).reduce((acc, item) => {
    const primaryAsset = Array.from(item.deliverableIds)[0];
    if (!acc[primaryAsset]) acc[primaryAsset] = [];
    acc[primaryAsset].push(item);
    return acc;
  }, {} as Record<string, GroupedPlaceholder[]>);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        <div>
          <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
            Content to Fill In
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
            These items need your input before export
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCriticalOnly}
            onChange={e => setShowCriticalOnly(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
            Must fix only
          </span>
        </label>
      </div>

      <div className="p-4 space-y-4">
        {Object.entries(groupedByAsset).map(([deliverableId, items]) => {
          const assetName = getAssetName(deliverableId as DeliverableId);
          const criticalCount = items.filter(i => i.critical).length;

          return (
            <div key={deliverableId}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                    {assetName}
                  </span>
                  {criticalCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: 'rgb(var(--error) / 0.1)',
                      color: 'rgb(var(--error))'
                    }}>
                      {criticalCount} required
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onNavigateToFix(deliverableId as DeliverableId)}
                  className="btn-ghost text-xs"
                  style={{ color: 'rgb(var(--accent-primary))' }}
                >
                  Go to {assetName}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, i) => {
                  const affectedAssets = Array.from(item.deliverableIds);
                  const showOccurrences = item.occurrences > 1 || affectedAssets.length > 1;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: 'rgb(var(--surface-base))' }}
                    >
                      <div className="flex items-center gap-3">
                        {item.critical ? (
                          <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(var(--error))' }} />
                        ) : (
                          <Edit3 className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(var(--warning))' }} />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                              {item.fieldName}
                            </p>
                            {showOccurrences && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: 'rgb(var(--text-muted) / 0.1)',
                                  color: 'rgb(var(--text-muted))'
                                }}
                              >
                                {item.occurrences}x
                                {affectedAssets.length > 1 && ` across ${affectedAssets.length} assets`}
                              </span>
                            )}
                          </div>
                          {item.critical ? (
                            <p className="text-xs" style={{ color: 'rgb(var(--error))' }}>
                              Required for export
                            </p>
                          ) : (
                            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                              {affectedAssets.length > 1
                                ? `Used in ${affectedAssets.map(id => getAssetName(id as DeliverableId)).join(', ')}`
                                : 'Optional but recommended'}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigateToFix(deliverableId as DeliverableId)}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                        style={{
                          background: 'rgb(var(--accent-primary) / 0.1)',
                          color: 'rgb(var(--accent-primary))'
                        }}
                      >
                        Fill in
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExportTypeCard({
  type,
  selected,
  enabled,
  onSelect,
}: {
  type: ExportType;
  selected: boolean;
  enabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={!enabled}
      className={`p-5 rounded-xl text-left transition-all ${!enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        background: selected ? 'rgb(var(--accent-primary) / 0.1)' : 'rgb(var(--surface-elevated))',
        border: selected ? '2px solid rgb(var(--accent-primary))' : '1px solid rgb(var(--border-default))',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-xl"
          style={{
            background: selected ? 'rgb(var(--accent-primary) / 0.2)' : 'rgb(var(--surface-base))',
          }}
        >
          {type === 'client' ? (
            <Package className="w-6 h-6" style={{ color: selected ? 'rgb(var(--accent-primary))' : 'rgb(var(--text-muted))' }} />
          ) : (
            <Shield className="w-6 h-6" style={{ color: selected ? 'rgb(var(--accent-primary))' : 'rgb(var(--text-muted))' }} />
          )}
        </div>
        <div>
          <h4 className="font-semibold mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
            {type === 'client' ? 'Client Package' : 'Operator Package'}
          </h4>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            {type === 'client'
              ? 'ZIP with all client-safe deliverables (WR3-WR8)'
              : 'Full package including QA report and internal notes'}
          </p>
          {type === 'client' && !enabled && (
            <p className="text-xs mt-2" style={{ color: 'rgb(var(--error))' }}>
              Resolve issues to enable
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function ExportHistorySection({ history }: { history: Array<{ type: ExportType; timestamp: number }> }) {
  return (
    <div
      className="p-5 rounded-2xl"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <h3 className="font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
        Export History
      </h3>
      <div className="space-y-2">
        {history.map((entry, i) => (
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
              {new Date(entry.timestamp).toLocaleString()}
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
      className="p-5 rounded-2xl"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <h3 className="font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
        Individual Exports
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
                <span style={{ color: 'rgb(var(--text-primary))' }}>{meta.title}</span>
                <span
                  className="text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'rgb(var(--surface-elevated))', color: 'rgb(var(--text-muted))' }}
                >
                  {meta.internal_badge}
                </span>
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
