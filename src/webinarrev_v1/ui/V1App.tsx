import { useState } from 'react';
import { AlertTriangle, X, Settings, Play } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './layout/AppShell';
import { ProjectHeader } from './layout/ProjectHeader';
import { ProjectsHome } from './views/ProjectsHome';
import { CreateProjectWizard, type ProjectFormData } from './modals/CreateProjectWizard';
import { DossierTab } from './tabs/DossierTab';
import { FrameworkBuilderTab } from './tabs/FrameworkBuilderTab';
import { AssetsTab } from './tabs/AssetsTab';
import { QAExportTab } from './tabs/QAExportTab';
import { ProjectSetupTab } from './tabs/ProjectSetupTab';
import { ActionableErrorDisplay } from './components/ActionableErrorDisplay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useProjectStore } from './hooks/useProjectStore';
import { getMissingRecommendedSettings } from '../utils/inputQuality';
import type { DeliverableId } from '../contracts';

type TabId = 'dossier' | 'framework' | 'assets' | 'qa-export' | 'project-setup';

function V1AppContent() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dossier');
  const [showSettingsWarning, setShowSettingsWarning] = useState(false);
  const [missingSettingsList, setMissingSettingsList] = useState<string[]>([]);

  const {
    projects,
    selectedProject,
    artifacts,
    isLoading,
    isPipelineRunning,
    pipelineProgress,
    error,
    pipelineError,
    selectProject,
    createNewProject,
    runPipeline,
    editDeliverable,
    revalidateDeliverable,
    revalidateAll,
    regenerateDeliverable,
    regenerateExecutiveSummary,
    exportDocx,
    exportZip,
    removeProject,
    clearError,
    cancelPipeline,
    updateSettings,
  } = useProjectStore();

  const handleRunPipelineWithCheck = async () => {
    if (!selectedProject) return;

    const { missingSettings, hasMissingSettings } = getMissingRecommendedSettings(
      selectedProject.settings.operator,
      selectedProject.settings.cta_mode
    );

    if (hasMissingSettings) {
      setMissingSettingsList(missingSettings);
      setShowSettingsWarning(true);
    } else {
      await runPipeline();
    }
  };

  const handleConfirmGeneration = async () => {
    setShowSettingsWarning(false);
    await runPipeline();
  };

  const handleNavigateToSettings = () => {
    setShowSettingsWarning(false);
    setActiveTab('project-setup');
  };

  const handleCreateProject = async (formData: ProjectFormData) => {
    await createNewProject({
      title: formData.title,
      buildTranscript: formData.buildTranscript,
      intakeTranscript: formData.intakeTranscript,
      operatorNotes: formData.operatorNotes,
      ctaMode: formData.ctaMode,
      audienceTemperature: formData.audienceTemperature,
      webinarLengthMinutes: formData.webinarLengthMinutes,
    });
    setShowCreateWizard(false);
    await runPipeline();
  };

  const handleSelectProject = async (projectId: string | null) => {
    await selectProject(projectId);
    setActiveTab('dossier');
  };

  const handleNavigateToFix = (deliverableId: DeliverableId) => {
    if (deliverableId === 'WR1' || deliverableId === 'PREFLIGHT') {
      setActiveTab('dossier');
    } else if (deliverableId === 'WR2') {
      setActiveTab('framework');
    } else {
      setActiveTab('assets');
    }
    clearError();
  };

  const handleNavigateToTab = (tab: string, _targetDeliverableId?: DeliverableId) => {
    if (tab === 'dossier' || tab === 'framework' || tab === 'assets' || tab === 'qa-export' || tab === 'project-setup') {
      setActiveTab(tab as TabId);
    }
  };

  const handleEditDeliverable = async (id: DeliverableId, field: string, value: unknown) => {
    await editDeliverable(id, field, value);
  };

  const handleAutoFix = async (deliverableId: DeliverableId) => {
    await revalidateDeliverable(deliverableId);
  };

  const handleRegenerate = async (deliverableId: DeliverableId, cascade: boolean = false, preserveEdits: boolean = false) => {
    await regenerateDeliverable(deliverableId, cascade, preserveEdits);
  };

  return (
    <AppShell
      projects={projects}
      selectedProject={selectedProject}
      onSelectProject={handleSelectProject}
      onNewProject={() => setShowCreateWizard(true)}
      isLoading={isLoading}
    >
      <ActionableErrorDisplay
        error={error}
        pipelineError={pipelineError}
        onDismiss={clearError}
        onNavigateToFix={handleNavigateToFix}
        onAutoFix={handleAutoFix}
        onRegenerate={handleRegenerate}
      />

      {selectedProject ? (
        <div className="flex flex-col h-full">
          <ProjectHeader
            project={selectedProject}
            isPipelineRunning={isPipelineRunning}
            pipelineProgress={pipelineProgress}
            onBack={() => handleSelectProject(null)}
            onRunPipeline={handleRunPipelineWithCheck}
            onCancelPipeline={cancelPipeline}
            activeTab={activeTab}
            onTabChange={tab => setActiveTab(tab as TabId)}
          />

          {activeTab === 'dossier' && (
            <DossierTab
              project={selectedProject}
              artifacts={artifacts}
              isPipelineRunning={isPipelineRunning}
              onRunPipeline={handleRunPipelineWithCheck}
              onEditDeliverable={handleEditDeliverable}
              onRegenerateExecutiveSummary={regenerateExecutiveSummary}
            />
          )}

          {activeTab === 'framework' && (
            <FrameworkBuilderTab
              project={selectedProject}
              artifacts={artifacts}
              isPipelineRunning={isPipelineRunning}
              onRunPipeline={handleRunPipelineWithCheck}
              onEditDeliverable={handleEditDeliverable}
              onRegenerate={handleRegenerate}
            />
          )}

          {activeTab === 'assets' && (
            <AssetsTab
              artifacts={artifacts}
              onRevalidate={revalidateDeliverable}
              onExportDocx={exportDocx}
              onEditDeliverable={handleEditDeliverable}
              onRegenerate={handleRegenerate}
              isPipelineRunning={isPipelineRunning}
              onRunPipeline={handleRunPipelineWithCheck}
            />
          )}

          {activeTab === 'qa-export' && (
            <QAExportTab
              project={selectedProject}
              artifacts={artifacts}
              onExportZip={exportZip}
              onExportDocx={exportDocx}
              onNavigateToTab={handleNavigateToTab}
              onRevalidateAll={revalidateAll}
            />
          )}

          {activeTab === 'project-setup' && (
            <ProjectSetupTab
              project={selectedProject}
              artifacts={artifacts}
              isPipelineRunning={isPipelineRunning}
              onRunPipeline={handleRunPipelineWithCheck}
              onSettingsChange={updateSettings}
            />
          )}
        </div>
      ) : (
        <ProjectsHome
          projects={projects}
          isLoading={isLoading}
          onSelectProject={handleSelectProject}
          onNewProject={() => setShowCreateWizard(true)}
          onDeleteProject={removeProject}
        />
      )}

      <CreateProjectWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onSubmit={handleCreateProject}
      />

      {showSettingsWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettingsWarning(false)}
          />
          <div
            className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
            style={{
              background: 'rgb(var(--surface-elevated))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgb(var(--border-default))' }}>
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: 'rgb(var(--warning) / 0.1)' }}
                >
                  <AlertTriangle className="w-5 h-5" style={{ color: 'rgb(var(--warning))' }} />
                </div>
                <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                  Missing Settings
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsWarning(false)}
                className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-glass))] transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'rgb(var(--text-muted))' }} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                Some email and CTA settings are missing. These will appear as placeholders in the generated content and require manual editing later.
              </p>

              <div
                className="p-3 rounded-xl space-y-2"
                style={{
                  background: 'rgb(var(--surface-base))',
                  border: '1px solid rgb(var(--border-subtle))',
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-muted))' }}>
                  Missing values:
                </p>
                <ul className="text-sm space-y-1" style={{ color: 'rgb(var(--text-primary))' }}>
                  {missingSettingsList.map((setting, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgb(var(--warning))' }} />
                      {setting}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                You can fill these in now or continue and edit them in the generated deliverables.
              </p>
            </div>

            <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'rgb(var(--border-default))' }}>
              <button
                onClick={handleNavigateToSettings}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Fill Now
              </button>
              <button
                onClick={handleConfirmGeneration}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function V1App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <V1AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
