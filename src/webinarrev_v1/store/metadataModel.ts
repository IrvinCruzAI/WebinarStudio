import { ProjectMetadata, ProjectStatus, DeliverableId, CTA, AudienceTemperature, OperatorSettings } from '../contracts';

const METADATA_KEY = 'wrv1_projects';

function migrateProject(project: ProjectMetadata): ProjectMetadata {
  if (!project.settings) {
    project.settings = {
      cta_mode: 'book_call',
      audience_temperature: 'warm',
      webinar_length_minutes: 60,
    };
  }

  if (project.settings.operator === undefined) {
    project.settings.operator = {};
  }

  return project;
}

export function loadMetadata(): ProjectMetadata[] {
  try {
    const stored = localStorage.getItem(METADATA_KEY);
    if (!stored) return [];
    const projects = JSON.parse(stored) as ProjectMetadata[];
    return projects.map(migrateProject);
  } catch (error) {
    console.error('Failed to load metadata:', error);
    return [];
  }
}

export function saveMetadata(projects: ProjectMetadata[]): void {
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save metadata:', error);
    throw error;
  }
}

export function getAllProjects(): ProjectMetadata[] {
  return loadMetadata();
}

export function getProject(projectId: string): ProjectMetadata | null {
  const projects = loadMetadata();
  return projects.find(p => p.project_id === projectId) || null;
}

export function updateProject(
  projectId: string,
  updates: Partial<ProjectMetadata>
): void {
  const projects = loadMetadata();
  const index = projects.findIndex(p => p.project_id === projectId);

  if (index === -1) {
    throw new Error(`Project ${projectId} not found`);
  }

  projects[index] = {
    ...projects[index],
    ...updates,
    updated_at: Date.now(),
  };

  saveMetadata(projects);
}

export function createProject(
  projectId: string,
  title: string,
  settings: {
    cta_mode: CTA;
    audience_temperature: AudienceTemperature;
    webinar_length_minutes: number;
    client_name?: string;
    speaker_name?: string;
    company_name?: string;
    contact_email?: string;
    operator?: OperatorSettings;
  }
): ProjectMetadata {
  const project: ProjectMetadata = {
    project_id: projectId,
    run_id: `run_${Date.now()}`,
    title,
    status: 'review',
    created_at: Date.now(),
    updated_at: Date.now(),
    settings: {
      ...settings,
      operator: settings.operator || {},
    },
    deliverable_pointers: {},
  };

  const projects = loadMetadata();
  projects.push(project);
  saveMetadata(projects);

  return project;
}

export function updateProjectStatus(projectId: string, status: ProjectStatus): void {
  updateProject(projectId, { status });
}

export function updateDeliverablePointer(
  projectId: string,
  deliverableId: DeliverableId,
  pointer: {
    artifact_id: string;
    validated: boolean;
    generated_at: number;
    edited_at?: number;
  }
): void {
  const project = getProject(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  updateProject(projectId, {
    deliverable_pointers: {
      ...project.deliverable_pointers,
      [deliverableId]: pointer,
    },
  });
}

export function deleteProject(projectId: string): void {
  const projects = loadMetadata();
  const filtered = projects.filter(p => p.project_id !== projectId);
  saveMetadata(filtered);
}

export function updateProjectSettings(
  projectId: string,
  settingsUpdates: Partial<{
    cta_mode: CTA;
    audience_temperature: AudienceTemperature;
    webinar_length_minutes: number;
    client_name?: string;
    speaker_name?: string;
    company_name?: string;
    contact_email?: string;
    operator?: OperatorSettings;
  }>
): void {
  const project = getProject(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const newSettings = { ...project.settings };

  if (settingsUpdates.operator) {
    newSettings.operator = {
      ...project.settings.operator,
      ...settingsUpdates.operator,
    };
    delete settingsUpdates.operator;
  }

  updateProject(projectId, {
    settings: {
      ...newSettings,
      ...settingsUpdates,
    },
  });
}

export function updateOperatorSettings(
  projectId: string,
  operatorUpdates: Partial<OperatorSettings>
): void {
  const project = getProject(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  updateProject(projectId, {
    settings: {
      ...project.settings,
      operator: {
        ...project.settings.operator,
        ...operatorUpdates,
      },
    },
  });
}
