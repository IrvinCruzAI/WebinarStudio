import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface FileUploadButtonProps {
  onFileContent: (content: string) => void;
  accept?: string;
  maxSizeBytes?: number;
  label?: string;
  disabled?: boolean;
}

export function FileUploadButton({
  onFileContent,
  accept = '.txt',
  maxSizeBytes = 10 * 1024 * 1024,
  label = 'Upload file',
  disabled = false,
}: FileUploadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('loading');
    setErrorMessage('');

    if (file.size > maxSizeBytes) {
      setStatus('error');
      setErrorMessage(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Max size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
      return;
    }

    if (!file.name.endsWith('.txt')) {
      setStatus('error');
      setErrorMessage('Only .txt files are supported');
      return;
    }

    try {
      const content = await file.text();

      if (!content.trim()) {
        setStatus('error');
        setErrorMessage('File is empty');
        return;
      }

      onFileContent(content);
      setStatus('success');

      setTimeout(() => {
        setStatus('idle');
        setFileName('');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to read file');
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Upload className="w-3.5 h-3.5 animate-pulse" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'rgb(var(--success))';
      case 'error':
        return 'rgb(var(--error))';
      default:
        return 'rgb(var(--text-muted))';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'loading':
        return 'Reading...';
      case 'success':
        return 'Uploaded!';
      case 'error':
        return 'Try again';
      default:
        return label;
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        id="file-upload-input"
      />
      <label htmlFor="file-upload-input">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || status === 'loading'}
          className="btn-ghost text-xs"
          style={{
            color: getStatusColor(),
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {getStatusIcon()}
          {getButtonText()}
        </button>
      </label>

      {fileName && status !== 'idle' && (
        <div className="mt-2">
          <div
            className="text-xs px-2 py-1 rounded flex items-center gap-2"
            style={{
              background: status === 'error'
                ? 'rgb(var(--error) / 0.1)'
                : status === 'success'
                ? 'rgb(var(--success) / 0.1)'
                : 'rgb(var(--surface-base))',
              color: status === 'error'
                ? 'rgb(var(--error))'
                : status === 'success'
                ? 'rgb(var(--success))'
                : 'rgb(var(--text-secondary))',
            }}
          >
            {status === 'success' && <CheckCircle2 className="w-3 h-3" />}
            {status === 'error' && <AlertCircle className="w-3 h-3" />}
            <span className="truncate max-w-[200px]">{fileName}</span>
          </div>
          {errorMessage && (
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--error))' }}>
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
