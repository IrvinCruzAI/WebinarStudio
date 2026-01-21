import { useState } from 'react';
import {
  Plus,
  FolderOpen,
  Clock,
  Target,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Filter,
  Trash2,
  Building2,
} from 'lucide-react';
import type { ProjectMetadata } from '../../contracts';
import { DELIVERABLES, UI_DELIVERABLE_ORDER } from '../../contracts/deliverables';
import { formatRelativeTime } from '../utils/formatters';

interface ProjectsHomeProps {
  projects: ProjectMetadata[];
  isLoading: boolean;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

type SortOption = 'updated' | 'name' | 'status';
type FilterOption = 'all' | 'running' | 'needs_fixes' | 'exportable';

export function ProjectsHome({
  projects,
  isLoading,
  onSelectProject,
  onNewProject,
  onDeleteProject,
}: ProjectsHomeProps) {
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredProjects = projects.filter(p => {
    switch (filterBy) {
      case 'running': return p.status === 'generating';
      case 'needs_fixes': return p.status === 'preflight_blocked' || p.status === 'review' || p.status === 'failed';
      case 'exportable': return p.status === 'ready';
      default: return true;
    }
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.title.localeCompare(b.title);
      case 'status': return a.status.localeCompare(b.status);
      case 'updated':
      default: return b.updated_at - a.updated_at;
    }
  });

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              Projects
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary text-sm"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>

              {showFilters && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl shadow-lg z-10 animate-in"
                  style={{
                    background: 'rgb(var(--surface-elevated))',
                    border: '1px solid rgb(var(--border-default))',
                  }}
                >
                  {[
                    { value: 'all', label: 'All Projects' },
                    { value: 'running', label: 'Running' },
                    { value: 'needs_fixes', label: 'Needs Fixes' },
                    { value: 'exportable', label: 'Exportable' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterBy(option.value as FilterOption);
                        setShowFilters(false);
                      }}
                      className={`
                        w-full text-left px-4 py-2 text-sm transition-colors
                        ${filterBy === option.value
                          ? 'text-[rgb(var(--accent-primary))]'
                          : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-glass))]'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              aria-label="Sort projects by"
              className="btn-secondary text-sm appearance-none cursor-pointer pr-8"
              style={{ backgroundImage: 'none' }}
            >
              <option value="updated">Recently Updated</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>

            <button onClick={onNewProject} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedProjects.length === 0 ? (
          <EmptyState onNewProject={onNewProject} hasFilter={filterBy !== 'all'} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map(project => (
              <ProjectCard
                key={project.project_id}
                project={project}
                onClick={() => onSelectProject(project.project_id)}
                onDelete={() => setDeleteConfirm(project.project_id)}
              />
            ))}
          </div>
        )}

        {deleteConfirm && (
          <DeleteConfirmModal
            projectTitle={projects.find(p => p.project_id === deleteConfirm)?.title || 'this project'}
            onConfirm={() => {
              onDeleteProject(deleteConfirm);
              setDeleteConfirm(null);
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectMetadata;
  onClick: () => void;
  onDelete: () => void;
}

function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const exportableIds = UI_DELIVERABLE_ORDER.filter(id => DELIVERABLES[id].exportable);
  const completedCount = exportableIds.filter(id =>
    project.deliverable_pointers?.[id]?.validated
  ).length;
  const totalCount = exportableIds.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const clientName = project.settings?.client_name || project.settings?.company_name;
  const duration = project.settings?.webinar_length_minutes;

  return (
    <div
      onClick={onClick}
      className="glass-card p-5 text-left w-full group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: 'rgb(var(--accent-primary) / 0.1)',
            border: '1px solid rgb(var(--accent-primary) / 0.2)',
          }}
        >
          <FolderOpen
            className="w-5 h-5"
            style={{ color: 'rgb(var(--accent-primary))' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgb(var(--error)/0.1)]"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" style={{ color: 'rgb(var(--error))' }} />
          </button>
        </div>
      </div>

      <h3
        className="font-semibold mb-0.5 line-clamp-2"
        style={{ color: 'rgb(var(--text-primary))' }}
      >
        {project.title}
      </h3>

      {clientName && (
        <p
          className="text-sm mb-2 line-clamp-1 flex items-center gap-1.5"
          style={{ color: 'rgb(var(--text-secondary))' }}
        >
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{clientName}</span>
        </p>
      )}

      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(project.updated_at)}
        </span>
        {duration && (
          <span>{duration}-minute webinar</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            Assets Progress
          </span>
          <span className="text-xs font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
            {completedCount}/{totalCount}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgb(var(--surface-base))' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: progress === 100
                ? 'rgb(var(--success))'
                : 'linear-gradient(90deg, rgb(var(--accent-primary)), rgb(var(--accent-secondary)))',
            }}
          />
        </div>
      </div>

      {project.status === 'ready' && (
        <div
          className="mt-4 pt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderTop: '1px solid rgb(var(--border-subtle))' }}
        >
          <span className="btn-ghost text-xs py-1.5 px-2.5 flex items-center gap-1.5">
            <Download className="w-3 h-3" />
            Export Ready
          </span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectMetadata['status'] }) {
  const configs: Record<string, { icon: typeof CheckCircle2; class: string; label: string }> = {
    preflight_blocked: { icon: AlertCircle, class: 'badge-error', label: 'Blocked' },
    generating: { icon: Loader2, class: 'badge-accent', label: 'Running' },
    review: { icon: AlertCircle, class: 'badge-warning', label: 'Review' },
    ready: { icon: CheckCircle2, class: 'badge-success', label: 'Ready' },
    failed: { icon: XCircle, class: 'badge-error', label: 'Failed' },
  };

  const config = configs[status] || configs.review;
  const Icon = config.icon;

  return (
    <span className={`badge ${config.class}`}>
      <Icon className={`w-3 h-3 ${status === 'generating' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="skeleton w-16 h-6 rounded-full" />
      </div>
      <div className="skeleton w-3/4 h-5 rounded mb-2" />
      <div className="skeleton w-1/2 h-4 rounded mb-4" />
      <div className="skeleton w-full h-1.5 rounded-full" />
    </div>
  );
}

function EmptyState({
  onNewProject,
  hasFilter,
}: {
  onNewProject: () => void;
  hasFilter: boolean;
}) {
  return (
    <div className="text-center py-16">
      <div
        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <FolderOpen className="w-8 h-8" style={{ color: 'rgb(var(--text-muted))' }} />
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'rgb(var(--text-primary))' }}
      >
        {hasFilter ? 'No matching projects' : 'No projects yet'}
      </h3>
      <p
        className="text-sm mb-6 max-w-sm mx-auto"
        style={{ color: 'rgb(var(--text-muted))' }}
      >
        {hasFilter
          ? 'Try adjusting your filters to see more projects.'
          : 'Create your first project to start generating webinar assets.'}
      </p>
      {!hasFilter && (
        <button onClick={onNewProject} className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      )}
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

function DeleteConfirmModal({
  projectTitle,
  onConfirm,
  onCancel,
}: {
  projectTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl shadow-2xl"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: 'rgb(var(--error) / 0.1)',
            border: '1px solid rgb(var(--error) / 0.2)',
          }}
        >
          <Trash2 className="w-6 h-6" style={{ color: 'rgb(var(--error))' }} />
        </div>

        <h3
          className="text-lg font-semibold text-center mb-2"
          style={{ color: 'rgb(var(--text-primary))' }}
        >
          Delete Project
        </h3>
        <p
          className="text-sm text-center mb-6"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          Are you sure you want to delete "{projectTitle}"? This action cannot be undone and all generated assets will be permanently removed.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
            style={{
              background: 'rgb(var(--error))',
              color: 'white',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
