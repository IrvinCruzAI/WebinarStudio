import { useState } from 'react';
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
import type { DeliverableId } from '../contracts';

type TabId = 'dossier' | 'framework' | 'assets' | 'qa-export' | 'project-setup';

function V1AppContent() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dossier');

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
            onRunPipeline={runPipeline}
            onCancelPipeline={cancelPipeline}
            activeTab={activeTab}
            onTabChange={tab => setActiveTab(tab as TabId)}
          />

          {activeTab === 'dossier' && (
            <DossierTab
              project={selectedProject}
              artifacts={artifacts}
              isPipelineRunning={isPipelineRunning}
              onRunPipeline={runPipeline}
              onEditDeliverable={handleEditDeliverable}
              onRegenerateExecutiveSummary={regenerateExecutiveSummary}
            />
          )}

          {activeTab === 'framework' && (
            <FrameworkBuilderTab
              project={selectedProject}
              artifacts={artifacts}
              isPipelineRunning={isPipelineRunning}
              onRunPipeline={runPipeline}
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
              onRunPipeline={runPipeline}
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
              onRunPipeline={runPipeline}
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
