import { useState, useEffect } from 'react';
import {
  Settings,
  FileText,
  User,
  Building2,
  Mail,
  Edit3,
  Eye,
  Save,
  RotateCcw,
  AlertTriangle,
  Clock,
  StickyNote,
  RefreshCw,
  Target,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ProjectMetadata, DeliverableId } from '../../contracts';
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

interface ProjectSetupTabProps {
  project: ProjectMetadata;
  artifacts: Map<DeliverableId, {
    content: unknown;
    validated: boolean;
    generated_at: number;
    edited_at?: number;
  }>;
  isPipelineRunning: boolean;
  onRunPipeline: () => void;
  onUpdateProject?: (updates: Partial<ProjectMetadata['settings']>) => Promise<void>;
}

export function ProjectSetupTab({
  project,
  artifacts,
  isPipelineRunning,
  onRunPipeline,
  onUpdateProject,
}: ProjectSetupTabProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['profile', 'config', 'sources'])
  );
  const [transcripts, setTranscripts] = useState<TranscriptData | null>(null);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(true);
  const [isEditingTranscripts, setIsEditingTranscripts] = useState(false);
  const [editedBuild, setEditedBuild] = useState('');
  const [editedIntake, setEditedIntake] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState<'build' | 'intake' | 'notes'>('build');

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

  const currentBuild = isEditingTranscripts ? editedBuild : (transcripts?.build_transcript || '');
  const currentIntake = isEditingTranscripts ? editedIntake : (transcripts?.intake_transcript || '');
  const currentNotes = isEditingTranscripts ? editedNotes : (transcripts?.operator_notes || '');

  const qualityResult = assessInputQuality(currentBuild, currentIntake, currentNotes);

  const hasWR1 = artifacts.has('WR1');
  const wr1GeneratedAt = artifacts.get('WR1')?.generated_at || 0;
  const inputsUpdatedAt = transcripts?.created_at || 0;
  const inputsAreNewer = inputsUpdatedAt > wr1GeneratedAt;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
            Project Setup
          </h2>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Configure project details and manage source materials
          </p>
        </div>

        {inputsAreNewer && hasWR1 && (
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
                  Inputs Modified After Generation
                </p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  Source materials were updated after deliverables were generated
                </p>
              </div>
            </div>
            <button onClick={onRunPipeline} disabled={isPipelineRunning} className="btn-primary text-sm">
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        )}

        <SetupSection
          id="profile"
          title="Project Profile"
          icon={User}
          expanded={expandedSections.has('profile')}
          onToggle={() => toggleSection('profile')}
        >
          <div className="grid grid-cols-2 gap-4">
            <ProfileField
              label="Client Name"
              value={project.settings?.client_name}
              icon={User}
            />
            <ProfileField
              label="Company"
              value={project.settings?.company_name}
              icon={Building2}
            />
            <ProfileField
              label="Speaker Name"
              value={project.settings?.speaker_name}
              icon={User}
            />
            <ProfileField
              label="Contact Email"
              value={project.settings?.contact_email}
              icon={Mail}
            />
          </div>
          <p className="text-xs mt-4" style={{ color: 'rgb(var(--text-muted))' }}>
            Profile details are extracted from the Client Profile (WR1) during generation
          </p>
        </SetupSection>

        <SetupSection
          id="config"
          title="Webinar Configuration"
          icon={Settings}
          expanded={expandedSections.has('config')}
          onToggle={() => toggleSection('config')}
        >
          <div className="grid grid-cols-3 gap-4">
            <ConfigField
              label="CTA Mode"
              value={project.settings.cta_mode}
              icon={Target}
            />
            <ConfigField
              label="Audience Temperature"
              value={formatAudienceTemp(project.settings.audience_temperature)}
            />
            <ConfigField
              label="Duration"
              value={`${project.settings.webinar_length_minutes} minutes`}
              icon={Clock}
            />
          </div>
          <p className="text-xs mt-4" style={{ color: 'rgb(var(--text-muted))' }}>
            Configuration is set during project creation
          </p>
        </SetupSection>

        <SetupSection
          id="sources"
          title="Source Materials"
          icon={FileText}
          expanded={expandedSections.has('sources')}
          onToggle={() => toggleSection('sources')}
        >
          {isLoadingTranscripts ? (
            <div className="space-y-4">
              <div className="skeleton h-8 w-48 rounded" />
              <div className="skeleton h-32 rounded-xl" />
            </div>
          ) : (
            <SourceMaterialsSection
              transcripts={transcripts}
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
              qualityResult={qualityResult}
            />
          )}
        </SetupSection>
      </div>
    </div>
  );
}

interface SetupSectionProps {
  id: string;
  title: string;
  icon: typeof User;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SetupSection({ title, icon: Icon, expanded, onToggle, children }: SetupSectionProps) {
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

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: typeof User;
}) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-subtle))',
      }}
    >
      <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'rgb(var(--text-muted))' }}>
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <p
        className="mt-1 text-sm font-medium"
        style={{ color: value ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))' }}
      >
        {value || 'Not specified'}
      </p>
    </div>
  );
}

function ConfigField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Target;
}) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-subtle))',
      }}
    >
      <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'rgb(var(--text-muted))' }}>
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <p
        className="mt-1 text-sm font-medium"
        style={{ color: 'rgb(var(--text-primary))' }}
      >
        {value}
      </p>
    </div>
  );
}

interface SourceMaterialsSectionProps {
  transcripts: TranscriptData | null;
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
  qualityResult: ReturnType<typeof assessInputQuality>;
}

function SourceMaterialsSection({
  transcripts,
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
  qualityResult,
}: SourceMaterialsSectionProps) {
  const currentBuild = isEditing ? editedBuild : (transcripts?.build_transcript || '');
  const currentIntake = isEditing ? editedIntake : (transcripts?.intake_transcript || '');
  const currentNotes = isEditing ? editedNotes : (transcripts?.operator_notes || '');

  return (
    <div className="space-y-4">
      <InputQualityIndicator quality={qualityResult} showDetails />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
            Transcripts
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
                {t === 'build' ? 'Build Transcript' : t === 'intake' ? 'Intake Call' : 'Operator Notes'}
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
              placeholder="Paste the build call transcript here..."
            />
          )}
          {activeTranscript === 'intake' && (
            <TranscriptPanel
              content={currentIntake}
              isEditing={isEditing}
              onChange={onSetEditedIntake}
              placeholder="Paste the intake call transcript (optional)..."
            />
          )}
          {activeTranscript === 'notes' && (
            <TranscriptPanel
              content={currentNotes}
              isEditing={isEditing}
              onChange={onSetEditedNotes}
              placeholder="Add operator notes (optional)..."
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

function formatAudienceTemp(temp: string): string {
  switch (temp) {
    case 'cold': return 'Cold';
    case 'warm': return 'Warm';
    case 'hot': return 'Hot';
    default: return temp;
  }
}
