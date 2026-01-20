import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { DeliverableId, ExportEligibility, ValidationResult, PlaceholderLocation } from '../../contracts';

interface OperatorDebugPanelProps {
  exportEligibility: ExportEligibility | null;
  artifacts: Map<DeliverableId, { content: unknown; validated: boolean }>;
  isVisible: boolean;
}

export default function OperatorDebugPanel({
  exportEligibility,
  artifacts,
  isVisible,
}: OperatorDebugPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!isVisible) return null;

  function toggleSection(sectionId: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  const deliverableIds: DeliverableId[] = ['WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[60vh] overflow-y-auto bg-slate-900 border-t-2 border-amber-500 shadow-2xl">
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-amber-300">Operator Debug Panel</h3>
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-500/20 text-amber-300">
            Ctrl+Shift+D
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {exportEligibility && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <button
              onClick={() => toggleSection('export-eligibility')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.has('export-eligibility') ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <h4 className="text-sm font-bold text-white">Export Eligibility</h4>
              {exportEligibility.canExport ? (
                <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 ml-auto" />
              )}
            </button>

            {expandedSections.has('export-eligibility') && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Readiness Score:</span>
                  <span className={`font-bold ${exportEligibility.readiness_score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                    {exportEligibility.readiness_score}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pass Status:</span>
                  <span className={exportEligibility.pass ? 'text-green-400' : 'text-red-400'}>
                    {exportEligibility.pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Critical Placeholders:</span>
                  <span className={exportEligibility.placeholder_scan.critical_count === 0 ? 'text-green-400' : 'text-red-400'}>
                    {exportEligibility.placeholder_scan.critical_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Placeholders:</span>
                  <span className="text-slate-300">
                    {exportEligibility.placeholder_scan.total_count}
                  </span>
                </div>

                {exportEligibility.blocking_reasons.length > 0 && (
                  <div className="mt-3">
                    <p className="text-slate-400 mb-2">Blocking Reasons:</p>
                    <ul className="space-y-1">
                      {exportEligibility.blocking_reasons.map((reason, idx) => (
                        <li key={idx} className="text-xs text-red-300 flex items-start gap-2">
                          <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {deliverableIds.map(deliverableId => {
          const artifact = artifacts.get(deliverableId);
          const validation = exportEligibility?.validation_results?.[deliverableId] as ValidationResult | undefined;

          return (
            <div key={deliverableId} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <button
                onClick={() => toggleSection(deliverableId)}
                className="flex items-center gap-2 w-full text-left"
              >
                {expandedSections.has(deliverableId) ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-mono text-teal-400">{deliverableId}</span>
                {artifact?.validated ? (
                  <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                )}
              </button>

              {expandedSections.has(deliverableId) && (
                <div className="mt-3 space-y-3">
                  {validation && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Validation Status:</p>
                      <p className={`text-xs font-mono ${validation.ok ? 'text-green-400' : 'text-red-400'}`}>
                        {validation.ok ? 'Valid' : 'Invalid'}
                      </p>
                      {validation.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-400 mb-1">Errors:</p>
                          <ul className="space-y-1">
                            {validation.errors.map((error, idx) => (
                              <li key={idx} className="text-xs text-red-300 font-mono">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {artifact && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Raw JSON:</p>
                      <pre className="text-xs bg-slate-900 p-3 rounded border border-slate-700 overflow-x-auto text-slate-300 max-h-64 overflow-y-auto">
                        {JSON.stringify(artifact.content, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {exportEligibility?.placeholder_scan && exportEligibility.placeholder_scan.locations.length > 0 && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <button
              onClick={() => toggleSection('placeholders')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.has('placeholders') ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <h4 className="text-sm font-bold text-white">Placeholder Locations</h4>
              <span className="ml-auto text-xs text-slate-400">
                {exportEligibility.placeholder_scan.locations.length} found
              </span>
            </button>

            {expandedSections.has('placeholders') && (
              <div className="mt-3 space-y-2">
                {exportEligibility.placeholder_scan.locations.map((loc: PlaceholderLocation, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border text-xs ${
                      loc.is_critical
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-teal-400">{loc.artifact_id.split(':')[2]}</span>
                      <span className={loc.is_critical ? 'text-red-400' : 'text-yellow-400'}>
                        {loc.is_critical ? 'CRITICAL' : 'Non-critical'}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-400">Field:</span> {loc.field_path}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-400">Text:</span> {loc.placeholder_text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
