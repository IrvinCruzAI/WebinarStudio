import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { QAReport } from '../types';

interface QADashboardProps {
  qa: QAReport;
}

const QADashboard: React.FC<QADashboardProps> = ({ qa }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!qa) return null;

  const totalIssues = (qa.assumptions?.length || 0) + (qa.placeholders?.length || 0) + (qa.claimsRequiringProof?.length || 0);

  if (totalIssues === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">Quality Check: All Clear</h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            No issues detected. All content is ready for client delivery.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (qa.placeholders && qa.placeholders.length > 0) return 'red';
    if (qa.claimsRequiringProof && qa.claimsRequiringProof.length > 0) return 'amber';
    return 'blue';
  };

  const statusColor = getStatusColor();

  return (
    <div className={`bg-gradient-to-r ${
      statusColor === 'red' ? 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20' :
      statusColor === 'amber' ? 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20' :
      'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
    } rounded-xl border ${
      statusColor === 'red' ? 'border-red-200 dark:border-red-800' :
      statusColor === 'amber' ? 'border-amber-200 dark:border-amber-800' :
      'border-blue-200 dark:border-blue-800'
    } overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-white/30 dark:hover:bg-black/10 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${
            statusColor === 'red' ? 'bg-red-600' :
            statusColor === 'amber' ? 'bg-amber-600' :
            'bg-blue-600'
          } flex items-center justify-center flex-shrink-0 shadow-md`}>
            {statusColor === 'red' ? (
              <AlertTriangle className="w-6 h-6 text-white" />
            ) : statusColor === 'amber' ? (
              <AlertCircle className="w-6 h-6 text-white" />
            ) : (
              <Info className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="text-left">
            <h4 className={`font-semibold ${
              statusColor === 'red' ? 'text-red-900 dark:text-red-100' :
              statusColor === 'amber' ? 'text-amber-900 dark:text-amber-100' :
              'text-blue-900 dark:text-blue-100'
            } mb-1`}>
              Quality Assurance Review
            </h4>
            <p className={`text-sm ${
              statusColor === 'red' ? 'text-red-700 dark:text-red-300' :
              statusColor === 'amber' ? 'text-amber-700 dark:text-amber-300' :
              'text-blue-700 dark:text-blue-300'
            }`}>
              {totalIssues} {totalIssues === 1 ? 'item' : 'items'} requiring attention
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {qa.placeholders && qa.placeholders.length > 0 && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                {qa.placeholders.length} Placeholder{qa.placeholders.length !== 1 ? 's' : ''}
              </span>
            )}
            {qa.claimsRequiringProof && qa.claimsRequiringProof.length > 0 && (
              <span className="px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded-full">
                {qa.claimsRequiringProof.length} Claim{qa.claimsRequiringProof.length !== 1 ? 's' : ''}
              </span>
            )}
            {qa.assumptions && qa.assumptions.length > 0 && (
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                {qa.assumptions.length} Assumption{qa.assumptions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className={`w-5 h-5 ${
              statusColor === 'red' ? 'text-red-600 dark:text-red-400' :
              statusColor === 'amber' ? 'text-amber-600 dark:text-amber-400' :
              'text-blue-600 dark:text-blue-400'
            }`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${
              statusColor === 'red' ? 'text-red-600 dark:text-red-400' :
              statusColor === 'amber' ? 'text-amber-600 dark:text-amber-400' :
              'text-blue-600 dark:text-blue-400'
            }`} />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-6 pt-0 space-y-5">
          {/* Placeholders - Highest Priority */}
          {qa.placeholders && qa.placeholders.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-red-300 dark:border-red-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-red-900 dark:text-red-100">Missing Information</h5>
                  <p className="text-xs text-red-700 dark:text-red-300">These fields require client input</p>
                </div>
              </div>
              <ul className="space-y-2">
                {qa.placeholders.map((placeholder, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="text-red-600 dark:text-red-400 font-bold mt-0.5">•</span>
                    <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{placeholder}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Claims Requiring Proof - Medium Priority */}
          {qa.claimsRequiringProof && qa.claimsRequiringProof.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-amber-300 dark:border-amber-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-amber-900 dark:text-amber-100">Claims Requiring Verification</h5>
                  <p className="text-xs text-amber-700 dark:text-amber-300">These statements need supporting evidence</p>
                </div>
              </div>
              <ul className="space-y-2">
                {qa.claimsRequiringProof.map((claim, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                    <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{claim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Assumptions - Informational */}
          {qa.assumptions && qa.assumptions.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-blue-900 dark:text-blue-100">Assumptions Made</h5>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Review these inferences for accuracy</p>
                </div>
              </div>
              <ul className="space-y-2">
                {qa.assumptions.map((assumption, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                    <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{assumption}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Next Steps:</h5>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {qa.placeholders && qa.placeholders.length > 0 && (
                <li>• Fill in all placeholder fields with actual client information</li>
              )}
              {qa.claimsRequiringProof && qa.claimsRequiringProof.length > 0 && (
                <li>• Verify claims and add supporting evidence where needed</li>
              )}
              {qa.assumptions && qa.assumptions.length > 0 && (
                <li>• Review assumptions and correct any inaccuracies</li>
              )}
              <li>• Conduct final review before client delivery</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default QADashboard;
