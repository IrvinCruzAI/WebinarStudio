import { useState } from 'react';
import {
  User,
  Target,
  Lightbulb,
  Shield,
  FileText,
  ChevronDown,
  ChevronRight,
  Eye,
  AlertTriangle,
  Play,
} from 'lucide-react';
import type { ProjectMetadata, DeliverableId, WR1 } from '../../contracts';

interface DossierTabProps {
  project: ProjectMetadata;
  artifacts: Map<DeliverableId, {
    content: unknown;
    validated: boolean;
    generated_at: number;
    edited_at?: number;
  }>;
  isPipelineRunning: boolean;
  onRunPipeline: () => void;
  onEditDeliverable: (id: DeliverableId, field: string, value: unknown) => Promise<void>;
}

export function DossierTab({
  artifacts,
  isPipelineRunning,
  onRunPipeline,
}: DossierTabProps) {
  const [viewMode, setViewMode] = useState<'formatted' | 'json'>('formatted');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['client', 'webinar', 'themes', 'proof'])
  );

  const wr1Artifact = artifacts.get('WR1');
  const wr1 = wr1Artifact?.content as WR1 | undefined;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (!wr1) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: 'rgb(var(--surface-elevated))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <FileText
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: 'rgb(var(--text-muted))' }}
            />
            <p className="text-lg font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              No Client Profile Yet
            </p>
            <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
              Run the pipeline to generate the client profile dossier
            </p>
            <button
              onClick={onRunPipeline}
              disabled={isPipelineRunning}
              className="btn-primary"
            >
              <Play className="w-4 h-4" />
              Run Pipeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
              Client Profile Dossier
            </h2>
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              WR1 - Strategy foundation for all deliverables
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'formatted' ? 'json' : 'formatted')}
              className="btn-ghost text-sm"
            >
              {viewMode === 'formatted' ? (
                <>
                  <FileText className="w-4 h-4" />
                  View JSON
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Formatted
                </>
              )}
            </button>
          </div>
        </div>

        {viewMode === 'json' ? (
          <JsonViewer content={wr1} />
        ) : (
          <>
            <DossierSection
              id="client"
              title="Client & Speaker"
              icon={User}
              expanded={expandedSections.has('client')}
              onToggle={() => toggleSection('client')}
            >
              <div className="grid grid-cols-2 gap-4">
                <FieldDisplay label="Client Name" value={wr1.parsed_intake.client_name} />
                <FieldDisplay label="Company" value={wr1.parsed_intake.company} />
                <FieldDisplay label="Speaker Name" value={wr1.parsed_intake.speaker_name} />
                <FieldDisplay label="Speaker Title" value={wr1.parsed_intake.speaker_title} />
              </div>
            </DossierSection>

            <DossierSection
              id="webinar"
              title="Webinar Overview"
              icon={Lightbulb}
              expanded={expandedSections.has('webinar')}
              onToggle={() => toggleSection('webinar')}
            >
              <div className="space-y-4">
                <FieldDisplay label="Webinar Title" value={wr1.parsed_intake.webinar_title} fullWidth />
                <div className="grid grid-cols-2 gap-4">
                  <FieldDisplay label="Offer" value={wr1.parsed_intake.offer} />
                  <FieldDisplay label="Tone" value={wr1.parsed_intake.tone} />
                  <FieldDisplay label="Primary CTA Type" value={wr1.parsed_intake.primary_cta_type} />
                </div>
              </div>
            </DossierSection>

            <DossierSection
              id="audience"
              title="Target Audience"
              icon={Target}
              expanded={expandedSections.has('audience')}
              onToggle={() => toggleSection('audience')}
            >
              <FieldDisplay label="Target Audience" value={wr1.parsed_intake.target_audience} fullWidth />
            </DossierSection>

            <DossierSection
              id="themes"
              title="Main Themes"
              icon={Lightbulb}
              expanded={expandedSections.has('themes')}
              onToggle={() => toggleSection('themes')}
            >
              <div className="space-y-4">
                <ArrayDisplay label="Main Themes" items={wr1.main_themes} />
                <ArrayDisplay label="Structured Notes" items={wr1.structured_notes} />
                <ArrayDisplay label="Speaker Insights" items={wr1.speaker_insights} />
              </div>
            </DossierSection>

            <DossierSection
              id="proof"
              title="Proof Vault"
              icon={Shield}
              expanded={expandedSections.has('proof')}
              onToggle={() => toggleSection('proof')}
            >
              {wr1.proof_points.length > 0 ? (
                <div className="space-y-3">
                  {wr1.proof_points.map((proof, index) => (
                    <ProofPointCard key={index} proof={proof} />
                  ))}
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: 'rgb(var(--text-muted))' }}>
                  No proof points extracted
                </p>
              )}
            </DossierSection>

            <DossierSection
              id="qa"
              title="QA Report (Operator View)"
              icon={AlertTriangle}
              expanded={expandedSections.has('qa')}
              onToggle={() => toggleSection('qa')}
            >
              <div className="space-y-4">
                <QAArrayDisplay label="Assumptions" items={wr1.qa.assumptions} type="warning" />
                <QAArrayDisplay label="Placeholders" items={wr1.qa.placeholders} type="error" />
                <QAArrayDisplay label="Claims Requiring Proof" items={wr1.qa.claims_requiring_proof} type="info" />
              </div>
            </DossierSection>

            <DossierSection
              id="transcript"
              title="Cleaned Transcript"
              icon={FileText}
              expanded={expandedSections.has('transcript')}
              onToggle={() => toggleSection('transcript')}
            >
              <div
                className="max-h-64 overflow-y-auto p-4 rounded-xl font-mono text-sm whitespace-pre-wrap scrollbar-thin"
                style={{
                  background: 'rgb(var(--surface-base))',
                  color: 'rgb(var(--text-secondary))',
                  lineHeight: 1.6,
                }}
              >
                {wr1.cleaned_transcript || 'No transcript available'}
              </div>
            </DossierSection>
          </>
        )}
      </div>
    </div>
  );
}

interface DossierSectionProps {
  id: string;
  title: string;
  icon: typeof User;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function DossierSection({ title, icon: Icon, expanded, onToggle, children }: DossierSectionProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[rgb(var(--surface-glass))] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: 'rgb(var(--surface-base))' }}
          >
            <Icon className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
          </div>
          <span className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
            {title}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
        ) : (
          <ChevronRight className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

function FieldDisplay({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
        {label}
      </label>
      <p
        className="mt-1 text-sm"
        style={{ color: value ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))' }}
      >
        {value || 'Not specified'}
      </p>
    </div>
  );
}

function ArrayDisplay({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
          {label}
        </label>
        <p className="mt-1 text-sm italic" style={{ color: 'rgb(var(--text-muted))' }}>
          None extracted
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-3 py-1.5 text-sm rounded-lg"
            style={{
              background: 'rgb(var(--surface-base))',
              color: 'rgb(var(--text-secondary))',
              border: '1px solid rgb(var(--border-subtle))',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function QAArrayDisplay({
  label,
  items,
  type,
}: {
  label: string;
  items: string[];
  type: 'warning' | 'error' | 'info';
}) {
  const colors = {
    warning: { bg: 'rgb(var(--warning) / 0.1)', border: 'rgb(var(--warning) / 0.2)', text: 'rgb(var(--warning))' },
    error: { bg: 'rgb(var(--error) / 0.1)', border: 'rgb(var(--error) / 0.2)', text: 'rgb(var(--error))' },
    info: { bg: 'rgb(var(--accent-primary) / 0.1)', border: 'rgb(var(--accent-primary) / 0.2)', text: 'rgb(var(--accent-primary))' },
  };

  const color = colors[type];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
          {label}
        </label>
        {items.length > 0 && (
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: color.bg, color: color.text }}
          >
            {items.length}
          </span>
        )}
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li
              key={i}
              className="text-sm p-2 rounded-lg"
              style={{
                background: color.bg,
                border: `1px solid ${color.border}`,
                color: 'rgb(var(--text-secondary))',
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          None detected
        </p>
      )}
    </div>
  );
}

function ProofPointCard({ proof }: { proof: { type: string; content: string; source: string | null } }) {
  const typeColors: Record<string, { bg: string; text: string }> = {
    testimonial: { bg: 'rgb(var(--success) / 0.1)', text: 'rgb(var(--success))' },
    metric: { bg: 'rgb(var(--accent-primary) / 0.1)', text: 'rgb(var(--accent-primary))' },
    case_study: { bg: 'rgb(var(--warning) / 0.1)', text: 'rgb(var(--warning))' },
  };

  const colors = typeColors[proof.type] || typeColors.testimonial;

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-subtle))',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <span
            className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2"
            style={{ background: colors.bg, color: colors.text }}
          >
            {proof.type.replace('_', ' ')}
          </span>
          <p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
            {proof.content}
          </p>
          {proof.source ? (
            <p className="text-xs mt-2" style={{ color: 'rgb(var(--text-muted))' }}>
              Source: {proof.source}
            </p>
          ) : (
            <p className="text-xs mt-2 italic" style={{ color: 'rgb(var(--warning))' }}>
              Source needed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function JsonViewer({ content }: { content: unknown }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
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
          WR1 JSON
        </span>
        <button onClick={handleCopy} className="btn-ghost text-xs">
          {copied ? 'Copied!' : 'Copy'}
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

