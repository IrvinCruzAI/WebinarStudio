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
  Sparkles,
  Copy,
  Check,
  Thermometer,
  X,
} from 'lucide-react';
import type { CTA, AudienceTemperature } from '../../contracts';
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
  onSettingsChange?: (updates: Partial<ProjectMetadata['settings']>) => void;
}

export function ProjectSetupTab({
  project,
  artifacts,
  isPipelineRunning,
  onRunPipeline,
  onUpdateProject,
  onSettingsChange,
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
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editedCtaMode, setEditedCtaMode] = useState<CTA>(project.settings.cta_mode);
  const [editedAudienceTemp, setEditedAudienceTemp] = useState<AudienceTemperature>(project.settings.audience_temperature);
  const [editedDuration, setEditedDuration] = useState(project.settings.webinar_length_minutes);
  const [configChanged, setConfigChanged] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedClientName, setEditedClientName] = useState(project.settings?.client_name || '');
  const [editedSpeakerName, setEditedSpeakerName] = useState(project.settings?.speaker_name || '');
  const [editedCompanyName, setEditedCompanyName] = useState(project.settings?.company_name || '');
  const [editedContactEmail, setEditedContactEmail] = useState(project.settings?.contact_email || '');

  useEffect(() => {
    loadTranscripts();
  }, [project.project_id]);

  useEffect(() => {
    setEditedCtaMode(project.settings.cta_mode);
    setEditedAudienceTemp(project.settings.audience_temperature);
    setEditedDuration(project.settings.webinar_length_minutes);
    setConfigChanged(false);
    setIsEditingConfig(false);
    setEditedClientName(project.settings?.client_name || '');
    setEditedSpeakerName(project.settings?.speaker_name || '');
    setEditedCompanyName(project.settings?.company_name || '');
    setEditedContactEmail(project.settings?.contact_email || '');
    setIsEditingProfile(false);
  }, [project.project_id, project.settings]);

  const handleSaveConfig = () => {
    if (onSettingsChange) {
      onSettingsChange({
        cta_mode: editedCtaMode,
        audience_temperature: editedAudienceTemp,
        webinar_length_minutes: editedDuration,
      });
    }
    setIsEditingConfig(false);
    setConfigChanged(
      editedCtaMode !== project.settings.cta_mode ||
      editedAudienceTemp !== project.settings.audience_temperature ||
      editedDuration !== project.settings.webinar_length_minutes
    );
  };

  const handleCancelConfigEdit = () => {
    setEditedCtaMode(project.settings.cta_mode);
    setEditedAudienceTemp(project.settings.audience_temperature);
    setEditedDuration(project.settings.webinar_length_minutes);
    setIsEditingConfig(false);
  };

  const handleSaveProfile = () => {
    if (onSettingsChange) {
      onSettingsChange({
        client_name: editedClientName.trim() || undefined,
        speaker_name: editedSpeakerName.trim() || undefined,
        company_name: editedCompanyName.trim() || undefined,
        contact_email: editedContactEmail.trim() || undefined,
      });
    }
    setIsEditingProfile(false);
  };

  const handleCancelProfileEdit = () => {
    setEditedClientName(project.settings?.client_name || '');
    setEditedSpeakerName(project.settings?.speaker_name || '');
    setEditedCompanyName(project.settings?.company_name || '');
    setEditedContactEmail(project.settings?.contact_email || '');
    setIsEditingProfile(false);
  };

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
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              {isEditingProfile ? 'Edit profile details' : 'Click Edit to update profile information'}
            </span>
            <div className="flex items-center gap-2">
              {isEditingProfile ? (
                <>
                  <button onClick={handleCancelProfileEdit} className="btn-ghost text-xs">
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} className="btn-primary text-xs">
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditingProfile(true)} className="btn-secondary text-xs">
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>
          {isEditingProfile ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  <User className="w-3.5 h-3.5" />
                  Client Name
                </label>
                <input
                  type="text"
                  value={editedClientName}
                  onChange={e => setEditedClientName(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Client or business name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  <Building2 className="w-3.5 h-3.5" />
                  Company
                </label>
                <input
                  type="text"
                  value={editedCompanyName}
                  onChange={e => setEditedCompanyName(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Company or organization"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  <User className="w-3.5 h-3.5" />
                  Speaker Name
                </label>
                <input
                  type="text"
                  value={editedSpeakerName}
                  onChange={e => setEditedSpeakerName(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Speaker or presenter name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  <Mail className="w-3.5 h-3.5" />
                  Contact Email
                </label>
                <input
                  type="email"
                  value={editedContactEmail}
                  onChange={e => setEditedContactEmail(e.target.value)}
                  className="input-field text-sm"
                  placeholder="contact@example.com"
                />
              </div>
            </div>
          ) : (
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
          )}
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
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              {isEditingConfig ? 'Edit webinar settings' : 'Click Edit to modify settings'}
            </span>
            <div className="flex items-center gap-2">
              {isEditingConfig ? (
                <>
                  <button onClick={handleCancelConfigEdit} className="btn-ghost text-xs">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button onClick={handleSaveConfig} className="btn-primary text-xs">
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditingConfig(true)} className="btn-ghost text-xs">
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {configChanged && !isEditingConfig && (
            <div
              className="p-3 rounded-xl flex items-center justify-between mb-4"
              style={{
                background: 'rgb(var(--warning) / 0.1)',
                border: '1px solid rgb(var(--warning) / 0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
                <span className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                  Settings changed. Regenerate to apply new configuration.
                </span>
              </div>
              <button onClick={onRunPipeline} disabled={isPipelineRunning} className="btn-primary text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          )}

          {isEditingConfig ? (
            <div className="grid grid-cols-3 gap-4">
              <div
                className="p-3 rounded-xl"
                style={{
                  background: 'rgb(var(--surface-base))',
                  border: '1px solid rgb(var(--accent-primary) / 0.3)',
                }}
              >
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5 mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  <Target className="w-3 h-3" />
                  CTA Mode
                </label>
                <select
                  value={editedCtaMode}
                  onChange={(e) => setEditedCtaMode(e.target.value as CTA)}
                  className="w-full px-2 py-1.5 text-sm rounded-lg"
                  style={{
                    background: 'rgb(var(--surface-elevated))',
                    border: '1px solid rgb(var(--border-default))',
                    color: 'rgb(var(--text-primary))',
                  }}
                >
                  <option value="book_call">Book a Call</option>
                  <option value="buy_now">Buy Now</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{
                  background: 'rgb(var(--surface-base))',
                  border: '1px solid rgb(var(--accent-primary) / 0.3)',
                }}
              >
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5 mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  <Thermometer className="w-3 h-3" />
                  Audience Temperature
                </label>
                <select
                  value={editedAudienceTemp}
                  onChange={(e) => setEditedAudienceTemp(e.target.value as AudienceTemperature)}
                  className="w-full px-2 py-1.5 text-sm rounded-lg"
                  style={{
                    background: 'rgb(var(--surface-elevated))',
                    border: '1px solid rgb(var(--border-default))',
                    color: 'rgb(var(--text-primary))',
                  }}
                >
                  <option value="cold">Cold</option>
                  <option value="warm">Warm</option>
                  <option value="hot">Hot</option>
                </select>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{
                  background: 'rgb(var(--surface-base))',
                  border: '1px solid rgb(var(--accent-primary) / 0.3)',
                }}
              >
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5 mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  <Clock className="w-3 h-3" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={editedDuration}
                  onChange={(e) => setEditedDuration(Math.max(15, Math.min(180, parseInt(e.target.value) || 60)))}
                  min={15}
                  max={180}
                  step={5}
                  className="w-full px-2 py-1.5 text-sm rounded-lg"
                  style={{
                    background: 'rgb(var(--surface-elevated))',
                    border: '1px solid rgb(var(--border-default))',
                    color: 'rgb(var(--text-primary))',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <ConfigField
                label="CTA Mode"
                value={formatCtaMode(project.settings.cta_mode)}
                icon={Target}
              />
              <ConfigField
                label="Audience Temperature"
                value={formatAudienceTemp(project.settings.audience_temperature)}
                icon={Thermometer}
              />
              <ConfigField
                label="Duration"
                value={`${project.settings.webinar_length_minutes} minutes`}
                icon={Clock}
              />
            </div>
          )}
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

        {hasWR1 && (
          <ProcessedTranscriptSection
            wr1={artifacts.get('WR1')?.content as WR1}
            generatedAt={wr1GeneratedAt}
            expanded={expandedSections.has('processed')}
            onToggle={() => toggleSection('processed')}
          />
        )}
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
      className="p-4 rounded-xl"
      style={{
        background: value ? 'rgb(var(--surface-base))' : 'rgb(var(--surface-elevated))',
        border: value ? '1px solid rgb(var(--border-default))' : '1px solid rgb(var(--border-default) / 0.5)',
      }}
    >
      <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>
      <p
        className="text-sm font-medium"
        style={{
          color: value ? 'rgb(var(--text-primary))' : 'rgb(var(--text-secondary))',
          opacity: value ? '1' : '0.7'
        }}
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
  icon?: React.ComponentType<{ className?: string }>;
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

function OperatorField({
  label,
  value,
  placeholder,
  isEditing,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  placeholder: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url';
}) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{
        background: 'rgb(var(--surface-base))',
        border: isEditing ? '1px solid rgb(var(--accent-primary) / 0.3)' : '1px solid rgb(var(--border-subtle))',
      }}
    >
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
        {label}
      </label>
      {isEditing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-1 px-2 py-1.5 text-sm rounded-lg bg-transparent"
          style={{
            border: '1px solid rgb(var(--border-default))',
            color: 'rgb(var(--text-primary))',
          }}
        />
      ) : (
        <p
          className="mt-1 text-sm font-medium truncate"
          style={{ color: value ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))' }}
          title={value || undefined}
        >
          {value || 'Not set'}
        </p>
      )}
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

function formatCtaMode(mode: string): string {
  switch (mode) {
    case 'book_call': return 'Book a Call';
    case 'buy_now': return 'Buy Now';
    case 'hybrid': return 'Hybrid';
    default: return mode;
  }
}

interface ProcessedTranscriptSectionProps {
  wr1: WR1;
  generatedAt: number;
  expanded: boolean;
  onToggle: () => void;
}

function ProcessedTranscriptSection({
  wr1,
  generatedAt,
  expanded,
  onToggle,
}: ProcessedTranscriptSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(wr1.cleaned_transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = wr1.cleaned_transcript.trim().split(/\s+/).filter(Boolean).length;

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
            style={{ background: 'rgb(var(--accent-primary) / 0.1)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
          </div>
          <div className="text-left">
            <span className="font-semibold block" style={{ color: 'rgb(var(--text-primary))' }}>
              AI-Processed Transcript
            </span>
            <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              Generated from build transcript
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs px-2 py-1 rounded-lg"
            style={{
              background: 'rgb(var(--surface-base))',
              color: 'rgb(var(--text-muted))',
            }}
          >
            {wordCount.toLocaleString()} words
          </span>
          {expanded ? (
            <ChevronDown className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
          ) : (
            <ChevronRight className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              <Clock className="w-3.5 h-3.5" />
              Generated: {formatDateTime(generatedAt)}
            </div>
            <button onClick={handleCopy} className="btn-ghost text-xs">
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div
            className="p-4 rounded-xl max-h-[300px] overflow-y-auto scrollbar-thin"
            style={{
              background: 'rgb(var(--surface-base))',
              border: '1px solid rgb(var(--border-subtle))',
            }}
          >
            <p
              className="text-sm whitespace-pre-wrap"
              style={{ color: 'rgb(var(--text-secondary))', lineHeight: 1.7 }}
            >
              {wr1.cleaned_transcript || 'No processed transcript available'}
            </p>
          </div>
          <p className="text-xs mt-3" style={{ color: 'rgb(var(--text-muted))' }}>
            This is the AI-cleaned version of your build transcript, used as the foundation for all deliverables.
          </p>
        </div>
      )}
    </div>
  );
}
