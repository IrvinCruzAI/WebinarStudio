import React, { useState } from 'react';
import { Copy, Check, CheckSquare, Clock, Play, Flag } from 'lucide-react';
import { copyToClipboard } from '../utils/exportUtils';

interface ChecklistDisplayProps {
  content: any;
}

const ChecklistDisplay: React.FC<ChecklistDisplayProps> = ({ content }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  if (!content) return null;

  const handleCopy = async (section: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const toggleCheck = (phase: string, index: number) => {
    const key = `${phase}-${index}`;
    const newChecked = new Set(checkedItems);
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    setCheckedItems(newChecked);
  };

  const getPhaseCompletion = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    const checked = items.filter((_, i) => checkedItems.has(`${items}-${i}`)).length;
    return Math.round((checked / items.length) * 100);
  };

  const renderPhase = (
    title: string,
    icon: React.ReactNode,
    color: string,
    items: any[],
    phaseKey: string
  ) => {
    const totalItems = items?.length || 0;
    const completedItems = items?.filter((_, i) => checkedItems.has(`${phaseKey}-${i}`)).length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
        {/* Phase Header */}
        <div className={`bg-gradient-to-r ${color} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                {icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
                <p className="text-white/80 text-sm">
                  {completedItems} of {totalItems} tasks completed
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCopy(phaseKey, (items || []).map((item: any) => `[ ] ${item.task} (${item.timing})`).join('\n'))}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors"
            >
              {copiedSection === phaseKey ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Copy className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Task List */}
        <div className="p-6 space-y-3">
          {(items || []).map((item: any, i: number) => {
            const isChecked = checkedItems.has(`${phaseKey}-${i}`);
            return (
              <div
                key={i}
                className={`group flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                  isChecked
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <button
                  onClick={() => toggleCheck(phaseKey, i)}
                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500'
                  }`}
                >
                  {isChecked && <Check className="w-4 h-4 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium leading-relaxed ${
                    isChecked
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {item.task}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {item.timing}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`${phaseKey}-${i}`, `${item.task} (${item.timing})`)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all flex-shrink-0"
                >
                  {copiedSection === `${phaseKey}-${i}` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const preCount = content.preWebinar?.length || 0;
  const duringCount = content.duringWebinar?.length || 0;
  const postCount = content.postWebinar?.length || 0;
  const totalCount = preCount + duringCount + postCount;
  const completedCount = [...checkedItems].length;
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-3xl font-bold mb-2">Execution Checklist</h3>
            <p className="text-teal-100">Complete guide for webinar execution</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{Math.round(overallProgress)}%</div>
            <div className="text-teal-100">Complete</div>
          </div>
        </div>

        <div className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur mb-4">
          <div
            className="h-full bg-white/90 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-2xl font-bold">{preCount}</div>
            <div className="text-sm text-teal-100">Pre-Webinar</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-2xl font-bold">{duringCount}</div>
            <div className="text-sm text-teal-100">During Event</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-2xl font-bold">{postCount}</div>
            <div className="text-sm text-teal-100">Post-Webinar</div>
          </div>
        </div>
      </div>

      {/* Pre-Webinar Phase */}
      {renderPhase(
        'Pre-Webinar Setup',
        <Clock className="w-8 h-8 text-white" />,
        'from-blue-500 to-indigo-500',
        content.preWebinar,
        'pre'
      )}

      {/* During Webinar Phase */}
      {renderPhase(
        'Live Event Execution',
        <Play className="w-8 h-8 text-white" />,
        'from-green-500 to-emerald-500',
        content.duringWebinar,
        'during'
      )}

      {/* Post-Webinar Phase */}
      {renderPhase(
        'Post-Webinar Follow-Up',
        <Flag className="w-8 h-8 text-white" />,
        'from-purple-500 to-pink-500',
        content.postWebinar,
        'post'
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-teal-600" />
          Checklist Management
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleCopy('full-checklist', [
              '# PRE-WEBINAR TASKS',
              ...(content.preWebinar || []).map((t: any) => `[ ] ${t.task} (${t.timing})`),
              '',
              '# DURING WEBINAR TASKS',
              ...(content.duringWebinar || []).map((t: any) => `[ ] ${t.task} (${t.timing})`),
              '',
              '# POST-WEBINAR TASKS',
              ...(content.postWebinar || []).map((t: any) => `[ ] ${t.task} (${t.timing})`)
            ].join('\n'))}
            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-md"
          >
            {copiedSection === 'full-checklist' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy Full Checklist
          </button>
          <button
            onClick={() => setCheckedItems(new Set())}
            className="px-5 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium shadow-md"
          >
            Reset Progress
          </button>
          {completedCount === totalCount && totalCount > 0 && (
            <div className="flex items-center gap-2 px-5 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-semibold">
              <Check className="w-5 h-5" />
              All Tasks Complete!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistDisplay;
