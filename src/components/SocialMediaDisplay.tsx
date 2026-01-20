import React, { useState } from 'react';
import { Copy, Check, Hash, TrendingUp } from 'lucide-react';
import { copyToClipboard } from '../utils/exportUtils';

interface SocialMediaDisplayProps {
  content: any;
}

const SocialMediaDisplay: React.FC<SocialMediaDisplayProps> = ({ content }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const social = content.social_promo;
  if (!social) return null;

  const handleCopy = async (section: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const getCharCount = (text: string) => text.length;

  return (
    <div className="space-y-8">
      {/* LinkedIn Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">LinkedIn Posts</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{social.linkedin_posts?.length || 0} professional posts</p>
            </div>
          </div>
          <button
            onClick={() => handleCopy('linkedin-all', (social.linkedin_posts || []).map((p: any) => `${p.hook}\n\n${p.body}\n\n${p.cta_line}`).join('\n\n---\n\n'))}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-md"
          >
            {copiedSection === 'linkedin-all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy All
          </button>
        </div>

        <div className="space-y-5">
          {(social.linkedin_posts || []).map((post: any, i: number) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-all">
              {/* LinkedIn Post Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">[Your Name]</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">[Your Title] • [Connection]</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(`linkedin-${i}`, `${post.hook}\n\n${post.body}\n\n${post.cta_line}`)}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    {copiedSection === `linkedin-${i}` ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-6">
                {/* Hook */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Hook
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{getCharCount(post.hook)} chars</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">{post.hook}</p>
                </div>

                {/* Body */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Body</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{getCharCount(post.body)} chars</span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.body}</div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                  <span>→</span>
                  <span>{post.cta_line}</span>
                </div>

                {/* LinkedIn Engagement Preview */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <button className="hover:text-blue-600 dark:hover:text-blue-400 transition">👍 Like</button>
                  <button className="hover:text-blue-600 dark:hover:text-blue-400 transition">💬 Comment</button>
                  <button className="hover:text-blue-600 dark:hover:text-blue-400 transition">🔄 Repost</button>
                  <button className="hover:text-blue-600 dark:hover:text-blue-400 transition">📤 Send</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* X/Twitter Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-black dark:bg-white flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">X / Twitter Posts</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{social.x_posts?.length || 0} punchy tweets</p>
            </div>
          </div>
          <button
            onClick={() => handleCopy('twitter-all', (social.x_posts || []).map((p: any) => p.body).join('\n\n---\n\n'))}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-md"
          >
            {copiedSection === 'twitter-all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy All
          </button>
        </div>

        <div className="space-y-4">
          {(social.x_posts || []).map((post: any, i: number) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black dark:from-gray-400 dark:to-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">[Your Name]</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">@yourhandle</div>
                    </div>
                    <button
                      onClick={() => handleCopy(`twitter-${i}`, post.body)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copiedSection === `twitter-${i}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap mb-3">{post.body}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <span>{getCharCount(post.body)}/280</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        getCharCount(post.body) > 280
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {getCharCount(post.body) <= 280 ? '✓ Within limit' : '⚠ Too long'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="hover:text-blue-500 transition">💬</button>
                      <button className="hover:text-green-500 transition">🔄</button>
                      <button className="hover:text-red-500 transition">❤️</button>
                      <button className="hover:text-gray-700 dark:hover:text-gray-300 transition">📊</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Chance Messages */}
      {social.last_chance_blurbs && social.last_chance_blurbs.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Last Chance Messages</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Urgent, scarcity-driven copy</p>
            </div>
          </div>

          <div className="space-y-4">
            {social.last_chance_blurbs.map((msg: any, i: number) => (
              <div key={i} className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase">Urgent</span>
                      <span className="text-sm text-red-600 dark:text-red-400 font-semibold">Message {i + 1}</span>
                    </div>
                    <p className="text-gray-900 dark:text-white leading-relaxed text-lg">{msg.body}</p>
                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                      {getCharCount(msg.body)} characters
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(`last-chance-${i}`, msg.body)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedSection === `last-chance-${i}` ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SMS Optional */}
      {content.sms_optional && content.sms_optional.enabled && content.sms_optional.messages && content.sms_optional.messages.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">SMS Messages</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Optional text message reminders</p>
            </div>
          </div>

          <div className="space-y-4">
            {content.sms_optional.messages.map((sms: any, i: number) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">
                        {sms.timing.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        getCharCount(sms.body) <= 160
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {getCharCount(sms.body)}/160 chars
                      </span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <p className="text-gray-900 dark:text-white">{sms.body}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(`sms-${i}`, sms.body)}
                    className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedSection === `sms-${i}` ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-teal-600" />
          Social Media Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{social.linkedin_posts?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">LinkedIn Posts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{social.x_posts?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">X Posts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{social.last_chance_blurbs?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Urgent Messages</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
              {((social.linkedin_posts?.length || 0) + (social.x_posts?.length || 0) + (social.last_chance_blurbs?.length || 0))}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Assets</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaDisplay;
