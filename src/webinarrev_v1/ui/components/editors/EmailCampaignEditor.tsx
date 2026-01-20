import { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  Clock,
  User,
  AtSign,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { WR4 } from '../../../contracts';
import ReactMarkdown from 'react-markdown';

interface EmailCampaignEditorProps {
  content: WR4;
  onEdit: (field: string, value: unknown) => Promise<void>;
  initialEditMode?: boolean;
}

export function EmailCampaignEditor({ content, onEdit, initialEditMode = false }: EmailCampaignEditorProps) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);

  useEffect(() => {
    setEditMode(initialEditMode);
  }, [initialEditMode]);

  if (!content?.emails || content.emails.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgb(var(--text-muted))' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
            No email content available
          </p>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Email campaign data has not been generated yet.
          </p>
        </div>
      </div>
    );
  }

  const selectedEmail = content.emails[selectedEmailIndex];

  const getSubjectLineStatus = (subject: string) => {
    const length = subject.length;
    if (length <= 40) return { status: 'good', message: 'Great length for mobile', color: 'success' };
    if (length <= 60) return { status: 'ok', message: 'Good length', color: 'accent-primary' };
    if (length <= 80) return { status: 'warning', message: 'May truncate on mobile', color: 'warning' };
    return { status: 'long', message: 'Will likely truncate', color: 'error' };
  };

  const getPreviewTextStatus = (preview: string) => {
    const length = preview.length;
    if (length <= 90) return { status: 'good', message: 'Good preview length', color: 'success' };
    if (length <= 120) return { status: 'ok', message: 'May truncate', color: 'warning' };
    return { status: 'long', message: 'Will truncate', color: 'error' };
  };

  const subjectStatus = getSubjectLineStatus(selectedEmail?.subject || '');
  const previewStatus = getPreviewTextStatus(selectedEmail?.preview_text || '');

  return (
    <div className="h-full flex">
      <div
        className="w-64 border-r overflow-y-auto flex-shrink-0"
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        <div
          className="p-3 border-b sticky top-0"
          style={{ background: 'rgb(var(--surface-elevated))', borderColor: 'rgb(var(--border-default))' }}
        >
          <h4 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
            Email Sequence
          </h4>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
            {content.emails.length} emails
          </p>
        </div>
        <div className="p-2 space-y-1">
          {content.emails.map((email, i) => (
            <button
              key={email.email_id}
              onClick={() => setSelectedEmailIndex(i)}
              className="w-full text-left p-3 rounded-lg transition-colors"
              style={{
                background: selectedEmailIndex === i ? 'rgb(var(--accent-primary) / 0.1)' : 'transparent',
                border: selectedEmailIndex === i ? '1px solid rgb(var(--accent-primary) / 0.2)' : '1px solid transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgb(var(--accent-primary))',
                    color: 'white',
                  }}
                >
                  {email.email_id}
                </span>
                <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  {email.timing}
                </span>
              </div>
              <div
                className="text-sm font-medium mt-1 line-clamp-2"
                style={{ color: 'rgb(var(--text-primary))' }}
              >
                {email.subject}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'rgb(var(--border-default))' }}
        >
          <div className="flex items-center gap-3">
            <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
              Email Preview
            </h3>
            {selectedEmail && (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ background: 'rgb(var(--surface-elevated))', color: 'rgb(var(--text-muted))' }}
              >
                {selectedEmail.email_id}
              </span>
            )}
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: editMode ? 'rgb(var(--accent-primary))' : 'rgb(var(--surface-elevated))',
              color: editMode ? 'white' : 'rgb(var(--text-primary))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {editMode ? 'Preview' : 'Edit'}
          </button>
        </div>

        {selectedEmail && (
          <div className="flex-1 overflow-y-auto p-4">
            <div
              className="max-w-2xl mx-auto rounded-xl overflow-hidden"
              style={{
                background: 'rgb(var(--surface-base))',
                border: '1px solid rgb(var(--border-default))',
              }}
            >
              <div
                className="p-4 space-y-3"
                style={{ background: 'rgb(var(--surface-elevated))' }}
              >
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
                  <span style={{ color: 'rgb(var(--text-muted))' }}>From:</span>
                  <span style={{ color: 'rgb(var(--text-primary))' }}>
                    {content.send_rules.from_name_placeholder}
                  </span>
                  <span style={{ color: 'rgb(var(--text-muted))' }}>
                    &lt;{content.send_rules.from_email_placeholder}&gt;
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <AtSign className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
                  <span style={{ color: 'rgb(var(--text-muted))' }}>Reply-to:</span>
                  <span style={{ color: 'rgb(var(--text-primary))' }}>
                    {content.send_rules.reply_to_placeholder}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
                  <span style={{ color: 'rgb(var(--text-muted))' }}>Timing:</span>
                  {editMode ? (
                    <input
                      type="text"
                      value={selectedEmail.timing}
                      onChange={(e) =>
                        onEdit(`emails[${selectedEmailIndex}].timing`, e.target.value)
                      }
                      className="flex-1 bg-transparent border-b focus:outline-none"
                      style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-subtle))' }}
                    />
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgb(var(--accent-primary) / 0.1)', color: 'rgb(var(--accent-primary))' }}
                    >
                      {selectedEmail.timing}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="p-4 border-t"
                style={{ borderColor: 'rgb(var(--border-default))' }}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                      Subject Line
                    </label>
                    <div className="flex items-center gap-1">
                      {subjectStatus.color === 'success' ? (
                        <CheckCircle2 className="w-3 h-3" style={{ color: `rgb(var(--${subjectStatus.color}))` }} />
                      ) : (
                        <AlertTriangle className="w-3 h-3" style={{ color: `rgb(var(--${subjectStatus.color}))` }} />
                      )}
                      <span className="text-xs" style={{ color: `rgb(var(--${subjectStatus.color}))` }}>
                        {selectedEmail.subject.length} chars - {subjectStatus.message}
                      </span>
                    </div>
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      value={selectedEmail.subject}
                      onChange={(e) =>
                        onEdit(`emails[${selectedEmailIndex}].subject`, e.target.value)
                      }
                      className="w-full text-lg font-semibold bg-transparent border rounded-lg p-2 focus:outline-none"
                      style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-default))' }}
                    />
                  ) : (
                    <div className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                      {selectedEmail.subject}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                      Preview Text
                    </label>
                    <div className="flex items-center gap-1">
                      {previewStatus.color === 'success' ? (
                        <CheckCircle2 className="w-3 h-3" style={{ color: `rgb(var(--${previewStatus.color}))` }} />
                      ) : (
                        <AlertTriangle className="w-3 h-3" style={{ color: `rgb(var(--${previewStatus.color}))` }} />
                      )}
                      <span className="text-xs" style={{ color: `rgb(var(--${previewStatus.color}))` }}>
                        {selectedEmail.preview_text.length} chars - {previewStatus.message}
                      </span>
                    </div>
                  </div>
                  {editMode ? (
                    <textarea
                      value={selectedEmail.preview_text}
                      onChange={(e) =>
                        onEdit(`emails[${selectedEmailIndex}].preview_text`, e.target.value)
                      }
                      className="w-full bg-transparent border rounded-lg p-2 resize-none focus:outline-none"
                      style={{ color: 'rgb(var(--text-muted))', borderColor: 'rgb(var(--border-default))' }}
                      rows={2}
                    />
                  ) : (
                    <div className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                      {selectedEmail.preview_text}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium mb-2 block" style={{ color: 'rgb(var(--text-muted))' }}>
                    Body
                  </label>
                  {editMode ? (
                    <textarea
                      value={selectedEmail.body_markdown}
                      onChange={(e) =>
                        onEdit(`emails[${selectedEmailIndex}].body_markdown`, e.target.value)
                      }
                      className="w-full bg-transparent border rounded-lg p-4 resize-none focus:outline-none font-mono text-sm"
                      style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-default))' }}
                      rows={15}
                    />
                  ) : (
                    <div
                      className="prose prose-sm max-w-none p-4 rounded-lg"
                      style={{ background: 'rgb(var(--surface-elevated))' }}
                    >
                      <div
                        className="text-sm leading-relaxed"
                        style={{ color: 'rgb(var(--text-primary))' }}
                      >
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-3">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-3">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-3">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                          }}
                        >
                          {selectedEmail.body_markdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="p-4 rounded-lg text-center"
                  style={{ background: 'rgb(var(--accent-primary) / 0.1)' }}
                >
                  {editMode ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={selectedEmail.primary_cta_label}
                        onChange={(e) =>
                          onEdit(`emails[${selectedEmailIndex}].primary_cta_label`, e.target.value)
                        }
                        className="px-6 py-3 rounded-lg font-medium text-center focus:outline-none"
                        style={{ background: 'rgb(var(--accent-primary))', color: 'white' }}
                      />
                      <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                        Link: {selectedEmail.primary_cta_link_placeholder}
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className="px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                        style={{ background: 'rgb(var(--accent-primary))', color: 'white' }}
                      >
                        {selectedEmail.primary_cta_label}
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <div className="mt-2 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                        {selectedEmail.primary_cta_link_placeholder}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
