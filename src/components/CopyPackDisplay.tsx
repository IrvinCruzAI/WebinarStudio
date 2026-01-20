import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/exportUtils';

interface CopyPackDisplayProps {
  content: any;
}

const CopyPackDisplay: React.FC<CopyPackDisplayProps> = ({ content }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['landing', 'email', 'social']));
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleCopySection = async (section: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const renderLandingPage = () => {
    const lp = content.landing_page;
    if (!lp) return null;

    const lpText = [
      '# LANDING PAGE COPY',
      '',
      '## Headline Options',
      ...(lp.headlines || []).map((h: string, i: number) => `${i + 1}. ${h}`),
      '',
      '## Subheadline Options',
      ...(lp.subheads || []).map((s: string, i: number) => `${i + 1}. ${s}`),
      '',
      '## Hero Section Bullets',
      ...(lp.hero_bullets || []).map((b: string) => `• ${b}`),
      '',
      '## What You\'ll Learn',
      ...(lp.what_youll_learn || []).map((l: string) => `• ${l}`),
      '',
      '## Who This Is For',
      ...(lp.who_its_for || []).map((p: string) => `✓ ${p}`),
      '',
      '## Who This Is NOT For',
      ...(lp.who_its_not_for || []).map((n: string) => `✗ ${n}`),
      '',
      '## Agenda Preview',
      ...(lp.agenda_preview || []).map((item: any) =>
        `**${item.segment}** (${item.timebox_minutes} min)\n${item.promise}`
      ),
      '',
      '## Speaker Bio',
      lp.speaker_bio?.one_liner || '',
      '',
      'Credentials:',
      ...(lp.speaker_bio?.credibility_bullets || []).map((c: string) => `• ${c}`),
      '',
      '## Proof Elements',
      ...(lp.proof_blocks || []).map((p: any) =>
        `**[${p.type.toUpperCase()}]**\n${p.content}${p.needs_source ? ' *(Needs source verification)*' : ''}`
      ),
      '',
      '## CTA Blocks',
      ...(lp.cta_blocks || []).map((cta: any) =>
        `### ${cta.headline}\n${cta.body}\n\n[${cta.button_label}]`
      ),
      '',
      '## FAQ',
      ...(lp.faq || []).map((f: any) =>
        `**Q: ${f.question}**\nA: ${f.answer}`
      ),
      '',
      lp.compliance_notes && lp.compliance_notes.length > 0 ? '## Compliance Notes' : '',
      ...(lp.compliance_notes || []).map((n: string) => `⚠️ ${n}`)
    ].filter(line => line !== '').join('\n');

    return (
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('landing')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
        >
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Landing Page Copy</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {lp.headlines?.length || 0} headlines • {lp.what_youll_learn?.length || 0} benefits • {lp.faq?.length || 0} FAQs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopySection('landing', lpText);
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
              title="Copy landing page"
            >
              {copiedSection === 'landing' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </button>
            {expandedSections.has('landing') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.has('landing') && (
          <div className="px-4 pb-4 space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Headline Options</h5>
              <div className="space-y-2">
                {(lp.headlines || []).map((headline: string, i: number) => (
                  <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{i + 1}.</span>{' '}
                    <span className="text-gray-900 dark:text-white">{headline}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Subheadline Options</h5>
              <div className="space-y-2">
                {(lp.subheads || []).map((subhead: string, i: number) => (
                  <div key={i} className="text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{i + 1}.</span> {subhead}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Hero Bullets</h5>
              <ul className="space-y-1">
                {(lp.hero_bullets || []).map((bullet: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">What You'll Learn</h5>
              <ul className="space-y-1">
                {(lp.what_youll_learn || []).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">Who This Is For</h5>
                <ul className="space-y-1">
                  {(lp.who_its_for || []).map((persona: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>{persona}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <h5 className="font-semibold text-red-900 dark:text-red-100 mb-2">Who This Is NOT For</h5>
                <ul className="space-y-1">
                  {(lp.who_its_not_for || []).map((notFor: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                      <span className="text-red-600 dark:text-red-400">✗</span>
                      <span>{notFor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {lp.agenda_preview && lp.agenda_preview.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Agenda Preview</h5>
                <div className="space-y-3">
                  {lp.agenda_preview.map((item: any, i: number) => (
                    <div key={i} className="border-l-4 border-teal-500 pl-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.segment} <span className="text-sm text-gray-500">({item.timebox_minutes} min)</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.promise}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lp.speaker_bio && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <h5 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Speaker Bio</h5>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{lp.speaker_bio.one_liner}</p>
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white mb-1">Credentials:</div>
                  <ul className="space-y-1">
                    {(lp.speaker_bio.credibility_bullets || []).map((cred: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-amber-600 dark:text-amber-400">•</span>
                        <span>{cred}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {lp.cta_blocks && lp.cta_blocks.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900 dark:text-white">CTA Blocks</h5>
                {lp.cta_blocks.map((cta: any, i: number) => (
                  <div key={i} className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
                    <h6 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{cta.headline}</h6>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{cta.body}</p>
                    <button className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg">
                      {cta.button_label}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {lp.faq && lp.faq.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">FAQ</h5>
                <div className="space-y-3">
                  {lp.faq.map((item: any, i: number) => (
                    <div key={i}>
                      <div className="font-medium text-gray-900 dark:text-white mb-1">Q: {item.question}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">A: {item.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEmailSequence = () => {
    const campaign = content.email_campaign;
    if (!campaign) return null;

    const emailText = [
      '# EMAIL SEQUENCE',
      '',
      `From Name: ${campaign.send_rules?.from_name_placeholder || '[INSERT FROM NAME]'}`,
      `From Email: ${campaign.send_rules?.from_email_placeholder || '[INSERT FROM EMAIL]'}`,
      `Reply To: ${campaign.send_rules?.reply_to_placeholder || '[INSERT REPLY-TO]'}`,
      '',
      ...(campaign.emails || []).flatMap((email: any) => [
        '',
        `## ${email.id.toUpperCase().replace(/_/g, ' ')}`,
        `**Timing:** ${email.timing}`,
        `**Subject:** ${email.subject}`,
        `**Preview:** ${email.preview_text}`,
        '',
        email.body_markdown,
        '',
        `[${email.primary_cta_label}] → ${email.primary_cta_link_placeholder}`,
        '',
        '---'
      ])
    ].join('\n');

    return (
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('email')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
        >
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Email Sequence</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {campaign.emails?.length || 0} emails
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopySection('email', emailText);
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
              title="Copy email sequence"
            >
              {copiedSection === 'email' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </button>
            {expandedSections.has('email') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.has('email') && (
          <div className="px-4 pb-4 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Sender Configuration</h5>
              <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <div><strong>From Name:</strong> {campaign.send_rules?.from_name_placeholder || '[INSERT FROM NAME]'}</div>
                <div><strong>From Email:</strong> {campaign.send_rules?.from_email_placeholder || '[INSERT FROM EMAIL]'}</div>
                <div><strong>Reply To:</strong> {campaign.send_rules?.reply_to_placeholder || '[INSERT REPLY-TO]'}</div>
              </div>
            </div>

            {(campaign.emails || []).map((email: any, i: number) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2">
                  <h5 className="font-bold text-white">{email.id.toUpperCase().replace(/_/g, ' ')}</h5>
                  <div className="text-xs text-indigo-100">Timing: {email.timing}</div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject Line</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{email.subject}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Preview Text</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{email.preview_text}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email Body</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 rounded p-3 border border-gray-200 dark:border-gray-700">
                      {email.body_markdown}
                    </div>
                  </div>
                  <div className="pt-2">
                    <button className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded text-sm">
                      {email.primary_cta_label}
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      {email.primary_cta_link_placeholder}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSocialPosts = () => {
    const social = content.social_promo;
    if (!social) return null;

    const socialText = [
      '# SOCIAL MEDIA POSTS',
      '',
      '## LinkedIn Posts',
      ...(social.linkedin_posts || []).flatMap((post: any) => [
        '',
        `**Hook:** ${post.hook}`,
        '',
        post.body,
        '',
        `**CTA:** ${post.cta_line}`,
        '',
        '---'
      ]),
      '',
      '## X/Twitter Posts',
      ...(social.x_posts || []).map((post: any) => `• ${post.body}`),
      '',
      '## Last Chance Messages',
      ...(social.last_chance_blurbs || []).map((msg: any) => `• ${msg.body}`)
    ].join('\n');

    return (
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('social')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
        >
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Social Media Posts</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {social.linkedin_posts?.length || 0} LinkedIn • {social.x_posts?.length || 0} X/Twitter
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopySection('social', socialText);
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
              title="Copy social posts"
            >
              {copiedSection === 'social' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </button>
            {expandedSections.has('social') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.has('social') && (
          <div className="px-4 pb-4 space-y-4">
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn Posts
              </h5>
              <div className="space-y-4">
                {(social.linkedin_posts || []).map((post: any, i: number) => (
                  <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">POST {i + 1}</div>
                    <div className="mb-2">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hook</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{post.hook}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Body</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.body}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CTA</div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{post.cta_line}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X/Twitter Posts
              </h5>
              <div className="space-y-3">
                {(social.x_posts || []).map((post: any, i: number) => (
                  <div key={i} className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg p-4 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">POST {i + 1}</div>
                    <div className="text-sm">{post.body}</div>
                  </div>
                ))}
              </div>
            </div>

            {social.last_chance_blurbs && social.last_chance_blurbs.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Last Chance Messages</h5>
                <div className="space-y-2">
                  {social.last_chance_blurbs.map((msg: any, i: number) => (
                    <div key={i} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                      <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">MESSAGE {i + 1}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">{msg.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {content.sms_optional && content.sms_optional.enabled && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h5 className="font-semibold text-green-900 dark:text-green-100 mb-3">SMS Messages (Optional)</h5>
                <div className="space-y-2">
                  {(content.sms_optional.messages || []).map((sms: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timing: {sms.timing}</div>
                      <div className="text-sm text-gray-900 dark:text-white">{sms.body}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sms.body.length} chars</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {renderLandingPage()}
      {renderEmailSequence()}
      {renderSocialPosts()}
    </div>
  );
};

export default CopyPackDisplay;
