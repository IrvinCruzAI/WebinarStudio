import { useState, useCallback } from 'react';
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
  Sparkles,
  Thermometer,
  Clock,
  CheckCircle2,
  Circle,
  XCircle,
  Edit3,
  Check,
  X,
  Zap,
  Info,
  Quote,
  HelpCircle,
} from 'lucide-react';
import type { ProjectMetadata, DeliverableId, WR1 } from '../../contracts';
import { EditableField, EditableTextArea } from '../components/EditableField';
import { hasExecutiveSummaryError } from '../../pipeline/orchestrator';
import { checkRequiredSettings, type SettingsWarning } from '../../utils/settingsChecker';
import { SettingsWarningModal } from '../modals/SettingsWarningModal';

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
  onRegenerateExecutiveSummary?: () => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
}

interface QAResolution {
  item: string;
  status: 'pending' | 'resolved' | 'accepted' | 'needs_input';
  resolution?: string;
}

export function DossierTab({
  project,
  artifacts,
  isPipelineRunning,
  onRunPipeline,
  onEditDeliverable,
  onRegenerateExecutiveSummary,
  onNavigateToTab,
}: DossierTabProps) {
  const [viewMode, setViewMode] = useState<'formatted' | 'json'>('formatted');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'client', 'webinar', 'themes', 'proof', 'qa'])
  );
  const [qaResolutions, setQaResolutions] = useState<Map<string, QAResolution>>(new Map());
  const [showSettingsWarning, setShowSettingsWarning] = useState(false);
  const [settingsWarnings, setSettingsWarnings] = useState<SettingsWarning[]>([]);

  const wr1Artifact = artifacts.get('WR1');
  const wr1 = wr1Artifact?.content as WR1 | undefined;
  const editedFields = wr1?.edited_fields || [];

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

  const handleFieldSave = useCallback(async (fieldPath: string, value: string | null) => {
    if (!wr1) return;

    const pathParts = fieldPath.split('.');
    let updatedContent = JSON.parse(JSON.stringify(wr1));
    let current: Record<string, unknown> = updatedContent;

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]] as Record<string, unknown>;
    }

    current[pathParts[pathParts.length - 1]] = value;

    if (!updatedContent.edited_fields) {
      updatedContent.edited_fields = [];
    }
    if (!updatedContent.edited_fields.includes(fieldPath)) {
      updatedContent.edited_fields.push(fieldPath);
    }

    await onEditDeliverable('WR1', '', updatedContent);
  }, [wr1, onEditDeliverable]);

  const handleFieldRevert = useCallback(async (fieldPath: string) => {
    if (!wr1) return;

    const updatedContent = JSON.parse(JSON.stringify(wr1));
    if (updatedContent.edited_fields) {
      updatedContent.edited_fields = updatedContent.edited_fields.filter(
        (f: string) => f !== fieldPath
      );
    }

    await onEditDeliverable('WR1', '', updatedContent);
  }, [wr1, onEditDeliverable]);

  const isFieldEdited = (fieldPath: string) => editedFields.includes(fieldPath);

  const handleRunPipeline = () => {
    const warnings = checkRequiredSettings(project.settings?.operator || {});
    if (warnings.length > 0) {
      setSettingsWarnings(warnings);
      setShowSettingsWarning(true);
    } else {
      onRunPipeline();
    }
  };

  const handleGenerateAnyway = () => {
    setShowSettingsWarning(false);
    onRunPipeline();
  };

  const handleConfigureSettings = () => {
    setShowSettingsWarning(false);
    if (onNavigateToTab) {
      onNavigateToTab('project-setup');
    }
  };

  const handleQAResolve = (category: string, index: number, resolution: string) => {
    const key = `${category}-${index}`;
    setQaResolutions(prev => {
      const newMap = new Map(prev);
      newMap.set(key, {
        item: wr1?.qa?.[category as keyof typeof wr1.qa]?.[index] || '',
        status: 'resolved',
        resolution,
      });
      return newMap;
    });
  };

  const handleQAAccept = (category: string, index: number) => {
    const key = `${category}-${index}`;
    setQaResolutions(prev => {
      const newMap = new Map(prev);
      newMap.set(key, {
        item: wr1?.qa?.[category as keyof typeof wr1.qa]?.[index] || '',
        status: 'accepted',
      });
      return newMap;
    });
  };

  const getQAResolution = (category: string, index: number): QAResolution | undefined => {
    return qaResolutions.get(`${category}-${index}`);
  };

  const completenessScore = calculateCompleteness(wr1, qaResolutions);

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
              onClick={handleRunPipeline}
              disabled={isPipelineRunning}
              className="btn-primary"
            >
              <Play className="w-4 h-4" />
              Run Pipeline
            </button>
          </div>
        </div>
        <SettingsWarningModal
          isOpen={showSettingsWarning}
          warnings={settingsWarnings}
          onClose={() => setShowSettingsWarning(false)}
          onGenerateAnyway={handleGenerateAnyway}
          onConfigureSettings={handleConfigureSettings}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
              Client Profile Dossier
            </h2>
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              WR1 - Strategy foundation for all deliverables
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CompletenessRing score={completenessScore} />
            <button
              onClick={() => setViewMode(viewMode === 'formatted' ? 'json' : 'formatted')}
              className="btn-ghost"
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
            <TransformationSummary
              wr1={wr1}
              project={project}
              expanded={expandedSections.has('summary')}
              onToggle={() => toggleSection('summary')}
              onRunPipeline={handleRunPipeline}
              isPipelineRunning={isPipelineRunning}
              onRegenerateExecutiveSummary={onRegenerateExecutiveSummary}
            />

            <DossierSection
              id="client"
              title="Client & Speaker"
              icon={User}
              expanded={expandedSections.has('client')}
              onToggle={() => toggleSection('client')}
              completeness={getClientCompleteness(wr1)}
            >
              <div className="grid grid-cols-2 gap-4">
                <FieldWithConfidence
                  label="Client Name"
                  value={wr1.parsed_intake.client_name}
                  fieldPath="parsed_intake.client_name"
                  isEdited={isFieldEdited('parsed_intake.client_name')}
                  onSave={handleFieldSave}
                  onRevert={handleFieldRevert}
                  confidence={wr1.parsed_intake.client_name ? 'high' : 'missing'}
                  source={wr1.parsed_intake.client_name ? 'extracted' : undefined}
                  critical
                />
                <FieldWithConfidence
                  label="Company"
                  value={wr1.parsed_intake.company}
                  fieldPath="parsed_intake.company"
                  isEdited={isFieldEdited('parsed_intake.company')}
                  onSave={handleFieldSave}
                  onRevert={handleFieldRevert}
                  confidence={wr1.parsed_intake.company ? 'high' : 'low'}
                  source={wr1.parsed_intake.company ? 'extracted' : 'inferred'}
                />
                <FieldWithConfidence
                  label="Speaker Name"
                  value={wr1.parsed_intake.speaker_name}
                  fieldPath="parsed_intake.speaker_name"
                  isEdited={isFieldEdited('parsed_intake.speaker_name')}
                  onSave={handleFieldSave}
                  onRevert={handleFieldRevert}
                  confidence={wr1.parsed_intake.speaker_name ? 'high' : 'low'}
                  source={wr1.parsed_intake.speaker_name ? 'extracted' : undefined}
                />
                <FieldWithConfidence
                  label="Speaker Title"
                  value={wr1.parsed_intake.speaker_title}
                  fieldPath="parsed_intake.speaker_title"
                  isEdited={isFieldEdited('parsed_intake.speaker_title')}
                  onSave={handleFieldSave}
                  onRevert={handleFieldRevert}
                  confidence={wr1.parsed_intake.speaker_title ? 'medium' : 'low'}
                  source={wr1.parsed_intake.speaker_title ? 'inferred' : undefined}
                />
              </div>
            </DossierSection>

            <DossierSection
              id="webinar"
              title="Webinar Overview"
              icon={Lightbulb}
              expanded={expandedSections.has('webinar')}
              onToggle={() => toggleSection('webinar')}
              completeness={getWebinarCompleteness(wr1)}
            >
              <div className="space-y-4">
                <EditableTextArea
                  label="Webinar Title"
                  value={wr1.parsed_intake.webinar_title}
                  fieldPath="parsed_intake.webinar_title"
                  isEdited={isFieldEdited('parsed_intake.webinar_title')}
                  onSave={handleFieldSave}
                  onRevert={handleFieldRevert}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-4">
                  <EditableTextArea
                    label="Offer"
                    value={wr1.parsed_intake.offer}
                    fieldPath="parsed_intake.offer"
                    isEdited={isFieldEdited('parsed_intake.offer')}
                    onSave={handleFieldSave}
                    onRevert={handleFieldRevert}
                  />
                  <EditableField
                    label="Tone"
                    value={wr1.parsed_intake.tone}
                    fieldPath="parsed_intake.tone"
                    isEdited={isFieldEdited('parsed_intake.tone')}
                    onSave={handleFieldSave}
                    onRevert={handleFieldRevert}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    label="Primary CTA Type"
                    value={wr1.parsed_intake.primary_cta_type}
                    fieldPath="parsed_intake.primary_cta_type"
                    isEdited={isFieldEdited('parsed_intake.primary_cta_type')}
                    onSave={handleFieldSave}
                    onRevert={handleFieldRevert}
                  />
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
                      Target Duration
                    </label>
                    <div
                      className="mt-1 p-3 rounded-lg flex items-center gap-2"
                      style={{
                        background: 'rgb(var(--surface-base))',
                        border: '1px solid rgb(var(--border-subtle))',
                      }}
                    >
                      <Clock className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
                      <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                        {project.settings.webinar_length_minutes} minutes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </DossierSection>

            <DossierSection
              id="audience"
              title="Target Audience"
              icon={Target}
              expanded={expandedSections.has('audience')}
              onToggle={() => toggleSection('audience')}
              completeness={wr1.parsed_intake.target_audience ? 100 : 0}
              highlight="strategic"
            >
              <AudienceSection
                targetAudience={wr1.parsed_intake.target_audience}
                audienceTemperature={project.settings.audience_temperature}
                onSave={handleFieldSave}
                onRevert={handleFieldRevert}
                isEdited={isFieldEdited('parsed_intake.target_audience')}
              />
            </DossierSection>

            <DossierSection
              id="themes"
              title="Main Themes"
              icon={Lightbulb}
              expanded={expandedSections.has('themes')}
              onToggle={() => toggleSection('themes')}
              completeness={getThemesCompleteness(wr1)}
              highlight="strategic"
            >
              <div className="space-y-4">
                <ArrayDisplay label="Main Themes" items={wr1.main_themes} highlight />
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
              completeness={getProofCompleteness(wr1)}
              highlight="proof"
            >
              <ProofVaultSection proofPoints={wr1.proof_points} />
            </DossierSection>

            <DossierSection
              id="qa"
              title="Quality Assurance"
              icon={AlertTriangle}
              expanded={expandedSections.has('qa')}
              onToggle={() => toggleSection('qa')}
              completeness={getQACompleteness(wr1, qaResolutions)}
              highlight="qa"
            >
              <ActionableQASection
                qa={wr1.qa}
                resolutions={qaResolutions}
                onResolve={handleQAResolve}
                onAccept={handleQAAccept}
                getResolution={getQAResolution}
              />
            </DossierSection>

            <GapAnalysis wr1={wr1} project={project} qaResolutions={qaResolutions} />
          </>
        )}
      </div>
      <SettingsWarningModal
        isOpen={showSettingsWarning}
        warnings={settingsWarnings}
        onClose={() => setShowSettingsWarning(false)}
        onGenerateAnyway={handleGenerateAnyway}
        onConfigureSettings={handleConfigureSettings}
      />
    </div>
  );
}

function CompletenessRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 85) return 'rgb(var(--success))';
    if (score >= 60) return 'rgb(var(--warning))';
    return 'rgb(var(--error))';
  };

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="rgb(var(--border-default))"
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke={getColor()}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span
        className="absolute text-xs font-bold"
        style={{ color: getColor() }}
      >
        {score}%
      </span>
    </div>
  );
}

interface TransformationSummaryProps {
  wr1: WR1;
  project: ProjectMetadata;
  expanded: boolean;
  onToggle: () => void;
  onRunPipeline: () => void;
  isPipelineRunning: boolean;
  onRegenerateExecutiveSummary?: () => Promise<void>;
}

function TransformationSummary({
  wr1,
  project,
  expanded,
  onToggle,
  onRunPipeline,
  isPipelineRunning,
  onRegenerateExecutiveSummary,
}: TransformationSummaryProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const summary = wr1.executive_summary;
  const hasSummaryError = hasExecutiveSummaryError(wr1);

  const handleRegenerate = async () => {
    if (!onRegenerateExecutiveSummary || isRegenerating) return;
    setIsRegenerating(true);
    try {
      await onRegenerateExecutiveSummary();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all hover:shadow-sm"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1.5px solid rgb(var(--border-default))',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-xl"
            style={{ background: 'rgb(var(--accent-primary) / 0.15)' }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'rgb(var(--accent-primary))' }} />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
              Strategic Summary
            </h3>
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              What this webinar is about and why the audience should care
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 transition-transform" style={{ color: 'rgb(var(--text-muted))' }} />
        ) : (
          <ChevronRight className="w-5 h-5 transition-transform" style={{ color: 'rgb(var(--text-muted))' }} />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {hasSummaryError ? (
            <div className="text-center py-8">
              <div
                className="inline-flex p-3 rounded-full mb-4"
                style={{ background: 'rgb(var(--error) / 0.1)' }}
              >
                <AlertTriangle className="w-8 h-8" style={{ color: 'rgb(var(--error))' }} />
              </div>
              <p className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                Executive Summary Error
              </p>
              <p className="text-sm mb-4" style={{ color: 'rgb(var(--text-muted))' }}>
                {!summary ? 'The executive summary failed to generate' : 'The executive summary is incomplete or invalid'}
              </p>
              {onRegenerateExecutiveSummary && (
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || isPipelineRunning}
                  className="btn-primary text-sm"
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Regenerate Summary
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgb(var(--surface-base))',
                  border: '1px solid rgb(var(--border-subtle))',
                }}
              >
                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'rgb(var(--text-primary))' }}
                >
                  {summary.overview}
                </p>
              </div>

              {summary.key_points.length > 0 && (
                <div>
                  <h4
                    className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    Key Strategic Points
                  </h4>
                  <div className="grid gap-2">
                    {summary.key_points.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{
                          background: 'rgb(var(--surface-base))',
                          border: '1px solid rgb(var(--border-subtle))',
                        }}
                      >
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: 'rgb(var(--accent-primary) / 0.15)',
                            color: 'rgb(var(--accent-primary))',
                          }}
                        >
                          {index + 1}
                        </span>
                        <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <StrategicImplications
                audienceTemp={project.settings.audience_temperature}
                ctaMode={project.settings.cta_mode}
                themes={wr1.main_themes}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StrategicImplicationsProps {
  audienceTemp: string;
  ctaMode: string;
  themes: string[];
}

function StrategicImplications({ audienceTemp, ctaMode, themes }: StrategicImplicationsProps) {
  const implications = [];

  if (audienceTemp === 'cold') {
    implications.push({
      icon: Thermometer,
      text: 'Cold audience means extra education is needed. The Opening Hook and Problem Amplification phases should be extended.',
      type: 'info',
    });
  } else if (audienceTemp === 'hot') {
    implications.push({
      icon: Zap,
      text: 'Hot audience is ready to act. Move quickly to the offer and minimize educational content.',
      type: 'success',
    });
  }

  if (ctaMode === 'book_call') {
    implications.push({
      icon: Target,
      text: 'Book-a-call CTA requires building trust and demonstrating expertise. Include more case studies and testimonials.',
      type: 'info',
    });
  }

  if (themes.length < 3) {
    implications.push({
      icon: AlertTriangle,
      text: 'Only ' + themes.length + ' main themes identified. Consider expanding content depth for a more comprehensive webinar.',
      type: 'warning',
    });
  }

  if (implications.length === 0) return null;

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'rgb(var(--accent-primary) / 0.05)',
        border: '1px solid rgb(var(--accent-primary) / 0.1)',
      }}
    >
      <h4
        className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
        style={{ color: 'rgb(var(--accent-primary))' }}
      >
        <Lightbulb className="w-4 h-4" />
        What This Means for Your Webinar
      </h4>
      <ul className="space-y-2">
        {implications.map((imp, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
            <imp.icon
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{
                color: imp.type === 'warning' ? 'rgb(var(--warning))' :
                       imp.type === 'success' ? 'rgb(var(--success))' :
                       'rgb(var(--accent-primary))'
              }}
            />
            {imp.text}
          </li>
        ))}
      </ul>
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
  completeness?: number;
  highlight?: 'strategic' | 'proof' | 'qa';
}

function DossierSection({
  title,
  icon: Icon,
  expanded,
  onToggle,
  children,
  completeness,
  highlight,
}: DossierSectionProps) {
  const getHighlightStyle = () => {
    switch (highlight) {
      case 'strategic':
        return {
          background: 'rgb(var(--accent-primary) / 0.04)',
          border: '2px solid rgb(var(--accent-primary) / 0.2)',
          iconBg: 'rgb(var(--accent-primary) / 0.12)',
          iconColor: 'rgb(var(--accent-primary))',
        };
      case 'proof':
        return {
          background: 'rgb(var(--success) / 0.04)',
          border: '2px solid rgb(var(--success) / 0.2)',
          iconBg: 'rgb(var(--success) / 0.12)',
          iconColor: 'rgb(var(--success))',
        };
      case 'qa':
        return {
          background: 'rgb(var(--warning) / 0.04)',
          border: '2px solid rgb(var(--warning) / 0.2)',
          iconBg: 'rgb(var(--warning) / 0.12)',
          iconColor: 'rgb(var(--warning))',
        };
      default:
        return {
          background: 'rgb(var(--surface-elevated))',
          border: '1.5px solid rgb(var(--border-default))',
          iconBg: 'rgb(var(--surface-base))',
          iconColor: 'rgb(var(--text-muted))',
        };
    }
  };

  const style = getHighlightStyle();

  return (
    <div className="rounded-xl overflow-hidden transition-all hover:shadow-sm" style={{ background: style.background, border: style.border }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-4">
          <div
            className="p-2.5 rounded-lg transition-all"
            style={{ background: style.iconBg }}
          >
            <Icon className="w-5 h-5" style={{ color: style.iconColor }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-base" style={{ color: 'rgb(var(--text-primary))' }}>
              {title}
            </span>
            {completeness !== undefined && (
              <CompletenessChip value={completeness} />
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 transition-transform" style={{ color: 'rgb(var(--text-muted))' }} />
        ) : (
          <ChevronRight className="w-5 h-5 transition-transform" style={{ color: 'rgb(var(--text-muted))' }} />
        )}
      </button>
      {expanded && (
        <div className="px-5 pb-5 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

function CompletenessChip({ value }: { value: number }) {
  const getStyle = () => {
    if (value >= 100) {
      return { bg: 'rgb(var(--success) / 0.15)', color: 'rgb(var(--success))', border: 'rgb(var(--success) / 0.3)' };
    }
    if (value >= 60) {
      return { bg: 'rgb(var(--warning) / 0.15)', color: 'rgb(var(--warning))', border: 'rgb(var(--warning) / 0.3)' };
    }
    return { bg: 'rgb(var(--error) / 0.15)', color: 'rgb(var(--error))', border: 'rgb(var(--error) / 0.3)' };
  };

  const style = getStyle();

  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {value >= 100 ? 'Complete' : `${value}%`}
    </span>
  );
}

interface FieldWithConfidenceProps {
  label: string;
  value: string | null;
  fieldPath: string;
  isEdited: boolean;
  onSave: (path: string, value: string | null) => Promise<void>;
  onRevert: (path: string) => Promise<void>;
  confidence: 'high' | 'medium' | 'low' | 'missing';
  source?: 'extracted' | 'inferred';
  critical?: boolean;
}

function FieldWithConfidence({
  label,
  value,
  fieldPath,
  isEdited,
  onSave,
  onRevert,
  confidence,
  source,
  critical,
}: FieldWithConfidenceProps) {
  const confidenceStyles = {
    high: { icon: CheckCircle2, color: 'rgb(var(--success))', label: 'Confident' },
    medium: { icon: Circle, color: 'rgb(var(--warning))', label: 'Verify' },
    low: { icon: HelpCircle, color: 'rgb(var(--error))', label: 'Needs review' },
    missing: { icon: XCircle, color: 'rgb(var(--error))', label: 'Missing' },
  };

  const conf = confidenceStyles[confidence];
  const ConfIcon = conf.icon;

  return (
    <div className="relative">
      <EditableField
        label={label}
        value={value}
        fieldPath={fieldPath}
        isEdited={isEdited}
        onSave={onSave}
        onRevert={onRevert}
      />
      <div className="flex items-center gap-2 mt-1">
        <div className="flex items-center gap-1">
          <ConfIcon className="w-3 h-3" style={{ color: conf.color }} />
          <span className="text-xs" style={{ color: conf.color }}>
            {conf.label}
          </span>
        </div>
        {source && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgb(var(--surface-base))', color: 'rgb(var(--text-muted))' }}>
            {source === 'extracted' ? 'From transcript' : 'AI inferred'}
          </span>
        )}
        {critical && !value && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgb(var(--error) / 0.1)', color: 'rgb(var(--error))' }}>
            Required
          </span>
        )}
      </div>
    </div>
  );
}

interface AudienceSectionProps {
  targetAudience: string | null;
  audienceTemperature: string;
  onSave: (path: string, value: string | null) => Promise<void>;
  onRevert: (path: string) => Promise<void>;
  isEdited: boolean;
}

function AudienceSection({
  targetAudience,
  audienceTemperature,
  onSave,
  onRevert,
  isEdited,
}: AudienceSectionProps) {
  const tempInfo = {
    cold: {
      label: 'Cold',
      desc: 'This audience is unfamiliar with the problem. Content should start with education and awareness.',
      color: '--accent-secondary',
    },
    warm: {
      label: 'Warm',
      desc: 'This audience knows the problem exists. Content should focus on your unique solution.',
      color: '--warning',
    },
    hot: {
      label: 'Hot',
      desc: 'This audience is ready to buy. Content should emphasize urgency and clear next steps.',
      color: '--error',
    },
  };

  const temp = tempInfo[audienceTemperature as keyof typeof tempInfo] || tempInfo.warm;

  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl flex items-start gap-4"
        style={{
          background: `rgb(var(${temp.color}) / 0.05)`,
          border: `1px solid rgb(var(${temp.color}) / 0.15)`,
        }}
      >
        <Thermometer className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: `rgb(var(${temp.color}))` }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
            {temp.label} Audience Configuration
          </p>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            {temp.desc}
          </p>
        </div>
      </div>

      <EditableTextArea
        label="Target Audience Description"
        value={targetAudience}
        fieldPath="parsed_intake.target_audience"
        isEdited={isEdited}
        onSave={onSave}
        onRevert={onRevert}
        rows={3}
      />
    </div>
  );
}

function ArrayDisplay({ label, items, highlight }: { label: string; items: string[]; highlight?: boolean }) {
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
      <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-2" style={{ color: 'rgb(var(--text-muted))' }}>
        {label}
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgb(var(--surface-base))' }}>
          {items.length}
        </span>
      </label>
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-3 py-1.5 text-sm rounded-lg"
            style={{
              background: highlight ? 'rgb(var(--accent-primary) / 0.1)' : 'rgb(var(--surface-base))',
              color: highlight ? 'rgb(var(--accent-primary))' : 'rgb(var(--text-secondary))',
              border: highlight ? '1px solid rgb(var(--accent-primary) / 0.2)' : '1px solid rgb(var(--border-subtle))',
              fontWeight: highlight ? 500 : 400,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

interface ProofVaultSectionProps {
  proofPoints: Array<{ type: string; content: string; source: string | null }>;
}

function ProofVaultSection({ proofPoints }: ProofVaultSectionProps) {
  if (!proofPoints || proofPoints.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgb(var(--text-muted))' }} />
        <p className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
          No Proof Points Found
        </p>
        <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
          Add testimonials, metrics, or case studies to strengthen credibility
        </p>
      </div>
    );
  }

  const grouped = {
    testimonial: proofPoints.filter(p => p.type === 'testimonial'),
    metric: proofPoints.filter(p => p.type === 'metric'),
    case_study: proofPoints.filter(p => p.type === 'case_study'),
  };

  const needsSource = proofPoints.filter(p => !p.source).length;

  return (
    <div className="space-y-4">
      {needsSource > 0 && (
        <div
          className="p-3 rounded-xl flex items-center gap-3"
          style={{
            background: 'rgb(var(--warning) / 0.1)',
            border: '1px solid rgb(var(--warning) / 0.2)',
          }}
        >
          <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
          <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
            {needsSource} proof point{needsSource > 1 ? 's' : ''} need source attribution
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { type: 'testimonial', label: 'Testimonials', color: '--success' },
          { type: 'metric', label: 'Metrics', color: '--accent-primary' },
          { type: 'case_study', label: 'Case Studies', color: '--warning' },
        ].map(({ type, label, color }) => (
          <div
            key={type}
            className="p-3 rounded-xl text-center"
            style={{
              background: `rgb(var(${color}) / 0.05)`,
              border: `1px solid rgb(var(${color}) / 0.15)`,
            }}
          >
            <p className="text-2xl font-bold" style={{ color: `rgb(var(${color}))` }}>
              {grouped[type as keyof typeof grouped].length}
            </p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {proofPoints.map((proof, index) => (
          <ProofPointCard key={index} proof={proof} />
        ))}
      </div>
    </div>
  );
}

function ProofPointCard({ proof }: { proof: { type: string; content: string; source: string | null } }) {
  const typeConfig: Record<string, { bg: string; text: string; icon: typeof Quote }> = {
    testimonial: { bg: 'rgb(var(--success) / 0.1)', text: 'rgb(var(--success))', icon: Quote },
    metric: { bg: 'rgb(var(--accent-primary) / 0.1)', text: 'rgb(var(--accent-primary))', icon: Target },
    case_study: { bg: 'rgb(var(--warning) / 0.1)', text: 'rgb(var(--warning))', icon: FileText },
  };

  const config = typeConfig[proof.type] || typeConfig.testimonial;

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'rgb(var(--surface-base))',
        border: proof.source ? '1px solid rgb(var(--border-subtle))' : '1px solid rgb(var(--warning) / 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: config.bg }}
        >
          <config.icon className="w-3.5 h-3.5" style={{ color: config.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
              style={{ background: config.bg, color: config.text }}
            >
              {proof.type.replace('_', ' ')}
            </span>
            {!proof.source && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgb(var(--warning) / 0.1)', color: 'rgb(var(--warning))' }}
              >
                Source needed
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
            {proof.content}
          </p>
          {proof.source && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'rgb(var(--text-muted))' }}>
              <CheckCircle2 className="w-3 h-3" style={{ color: 'rgb(var(--success))' }} />
              Source: {proof.source}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActionableQASectionProps {
  qa: { assumptions: string[]; placeholders: string[]; claims_requiring_proof: string[] };
  resolutions: Map<string, QAResolution>;
  onResolve: (category: string, index: number, resolution: string) => void;
  onAccept: (category: string, index: number) => void;
  getResolution: (category: string, index: number) => QAResolution | undefined;
}

function ActionableQASection({
  qa,
  resolutions,
  onResolve,
  onAccept,
  getResolution,
}: ActionableQASectionProps) {
  const totalIssues = qa.assumptions.length + qa.placeholders.length + qa.claims_requiring_proof.length;
  const resolvedCount = Array.from(resolutions.values()).filter(r => r.status === 'resolved' || r.status === 'accepted').length;

  if (totalIssues === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgb(var(--success))' }} />
        <p className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
          No Quality Issues Detected
        </p>
        <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
          The dossier passed all automated quality checks
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="p-4 rounded-xl flex items-center justify-between"
        style={{
          background: resolvedCount === totalIssues ? 'rgb(var(--success) / 0.1)' : 'rgb(var(--surface-base))',
          border: `1px solid ${resolvedCount === totalIssues ? 'rgb(var(--success) / 0.2)' : 'rgb(var(--border-subtle))'}`,
        }}
      >
        <div className="flex items-center gap-3">
          {resolvedCount === totalIssues ? (
            <CheckCircle2 className="w-5 h-5" style={{ color: 'rgb(var(--success))' }} />
          ) : (
            <AlertTriangle className="w-5 h-5" style={{ color: 'rgb(var(--warning))' }} />
          )}
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
              {resolvedCount === totalIssues ? 'All Issues Addressed' : `${totalIssues - resolvedCount} items need attention`}
            </p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              {resolvedCount} of {totalIssues} resolved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalIssues }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i < resolvedCount ? 'rgb(var(--success))' : 'rgb(var(--border-default))',
              }}
            />
          ))}
        </div>
      </div>

      {qa.placeholders.length > 0 && (
        <QACategory
          title="Placeholders to Fill"
          description="These require your input before the deliverables are complete"
          items={qa.placeholders}
          category="placeholders"
          severity="high"
          onResolve={onResolve}
          onAccept={onAccept}
          getResolution={getResolution}
        />
      )}

      {qa.assumptions.length > 0 && (
        <QACategory
          title="AI Assumptions Made"
          description="The AI made these educated guesses. Confirm or correct them."
          items={qa.assumptions}
          category="assumptions"
          severity="medium"
          onResolve={onResolve}
          onAccept={onAccept}
          getResolution={getResolution}
        />
      )}

      {qa.claims_requiring_proof.length > 0 && (
        <QACategory
          title="Claims Needing Proof"
          description="These statements should be backed by evidence or sources"
          items={qa.claims_requiring_proof}
          category="claims_requiring_proof"
          severity="low"
          onResolve={onResolve}
          onAccept={onAccept}
          getResolution={getResolution}
        />
      )}
    </div>
  );
}

interface QACategoryProps {
  title: string;
  description: string;
  items: string[];
  category: string;
  severity: 'high' | 'medium' | 'low';
  onResolve: (category: string, index: number, resolution: string) => void;
  onAccept: (category: string, index: number) => void;
  getResolution: (category: string, index: number) => QAResolution | undefined;
}

function QACategory({
  title,
  description,
  items,
  category,
  severity,
  onResolve,
  onAccept,
  getResolution,
}: QACategoryProps) {
  const severityConfig = {
    high: { color: '--error', label: 'High Priority', icon: XCircle },
    medium: { color: '--warning', label: 'Medium', icon: AlertTriangle },
    low: { color: '--accent-primary', label: 'Low', icon: Info },
  };

  const config = severityConfig[severity];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <config.icon className="w-4 h-4" style={{ color: `rgb(var(${config.color}))` }} />
        <h4 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
          {title}
        </h4>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ background: `rgb(var(${config.color}) / 0.1)`, color: `rgb(var(${config.color}))` }}
        >
          {items.length}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-muted))' }}>
        {description}
      </p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <QAItem
            key={index}
            item={item}
            category={category}
            index={index}
            severity={severity}
            resolution={getResolution(category, index)}
            onResolve={onResolve}
            onAccept={onAccept}
          />
        ))}
      </div>
    </div>
  );
}

interface QAItemProps {
  item: string;
  category: string;
  index: number;
  severity: 'high' | 'medium' | 'low';
  resolution?: QAResolution;
  onResolve: (category: string, index: number, resolution: string) => void;
  onAccept: (category: string, index: number) => void;
}

function QAItem({
  item,
  category,
  index,
  severity,
  resolution,
  onResolve,
  onAccept,
}: QAItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const isResolved = resolution?.status === 'resolved' || resolution?.status === 'accepted';

  const severityColors = {
    high: '--error',
    medium: '--warning',
    low: '--accent-primary',
  };

  const handleSave = () => {
    onResolve(category, index, editValue);
    setIsEditing(false);
    setEditValue('');
  };

  if (isResolved) {
    return (
      <div
        className="p-3 rounded-xl flex items-start gap-3"
        style={{
          background: 'rgb(var(--success) / 0.05)',
          border: '1px solid rgb(var(--success) / 0.15)',
        }}
      >
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--success))' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm line-through" style={{ color: 'rgb(var(--text-muted))' }}>
            {item}
          </p>
          {resolution?.resolution && (
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--success))' }}>
              Resolved: {resolution.resolution}
            </p>
          )}
          {resolution?.status === 'accepted' && (
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
              Accepted as-is
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded-xl"
      style={{
        background: `rgb(var(${severityColors[severity]}) / 0.05)`,
        border: `1px solid rgb(var(${severityColors[severity]}) / 0.15)`,
      }}
    >
      <div className="flex items-start gap-3">
        <Circle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: `rgb(var(${severityColors[severity]}))` }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
            {item}
          </p>

          {isEditing ? (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter correction or additional info..."
                className="input-field text-sm"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button onClick={handleSave} className="btn-primary text-xs py-1.5">
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="btn-ghost text-xs py-1.5">
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="btn-ghost text-xs py-1"
              >
                <Edit3 className="w-3 h-3" />
                Correct
              </button>
              <button
                onClick={() => onAccept(category, index)}
                className="btn-ghost text-xs py-1"
              >
                <Check className="w-3 h-3" />
                Accept as-is
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GapAnalysisProps {
  wr1: WR1;
  project: ProjectMetadata;
  qaResolutions: Map<string, QAResolution>;
}

function GapAnalysis({ wr1, project, qaResolutions }: GapAnalysisProps) {
  const gaps: Array<{ issue: string; recommendation: string; severity: 'high' | 'medium' | 'low' }> = [];

  if (!wr1.parsed_intake.client_name) {
    gaps.push({
      issue: 'Missing client name',
      recommendation: 'Add the client or business name in the Client & Speaker section',
      severity: 'high',
    });
  }

  if (!wr1.parsed_intake.target_audience) {
    gaps.push({
      issue: 'Target audience not defined',
      recommendation: 'Specify who this webinar is for in the Target Audience section',
      severity: 'high',
    });
  }

  if (wr1.proof_points.length === 0) {
    gaps.push({
      issue: 'No proof points',
      recommendation: 'Add testimonials, metrics, or case studies to build credibility',
      severity: 'medium',
    });
  }

  const unsourcedProof = wr1.proof_points.filter(p => !p.source).length;
  if (unsourcedProof > 0) {
    gaps.push({
      issue: `${unsourcedProof} proof point${unsourcedProof > 1 ? 's' : ''} without sources`,
      recommendation: 'Add source attribution to make claims verifiable',
      severity: 'low',
    });
  }

  if (wr1.main_themes.length < 3) {
    gaps.push({
      issue: 'Limited main themes',
      recommendation: 'Consider expanding content depth for a richer webinar experience',
      severity: 'low',
    });
  }

  const unresolvedQA = (wr1.qa.assumptions.length + wr1.qa.placeholders.length + wr1.qa.claims_requiring_proof.length) -
    Array.from(qaResolutions.values()).filter(r => r.status === 'resolved' || r.status === 'accepted').length;

  if (unresolvedQA > 0) {
    gaps.push({
      issue: `${unresolvedQA} unresolved QA item${unresolvedQA > 1 ? 's' : ''}`,
      recommendation: 'Review and address items in the Quality Assurance section',
      severity: unresolvedQA > 3 ? 'high' : 'medium',
    });
  }

  if (gaps.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center transition-all hover:shadow-sm"
        style={{
          background: 'linear-gradient(135deg, rgb(var(--success) / 0.08) 0%, rgb(var(--success) / 0.03) 100%)',
          border: '2px solid rgb(var(--success) / 0.25)',
        }}
      >
        <div className="inline-flex p-3 rounded-full mb-4" style={{ background: 'rgb(var(--success) / 0.15)' }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: 'rgb(var(--success))' }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
          Dossier Complete
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
          All required fields are filled and quality checks pass. Ready to generate deliverables.
        </p>
      </div>
    );
  }

  const highCount = gaps.filter(g => g.severity === 'high').length;
  const medCount = gaps.filter(g => g.severity === 'medium').length;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all hover:shadow-sm"
      style={{
        background: 'rgb(var(--surface-elevated))',
        border: '1.5px solid rgb(var(--border-default))',
      }}
    >
      <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: 'rgb(var(--border-default))' }}>
        <div className="flex items-center gap-4">
          <div
            className="p-2.5 rounded-lg"
            style={{ background: 'rgb(var(--warning) / 0.12)' }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: 'rgb(var(--warning))' }} />
          </div>
          <div>
            <h3 className="font-semibold text-base" style={{ color: 'rgb(var(--text-primary))' }}>
              Gap Analysis
            </h3>
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              {gaps.length} {gaps.length === 1 ? 'item' : 'items'} to improve
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {gaps.map((gap, index) => {
          const severityIcons = {
            high: XCircle,
            medium: AlertTriangle,
            low: Info,
          };
          const severityColors = {
            high: {
              bg: 'linear-gradient(135deg, rgb(var(--error) / 0.08) 0%, rgb(var(--error) / 0.03) 100%)',
              border: 'rgb(var(--error) / 0.25)',
              text: 'rgb(var(--error))',
              iconBg: 'rgb(var(--error) / 0.12)',
            },
            medium: {
              bg: 'linear-gradient(135deg, rgb(var(--warning) / 0.08) 0%, rgb(var(--warning) / 0.03) 100%)',
              border: 'rgb(var(--warning) / 0.25)',
              text: 'rgb(var(--warning))',
              iconBg: 'rgb(var(--warning) / 0.12)',
            },
            low: {
              bg: 'linear-gradient(135deg, rgb(var(--accent-primary) / 0.08) 0%, rgb(var(--accent-primary) / 0.03) 100%)',
              border: 'rgb(var(--accent-primary) / 0.25)',
              text: 'rgb(var(--accent-primary))',
              iconBg: 'rgb(var(--accent-primary) / 0.12)',
            },
          };
          const colors = severityColors[gap.severity];
          const SeverityIcon = severityIcons[gap.severity];

          return (
            <div
              key={index}
              className="p-4 rounded-lg flex items-start gap-3"
              style={{
                background: colors.bg,
                border: `1.5px solid ${colors.border}`,
              }}
            >
              <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: colors.iconBg }}>
                <SeverityIcon className="w-4 h-4" style={{ color: colors.text }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-primary))' }}>
                  {gap.issue}
                </p>
                <p className="text-xs flex items-center gap-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
                  <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.text }} />
                  {gap.recommendation}
                </p>
              </div>
            </div>
          );
        })}
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

function calculateCompleteness(wr1: WR1 | undefined, qaResolutions: Map<string, QAResolution>): number {
  if (!wr1) return 0;

  let score = 0;
  let total = 0;

  const fields = [
    { value: wr1.parsed_intake.client_name, weight: 15 },
    { value: wr1.parsed_intake.company, weight: 10 },
    { value: wr1.parsed_intake.webinar_title, weight: 10 },
    { value: wr1.parsed_intake.target_audience, weight: 15 },
    { value: wr1.parsed_intake.offer, weight: 10 },
    { value: wr1.executive_summary?.overview, weight: 10 },
    { value: wr1.main_themes.length > 0, weight: 10 },
    { value: wr1.proof_points.length > 0, weight: 10 },
  ];

  fields.forEach(f => {
    total += f.weight;
    if (f.value) score += f.weight;
  });

  const qaTotal = wr1.qa.assumptions.length + wr1.qa.placeholders.length + wr1.qa.claims_requiring_proof.length;
  const qaResolved = Array.from(qaResolutions.values()).filter(r => r.status === 'resolved' || r.status === 'accepted').length;

  if (qaTotal > 0) {
    total += 10;
    score += (qaResolved / qaTotal) * 10;
  }

  return Math.round((score / total) * 100);
}

function getClientCompleteness(wr1: WR1): number {
  let filled = 0;
  if (wr1.parsed_intake.client_name) filled++;
  if (wr1.parsed_intake.company) filled++;
  if (wr1.parsed_intake.speaker_name) filled++;
  if (wr1.parsed_intake.speaker_title) filled++;
  return Math.round((filled / 4) * 100);
}

function getWebinarCompleteness(wr1: WR1): number {
  let filled = 0;
  if (wr1.parsed_intake.webinar_title) filled++;
  if (wr1.parsed_intake.offer) filled++;
  if (wr1.parsed_intake.tone) filled++;
  if (wr1.parsed_intake.primary_cta_type) filled++;
  return Math.round((filled / 4) * 100);
}

function getThemesCompleteness(wr1: WR1): number {
  const hasThemes = wr1.main_themes.length >= 3;
  const hasNotes = wr1.structured_notes.length > 0;
  const hasInsights = wr1.speaker_insights.length > 0;

  let score = 0;
  if (hasThemes) score += 50;
  else if (wr1.main_themes.length > 0) score += 25;
  if (hasNotes) score += 25;
  if (hasInsights) score += 25;

  return Math.min(100, score);
}

function getProofCompleteness(wr1: WR1): number {
  if (wr1.proof_points.length === 0) return 0;

  const sourced = wr1.proof_points.filter(p => p.source).length;
  const total = wr1.proof_points.length;

  const hasTypes = new Set(wr1.proof_points.map(p => p.type)).size;
  const typeBonus = hasTypes >= 2 ? 20 : 0;

  return Math.min(100, Math.round((sourced / total) * 80) + typeBonus);
}

function getQACompleteness(wr1: WR1, qaResolutions: Map<string, QAResolution>): number {
  const total = wr1.qa.assumptions.length + wr1.qa.placeholders.length + wr1.qa.claims_requiring_proof.length;
  if (total === 0) return 100;

  const resolved = Array.from(qaResolutions.values()).filter(r => r.status === 'resolved' || r.status === 'accepted').length;
  return Math.round((resolved / total) * 100);
}
