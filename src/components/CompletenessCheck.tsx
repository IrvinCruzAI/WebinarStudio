import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { CompletenessCheck as CompletenessCheckType } from '../types';
import { getCompletenessColor, getCompletenessBgColor } from '../utils/completenessCheck';

interface CompletenessCheckProps {
  check: CompletenessCheckType;
}

export const CompletenessCheck: React.FC<CompletenessCheckProps> = ({ check }) => {
  const scoreColor = getCompletenessColor(check.score);
  const scoreBg = getCompletenessBgColor(check.score);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Completeness Check
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {check.filledFields} of {check.totalFields} fields completed
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className={`text-3xl font-bold ${scoreColor}`}>
            {check.score}%
          </div>
          <div className="mt-1 w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${scoreBg} transition-all duration-300`}
              style={{ width: `${check.score}%` }}
            />
          </div>
        </div>
      </div>

      {check.requiredMissing.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                Required Fields Missing
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {check.requiredMissing.map((field, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-red-600 dark:bg-red-400 rounded-full" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {check.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                Warnings
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {check.warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full flex-shrink-0 mt-2" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {check.optionalMissing.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Optional Fields Missing ({check.optionalMissing.length})
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                These fields will improve output quality: {check.optionalMissing.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {check.score === 100 && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              All fields complete! Ready to generate high-quality deliverables.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
