import { useState, type ReactNode } from 'react';
import {
  FolderOpen,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Settings,
  Plus,
} from 'lucide-react';
import { WebcamLogo } from '../../../components/WebcamLogo';
import { useTheme } from '../context/ThemeContext';
import type { ProjectMetadata } from '../../contracts';

interface AppShellProps {
  children: ReactNode;
  projects: ProjectMetadata[];
  selectedProject: ProjectMetadata | null;
  onSelectProject: (projectId: string | null) => void;
  onNewProject: () => void;
  isLoading?: boolean;
}

export function AppShell({
  children,
  projects,
  selectedProject,
  onSelectProject,
  onNewProject,
  isLoading,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const recentProjects = [...projects]
    .sort((a, b) => b.updated_at - a.updated_at)
    .slice(0, 5);

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`
          flex flex-col border-r transition-all duration-200 ease-out
          ${sidebarCollapsed ? 'w-16' : 'w-72'}
        `}
        style={{
          background: 'rgb(var(--surface-elevated))',
          borderColor: 'rgb(var(--border-default))',
        }}
      >
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgb(var(--border-default))' }}>
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--accent-primary)), rgb(var(--accent-secondary)))',
            }}
          >
            <WebcamLogo className="text-white" size={20} />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-base" style={{ color: 'rgb(var(--text-primary))' }}>
                WebinarStudio
              </h1>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn-ghost p-1.5"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="p-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'rgb(var(--text-muted))' }}
              />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-6">
          {!sidebarCollapsed ? (
            <>
              <div>
                <button
                  onClick={onNewProject}
                  className="btn-primary w-full text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>

              {selectedProject && (
                <div>
                  <h3
                    className="text-xs font-medium uppercase tracking-wider mb-2 px-2"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    Current Project
                  </h3>
                  <button
                    className="w-full text-left p-3 rounded-xl transition-colors"
                    style={{
                      background: 'rgb(var(--accent-primary) / 0.1)',
                      border: '1px solid rgb(var(--accent-primary) / 0.2)',
                    }}
                  >
                    <p
                      className="font-medium text-sm truncate"
                      style={{ color: 'rgb(var(--accent-primary))' }}
                    >
                      {selectedProject.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                      {getStatusLabel(selectedProject.status)}
                    </p>
                  </button>
                </div>
              )}

              <div>
                <h3
                  className="text-xs font-medium uppercase tracking-wider mb-2 px-2"
                  style={{ color: 'rgb(var(--text-muted))' }}
                >
                  Recent
                </h3>
                <div className="space-y-1">
                  {isLoading ? (
                    <>
                      <div className="skeleton h-10 rounded-lg" />
                      <div className="skeleton h-10 rounded-lg" />
                      <div className="skeleton h-10 rounded-lg" />
                    </>
                  ) : recentProjects.length === 0 ? (
                    <p className="text-sm px-2" style={{ color: 'rgb(var(--text-muted))' }}>
                      No projects yet
                    </p>
                  ) : (
                    recentProjects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        className={`
                          w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 transition-colors
                          ${selectedProject?.id === project.id
                            ? ''
                            : 'hover:bg-[rgb(var(--surface-glass))]'
                          }
                        `}
                        style={selectedProject?.id === project.id ? {
                          background: 'rgb(var(--surface-glass))',
                        } : undefined}
                      >
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(var(--text-muted))' }} />
                        <span
                          className="text-sm truncate"
                          style={{ color: 'rgb(var(--text-secondary))' }}
                        >
                          {project.title}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {searchQuery && (
                <div>
                  <h3
                    className="text-xs font-medium uppercase tracking-wider mb-2 px-2"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    Search Results
                  </h3>
                  <div className="space-y-1">
                    {filteredProjects.length === 0 ? (
                      <p className="text-sm px-2" style={{ color: 'rgb(var(--text-muted))' }}>
                        No matches found
                      </p>
                    ) : (
                      filteredProjects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => {
                            onSelectProject(project.id);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 hover:bg-[rgb(var(--surface-glass))] transition-colors"
                        >
                          <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(var(--text-muted))' }} />
                          <span
                            className="text-sm truncate"
                            style={{ color: 'rgb(var(--text-secondary))' }}
                          >
                            {project.title}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button onClick={onNewProject} className="btn-ghost p-2.5 rounded-xl">
                <Plus className="w-5 h-5" />
              </button>
              <button className="btn-ghost p-2.5 rounded-xl">
                <FolderOpen className="w-5 h-5" />
              </button>
            </div>
          )}
        </nav>

        <div
          className="p-3 border-t"
          style={{ borderColor: 'rgb(var(--border-default))' }}
        >
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button key="theme-toggle-collapsed" onClick={toggleTheme} className="btn-ghost p-2.5 rounded-xl">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button key="theme-toggle" onClick={toggleTheme} className="btn-ghost text-sm">
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Dark Mode
                  </>
                )}
              </button>
              <button key="settings-btn" className="btn-ghost p-2">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function getStatusLabel(status: ProjectMetadata['status']): string {
  switch (status) {
    case 'preflight_blocked': return 'Blocked';
    case 'generating': return 'Generating...';
    case 'review': return 'Ready for Review';
    case 'ready': return 'Ready to Export';
    case 'failed': return 'Failed';
    default: return status;
  }
}
