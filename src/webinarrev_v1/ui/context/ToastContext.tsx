import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ type: 'success', message, duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast({ type: 'error', message, duration: duration ?? 6000 });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ type: 'info', message, duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ type: 'warning', message, duration });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      color: 'rgb(var(--success))',
      bg: 'rgb(var(--success) / 0.1)',
      border: 'rgb(var(--success) / 0.3)',
    },
    error: {
      icon: AlertCircle,
      color: 'rgb(var(--error))',
      bg: 'rgb(var(--error) / 0.1)',
      border: 'rgb(var(--error) / 0.3)',
    },
    warning: {
      icon: AlertTriangle,
      color: 'rgb(var(--warning))',
      bg: 'rgb(var(--warning) / 0.1)',
      border: 'rgb(var(--warning) / 0.3)',
    },
    info: {
      icon: Info,
      color: 'rgb(var(--accent-primary))',
      bg: 'rgb(var(--accent-primary) / 0.1)',
      border: 'rgb(var(--accent-primary) / 0.3)',
    },
  };

  const style = config[toast.type];
  const Icon = style.icon;

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl shadow-lg backdrop-blur-sm animate-slide-up"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5" style={{ color: style.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onRemove(toast.id);
            }}
            className="mt-2 text-xs font-medium underline"
            style={{ color: style.color }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded transition-colors hover:bg-[rgb(var(--surface-glass))]"
      >
        <X className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
      </button>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
