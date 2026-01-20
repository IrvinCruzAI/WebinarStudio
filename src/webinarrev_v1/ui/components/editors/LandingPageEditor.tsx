import { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  Plus,
  Trash2,
  Quote,
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  UserX,
  MessageSquare,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import type { WR3 } from '../../../contracts';

interface LandingPageEditorProps {
  content: WR3;
  onEdit: (field: string, value: unknown) => Promise<void>;
  initialEditMode?: boolean;
}

export function LandingPageEditor({ content, onEdit, initialEditMode = false }: LandingPageEditorProps) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hero: true,
    agenda: true,
    proof: true,
    speaker: true,
    cta: true,
    faq: false,
    audience: false,
  });

  useEffect(() => {
    setEditMode(initialEditMode);
  }, [initialEditMode]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const proofTypeIcons = {
    testimonial: Quote,
    metric: BarChart3,
    case_study: Briefcase,
  };

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgb(var(--text-muted))' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
            No landing page content available
          </p>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Landing page data has not been generated yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
          Landing Page Preview
        </h3>
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

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Section
            title="Hero Section"
            expanded={expandedSections.hero}
            onToggle={() => toggleSection('hero')}
          >
            <div
              className="p-6 rounded-xl text-center"
              style={{ background: 'linear-gradient(135deg, rgb(var(--accent-primary) / 0.1), rgb(var(--accent-secondary) / 0.1))' }}
            >
              {editMode ? (
                <input
                  type="text"
                  value={content.hero_headline}
                  onChange={(e) => onEdit('hero_headline', e.target.value)}
                  className="w-full text-2xl font-bold text-center bg-transparent border-b-2 focus:outline-none"
                  style={{
                    color: 'rgb(var(--text-primary))',
                    borderColor: 'rgb(var(--accent-primary))',
                  }}
                />
              ) : (
                <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                  {content.hero_headline}
                </h1>
              )}
              {editMode ? (
                <textarea
                  value={content.subheadline}
                  onChange={(e) => onEdit('subheadline', e.target.value)}
                  className="w-full mt-3 text-center bg-transparent border rounded-lg p-2 resize-none focus:outline-none"
                  style={{
                    color: 'rgb(var(--text-secondary))',
                    borderColor: 'rgb(var(--border-default))',
                  }}
                  rows={2}
                />
              ) : (
                <p className="mt-3" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {content.subheadline}
                </p>
              )}
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                Key Benefits
              </div>
              <ul className="space-y-2">
                {content.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-lg" style={{ color: 'rgb(var(--success))' }}>
                      *
                    </span>
                    {editMode ? (
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...content.bullets];
                          newBullets[i] = e.target.value;
                          onEdit('bullets', newBullets);
                        }}
                        className="flex-1 bg-transparent border-b focus:outline-none"
                        style={{
                          color: 'rgb(var(--text-primary))',
                          borderColor: 'rgb(var(--border-subtle))',
                        }}
                      />
                    ) : (
                      <span style={{ color: 'rgb(var(--text-primary))' }}>{bullet}</span>
                    )}
                    {editMode && (
                      <button
                        onClick={() => {
                          const newBullets = content.bullets.filter((_, idx) => idx !== i);
                          onEdit('bullets', newBullets);
                        }}
                        className="p-1 rounded hover:bg-[rgb(var(--error)/0.1)]"
                      >
                        <Trash2 className="w-3 h-3" style={{ color: 'rgb(var(--error))' }} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {editMode && content.bullets.length < 7 && (
                <button
                  onClick={() => onEdit('bullets', [...content.bullets, 'New benefit'])}
                  className="mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{
                    background: 'rgb(var(--accent-primary) / 0.1)',
                    color: 'rgb(var(--accent-primary))',
                  }}
                >
                  <Plus className="w-3 h-3" /> Add Bullet
                </button>
              )}
            </div>
          </Section>

          <Section
            title="Agenda Preview"
            expanded={expandedSections.agenda}
            onToggle={() => toggleSection('agenda')}
          >
            <div className="space-y-3">
              {content.agenda_preview.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg"
                  style={{ background: 'rgb(var(--surface-elevated))' }}
                >
                  <div
                    className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded"
                    style={{ background: 'rgb(var(--accent-primary) / 0.1)', color: 'rgb(var(--accent-primary))' }}
                  >
                    <Clock className="w-3 h-3" />
                    {editMode ? (
                      <input
                        type="number"
                        value={item.timebox_minutes}
                        onChange={(e) => {
                          const newAgenda = [...content.agenda_preview];
                          newAgenda[i] = { ...item, timebox_minutes: parseInt(e.target.value) || 0 };
                          onEdit('agenda_preview', newAgenda);
                        }}
                        className="w-12 bg-transparent text-center focus:outline-none"
                        min={1}
                        max={60}
                      />
                    ) : (
                      item.timebox_minutes
                    )}m
                  </div>
                  <div className="flex-1">
                    {editMode ? (
                      <input
                        type="text"
                        value={item.segment}
                        onChange={(e) => {
                          const newAgenda = [...content.agenda_preview];
                          newAgenda[i] = { ...item, segment: e.target.value };
                          onEdit('agenda_preview', newAgenda);
                        }}
                        className="w-full font-medium bg-transparent border-b focus:outline-none"
                        style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-subtle))' }}
                      />
                    ) : (
                      <div className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                        {item.segment}
                      </div>
                    )}
                    {editMode ? (
                      <input
                        type="text"
                        value={item.promise}
                        onChange={(e) => {
                          const newAgenda = [...content.agenda_preview];
                          newAgenda[i] = { ...item, promise: e.target.value };
                          onEdit('agenda_preview', newAgenda);
                        }}
                        className="w-full text-sm bg-transparent border-b focus:outline-none mt-1"
                        style={{ color: 'rgb(var(--text-muted))', borderColor: 'rgb(var(--border-subtle))' }}
                      />
                    ) : (
                      <div className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                        {item.promise}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Proof Blocks"
            expanded={expandedSections.proof}
            onToggle={() => toggleSection('proof')}
          >
            <div className="grid gap-4">
              {content.proof_blocks.map((proof, i) => {
                const ProofIcon = proofTypeIcons[proof.type];
                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgb(var(--surface-elevated))',
                      border: '1px solid rgb(var(--border-default))',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ background: 'rgb(var(--accent-primary) / 0.1)' }}
                      >
                        <ProofIcon className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
                      </div>
                      <span
                        className="text-xs font-medium uppercase"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        {proof.type.replace('_', ' ')}
                      </span>
                      {proof.needs_source && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgb(var(--warning) / 0.1)', color: 'rgb(var(--warning))' }}
                        >
                          Needs Source
                        </span>
                      )}
                    </div>
                    {editMode ? (
                      <textarea
                        value={proof.content}
                        onChange={(e) => {
                          const newProof = [...content.proof_blocks];
                          newProof[i] = { ...proof, content: e.target.value };
                          onEdit('proof_blocks', newProof);
                        }}
                        className="w-full bg-transparent border rounded-lg p-2 resize-none focus:outline-none"
                        style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-default))' }}
                        rows={3}
                      />
                    ) : (
                      <p style={{ color: 'rgb(var(--text-primary))' }}>{proof.content}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section
            title="Speaker Bio"
            expanded={expandedSections.speaker}
            onToggle={() => toggleSection('speaker')}
          >
            <div
              className="p-4 rounded-xl"
              style={{ background: 'rgb(var(--surface-elevated))' }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgb(var(--accent-primary) / 0.1)' }}
                >
                  <Users className="w-8 h-8" style={{ color: 'rgb(var(--accent-primary))' }} />
                </div>
                <div className="flex-1">
                  {editMode ? (
                    <input
                      type="text"
                      value={content.speaker_bio.one_liner}
                      onChange={(e) => onEdit('speaker_bio.one_liner', e.target.value)}
                      className="w-full font-medium bg-transparent border-b focus:outline-none"
                      style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-subtle))' }}
                    />
                  ) : (
                    <div className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                      {content.speaker_bio.one_liner}
                    </div>
                  )}
                </div>
              </div>
              <ul className="space-y-1 ml-4">
                {content.speaker_bio.credibility_bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span style={{ color: 'rgb(var(--accent-primary))' }}>-</span>
                    {editMode ? (
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...content.speaker_bio.credibility_bullets];
                          newBullets[i] = e.target.value;
                          onEdit('speaker_bio.credibility_bullets', newBullets);
                        }}
                        className="flex-1 bg-transparent border-b focus:outline-none"
                        style={{ color: 'rgb(var(--text-muted))', borderColor: 'rgb(var(--border-subtle))' }}
                      />
                    ) : (
                      <span style={{ color: 'rgb(var(--text-muted))' }}>{bullet}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section
            title="Call to Action"
            expanded={expandedSections.cta}
            onToggle={() => toggleSection('cta')}
          >
            <div
              className="p-6 rounded-xl text-center"
              style={{ background: 'linear-gradient(135deg, rgb(var(--success) / 0.1), rgb(var(--accent-primary) / 0.1))' }}
            >
              {editMode ? (
                <input
                  type="text"
                  value={content.cta_block.headline}
                  onChange={(e) => onEdit('cta_block.headline', e.target.value)}
                  className="w-full text-xl font-bold text-center bg-transparent border-b focus:outline-none"
                  style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--accent-primary))' }}
                />
              ) : (
                <h3 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                  {content.cta_block.headline}
                </h3>
              )}
              {editMode ? (
                <textarea
                  value={content.cta_block.body}
                  onChange={(e) => onEdit('cta_block.body', e.target.value)}
                  className="w-full mt-2 text-center bg-transparent border rounded-lg p-2 resize-none focus:outline-none"
                  style={{ color: 'rgb(var(--text-secondary))', borderColor: 'rgb(var(--border-default))' }}
                  rows={2}
                />
              ) : (
                <p className="mt-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {content.cta_block.body}
                </p>
              )}
              <div className="mt-4">
                {editMode ? (
                  <input
                    type="text"
                    value={content.cta_block.button_label}
                    onChange={(e) => onEdit('cta_block.button_label', e.target.value)}
                    className="px-6 py-3 rounded-lg font-medium text-center focus:outline-none"
                    style={{ background: 'rgb(var(--accent-primary))', color: 'white' }}
                  />
                ) : (
                  <button
                    className="px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                    style={{ background: 'rgb(var(--accent-primary))', color: 'white' }}
                  >
                    {content.cta_block.button_label}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                Link: {content.cta_block.link_placeholder}
              </div>
            </div>
          </Section>

          <Section
            title="FAQ"
            expanded={expandedSections.faq}
            onToggle={() => toggleSection('faq')}
          >
            <div className="space-y-3">
              {content.faq.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgb(var(--surface-elevated))' }}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-0.5" style={{ color: 'rgb(var(--accent-primary))' }} />
                    {editMode ? (
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => {
                          const newFaq = [...content.faq];
                          newFaq[i] = { ...item, question: e.target.value };
                          onEdit('faq', newFaq);
                        }}
                        className="flex-1 font-medium bg-transparent border-b focus:outline-none"
                        style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-subtle))' }}
                      />
                    ) : (
                      <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                        {item.question}
                      </span>
                    )}
                  </div>
                  {editMode ? (
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newFaq = [...content.faq];
                        newFaq[i] = { ...item, answer: e.target.value };
                        onEdit('faq', newFaq);
                      }}
                      className="w-full mt-2 ml-6 bg-transparent border rounded-lg p-2 resize-none focus:outline-none text-sm"
                      style={{ color: 'rgb(var(--text-muted))', borderColor: 'rgb(var(--border-default))' }}
                      rows={2}
                    />
                  ) : (
                    <p className="mt-2 ml-6 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                      {item.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Target Audience"
            expanded={expandedSections.audience}
            onToggle={() => toggleSection('audience')}
          >
            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-4 rounded-xl"
                style={{ background: 'rgb(var(--success) / 0.1)', border: '1px solid rgb(var(--success) / 0.2)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" style={{ color: 'rgb(var(--success))' }} />
                  <span className="font-medium text-sm" style={{ color: 'rgb(var(--success))' }}>
                    Who It's For
                  </span>
                </div>
                <ul className="space-y-1">
                  {content.who_its_for.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span style={{ color: 'rgb(var(--success))' }}>+</span>
                      {editMode ? (
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newList = [...content.who_its_for];
                            newList[i] = e.target.value;
                            onEdit('who_its_for', newList);
                          }}
                          className="flex-1 bg-transparent border-b focus:outline-none"
                          style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-subtle))' }}
                        />
                      ) : (
                        <span style={{ color: 'rgb(var(--text-primary))' }}>{item}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: 'rgb(var(--error) / 0.1)', border: '1px solid rgb(var(--error) / 0.2)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserX className="w-4 h-4" style={{ color: 'rgb(var(--error))' }} />
                  <span className="font-medium text-sm" style={{ color: 'rgb(var(--error))' }}>
                    Who It's Not For
                  </span>
                </div>
                <ul className="space-y-1">
                  {content.who_its_not_for.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span style={{ color: 'rgb(var(--error))' }}>-</span>
                      {editMode ? (
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newList = [...content.who_its_not_for];
                            newList[i] = e.target.value;
                            onEdit('who_its_not_for', newList);
                          }}
                          className="flex-1 bg-transparent border-b focus:outline-none"
                          style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-subtle))' }}
                        />
                      ) : (
                        <span style={{ color: 'rgb(var(--text-primary))' }}>{item}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, expanded, onToggle, children }: SectionProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid rgb(var(--border-default))',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: 'rgb(var(--surface-elevated))' }}
      >
        <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
          {title}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
        )}
      </button>
      {expanded && <div className="p-4">{children}</div>}
    </div>
  );
}
