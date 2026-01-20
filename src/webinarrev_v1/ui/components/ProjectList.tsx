import { useState } from 'react';
import {
  Plus,
  FolderOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import type { ProjectMetadata } from '../../contracts';

interface ProjectListProps {
  projects: ProjectMetadata[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  preflight_blocked: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    label: 'Blocked',
  },
  generating: {
    icon: RefreshCw,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    label: 'Generating',
  },
  review: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    label: 'Review',
  },
  ready: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    label: 'Ready',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    label: 'Failed',
  },
};

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function getDeliverableProgress(project: ProjectMetadata): {
  total: number;
  completed: number;
  validated: number;
} {
  const pointers = project.deliverable_pointers;
  const deliverableIds = ['PREFLIGHT', 'WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8', 'WR9'];
  const total = deliverableIds.length;
  let completed = 0;
  let validated = 0;

  for (const id of deliverableIds) {
    const pointer = pointers[id as keyof typeof pointers];
    if (pointer) {
      completed++;
      if (pointer.validated) validated++;
    }
  }

  return { total, completed, validated };
}

export default function ProjectList({
  projects,
  onSelectProject,
  onCreateProject,
  isLoading,
}: ProjectListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'date') return b.updated_at - a.updated_at;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-slate-400 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium hover:from-teal-400 hover:to-cyan-500 transition-all shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Sort by:</span>
        <button
          onClick={() => setSortBy('date')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            sortBy === 'date'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Date
        </button>
        <button
          onClick={() => setSortBy('name')}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            sortBy === 'name'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Name
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
          <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            No projects yet
          </h3>
          <p className="text-slate-500 mb-6">
            Create your first webinar project to get started
          </p>
          <button
            onClick={onCreateProject}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedProjects.map((project) => {
            const status = STATUS_CONFIG[project.status];
            const StatusIcon = status.icon;
            const progress = getDeliverableProgress(project);

            return (
              <button
                key={project.project_id}
                onClick={() => onSelectProject(project.project_id)}
                className="group backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 text-left hover:border-teal-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-teal-300 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Updated {formatDate(project.updated_at)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg}`}
                  >
                    <StatusIcon
                      className={`w-3.5 h-3.5 ${status.color} ${
                        project.status === 'generating' ? 'animate-spin' : ''
                      }`}
                    />
                    <span className={status.color}>{status.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Deliverables:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white font-medium">
                        {progress.completed}/{progress.total}
                      </span>
                      {progress.validated === progress.completed && progress.completed > 0 && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {(project.settings.client_name || project.settings.company_name) && (
                    <>
                      <div className="h-4 w-px bg-slate-700" />

                      <div className="flex items-center gap-2 text-slate-400">
                        <span>Client:</span>
                        <span className="text-slate-300">
                          {project.settings.client_name || project.settings.company_name}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="h-4 w-px bg-slate-700" />

                  <div className="flex items-center gap-2 text-slate-400">
                    <span>Duration:</span>
                    <span className="text-slate-300">
                      {project.settings.webinar_length_minutes}min
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all"
                      style={{
                        width: `${(progress.completed / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
