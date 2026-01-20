import React, { useState } from 'react';
import { Copy, Check, Mail, Clock, Users, ArrowRight } from 'lucide-react';
import { copyToClipboard } from '../utils/exportUtils';

interface EmailCampaignDisplayProps {
  content: any;
}

const EmailCampaignDisplay: React.FC<EmailCampaignDisplayProps> = ({ content }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const campaign = content.email_campaign;
  if (!campaign) return null;

  const handleCopy = async (section: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const getEmailIcon = (timing: string) => {
    if (timing.includes('immediate')) return '🎉';
    if (timing.includes('24')) return '📅';
    if (timing.includes('morning')) return '☀️';
    if (timing.includes('15')) return '⏰';
    if (timing.includes('attended')) return '🎯';
    if (timing.includes('no_show')) return '🔄';
    return '📧';
  };

  const getEmailColor = (id: string) => {
    if (id.includes('confirm')) return 'from-green-500 to-emerald-500';
    if (id.includes('24h')) return 'from-blue-500 to-cyan-500';
    if (id.includes('morning')) return 'from-orange-500 to-amber-500';
    if (id.includes('15m')) return 'from-red-500 to-pink-500';
    if (id.includes('attended')) return 'from-purple-500 to-indigo-500';
    if (id.includes('noshow')) return 'from-teal-500 to-cyan-500';
    return 'from-gray-500 to-gray-600';
  };

  const getCharCount = (text: string) => text.length;
  const getWordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Sender Configuration */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Sender Configuration</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From Name</div>
            <div className="font-semibold text-gray-900 dark:text-white">{campaign.send_rules?.from_name_placeholder || '[FROM NAME]'}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From Email</div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">{campaign.send_rules?.from_email_placeholder || '[FROM EMAIL]'}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reply To</div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">{campaign.send_rules?.reply_to_placeholder || '[REPLY-TO]'}</div>
          </div>
        </div>
      </div>

      {/* Email Sequence Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          Email Sequence Timeline
        </h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 to-purple-500"></div>
          <div className="space-y-4">
            {(campaign.emails || []).map((email: any, i: number) => (
              <div key={i} className="relative pl-10 flex items-center gap-4">
                <div className="absolute left-0 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-4 border-teal-500 flex items-center justify-center text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{email.timing.replace(/_/g, ' ')}</span>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{email.email_id.replace(/_/g, ' ').toUpperCase()}</h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Emails */}
      <div className="space-y-6">
        {(campaign.emails || []).map((email: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            {/* Email Header */}
            <div className={`bg-gradient-to-r ${getEmailColor(email.email_id)} p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{getEmailIcon(email.timing)}</span>
                    <div>
                      <h4 className="text-xl font-bold text-white">{email.email_id.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p className="text-sm text-white/80 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {email.timing.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(`email-${i}`, `Subject: ${email.subject}\n\n${email.body_markdown}\n\n[${email.primary_cta_label}]`)}
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {copiedSection === `email-${i}` ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Email Preview */}
            <div className="p-6">
              {/* Subject Line */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subject Line</label>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{getCharCount(email.subject)} chars</span>
                    <button
                      onClick={() => handleCopy(`subject-${i}`, email.subject)}
                      className="text-gray-400 hover:text-teal-600 transition"
                    >
                      {copiedSection === `subject-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-l-4 border-teal-500">
                  <p className="font-semibold text-lg text-gray-900 dark:text-white">{email.subject}</p>
                </div>
              </div>

              {/* Preview Text */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Preview Text</label>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{getCharCount(email.preview_text)} chars</span>
                    <button
                      onClick={() => handleCopy(`preview-${i}`, email.preview_text)}
                      className="text-gray-400 hover:text-teal-600 transition"
                    >
                      {copiedSection === `preview-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{email.preview_text}</p>
                </div>
              </div>

              {/* Email Body */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email Body</label>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{getWordCount(email.body_markdown)} words</span>
                    <button
                      onClick={() => handleCopy(`body-${i}`, email.body_markdown)}
                      className="text-gray-400 hover:text-teal-600 transition"
                    >
                      {copiedSection === `body-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {email.body_markdown}
                    </pre>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Call-to-Action</div>
                  <button className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md">
                    {email.primary_cta_label}
                  </button>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    → {email.primary_cta_link_placeholder}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Campaign Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{campaign.emails?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Emails</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {campaign.emails?.reduce((acc: number, e: any) => acc + getWordCount(e.body_markdown), 0) || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">3</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Pre-Event</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">2</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Post-Event</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCampaignDisplay;
