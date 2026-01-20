import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, RotateCcw, Loader2, Edit3 } from 'lucide-react';

interface EditableFieldProps {
  label: string;
  value: string | null | undefined;
  fieldPath: string;
  isEdited?: boolean;
  originalValue?: string | null;
  fullWidth?: boolean;
  onSave: (fieldPath: string, value: string | null) => Promise<void>;
  onRevert?: (fieldPath: string) => void;
}

export function EditableField({
  label,
  value,
  fieldPath,
  isEdited = false,
  originalValue,
  fullWidth = false,
  onSave,
  onRevert,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<number>();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value ?? '');
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue === (value ?? '')) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(fieldPath, editValue || null);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1500);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [editValue, value, fieldPath, onSave]);

  const handleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      handleSave();
    }, 150);
  }, [handleSave]);

  const handleCancel = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setEditValue(value ?? '');
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleRevert = useCallback(() => {
    if (onRevert) {
      onRevert(fieldPath);
    }
  }, [fieldPath, onRevert]);

  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1.5 mb-1 group">
        <label
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          {label}
        </label>
        {!isEditing && (
          <Edit3
            className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'rgb(var(--text-muted))' }}
          />
        )}
        {isEdited && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: 'rgb(var(--accent-primary) / 0.1)',
              color: 'rgb(var(--accent-primary))',
            }}
          >
            Edited
          </span>
        )}
        {showSaved && (
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'rgb(var(--success))' }}>
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
        {isSaving && (
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'rgb(var(--text-muted))' }} />
        )}
      </div>

      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm rounded-lg bg-transparent border focus:outline-none focus:ring-2"
            style={{
              borderColor: 'rgb(var(--border-default))',
              color: 'rgb(var(--text-primary))',
            }}
            placeholder="Not specified"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSave}
            className="p-1 rounded hover:bg-[rgb(var(--surface-base))]"
            title="Save"
          >
            <Check className="w-4 h-4" style={{ color: 'rgb(var(--success))' }} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCancel}
            className="p-1 rounded hover:bg-[rgb(var(--surface-base))]"
            title="Cancel"
          >
            <X className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
          </button>
        </div>
      ) : (
        <div className="group relative">
          <p
            onClick={() => setIsEditing(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsEditing(true);
              }
            }}
            className="text-sm cursor-pointer rounded px-2 py-1 -mx-2 hover:bg-[rgb(var(--surface-base))] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:ring-offset-2"
            style={{ color: value ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))' }}
            role="button"
            tabIndex={0}
            aria-label={`Edit ${label}`}
          >
            {value || 'Not specified'}
          </p>
          {isEdited && onRevert && originalValue !== undefined && (
            <button
              onClick={handleRevert}
              className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[rgb(var(--surface-base))]"
              title={`Revert to: ${originalValue || 'Not specified'}`}
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-muted))' }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface EditableTextAreaProps {
  label: string;
  value: string | null | undefined;
  fieldPath: string;
  isEdited?: boolean;
  originalValue?: string | null;
  onSave: (fieldPath: string, value: string | null) => Promise<void>;
  onRevert?: (fieldPath: string) => void;
  rows?: number;
}

export function EditableTextArea({
  label,
  value,
  fieldPath,
  isEdited = false,
  originalValue,
  onSave,
  onRevert,
  rows = 3,
}: EditableTextAreaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number>();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value ?? '');
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue === (value ?? '')) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(fieldPath, editValue || null);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1500);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [editValue, value, fieldPath, onSave]);

  const handleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      handleSave();
    }, 150);
  }, [handleSave]);

  const handleCancel = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setEditValue(value ?? '');
    setIsEditing(false);
  }, [value]);

  const handleRevert = useCallback(() => {
    if (onRevert) {
      onRevert(fieldPath);
    }
  }, [fieldPath, onRevert]);

  return (
    <div className="col-span-2">
      <div className="flex items-center gap-1.5 mb-1">
        <label
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          {label}
        </label>
        {isEdited && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: 'rgb(var(--accent-primary) / 0.1)',
              color: 'rgb(var(--accent-primary))',
            }}
          >
            Edited
          </span>
        )}
        {showSaved && (
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'rgb(var(--success))' }}>
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
        {isSaving && (
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'rgb(var(--text-muted))' }} />
        )}
        {isEdited && onRevert && !isEditing && (
          <button
            onClick={handleRevert}
            className="ml-auto p-1 rounded opacity-60 hover:opacity-100 hover:bg-[rgb(var(--surface-base))]"
            title={`Revert to original`}
          >
            <RotateCcw className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-muted))' }} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            rows={rows}
            className="w-full px-3 py-2 text-sm rounded-xl bg-transparent border resize-none focus:outline-none focus:ring-2"
            style={{
              borderColor: 'rgb(var(--border-default))',
              color: 'rgb(var(--text-primary))',
            }}
            placeholder="Not specified"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCancel}
              className="btn-ghost text-xs"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSave}
              className="btn-primary text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <p
          onClick={() => setIsEditing(true)}
          className="text-sm cursor-pointer rounded-xl px-3 py-2 hover:bg-[rgb(var(--surface-base))] transition-colors whitespace-pre-wrap"
          style={{
            color: value ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
            border: '1px solid transparent',
          }}
        >
          {value || 'Not specified'}
        </p>
      )}
    </div>
  );
}
