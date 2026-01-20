import { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Target,
  Lightbulb,
  Shield,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  Save,
  RotateCcw,
  AlertTriangle,
  Clock,
  Settings,
  Play,
  StickyNote,
  RefreshCw,
} from 'lucide-react';
import type { ProjectMetadata, DeliverableId, WR1 } from '../../contracts';
import { readTranscript, writeTranscript } from '../../store/storageService';
import { formatDateTime } from '../utils/formatters';
import { TextMetrics } from '../components/TextMetrics';
import { FileUploadButton } from '../components/FileUploadButton';
import { assessInputQuality } from '../../utils/inputQuality';
import { InputQualityIndicator } from '../components/InputQualityIndicator';

interface TranscriptData {
  build_transcript: string;
  intake_transcript?: string;
  operator_notes?: string;
  created_at: number;
}

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
  project,
  artifacts,
  isPipelineRunning,
  onRunPipeline,
  onEditDeliverable,
}: DossierTabProps) {
  const [viewMode, setViewMode] = useState<'formatted' | 'json'>('formatted');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['client', 'webinar', 'themes', 'proof', 'inputs'])
  );
  const [transcripts, setTranscripts] = useState<TranscriptData | null>(null);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(true);
  const [isEditingTranscripts, setIsEditingTranscripts] = useState(false);
  const [editedBuild, setEditedBuild] = useState('');
  const [editedIntake, setEditedIntake] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState<'build' | 'intake' | 'notes'>('build');

  const wr1Artifact = artifacts.get('WR1');
  const wr1 = wr1Artifact?.content as WR1 | undefined;

  useEffect(() => {
    loadTranscripts();
  }, [project.project_id]);

  const loadTranscripts = async () => {
    setIsLoadingTranscripts(true);
    try {
      const data = await readTranscript(project.project_id);
      if (data) {
        setTranscripts(data as TranscriptData);
        setEditedBuild(data.build_transcript || '');
        setEditedIntake(data.intake_transcript || '');
        setEditedNotes(data.operator_notes || '');
      }
    } finally {
      setIsLoadingTranscripts(false);
    }
  };

  const handleSaveTranscripts = async () => {
    setIsSaving(true);
    try {
      const updatedData: TranscriptData = {
        build_transcript: editedBuild,
        intake_transcript: editedIntake || undefined,
        operator_notes: editedNotes || undefined,
        created_at: Date.now(),
      };
      await writeTranscript(project.project_id, updatedData);
      setTranscripts(updatedData);
      setIsEditingTranscripts(false);
    } finally {
      setIsSaving(false);
    }
  };

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

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const inputsStale = transcripts && wr1Artifact && transcripts.created_at > wr1Artifact.generated_at;

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

        {inputsStale && (
          <StaleBanner
            message="Input transcripts were modified after this dossier was generated"
            onRerun={onRunPipeline}
            isPipelineRunning={isPipelineRunning}
          />
        )}

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

            <DossierSection
              id="inputs"
              title="Inputs & Settings"
              icon={Settings}
              expanded={expandedSections.has('inputs')}
              onToggle={() => toggleSection('inputs')}
            >
              <InputsSettingsSection
                project={project}
                transcripts={transcripts}
                isLoading={isLoadingTranscripts}
                isEditing={isEditingTranscripts}
                editedBuild={editedBuild}
                editedIntake={editedIntake}
                editedNotes={editedNotes}
                activeTranscript={activeTranscript}
                isSaving={isSaving}
                onSetActiveTranscript={setActiveTranscript}
                onSetEditedBuild={setEditedBuild}
                onSetEditedIntake={setEditedIntake}
                onSetEditedNotes={setEditedNotes}
                onToggleEditing={() => setIsEditingTranscripts(!isEditingTranscripts)}
                onSave={handleSaveTranscripts}
                onCancel={() => {
                  setEditedBuild(transcripts?.build_transcript || '');
                  setEditedIntake(transcripts?.intake_transcript || '');
                  setEditedNotes(transcripts?.operator_notes || '');
                  setIsEditingTranscripts(false);
                }}
                wordCount={wordCount}
                isPipelineRunning={isPipelineRunning}
                onRunPipeline={onRunPipeline}
                artifacts={artifacts}
              />
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

function StaleBanner({
  message,
  onRerun,
  isPipelineRunning,
}: {
  message: string;
  onRerun: () => void;
  isPipelineRunning: boolean;
}) {
  return (
    <div
      className="p-4 rounded-xl flex items-center justify-between"
      style={{
        background: 'rgb(var(--warning) / 0.1)',
        border: '1px solid rgb(var(--warning) / 0.2)',
      }}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" style={{ color: 'rgb(var(--warning))' }} />
        <div>
          <p className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
            Outputs may be stale
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            {message}
          </p>
        </div>
      </div>
      <button onClick={onRerun} disabled={isPipelineRunning} className="btn-primary text-sm">
        <Play className="w-4 h-4" />
        Re-run
      </button>
    </div>
  );
}

interface InputsSettingsSectionProps {
  project: ProjectMetadata;
  transcripts: TranscriptData | null;
  isLoading: boolean;
  isEditing: boolean;
  editedBuild: string;
  editedIntake: string;
  editedNotes: string;
  activeTranscript: 'build' | 'intake' | 'notes';
  isSaving: boolean;
  onSetActiveTranscript: (t: 'build' | 'intake' | 'notes') => void;
  onSetEditedBuild: (v: string) => void;
  onSetEditedIntake: (v: string) => void;
  onSetEditedNotes: (v: string) => void;
  onToggleEditing: () => void;
  onSave: () => void;
  onCancel: () => void;
  wordCount: (text: string) => number;
  isPipelineRunning: boolean;
  onRunPipeline: () => void;
  artifacts: Map<DeliverableId, {
    content: unknown;
    validated: boolean;
    generated_at: number;
    edited_at?: number;
  }>;
}

function InputsSettingsSection({
  project,
  transcripts,
  isLoading,
  isEditing,
  editedBuild,
  editedIntake,
  editedNotes,
  activeTranscript,
  isSaving,
  onSetActiveTranscript,
  onSetEditedBuild,
  onSetEditedIntake,
  onSetEditedNotes,
  onToggleEditing,
  onSave,
  onCancel,
  wordCount,
  isPipelineRunning,
  onRunPipeline,
  artifacts,
}: InputsSettingsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    );
  }

  const currentBuild = isEditing ? editedBuild : (transcripts?.build_transcript || '');
  const currentIntake = isEditing ? editedIntake : (transcripts?.intake_transcript || '');
  const currentNotes = isEditing ? editedNotes : (transcripts?.operator_notes || '');

  const qualityResult = assessInputQuality(currentBuild, currentIntake, currentNotes);

  const hasWR1 = artifacts.has('WR1');
  const hasWR2 = artifacts.has('WR2');
  const wr1GeneratedAt = artifacts.get('WR1')?.generated_at || 0;
  const inputsUpdatedAt = transcripts?.created_at || 0;
  const inputsAreNewer = inputsUpdatedAt > wr1GeneratedAt;

  return (
    <div className="space-y-6">
      {inputsAreNewer && hasWR1 && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgb(var(--warning) / 0.1)',
            border: '1px solid rgb(var(--warning) / 0.2)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
                <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                  Inputs Modified After Generation
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-secondary))' }}>
                The input transcripts were modified after deliverables were generated. Consider regenerating to reflect the latest changes.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onRunPipeline}
                  disabled={isPipelineRunning}
                  className="btn-primary text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Rerun Full Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="p-4 rounded-xl"
        style={{
          background: 'rgb(var(--surface-base))',
          border: '1px solid rgb(var(--border-subtle))',
        }}
      >
        <h4 className="text-sm font-medium mb-3" style={{ color: 'rgb(var(--text-primary))' }}>
          Project Settings
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>CTA Mode</label>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
              {project.settings.cta_mode}
            </p>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Audience Temperature</label>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
              {project.settings.audience_temperature}
            </p>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Duration</label>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
              {project.settings.webinar_length_minutes} min
            </p>
          </div>
        </div>
      </div>

      <InputQualityIndicator quality={qualityResult} showDetails={false} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
            Source Transcripts
          </h4>
          <div className="flex items-center gap-2">
            {isEditing && (
              <FileUploadButton
                onFileContent={(content) => {
                  if (activeTranscript === 'build') onSetEditedBuild(content);
                  else if (activeTranscript === 'intake') onSetEditedIntake(content);
                  else onSetEditedNotes(content);
                }}
                label="Upload .txt"
              />
            )}
            <button onClick={onToggleEditing} className="btn-ghost text-xs">
              {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? 'Preview' : 'Edit'}
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          {(['build', 'intake', 'notes'] as const).map((t) => {
            const text = t === 'build' ? currentBuild : t === 'intake' ? currentIntake : currentNotes;
            const wc = wordCount(text);
            let qualityColor = 'rgb(var(--text-muted))';

            if (t === 'build') {
              if (wc === 0) qualityColor = 'rgb(var(--error))';
              else if (wc < 500) qualityColor = 'rgb(var(--error))';
              else if (wc < 800) qualityColor = 'rgb(var(--warning))';
              else qualityColor = 'rgb(var(--success))';
            }

            return (
              <button
                key={t}
                onClick={() => onSetActiveTranscript(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTranscript === t
                    ? 'bg-[rgb(var(--surface-base))] text-[rgb(var(--text-primary))]'
                    : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'
                }`}
              >
                {t === 'build' ? 'Build' : t === 'intake' ? 'Intake' : 'Notes'}
                <span className="ml-1 opacity-60" style={{ color: qualityColor }}>
                  ({wc})
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgb(var(--surface-base))',
            border: '1px solid rgb(var(--border-subtle))',
          }}
        >
          {activeTranscript === 'build' && (
            <TranscriptPanel
              content={currentBuild}
              isEditing={isEditing}
              onChange={onSetEditedBuild}
              placeholder="Build transcript content..."
            />
          )}
          {activeTranscript === 'intake' && (
            <TranscriptPanel
              content={currentIntake}
              isEditing={isEditing}
              onChange={onSetEditedIntake}
              placeholder="Intake transcript (optional)..."
            />
          )}
          {activeTranscript === 'notes' && (
            <TranscriptPanel
              content={currentNotes}
              isEditing={isEditing}
              onChange={onSetEditedNotes}
              placeholder="Operator notes (optional)..."
            />
          )}
        </div>

        {!isEditing && (
          <div className="mt-3">
            <TextMetrics
              text={activeTranscript === 'build' ? currentBuild : activeTranscript === 'intake' ? currentIntake : currentNotes}
              minWords={activeTranscript === 'build' ? 500 : activeTranscript === 'intake' ? 200 : 20}
              recommendedWords={activeTranscript === 'build' ? 800 : activeTranscript === 'intake' ? 300 : 50}
              compact
            />
          </div>
        )}

        {isEditing && (
          <div className="flex items-center justify-end gap-2 mt-3">
            <button onClick={onCancel} className="btn-ghost text-sm">
              <RotateCcw className="w-4 h-4" />
              Cancel
            </button>
            <button onClick={onSave} disabled={isSaving} className="btn-primary text-sm">
              <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {transcripts?.created_at && (
          <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            <Clock className="w-3.5 h-3.5" />
            Last modified: {formatDateTime(transcripts.created_at)}
          </div>
        )}
      </div>
    </div>
  );
}

function TranscriptPanel({
  content,
  isEditing,
  onChange,
  placeholder,
}: {
  content: string;
  isEditing: boolean;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  if (!content && !isEditing) {
    return (
      <div className="p-8 text-center">
        <StickyNote className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgb(var(--text-muted))' }} />
        <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          Not provided
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 min-h-[200px] text-sm font-mono resize-none bg-transparent focus:outline-none"
        style={{ color: 'rgb(var(--text-secondary))' }}
      />
    );
  }

  return (
    <div
      className="p-4 max-h-[200px] overflow-y-auto scrollbar-thin font-mono text-sm whitespace-pre-wrap"
      style={{ color: 'rgb(var(--text-secondary))', lineHeight: 1.6 }}
    >
      {content}
    </div>
  );
}
