import ReactMarkdown from 'react-markdown';
import { Shield, MessageSquare, ArrowRight } from 'lucide-react';
import type { WR2Block, DeliverableId } from '../../contracts';
import { hasPlaceholders } from '../../utils/stageDirectionsFormatter';
import { InlineMissingInfoCallout } from './InlineMissingInfoCallout';

interface DeliverBlockContentProps {
  block: WR2Block;
  onNavigateToTab?: (route: { tab: string; deliverableId?: DeliverableId }) => void;
}

export function DeliverBlockContent({ block, onNavigateToTab }: DeliverBlockContentProps) {
  const hasTalkTrackPlaceholders = hasPlaceholders(block.talk_track_md);
  const hasSpeakerNotesPlaceholders = hasPlaceholders(block.speaker_notes_md);

  const handleFixRoute = (route: { tab: string; deliverableId?: DeliverableId }) => {
    if (onNavigateToTab) {
      onNavigateToTab(route);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3
            className="text-sm font-medium uppercase tracking-wide"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            What to Say
          </h3>
          {hasTalkTrackPlaceholders && (
            <InlineMissingInfoCallout
              placeholderText="Talk track contains placeholders"
              fieldPath="talk_track_md"
              deliverableId="WR2"
              onFix={handleFixRoute}
            />
          )}
          <div
            className="prose prose-lg max-w-none"
            style={{
              color: 'rgb(var(--text-primary))',
              lineHeight: '1.9',
              fontSize: '1.125rem',
            }}
          >
            <ReactMarkdown>{block.talk_track_md}</ReactMarkdown>
          </div>
        </div>

        {block.speaker_notes_md && block.speaker_notes_md.trim().length > 0 && (
          <div
            className="rounded-lg p-4 space-y-2"
            style={{
              background: 'rgb(var(--surface-base))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <h3
              className="text-sm font-medium uppercase tracking-wide"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              Speaker Notes
            </h3>
            {hasSpeakerNotesPlaceholders && (
              <InlineMissingInfoCallout
                placeholderText="Speaker notes contain placeholders"
                fieldPath="speaker_notes_md"
                deliverableId="WR2"
                onFix={handleFixRoute}
              />
            )}
            <div
              className="text-sm"
              style={{
                color: 'rgb(var(--text-muted))',
                lineHeight: '1.6',
              }}
            >
              <ReactMarkdown>{block.speaker_notes_md}</ReactMarkdown>
            </div>
          </div>
        )}

        {block.proof_insertion_points && block.proof_insertion_points.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
              <h3
                className="text-sm font-medium uppercase tracking-wide"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Proof Points
              </h3>
            </div>
            <ul className="space-y-1.5 ml-6 list-disc">
              {block.proof_insertion_points.map((proof, idx) => (
                <li key={idx} className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                  {proof}
                </li>
              ))}
            </ul>
          </div>
        )}

        {block.objections_handled && block.objections_handled.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
              <h3
                className="text-sm font-medium uppercase tracking-wide"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Objections Handled
              </h3>
            </div>
            <ul className="space-y-1.5 ml-6 list-disc">
              {block.objections_handled.map((objection, idx) => (
                <li key={idx} className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                  {objection}
                </li>
              ))}
            </ul>
          </div>
        )}

        {block.transition_out && block.transition_out.trim().length > 0 && (
          <div
            className="flex items-center gap-2 pt-4 border-t"
            style={{ borderColor: 'rgb(var(--border-default))' }}
          >
            <ArrowRight className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
            <span className="text-sm italic" style={{ color: 'rgb(var(--text-muted))' }}>
              {block.transition_out}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
