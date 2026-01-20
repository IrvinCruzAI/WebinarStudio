import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import type { GoldenPathCheck } from '../../qa/runGoldenPathAssertions';

interface GoldenPathChecklistProps {
  checks: GoldenPathCheck[];
  isLoading?: boolean;
}

export default function GoldenPathChecklist({
  checks,
  isLoading,
}: GoldenPathChecklistProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
          <span className="text-slate-400">Running validation checks...</span>
        </div>
      </div>
    );
  }

  const passedCount = checks.filter(c => c.pass).length;
  const totalCount = checks.length;
  const allPassed = passedCount === totalCount;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Golden Path Checklist</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          allPassed
            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
        }`}>
          {passedCount}/{totalCount} passed
        </div>
      </div>

      <div className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              check.pass
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            {check.pass ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                check.pass ? 'text-green-300' : 'text-red-300'
              }`}>
                {check.label}
              </p>
              {check.details && (
                <p className="text-xs text-slate-400 mt-1">{check.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {allPassed && (
        <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-300">All Checks Passed!</p>
            <p className="text-xs text-green-400/70 mt-1">
              System meets all Vernon-ready criteria. Ready for production deployment.
            </p>
          </div>
        </div>
      )}

      {!allPassed && (
        <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">Action Required</p>
            <p className="text-xs text-amber-400/70 mt-1">
              {totalCount - passedCount} check{totalCount - passedCount !== 1 ? 's' : ''} failed. Review the issues above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
