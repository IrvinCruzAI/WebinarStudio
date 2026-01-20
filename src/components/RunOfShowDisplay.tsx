import React, { useState } from 'react';
import { Copy, Check, Clock, Zap, ArrowRight, Mic } from 'lucide-react';
import { copyToClipboard } from '../utils/exportUtils';

interface RunOfShowDisplayProps {
  content: any;
}

const RunOfShowDisplay: React.FC<RunOfShowDisplayProps> = ({ content }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!content) return null;

  const handleCopy = async (section: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const segments = content.segments || [];
  const totalDuration = content.totalDuration || 60;

  const getSegmentColor = (index: number) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-amber-500',
      'from-teal-500 to-cyan-500',
      'from-indigo-500 to-purple-500',
      'from-red-500 to-pink-500',
      'from-cyan-500 to-blue-500'
    ];
    return colors[index % colors.length];
  };

  const getProgressPercentage = (startTime: string) => {
    const minutes = parseInt(startTime.split(':')[0]) || 0;
    return (minutes / totalDuration) * 100;
  };

  const formatFullSegment = (seg: any) => {
    return [
      `[${seg.startTime}] ${seg.segment} (${seg.duration} min)`,
      '',
      `Description: ${seg.description}`,
      '',
      `Speaker Notes: ${seg.speakerNotes}`,
      seg.ctaMoment ? '\n*** CTA MOMENT ***' : '',
      seg.transition ? `\nTransition: ${seg.transition}` : ''
    ].filter(Boolean).join('\n');
  };

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold mb-2">Production Timeline</h3>
            <p className="text-teal-100">Complete minute-by-minute webinar execution plan</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{totalDuration}</div>
            <div className="text-teal-100">minutes</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-2xl font-bold">{segments.length}</div>
            <div className="text-sm text-teal-100">Segments</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-2xl font-bold">{segments.filter((s: any) => s.ctaMoment).length}</div>
            <div className="text-sm text-teal-100">CTA Moments</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-2xl font-bold">{segments.filter((s: any) => s.transition).length}</div>
            <div className="text-sm text-teal-100">Transitions</div>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          Timeline Overview
        </h3>
        <div className="relative">
          {/* Timeline bar */}
          <div className="absolute left-0 right-0 top-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {segments.map((seg: any, i: number) => {
              const widthPercent = (seg.duration / totalDuration) * 100;
              const leftPercent = getProgressPercentage(seg.startTime);
              return (
                <div
                  key={i}
                  className={`absolute top-0 h-full bg-gradient-to-r ${getSegmentColor(i)} opacity-80`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`
                  }}
                  title={seg.segment}
                />
              );
            })}
          </div>

          {/* Time markers */}
          <div className="relative h-20 pt-14">
            {[0, totalDuration / 4, totalDuration / 2, (3 * totalDuration) / 4, totalDuration].map((time, i) => (
              <div
                key={i}
                className="absolute text-xs text-gray-600 dark:text-gray-400 font-medium"
                style={{ left: `${(time / totalDuration) * 100}%`, transform: 'translateX(-50%)' }}
              >
                {Math.round(time)} min
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Segments */}
      <div className="space-y-6">
        {segments.map((segment: any, i: number) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:border-teal-400 dark:hover:border-teal-600 transition-all shadow-lg"
          >
            {/* Segment Header */}
            <div className={`bg-gradient-to-r ${getSegmentColor(i)} p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-white mb-1">{segment.segment}</h4>
                      <div className="flex items-center gap-4 text-white/90 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {segment.startTime} • {segment.duration} minutes
                        </span>
                        {segment.ctaMoment && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full font-semibold">
                            <Zap className="w-4 h-4" />
                            CTA Moment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(`segment-${i}`, formatFullSegment(segment))}
                  className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors"
                >
                  {copiedSection === `segment-${i}` ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Segment Content */}
            <div className="p-6 space-y-5">
              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                  What Happens
                </label>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
                  {segment.description}
                </p>
              </div>

              {/* Speaker Notes */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <label className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Speaker Notes
                  </label>
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {segment.speakerNotes}
                </p>
              </div>

              {/* CTA Moment Highlight */}
              {segment.ctaMoment && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-5 border-2 border-yellow-400 dark:border-yellow-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-bold text-yellow-900 dark:text-yellow-100 text-lg">
                      Call-to-Action Opportunity
                    </span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 text-sm">
                    This is a strategic moment to present your offer and drive conversions.
                  </p>
                </div>
              )}

              {/* Transition */}
              {segment.transition && (
                <div className="flex items-start gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 mt-1">
                    <ArrowRight className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                      Transition to Next Segment
                    </label>
                    <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      {segment.transition}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleCopy('full-timeline', segments.map(formatFullSegment).join('\n\n---\n\n'))}
            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-md"
          >
            {copiedSection === 'full-timeline' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy Full Timeline
          </button>
          <button
            onClick={() => handleCopy('speaker-notes', segments.map((s: any) => `[${s.startTime}] ${s.segment}\n${s.speakerNotes}`).join('\n\n'))}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-md"
          >
            <Mic className="w-4 h-4" />
            Copy Speaker Notes Only
          </button>
          <button
            onClick={() => handleCopy('cta-moments', segments.filter((s: any) => s.ctaMoment).map((s: any) => `[${s.startTime}] ${s.segment}: ${s.description}`).join('\n\n'))}
            className="px-5 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-md"
          >
            <Zap className="w-4 h-4" />
            Copy CTA Moments
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunOfShowDisplay;
