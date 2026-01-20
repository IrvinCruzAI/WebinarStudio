import React, { useState } from 'react';
import { Copy, Check, Star, TrendingUp } from 'lucide-react';
import { copyToClipboard } from '../utils/exportUtils';

interface LandingPageDisplayProps {
  content: any;
}

const LandingPageDisplay: React.FC<LandingPageDisplayProps> = ({ content }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const lp = content.landing_page;
  if (!lp) return null;

  const handleCopy = async (section: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const toggleFavorite = (item: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(item)) {
      newFavorites.delete(item);
    } else {
      newFavorites.add(item);
    }
    setFavorites(newFavorites);
  };

  const getWordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
  const getCharCount = (text: string) => text.length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              Headline Options
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {lp.headlines?.length || 0} variations • Choose the one that resonates most
            </p>
          </div>
          <button
            onClick={() => handleCopy('headlines', (lp.headlines || []).map((h: string, i: number) => `${i + 1}. ${h}`).join('\n'))}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
          >
            {copiedSection === 'headlines' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy All
          </button>
        </div>

        <div className="space-y-3">
          {(lp.headlines || []).map((headline: string, i: number) => (
            <div
              key={i}
              className="group bg-white dark:bg-gray-900 rounded-xl p-5 border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white leading-snug mb-2">
                    {headline}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{getCharCount(headline)} chars</span>
                    <span>{getWordCount(headline)} words</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleFavorite(`headline-${i}`)}
                    className={`p-2 rounded-lg transition ${
                      favorites.has(`headline-${i}`)
                        ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${favorites.has(`headline-${i}`) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleCopy(`headline-${i}`, headline)}
                    className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                  >
                    {copiedSection === `headline-${i}` ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subheadlines */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Subheadlines</h3>
          <button
            onClick={() => handleCopy('subheads', (lp.subheads || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n'))}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {copiedSection === 'subheads' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            Copy
          </button>
        </div>
        <div className="space-y-2">
          {(lp.subheads || []).map((subhead: string, i: number) => (
            <div key={i} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-gray-800 dark:text-gray-200">
              <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">{i + 1}.</span>
              {subhead}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Bullets & What You'll Learn - Side by Side */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hero Bullets</h3>
            <button
              onClick={() => handleCopy('hero_bullets', (lp.hero_bullets || []).map((b: string) => `• ${b}`).join('\n'))}
              className="p-2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition"
            >
              {copiedSection === 'hero_bullets' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <ul className="space-y-2">
            {(lp.hero_bullets || []).map((bullet: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-teal-600 dark:text-teal-400 font-bold text-lg leading-none mt-0.5">•</span>
                <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-900 dark:text-green-100">What You'll Learn</h3>
            <button
              onClick={() => handleCopy('what_youll_learn', (lp.what_youll_learn || []).map((l: string) => `✓ ${l}`).join('\n'))}
              className="p-2 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-800/30 transition"
            >
              {copiedSection === 'what_youll_learn' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <ul className="space-y-2">
            {(lp.what_youll_learn || []).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">✓</span>
                <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Audience Qualification */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">✓</div>
            Perfect For
          </h3>
          <ul className="space-y-2">
            {(lp.who_its_for || []).map((persona: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-gray-800 dark:text-gray-200 text-sm">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">✓</span>
                <span className="leading-relaxed">{persona}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-sm">✗</div>
            Not Ideal For
          </h3>
          <ul className="space-y-2">
            {(lp.who_its_not_for || []).map((notFor: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-gray-800 dark:text-gray-200 text-sm">
                <span className="text-red-600 dark:text-red-400 font-bold mt-0.5">✗</span>
                <span className="leading-relaxed">{notFor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Agenda Preview */}
      {lp.agenda_preview && lp.agenda_preview.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Session Agenda
          </h3>
          <div className="space-y-4">
            {lp.agenda_preview.map((item: any, i: number) => (
              <div key={i} className="relative pl-6 border-l-4 border-teal-500 py-2">
                <div className="absolute left-[-10px] top-2 w-4 h-4 rounded-full bg-teal-500 border-4 border-white dark:border-gray-900"></div>
                <div className="flex items-baseline justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{item.segment}</h4>
                  <span className="text-sm font-medium text-teal-600 dark:text-teal-400 ml-3">{item.timebox_minutes} min</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.promise}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speaker Bio */}
      {lp.speaker_bio && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-3">About Your Speaker</h3>
          <p className="text-lg text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">{lp.speaker_bio.one_liner}</p>
          <div className="space-y-2">
            {(lp.speaker_bio.credibility_bullets || []).map((cred: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                <span className="leading-relaxed">{cred}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Blocks */}
      {lp.cta_blocks && lp.cta_blocks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Call-to-Action Blocks</h3>
          {lp.cta_blocks.map((cta: any, i: number) => (
            <div key={i} className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-8 text-white shadow-xl">
              <h4 className="text-2xl font-bold mb-3">{cta.headline}</h4>
              <p className="text-lg mb-6 text-teal-50 leading-relaxed">{cta.body}</p>
              <button className="px-8 py-4 bg-white text-teal-600 font-bold rounded-lg text-lg hover:bg-teal-50 transition-colors shadow-lg">
                {cta.button_label}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAQ */}
      {lp.faq && lp.faq.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Frequently Asked Questions</h3>
          <div className="space-y-5">
            {lp.faq.map((item: any, i: number) => (
              <div key={i} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-5 last:pb-0">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">Q: {item.question}</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">A: {item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Notes */}
      {lp.compliance_notes && lp.compliance_notes.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Compliance & Legal Notes
          </h4>
          <ul className="space-y-2">
            {lp.compliance_notes.map((note: string, i: number) => (
              <li key={i} className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <span>•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LandingPageDisplay;
