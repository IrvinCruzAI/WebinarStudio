import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileText,
  Download,
  ChevronRight,
  RefreshCw,
  Edit3,
  Loader2,
  Package,
  PartyPopper,
} from 'lucide-react';
import type { DeliverableId } from '../../contracts';
import { DELIVERABLES } from '../../contracts/deliverables';

export interface ReadinessIssue {
  id: string;
  type: 'missing' | 'validation' | 'placeholder';
  deliverableId: DeliverableId;
  title: string;
  description: string;
  actionLabel: string;
  fieldPath?: string;
  critical: boolean;
}

interface ReadinessWizardProps {
  issues: ReadinessIssue[];
  readinessScore: number;
  isScanning: boolean;
  onFixIssue: (issue: ReadinessIssue) => void;
  onRescan: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function ReadinessWizard({
  issues,
  readinessScore,
  isScanning,
  onFixIssue,
  onRescan,
  onExport,
  isExporting,
}: ReadinessWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const criticalIssues = useMemo(() => issues.filter(i => i.critical), [issues]);
  const warningIssues = useMemo(() => issues.filter(i => !i.critical), [issues]);
  const isReady = criticalIssues.length === 0;

  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgb(var(--accent-primary) / 0.1)' }}>
            <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'rgb(var(--accent-primary))' }} />
          </div>
        </div>
        <h3 className="text-lg font-semibold mt-6" style={{ color: 'rgb(var(--text-primary))' }}>
          Checking Your Deliverables
        </h3>
        <p className="text-sm mt-2" style={{ color: 'rgb(var(--text-muted))' }}>
          This only takes a moment...
        </p>
      </div>
    );
  }

  if (isReady && warningIssues.length === 0) {
    return <ReadyToExportView onExport={onExport} isExporting={isExporting} onRescan={onRescan} />;
  }

  if (isReady && warningIssues.length > 0) {
    return (
      <ReadyWithWarningsView
        warnings={warningIssues}
        onExport={onExport}
        isExporting={isExporting}
        onFixIssue={onFixIssue}
        onRescan={onRescan}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProgressHeader
        totalSteps={criticalIssues.length}
        currentStep={currentStep}
        readinessScore={readinessScore}
      />

      <div className="space-y-3">
        {criticalIssues.map((issue, index) => (
          <FixStepCard
            key={issue.id}
            issue={issue}
            stepNumber={index + 1}
            isActive={index === currentStep}
            isCompleted={index < currentStep}
            onFix={() => onFixIssue(issue)}
            onActivate={() => setCurrentStep(index)}
          />
        ))}
      </div>

      {warningIssues.length > 0 && (
        <WarningsSummary warnings={warningIssues} onFixIssue={onFixIssue} />
      )}

      <div className="flex justify-center pt-4">
        <button
          onClick={onRescan}
          className="btn-ghost text-sm"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          <RefreshCw className="w-4 h-4" />
          Re-check all deliverables
        </button>
      </div>
    </div>
  );
}

function ProgressHeader({
  totalSteps,
  currentStep,
  readinessScore,
}: {
  totalSteps: number;
  currentStep: number;
  readinessScore: number;
}) {
  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgb(var(--error) / 0.1), rgb(var(--warning) / 0.1))',
        border: '1px solid rgb(var(--error) / 0.2)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgb(var(--error) / 0.2)' }}
          >
            <AlertCircle className="w-6 h-6" style={{ color: 'rgb(var(--error))' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
              {totalSteps} {totalSteps === 1 ? 'Step' : 'Steps'} to Go
            </h2>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
              Complete these to unlock export
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
            {readinessScore}%
          </div>
          <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            Readiness
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full transition-colors"
            style={{
              background: i < currentStep
                ? 'rgb(var(--success))'
                : i === currentStep
                  ? 'rgb(var(--accent-primary))'
                  : 'rgb(var(--border-default))'
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FixStepCard({
  issue,
  stepNumber,
  isActive,
  isCompleted,
  onFix,
  onActivate,
}: {
  issue: ReadinessIssue;
  stepNumber: number;
  isActive: boolean;
  isCompleted: boolean;
  onFix: () => void;
  onActivate: () => void;
}) {
  const meta = DELIVERABLES[issue.deliverableId];

  return (
    <div
      onClick={!isCompleted ? onActivate : undefined}
      className={`rounded-xl transition-all ${!isCompleted ? 'cursor-pointer' : ''}`}
      style={{
        background: isActive
          ? 'rgb(var(--surface-elevated))'
          : isCompleted
            ? 'rgb(var(--success) / 0.05)'
            : 'rgb(var(--surface-base))',
        border: isActive
          ? '2px solid rgb(var(--accent-primary))'
          : isCompleted
            ? '1px solid rgb(var(--success) / 0.3)'
            : '1px solid rgb(var(--border-subtle))',
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isCompleted
                ? 'rgb(var(--success) / 0.2)'
                : isActive
                  ? 'rgb(var(--accent-primary) / 0.2)'
                  : 'rgb(var(--surface-elevated))'
            }}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: 'rgb(var(--success))' }} />
            ) : (
              <span
                className="text-sm font-bold"
                style={{ color: isActive ? 'rgb(var(--accent-primary))' : 'rgb(var(--text-muted))' }}
              >
                {stepNumber}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  background: 'rgb(var(--accent-primary) / 0.1)',
                  color: 'rgb(var(--accent-primary))',
                }}
              >
                {meta?.short_title || issue.deliverableId}
              </span>
            </div>
            <h3
              className="font-semibold mb-1"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              {issue.title}
            </h3>
            <p
              className="text-sm"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              {issue.description}
            </p>
          </div>

          {isActive && !isCompleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFix();
              }}
              className="btn-primary flex-shrink-0"
            >
              {issue.actionLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningsSummary({
  warnings,
  onFixIssue,
}: {
  warnings: ReadinessIssue[];
  onFixIssue: (issue: ReadinessIssue) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgb(var(--warning) / 0.05)',
        border: '1px solid rgb(var(--warning) / 0.2)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgb(var(--warning) / 0.2)' }}
          >
            <FileText className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
          </div>
          <div>
            <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
              {warnings.length} Optional {warnings.length === 1 ? 'Improvement' : 'Improvements'}
            </span>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              These won't block export but are recommended
            </p>
          </div>
        </div>
        <ChevronRight
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`}
          style={{ color: 'rgb(var(--text-muted))' }}
        />
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 space-y-2"
        >
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: 'rgb(var(--surface-base))' }}
            >
              <div className="flex items-center gap-3">
                <Circle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                    {warning.title}
                  </p>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    {DELIVERABLES[warning.deliverableId]?.short_title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onFixIssue(warning)}
                className="btn-ghost text-xs"
                style={{ color: 'rgb(var(--accent-primary))' }}
              >
                <Edit3 className="w-3 h-3" />
                Fix
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReadyToExportView({
  onExport,
  isExporting,
  onRescan,
}: {
  onExport: () => void;
  isExporting: boolean;
  onRescan: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-12">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative"
        style={{ background: 'rgb(var(--success) / 0.1)' }}
      >
        <Sparkles className="w-10 h-10" style={{ color: 'rgb(var(--success))' }} />
        <div
          className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgb(var(--success))' }}
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
        Ready to Deliver!
      </h2>
      <p className="text-center mb-8 max-w-md" style={{ color: 'rgb(var(--text-muted))' }}>
        All deliverables have passed validation. Your client package is ready for export.
      </p>

      <button
        onClick={onExport}
        disabled={isExporting}
        className="btn-primary text-lg px-8 py-3"
        style={{
          background: 'rgb(var(--success))',
        }}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Preparing Package...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Download Client Package
          </>
        )}
      </button>

      <button
        onClick={onRescan}
        className="btn-ghost text-sm mt-4"
        style={{ color: 'rgb(var(--text-muted))' }}
      >
        <RefreshCw className="w-4 h-4" />
        Re-check deliverables
      </button>
    </div>
  );
}

function ReadyWithWarningsView({
  warnings,
  onExport,
  isExporting,
  onFixIssue,
  onRescan,
}: {
  warnings: ReadinessIssue[];
  onExport: () => void;
  isExporting: boolean;
  onFixIssue: (issue: ReadinessIssue) => void;
  onRescan: () => void;
}) {
  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-2xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgb(var(--success) / 0.1), rgb(var(--accent-primary) / 0.1))',
          border: '1px solid rgb(var(--success) / 0.3)',
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgb(var(--success) / 0.2)' }}
        >
          <Package className="w-8 h-8" style={{ color: 'rgb(var(--success))' }} />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
          Ready to Export!
        </h2>
        <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
          Your package is ready. You can export now or fix the optional items below first.
        </p>

        <button
          onClick={onExport}
          disabled={isExporting}
          className="btn-primary"
          style={{ background: 'rgb(var(--success))' }}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Client Package
            </>
          )}
        </button>
      </div>

      <WarningsSummary warnings={warnings} onFixIssue={onFixIssue} />

      <div className="flex justify-center">
        <button
          onClick={onRescan}
          className="btn-ghost text-sm"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          <RefreshCw className="w-4 h-4" />
          Re-check deliverables
        </button>
      </div>
    </div>
  );
}

export function transformIssuesToReadinessIssues(
  artifacts: Map<DeliverableId, { content: unknown; validated: boolean }>,
  exportableDeliverables: DeliverableId[]
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const placeholderPatterns = [
    /\{\{[^}]+\}\}/g,
    /\[TBD\]/gi,
    /\[TODO\]/gi,
    /\[INSERT[^\]]*\]/gi,
    /\[PLACEHOLDER\]/gi,
    /\[FILL[^\]]*\]/gi,
    /link_placeholder/gi,
    /from_email_placeholder/gi,
    /XXX/g,
  ];

  const criticalPlaceholders = [
    'link_placeholder',
    'from_email_placeholder',
    'from_name_placeholder',
    'reply_to_placeholder',
  ];

  for (const deliverableId of exportableDeliverables) {
    const artifact = artifacts.get(deliverableId);
    const meta = DELIVERABLES[deliverableId];

    if (!artifact) {
      issues.push({
        id: `missing-${deliverableId}`,
        type: 'missing',
        deliverableId,
        title: `Generate ${meta?.short_title || deliverableId}`,
        description: 'This deliverable hasn\'t been created yet. Run the pipeline to generate it.',
        actionLabel: 'Go to Setup',
        critical: true,
      });
      continue;
    }

    if (!artifact.validated) {
      issues.push({
        id: `validation-${deliverableId}`,
        type: 'validation',
        deliverableId,
        title: `Fix ${meta?.short_title || deliverableId}`,
        description: 'Some content needs to be corrected before export.',
        actionLabel: 'Edit Content',
        critical: true,
      });
    }

    const contentStr = JSON.stringify(artifact.content);
    for (const pattern of placeholderPatterns) {
      const matches = contentStr.matchAll(pattern);
      for (const match of matches) {
        const text = match[0];
        const isCritical = criticalPlaceholders.some(cp => text.toLowerCase().includes(cp.toLowerCase()));

        const existingPlaceholder = issues.find(i =>
          i.type === 'placeholder' &&
          i.deliverableId === deliverableId &&
          i.title.includes(text.slice(0, 20))
        );

        if (!existingPlaceholder) {
          issues.push({
            id: `placeholder-${deliverableId}-${text.slice(0, 20)}`,
            type: 'placeholder',
            deliverableId,
            title: humanizePlaceholder(text),
            description: `Found "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}" that needs to be replaced.`,
            actionLabel: 'Fill In',
            critical: isCritical,
          });
        }
      }
    }
  }

  return issues.sort((a, b) => {
    if (a.critical !== b.critical) return a.critical ? -1 : 1;
    if (a.type !== b.type) {
      const order = { missing: 0, validation: 1, placeholder: 2 };
      return order[a.type] - order[b.type];
    }
    return 0;
  });
}

function humanizePlaceholder(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('link')) return 'Add missing link';
  if (lower.includes('email')) return 'Add email address';
  if (lower.includes('name')) return 'Add name';
  if (lower.includes('date')) return 'Set the date';
  if (lower.includes('time')) return 'Set the time';
  if (lower.includes('price') || lower.includes('cost')) return 'Add pricing';
  if (lower.includes('url')) return 'Add URL';
  if (lower.includes('tbd') || lower.includes('todo')) return 'Complete this section';
  if (lower.includes('insert')) return 'Insert required content';

  return `Fill in placeholder`;
}
