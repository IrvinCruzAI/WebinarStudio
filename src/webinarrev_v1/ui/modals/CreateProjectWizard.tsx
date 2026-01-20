import { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Settings,
  Play,
  Check,
  AlertCircle,
  Lightbulb,
  Copy,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { FileUploadButton } from '../components/FileUploadButton';
import { TextMetrics } from '../components/TextMetrics';
import { InputQualityIndicator } from '../components/InputQualityIndicator';
import { assessInputQuality, BUILD_TRANSCRIPT_EXAMPLES, INTAKE_TRANSCRIPT_EXAMPLES, OPERATOR_NOTES_EXAMPLES } from '../../utils/inputQuality';
import { saveDraft, loadDraft, deleteDraft, listAllDrafts, type DraftData } from '../../store/indexedDbWrapper';

export interface ProjectFormData {
  title: string;
  buildTranscript: string;
  intakeTranscript: string;
  operatorNotes: string;
  ctaMode: 'book_call' | 'buy_now';
  audienceTemperature: 'cold' | 'warm' | 'hot';
  webinarLengthMinutes: number;
}

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}

type Step = 'basics' | 'inputs' | 'confirm';

const STEPS: { id: Step; label: string; icon: typeof FileText }[] = [
  { id: 'basics', label: 'Basics', icon: Settings },
  { id: 'inputs', label: 'Inputs', icon: FileText },
  { id: 'confirm', label: 'Confirm', icon: Play },
];

function generateDraftId(): string {
  return `draft_${crypto.randomUUID()}`;
}

export function CreateProjectWizard({ isOpen, onClose, onSubmit }: CreateProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId] = useState<string>(() => generateDraftId());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showResumeDraft, setShowResumeDraft] = useState(false);
  const [existingDrafts, setExistingDrafts] = useState<DraftData[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    buildTranscript: '',
    intakeTranscript: '',
    operatorNotes: '',
    ctaMode: 'book_call',
    audienceTemperature: 'warm',
    webinarLengthMinutes: 60,
  });

  useEffect(() => {
    if (isOpen) {
      checkForExistingDrafts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, hasUnsavedChanges]);

  useEffect(() => {
    if (!isOpen) return;

    const hasContent = formData.title || formData.buildTranscript || formData.intakeTranscript || formData.operatorNotes;
    setHasUnsavedChanges(hasContent);

    if (hasContent) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 10000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, isOpen]);

  const checkForExistingDrafts = async () => {
    try {
      const drafts = await listAllDrafts();
      if (drafts.length > 0) {
        setExistingDrafts(drafts);
        setShowResumeDraft(true);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  };

  const handleAutoSave = async () => {
    try {
      const draftData: DraftData = {
        draft_id: draftId,
        title: formData.title,
        build_transcript: formData.buildTranscript,
        intake_transcript: formData.intakeTranscript,
        operator_notes: formData.operatorNotes,
        cta_mode: formData.ctaMode,
        audience_temperature: formData.audienceTemperature,
        webinar_length_minutes: formData.webinarLengthMinutes,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      await saveDraft(draftData);
    } catch (error) {
      console.error('Failed to auto-save draft:', error);
    }
  };

  const handleResumeDraft = async (draft: DraftData) => {
    setFormData({
      title: draft.title,
      buildTranscript: draft.build_transcript,
      intakeTranscript: draft.intake_transcript,
      operatorNotes: draft.operator_notes,
      ctaMode: draft.cta_mode as 'book_call' | 'buy_now',
      audienceTemperature: draft.audience_temperature as 'cold' | 'warm' | 'hot',
      webinarLengthMinutes: draft.webinar_length_minutes,
    });
    setShowResumeDraft(false);
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return formData.title.trim().length > 0;
      case 'inputs':
        return formData.buildTranscript.trim().length > 0;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'basics') setCurrentStep('inputs');
    else if (currentStep === 'inputs') setCurrentStep('confirm');
  };

  const handleBack = () => {
    if (currentStep === 'inputs') setCurrentStep('basics');
    else if (currentStep === 'confirm') setCurrentStep('inputs');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      await deleteDraft(draftId);
      onClose();
      setFormData({
        title: '',
        buildTranscript: '',
        intakeTranscript: '',
        operatorNotes: '',
        ctaMode: 'book_call',
        audienceTemperature: 'warm',
        webinarLengthMinutes: 60,
      });
      setCurrentStep('basics');
      setHasUnsavedChanges(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirm) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  if (showResumeDraft && existingDrafts.length > 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 fade-in"
          style={{ background: 'rgb(0 0 0 / 0.5)' }}
          onClick={() => setShowResumeDraft(false)}
        />
        <div
          className="relative w-full max-w-lg rounded-2xl shadow-xl animate-in p-6"
          style={{
            background: 'rgb(var(--surface-elevated))',
            border: '1px solid rgb(var(--border-default))',
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
            Resume Draft?
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgb(var(--text-secondary))' }}>
            You have {existingDrafts.length} unsaved draft{existingDrafts.length > 1 ? 's' : ''}. Would you like to resume one?
          </p>
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {existingDrafts.map((draft) => (
              <button
                key={draft.draft_id}
                onClick={() => handleResumeDraft(draft)}
                className="w-full text-left p-3 rounded-lg hover:bg-[rgb(var(--surface-base))] transition-colors"
                style={{ border: '1px solid rgb(var(--border-subtle))' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>
                      {draft.title || 'Untitled Draft'}
                    </p>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                      {new Date(draft.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 ml-2" style={{ color: 'rgb(var(--text-muted))' }} />
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResumeDraft(false)}
              className="btn-ghost flex-1"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 fade-in"
        style={{ background: 'rgb(0 0 0 / 0.5)' }}
        onClick={handleClose}
      />
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-xl animate-in flex flex-col"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgb(var(--border-default))' }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              New Project
            </h2>
            {hasUnsavedChanges && (
              <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                <Clock className="w-3 h-3" />
                Auto-saving...
              </p>
            )}
          </div>
          <button onClick={handleClose} className="btn-ghost p-2 -mr-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: 'rgb(var(--border-subtle))' }}
        >
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <div
                      className="w-8 h-px"
                      style={{
                        background: isCompleted
                          ? 'rgb(var(--accent-primary))'
                          : 'rgb(var(--border-default))',
                      }}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        background: isActive
                          ? 'rgb(var(--accent-primary))'
                          : isCompleted
                          ? 'rgb(var(--accent-primary) / 0.1)'
                          : 'rgb(var(--surface-base))',
                        border: isCompleted ? '1px solid rgb(var(--accent-primary) / 0.3)' : 'none',
                      }}
                    >
                      {isCompleted ? (
                        <Check
                          className="w-4 h-4"
                          style={{ color: 'rgb(var(--accent-primary))' }}
                        />
                      ) : (
                        <Icon
                          className="w-4 h-4"
                          style={{
                            color: isActive ? 'white' : 'rgb(var(--text-muted))',
                          }}
                        />
                      )}
                    </div>
                    <span
                      className="text-sm font-medium hidden sm:block"
                      style={{
                        color: isActive
                          ? 'rgb(var(--text-primary))'
                          : 'rgb(var(--text-muted))',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {currentStep === 'basics' && (
            <BasicsStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 'inputs' && (
            <InputsStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 'confirm' && (
            <ConfirmStep formData={formData} />
          )}
        </div>

        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: 'rgb(var(--border-default))' }}
        >
          <button
            onClick={handleBack}
            className="btn-ghost"
            disabled={currentStep === 'basics'}
            style={{ opacity: currentStep === 'basics' ? 0 : 1 }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep === 'confirm' ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Create & Run Pipeline
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
}

function BasicsStep({ formData, setFormData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'rgb(var(--text-primary))' }}
        >
          Project Name *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Capacity Crisis Playbook"
          className="input-field"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            Audience Temperature
          </label>
          <select
            value={formData.audienceTemperature}
            onChange={e => setFormData(prev => ({
              ...prev,
              audienceTemperature: e.target.value as 'cold' | 'warm' | 'hot',
            }))}
            className="input-field"
          >
            <option value="cold">Cold - New to topic</option>
            <option value="warm">Warm - Familiar</option>
            <option value="hot">Hot - Ready to buy</option>
          </select>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            CTA Mode
          </label>
          <select
            value={formData.ctaMode}
            onChange={e => setFormData(prev => ({
              ...prev,
              ctaMode: e.target.value as 'book_call' | 'buy_now',
            }))}
            className="input-field"
          >
            <option value="book_call">Book a Call</option>
            <option value="buy_now">Buy Now</option>
          </select>
        </div>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'rgb(var(--text-primary))' }}
        >
          Webinar Length (minutes)
        </label>
        <input
          type="number"
          value={formData.webinarLengthMinutes}
          onChange={e => setFormData(prev => ({
            ...prev,
            webinarLengthMinutes: parseInt(e.target.value) || 60,
          }))}
          min={15}
          max={180}
          className="input-field w-32"
        />
      </div>
    </div>
  );
}

function InputsStep({ formData, setFormData }: StepProps) {
  const [showBuildExamples, setShowBuildExamples] = useState(false);
  const [showIntakeExamples, setShowIntakeExamples] = useState(false);
  const [showNotesExamples, setShowNotesExamples] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            className="block text-sm font-medium"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            Build Transcript *
          </label>
          <div className="flex items-center gap-2">
            <FileUploadButton
              onFileContent={(content) => setFormData(prev => ({ ...prev, buildTranscript: content }))}
              label="Upload .txt"
            />
            <button
              onClick={() => setShowBuildExamples(!showBuildExamples)}
              className="btn-ghost text-xs"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showBuildExamples ? 'Hide' : 'Examples'}
            </button>
          </div>
        </div>
        <p
          className="text-xs mb-2"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          Core content from your webinar build session. 800+ words recommended.
        </p>

        {showBuildExamples && (
          <ExamplesPanel
            examples={BUILD_TRANSCRIPT_EXAMPLES}
            onPaste={(content) => {
              setFormData(prev => ({ ...prev, buildTranscript: content }));
              setShowBuildExamples(false);
            }}
          />
        )}

        <textarea
          value={formData.buildTranscript}
          onChange={e => setFormData(prev => ({ ...prev, buildTranscript: e.target.value }))}
          placeholder="Paste your build transcript here..."
          rows={8}
          className="input-field resize-none font-mono text-sm"
        />
        <div className="mt-2">
          <TextMetrics
            text={formData.buildTranscript}
            minWords={500}
            recommendedWords={800}
            compact
          />
        </div>
        {!formData.buildTranscript && (
          <div
            className="flex items-center gap-2 mt-2 text-xs"
            style={{ color: 'rgb(var(--warning))' }}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Build transcript is required to proceed
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            className="block text-sm font-medium"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            Intake Transcript
            <span className="font-normal ml-2" style={{ color: 'rgb(var(--text-muted))' }}>
              Optional
            </span>
          </label>
          <div className="flex items-center gap-2">
            <FileUploadButton
              onFileContent={(content) => setFormData(prev => ({ ...prev, intakeTranscript: content }))}
              label="Upload .txt"
            />
            <button
              onClick={() => setShowIntakeExamples(!showIntakeExamples)}
              className="btn-ghost text-xs"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showIntakeExamples ? 'Hide' : 'Examples'}
            </button>
          </div>
        </div>
        <p
          className="text-xs mb-2"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          Client intake notes improve output quality. 300+ words recommended.
        </p>

        {showIntakeExamples && (
          <ExamplesPanel
            examples={INTAKE_TRANSCRIPT_EXAMPLES}
            onPaste={(content) => {
              setFormData(prev => ({ ...prev, intakeTranscript: content }));
              setShowIntakeExamples(false);
            }}
          />
        )}

        <textarea
          value={formData.intakeTranscript}
          onChange={e => setFormData(prev => ({ ...prev, intakeTranscript: e.target.value }))}
          placeholder="Paste intake transcript if available..."
          rows={4}
          className="input-field resize-none font-mono text-sm"
        />
        {formData.intakeTranscript && (
          <div className="mt-2">
            <TextMetrics
              text={formData.intakeTranscript}
              minWords={200}
              recommendedWords={300}
              compact
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            className="block text-sm font-medium"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            Operator Notes
            <span className="font-normal ml-2" style={{ color: 'rgb(var(--text-muted))' }}>
              Optional
            </span>
          </label>
          <div className="flex items-center gap-2">
            <FileUploadButton
              onFileContent={(content) => setFormData(prev => ({ ...prev, operatorNotes: content }))}
              label="Upload .txt"
            />
            <button
              onClick={() => setShowNotesExamples(!showNotesExamples)}
              className="btn-ghost text-xs"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showNotesExamples ? 'Hide' : 'Examples'}
            </button>
          </div>
        </div>
        <p
          className="text-xs mb-2"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          Special instructions, context, or constraints. 50+ words recommended.
        </p>

        {showNotesExamples && (
          <ExamplesPanel
            examples={OPERATOR_NOTES_EXAMPLES}
            onPaste={(content) => {
              setFormData(prev => ({ ...prev, operatorNotes: content }));
              setShowNotesExamples(false);
            }}
          />
        )}

        <textarea
          value={formData.operatorNotes}
          onChange={e => setFormData(prev => ({ ...prev, operatorNotes: e.target.value }))}
          placeholder="Any special instructions or context..."
          rows={3}
          className="input-field resize-none"
        />
        {formData.operatorNotes && (
          <div className="mt-2">
            <TextMetrics
              text={formData.operatorNotes}
              minWords={20}
              recommendedWords={50}
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmStep({ formData }: { formData: ProjectFormData }) {
  const qualityResult = assessInputQuality(
    formData.buildTranscript,
    formData.intakeTranscript,
    formData.operatorNotes
  );

  return (
    <div className="space-y-6">
      <InputQualityIndicator quality={qualityResult} showDetails={true} />

      <div
        className="p-4 rounded-xl"
        style={{
          background: 'rgb(var(--surface-base))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <h3
          className="font-semibold mb-4"
          style={{ color: 'rgb(var(--text-primary))' }}
        >
          Project Summary
        </h3>

        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt style={{ color: 'rgb(var(--text-muted))' }}>Name</dt>
            <dd className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
              {formData.title}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: 'rgb(var(--text-muted))' }}>Audience</dt>
            <dd className="font-medium capitalize" style={{ color: 'rgb(var(--text-primary))' }}>
              {formData.audienceTemperature}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: 'rgb(var(--text-muted))' }}>CTA</dt>
            <dd className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
              {formData.ctaMode === 'book_call' ? 'Book a Call' : 'Buy Now'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: 'rgb(var(--text-muted))' }}>Duration</dt>
            <dd className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
              {formData.webinarLengthMinutes} minutes
            </dd>
          </div>
        </dl>
      </div>

      {qualityResult.risks.length > 0 && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgb(var(--warning) / 0.1)',
            border: '1px solid rgb(var(--warning) / 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
            <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Pipeline may fail or produce low-quality outputs
            </span>
          </div>
          <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
            You can still proceed, but consider addressing the risks above for better results.
          </p>
        </div>
      )}

      <div
        className="p-4 rounded-xl"
        style={{
          background: 'rgb(var(--accent-primary) / 0.05)',
          border: '1px solid rgb(var(--accent-primary) / 0.1)',
        }}
      >
        <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
          Clicking "Create & Run Pipeline" will create your project and immediately start
          generating all 8 client assets. This typically takes 2-3 minutes.
        </p>
      </div>
    </div>
  );
}

interface ExamplesPanelProps {
  examples: Array<{ title: string; description: string; example: string }>;
  onPaste: (content: string) => void;
}

function ExamplesPanel({ examples, onPaste }: ExamplesPanelProps) {
  return (
    <div
      className="mb-3 p-4 rounded-xl space-y-3"
      style={{
        background: 'rgb(var(--accent-primary) / 0.05)',
        border: '1px solid rgb(var(--accent-primary) / 0.1)',
      }}
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
        <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
          What good looks like
        </span>
      </div>
      {examples.map((ex, i) => (
        <div key={i}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                {ex.title}
              </p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                {ex.description}
              </p>
            </div>
            <button
              onClick={() => onPaste(ex.example)}
              className="btn-ghost text-xs"
            >
              <Copy className="w-3 h-3" />
              Use
            </button>
          </div>
          <pre
            className="text-xs p-2 rounded overflow-x-auto scrollbar-thin whitespace-pre-wrap"
            style={{
              background: 'rgb(var(--surface-base))',
              color: 'rgb(var(--text-muted))',
              maxHeight: '100px',
            }}
          >
            {ex.example}
          </pre>
        </div>
      ))}
    </div>
  );
}
