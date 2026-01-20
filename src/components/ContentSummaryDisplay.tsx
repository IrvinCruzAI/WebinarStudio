import React, { useState } from 'react';
import { Copy, Check, Lightbulb, Target, Users, TrendingUp } from 'lucide-react';
import { copyToClipboard } from '../utils/exportUtils';

interface ContentSummaryDisplayProps {
  content: any;
}

const ContentSummaryDisplay: React.FC<ContentSummaryDisplayProps> = ({ content }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!content) return null;

  const handleCopy = async (section: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* One-Line Value */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold">Core Value Proposition</h3>
            </div>
            <p className="text-2xl font-semibold leading-relaxed text-purple-50">
              {content.oneLineValue || 'No value proposition defined'}
            </p>
          </div>
          <button
            onClick={() => handleCopy('value-prop', content.oneLineValue || '')}
            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors flex-shrink-0"
          >
            {copiedSection === 'value-prop' ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            Key Takeaways
          </h3>
          <button
            onClick={() => handleCopy('takeaways', (content.keyTakeaways || []).map((t: string, i: number) => `${i + 1}. ${t}`).join('\n'))}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-md"
          >
            {copiedSection === 'takeaways' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy All
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(content.keyTakeaways || []).map((takeaway: string, i: number) => (
            <div
              key={i}
              className="group bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <p className="flex-1 text-gray-800 dark:text-gray-200 leading-relaxed">
                  {takeaway}
                </p>
                <button
                  onClick={() => handleCopy(`takeaway-${i}`, takeaway)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg transition-all"
                >
                  {copiedSection === `takeaway-${i}` ? (
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

      {/* Content Outline */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            Content Outline
          </h3>
          <button
            onClick={() => handleCopy('outline', (content.contentOutline || []).map((item: any) =>
              `${item.section} (${item.duration})\n${(item.keyPoints || []).map((kp: string) => `  • ${kp}`).join('\n')}`
            ).join('\n\n'))}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-md"
          >
            {copiedSection === 'outline' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy Outline
          </button>
        </div>

        <div className="space-y-4">
          {(content.contentOutline || []).map((item: any, i: number) => (
            <div
              key={i}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-baseline justify-between mb-3">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {item.section}
                </h4>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 ml-3">
                  {item.duration}
                </span>
              </div>
              <ul className="space-y-2">
                {(item.keyPoints || []).map((point: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Audience Profile */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            Target Audience Profile
          </h3>
          <button
            onClick={() => handleCopy('audience', content.audienceProfile || '')}
            className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
          >
            {copiedSection === 'audience' ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
          </button>
        </div>
        <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
          {content.audienceProfile || 'No audience profile defined'}
        </p>
      </div>

      {/* Recommended Angles */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Recommended Marketing Angles
          </h3>
          <button
            onClick={() => handleCopy('angles', (content.recommendedAngles || []).map((a: string, i: number) => `${i + 1}. ${a}`).join('\n'))}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-md"
          >
            {copiedSection === 'angles' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy All
          </button>
        </div>

        <div className="space-y-3">
          {(content.recommendedAngles || []).map((angle: string, i: number) => (
            <div
              key={i}
              className="group bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <p className="flex-1 text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {angle}
                </p>
                <button
                  onClick={() => handleCopy(`angle-${i}`, angle)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all"
                >
                  {copiedSection === `angle-${i}` ? (
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

      {/* Strategic Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Content Summary Stats</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{content.keyTakeaways?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Key Takeaways</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{content.contentOutline?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Sections</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{content.recommendedAngles?.length || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Marketing Angles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {content.contentOutline?.reduce((acc: number, item: any) => acc + (item.keyPoints?.length || 0), 0) || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentSummaryDisplay;
