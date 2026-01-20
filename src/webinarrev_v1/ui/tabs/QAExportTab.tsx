import { useState, useEffect } from 'react';
import {
  Download,
  Package,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight,
  ArrowRight,
  Clock,
  Archive,
  Shield,
  Loader2,
} from 'lucide-react';
import type { ProjectMetadata, DeliverableId } from '../../contracts';
import { DELIVERABLES, UI_DELIVERABLE_ORDER } from '../../contracts/deliverables';
import { computeExportEligibility, type ExportEligibility } from '../../export/eligibilityComputer';

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
    'from_email_placeholder',
    'from_name_placeholder',
    'reply_to_placeholder',
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

  useEffect(() => {
    checkEligibility();
    scanIssues();
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

  const scanIssues = async () => {
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

  const filteredIssues = issues.filter(issue => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        issue.message.toLowerCase().includes(searchLower) ||
        DELIVERABLES[issue.deliverableId].title.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

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
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              Review issues and export deliverables
            </p>
          </div>
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="btn-secondary text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Rescan All
          </button>
        </div>

        <ReadinessSection
          eligibility={eligibility}
          isChecking={isCheckingEligibility}
          criticalCount={criticalCount}
          warningCount={warningCount}
          placeholderCount={placeholders.length}
        />

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgb(var(--surface-elevated))',
            border: '1px solid rgb(var(--border-default))',
          }}
        >
          <div
            className="flex items-center gap-4 p-4 border-b"
            style={{ borderColor: 'rgb(var(--border-default))' }}
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'rgb(var(--text-muted))' }}
              />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-2"
              />
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'critical', 'warning'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filterSeverity === sev
                      ? 'bg-[rgb(var(--accent-primary))] text-white'
                      : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-glass))]'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev === 'critical' ? 'Critical' : 'Warnings'}
                </button>
              ))}
            </div>
          </div>

          {isScanning ? (
            <div className="p-8 text-center">
              <RefreshCw
                className="w-8 h-8 mx-auto mb-3 animate-spin"
                style={{ color: 'rgb(var(--accent-primary))' }}
              />
              <p style={{ color: 'rgb(var(--text-muted))' }}>Scanning for issues...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-8 text-center">
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
            <div className="divide-y" style={{ borderColor: 'rgb(var(--border-subtle))' }}>
              {Object.entries(groupedIssues).map(([deliverableId, deliverableIssues]) => (
                <IssueGroup
                  key={deliverableId}
                  deliverableId={deliverableId as DeliverableId}
                  issues={deliverableIssues}
                  onNavigate={handleNavigateToFix}
                />
              ))}
            </div>
          )}
        </div>

        {placeholders.length > 0 && (
          <PlaceholderManager
            placeholders={placeholders}
            onNavigateToFix={handleNavigateToFix}
          />
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
  criticalCount,
  warningCount,
  placeholderCount,
}: {
  eligibility: ExportEligibility | null;
  isChecking: boolean;
  criticalCount: number;
  warningCount: number;
  placeholderCount: number;
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
        icon={XCircle}
        label="Critical Issues"
        count={criticalCount}
        color="error"
      />
      <SummaryCard
        icon={AlertTriangle}
        label="Warnings"
        count={warningCount}
        color="warning"
      />
      <SummaryCard
        icon={FileText}
        label="Placeholders"
        count={placeholderCount}
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
  color: 'error' | 'warning' | 'neutral';
}) {
  const colorStyles = {
    error: { bg: 'rgb(var(--error) / 0.1)', border: 'rgb(var(--error) / 0.2)', icon: 'rgb(var(--error))' },
    warning: { bg: 'rgb(var(--warning) / 0.1)', border: 'rgb(var(--warning) / 0.2)', icon: 'rgb(var(--warning))' },
    neutral: { bg: 'rgb(var(--surface-elevated))', border: 'rgb(var(--border-default))', icon: 'rgb(var(--text-muted))' },
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
  const [expanded, setExpanded] = useState(true);
  const meta = DELIVERABLES[deliverableId];
  const criticalCount = issues.filter(i => i.severity === 'critical').length;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[rgb(var(--surface-glass))] transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            style={{ color: 'rgb(var(--text-muted))' }}
          />
          <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
            {meta.title}
          </span>
          <span className="badge badge-neutral text-xs">{meta.internal_badge}</span>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="badge badge-error">{criticalCount} critical</span>
          )}
          <span className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="pb-2">
          {issues.map((issue, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 ml-8 mr-4 rounded-lg hover:bg-[rgb(var(--surface-glass))] transition-colors"
            >
              <div className="flex items-center gap-3">
                {issue.severity === 'critical' ? (
                  <XCircle className="w-4 h-4" style={{ color: 'rgb(var(--error))' }} />
                ) : (
                  <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
                )}
                <div>
                  <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                    {issue.message}
                  </p>
                  {issue.fieldPath && (
                    <p className="text-xs font-mono" style={{ color: 'rgb(var(--text-muted))' }}>
                      {issue.fieldPath}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onNavigate(deliverableId)}
                className="btn-ghost text-xs py-1"
                style={{ color: 'rgb(var(--accent-primary))' }}
              >
                Fix
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
        <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
          Placeholder Manager
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCriticalOnly}
            onChange={e => setShowCriticalOnly(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
            Critical only
          </span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgb(var(--surface-base))' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                Asset
              </th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                Path
              </th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                Placeholder
              </th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                Severity
              </th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'rgb(var(--border-subtle))' }}>
            {filtered.map((placeholder, i) => (
              <tr key={i} className="hover:bg-[rgb(var(--surface-glass))]">
                <td className="px-4 py-3" style={{ color: 'rgb(var(--text-primary))' }}>
                  {DELIVERABLES[placeholder.deliverableId as DeliverableId]?.short_title || placeholder.deliverableId}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  {placeholder.path}
                </td>
                <td className="px-4 py-3" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {placeholder.text}
                </td>
                <td className="px-4 py-3">
                  {placeholder.critical ? (
                    <span className="badge badge-error">Critical</span>
                  ) : (
                    <span className="badge badge-warning">Warning</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onNavigateToFix(placeholder.deliverableId as DeliverableId)}
                    className="btn-ghost text-xs py-1"
                  >
                    Fix
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
