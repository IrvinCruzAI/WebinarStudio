import { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  Linkedin,
  Twitter,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { WR5 } from '../../../contracts';

interface SocialPostsEditorProps {
  content: WR5;
  onEdit: (field: string, value: unknown) => Promise<void>;
  initialEditMode?: boolean;
}

type PlatformTab = 'linkedin' | 'x' | 'last_chance';

const PLATFORM_LIMITS = {
  linkedin: 3000,
  x: 280,
  last_chance: 500,
};

const PLATFORM_LABELS = {
  linkedin: 'LinkedIn Posts',
  x: 'X (Twitter) Posts',
  last_chance: 'Last Chance Blurbs',
};

export function SocialPostsEditor({ content, onEdit, initialEditMode = false }: SocialPostsEditorProps) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const [activeTab, setActiveTab] = useState<PlatformTab>('linkedin');

  useEffect(() => {
    setEditMode(initialEditMode);
  }, [initialEditMode]);

  if (!content?.linkedin_posts || !content?.x_posts || !content?.last_chance_blurbs) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgb(var(--text-muted))' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
            No social media content available
          </p>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Social media posts have not been generated yet.
          </p>
        </div>
      </div>
    );
  }

  const getCharacterStatus = (length: number, limit: number) => {
    const percentage = (length / limit) * 100;
    if (percentage <= 70) return { color: 'success', status: 'good' };
    if (percentage <= 90) return { color: 'warning', status: 'approaching limit' };
    if (percentage <= 100) return { color: 'warning', status: 'near limit' };
    return { color: 'error', status: 'over limit' };
  };

  const tabs: { id: PlatformTab; label: string; icon: typeof Linkedin; count: number }[] = [
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, count: content.linkedin_posts.length },
    { id: 'x', label: 'X (Twitter)', icon: Twitter, count: content.x_posts.length },
    { id: 'last_chance', label: 'Last Chance', icon: Clock, count: content.last_chance_blurbs.length },
  ];

  const renderLinkedInPost = (post: typeof content.linkedin_posts[0], index: number) => {
    const fullText = `${post.hook}\n\n${post.body}\n\n${post.cta_line}`;
    const charStatus = getCharacterStatus(fullText.length, PLATFORM_LIMITS.linkedin);

    return (
      <div
        key={post.social_id}
        className="p-4 rounded-xl"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ background: '#0077B5', color: 'white' }}
            >
              {post.social_id}
            </span>
            <Linkedin className="w-4 h-4" style={{ color: '#0077B5' }} />
          </div>
          <div className="flex items-center gap-1">
            {charStatus.color === 'success' ? (
              <CheckCircle2 className="w-3 h-3" style={{ color: `rgb(var(--${charStatus.color}))` }} />
            ) : (
              <AlertTriangle className="w-3 h-3" style={{ color: `rgb(var(--${charStatus.color}))` }} />
            )}
            <span className="text-xs" style={{ color: `rgb(var(--${charStatus.color}))` }}>
              {fullText.length}/{PLATFORM_LIMITS.linkedin}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
              Hook
            </label>
            {editMode ? (
              <textarea
                value={post.hook}
                onChange={(e) => {
                  const newPosts = [...content.linkedin_posts];
                  newPosts[index] = { ...post, hook: e.target.value };
                  onEdit('linkedin_posts', newPosts);
                }}
                className="w-full bg-transparent border rounded-lg p-2 resize-none focus:outline-none font-medium"
                style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-default))' }}
                rows={2}
              />
            ) : (
              <div className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                {post.hook}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
              Body
            </label>
            {editMode ? (
              <textarea
                value={post.body}
                onChange={(e) => {
                  const newPosts = [...content.linkedin_posts];
                  newPosts[index] = { ...post, body: e.target.value };
                  onEdit('linkedin_posts', newPosts);
                }}
                className="w-full bg-transparent border rounded-lg p-2 resize-none focus:outline-none text-sm"
                style={{ color: 'rgb(var(--text-secondary))', borderColor: 'rgb(var(--border-default))' }}
                rows={6}
              />
            ) : (
              <div className="text-sm whitespace-pre-wrap" style={{ color: 'rgb(var(--text-secondary))' }}>
                {post.body}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--text-muted))' }}>
              CTA Line
            </label>
            {editMode ? (
              <input
                type="text"
                value={post.cta_line}
                onChange={(e) => {
                  const newPosts = [...content.linkedin_posts];
                  newPosts[index] = { ...post, cta_line: e.target.value };
                  onEdit('linkedin_posts', newPosts);
                }}
                className="w-full bg-transparent border rounded-lg p-2 focus:outline-none text-sm font-medium"
                style={{ color: 'rgb(var(--accent-primary))', borderColor: 'rgb(var(--border-default))' }}
              />
            ) : (
              <div className="text-sm font-medium" style={{ color: 'rgb(var(--accent-primary))' }}>
                {post.cta_line}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderXPost = (post: typeof content.x_posts[0], index: number) => {
    const charStatus = getCharacterStatus(post.body.length, PLATFORM_LIMITS.x);

    return (
      <div
        key={post.social_id}
        className="p-4 rounded-xl"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ background: '#1DA1F2', color: 'white' }}
            >
              {post.social_id}
            </span>
            <Twitter className="w-4 h-4" style={{ color: '#1DA1F2' }} />
          </div>
          <div className="flex items-center gap-1">
            {charStatus.color === 'success' ? (
              <CheckCircle2 className="w-3 h-3" style={{ color: `rgb(var(--${charStatus.color}))` }} />
            ) : (
              <AlertTriangle className="w-3 h-3" style={{ color: `rgb(var(--${charStatus.color}))` }} />
            )}
            <span className="text-xs" style={{ color: `rgb(var(--${charStatus.color}))` }}>
              {post.body.length}/{PLATFORM_LIMITS.x}
            </span>
          </div>
        </div>

        {editMode ? (
          <textarea
            value={post.body}
            onChange={(e) => {
              const newPosts = [...content.x_posts];
              newPosts[index] = { ...post, body: e.target.value };
              onEdit('x_posts', newPosts);
            }}
            className="w-full bg-transparent border rounded-lg p-3 resize-none focus:outline-none"
            style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--border-default))' }}
            rows={4}
            maxLength={PLATFORM_LIMITS.x}
          />
        ) : (
          <div style={{ color: 'rgb(var(--text-primary))' }}>
            {post.body}
          </div>
        )}
      </div>
    );
  };

  const renderLastChanceBlurb = (blurb: typeof content.last_chance_blurbs[0], index: number) => {
    const charStatus = getCharacterStatus(blurb.body.length, PLATFORM_LIMITS.last_chance);

    return (
      <div
        key={blurb.social_id}
        className="p-4 rounded-xl"
        style={{
          background: 'rgb(var(--warning) / 0.1)',
          border: '1px solid rgb(var(--warning) / 0.2)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgb(var(--warning))', color: 'white' }}
            >
              {blurb.social_id}
            </span>
            <Clock className="w-4 h-4" style={{ color: 'rgb(var(--warning))' }} />
            <span className="text-xs font-medium" style={{ color: 'rgb(var(--warning))' }}>
              Urgency Copy
            </span>
          </div>
          <div className="flex items-center gap-1">
            {charStatus.color === 'success' ? (
              <CheckCircle2 className="w-3 h-3" style={{ color: `rgb(var(--${charStatus.color}))` }} />
            ) : (
              <AlertTriangle className="w-3 h-3" style={{ color: `rgb(var(--${charStatus.color}))` }} />
            )}
            <span className="text-xs" style={{ color: `rgb(var(--${charStatus.color}))` }}>
              {blurb.body.length}/{PLATFORM_LIMITS.last_chance}
            </span>
          </div>
        </div>

        {editMode ? (
          <textarea
            value={blurb.body}
            onChange={(e) => {
              const newBlurbs = [...content.last_chance_blurbs];
              newBlurbs[index] = { ...blurb, body: e.target.value };
              onEdit('last_chance_blurbs', newBlurbs);
            }}
            className="w-full bg-transparent border rounded-lg p-3 resize-none focus:outline-none"
            style={{ color: 'rgb(var(--text-primary))', borderColor: 'rgb(var(--warning) / 0.3)' }}
            rows={4}
          />
        ) : (
          <div className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
            {blurb.body}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        <div className="flex items-center gap-4">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: activeTab === tab.id ? 'rgb(var(--accent-primary) / 0.1)' : 'transparent',
                  color: activeTab === tab.id ? 'rgb(var(--accent-primary))' : 'rgb(var(--text-muted))',
                }}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === tab.id ? 'rgb(var(--accent-primary))' : 'rgb(var(--surface-elevated))',
                    color: activeTab === tab.id ? 'white' : 'rgb(var(--text-muted))',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
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

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div
            className="p-3 rounded-lg flex items-center justify-between"
            style={{ background: 'rgb(var(--surface-elevated))' }}
          >
            <div>
              <h4 className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                {PLATFORM_LABELS[activeTab]}
              </h4>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                Character limit: {PLATFORM_LIMITS[activeTab].toLocaleString()}
              </p>
            </div>
            <div className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              {activeTab === 'linkedin' && `${content.linkedin_posts.length} posts (3-8 required)`}
              {activeTab === 'x' && `${content.x_posts.length} posts (2-6 required)`}
              {activeTab === 'last_chance' && `${content.last_chance_blurbs.length} blurbs (1-4 required)`}
            </div>
          </div>

          {activeTab === 'linkedin' && (
            <div className="space-y-4">
              {content.linkedin_posts.map((post, i) => renderLinkedInPost(post, i))}
            </div>
          )}

          {activeTab === 'x' && (
            <div className="space-y-4">
              {content.x_posts.map((post, i) => renderXPost(post, i))}
            </div>
          )}

          {activeTab === 'last_chance' && (
            <div className="space-y-4">
              {content.last_chance_blurbs.map((blurb, i) => renderLastChanceBlurb(blurb, i))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
