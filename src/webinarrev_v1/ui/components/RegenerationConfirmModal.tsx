import { useState } from 'react';
import { X, AlertTriangle, ArrowRight, Edit3, RefreshCw } from 'lucide-react';
import type { DeliverableId, WR1 } from '../../contracts';
import { DELIVERABLES } from '../../contracts/deliverables';
import { checkStaleness, formatStalenessWarning } from '../../utils/stalenessDetection';

interface RegenerationConfirmModalProps {
  targetDeliverableId: DeliverableId;
  cascade: boolean;
  affectedDeliverables: DeliverableId[];
  artifacts: Map<DeliverableId, { content: unknown; generated_at: number; edited_at?: number }>;
  onConfirm: (preserveEdits: boolean) => void;
  onCancel: () => void;
}

export default function RegenerationConfirmModal({
  targetDeliverableId,
  cascade,
  affectedDeliverables,
  artifacts,
  onConfirm,
  onCancel,
}: RegenerationConfirmModalProps) {
  const [selectedOption, setSelectedOption] = useState<'preserve' | 'regenerate'>('preserve');

  const stalenessInfo = checkStaleness(targetDeliverableId, artifacts);
  const targetMeta = DELIVERABLES[targetDeliverableId];

  const dependencyChain = affectedDeliverables
    .filter((id) => id !== 'WR9')
    .map((id) => DELIVERABLES[id].short_title);

  const wr1Artifact = artifacts.get('WR1');
  const wr1Content = wr1Artifact?.content as WR1 | undefined;
  const hasEditedFields = targetDeliverableId === 'WR1' &&
    wr1Content?.edited_fields &&
    wr1Content.edited_fields.length > 0;

  const editedFieldsCount = wr1Content?.edited_fields?.length || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgb(var(--surface-elevated))',
          border: '1px solid rgb(var(--border-default))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid rgb(var(--border-default))' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
            Confirm Regeneration
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {stalenessInfo.isStale && (
            <div
              className="p-3 rounded-lg flex items-start gap-2"
              style={{
                background: 'rgb(var(--warning) / 0.1)',
                border: '1px solid rgb(var(--warning) / 0.3)',
              }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--warning))' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(var(--warning))' }}>
                  Staleness Warning
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {formatStalenessWarning(stalenessInfo)}
                </p>
                <p className="text-xs mt-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  Consider regenerating upstream dependencies first.
                </p>
              </div>
            </div>
          )}

          {hasEditedFields && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgb(var(--border-default))' }}
            >
              <div
                className="p-3"
                style={{
                  background: 'rgb(var(--accent-primary) / 0.05)',
                  borderBottom: '1px solid rgb(var(--border-default))',
                }}
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" style={{ color: 'rgb(var(--accent-primary))' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                    You have {editedFieldsCount} manual edit{editedFieldsCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                  Choose how to handle your customizations during regeneration
                </p>
              </div>

              <div className="p-3 space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedOption === 'preserve'
                      ? 'bg-[rgb(var(--accent-primary)/0.1)]'
                      : 'hover:bg-[rgb(var(--surface-base))]'
                  }`}
                  style={{
                    border: selectedOption === 'preserve'
                      ? '1px solid rgb(var(--accent-primary) / 0.3)'
                      : '1px solid transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="mergeOption"
                    checked={selectedOption === 'preserve'}
                    onChange={() => setSelectedOption('preserve')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                        Keep My Edits
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: 'rgb(var(--success) / 0.1)',
                          color: 'rgb(var(--success))',
                        }}
                      >
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                      Regenerate with fresh AI content, then restore your manual edits on top
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedOption === 'regenerate'
                      ? 'bg-[rgb(var(--accent-primary)/0.1)]'
                      : 'hover:bg-[rgb(var(--surface-base))]'
                  }`}
                  style={{
                    border: selectedOption === 'regenerate'
                      ? '1px solid rgb(var(--accent-primary) / 0.3)'
                      : '1px solid transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="mergeOption"
                    checked={selectedOption === 'regenerate'}
                    onChange={() => setSelectedOption('regenerate')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                      Regenerate Everything
                    </span>
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                      Start fresh with all AI-generated content, discarding manual edits
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              Regeneration Mode
            </h3>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
              {cascade ? (
                <>
                  <span className="font-medium" style={{ color: 'rgb(var(--accent-primary))' }}>
                    Cascade Mode:
                  </span>{' '}
                  This will regenerate {targetMeta.short_title} and all downstream deliverables that depend on
                  it.
                </>
              ) : (
                <>
                  <span className="font-medium" style={{ color: 'rgb(var(--accent-primary))' }}>
                    Single Mode:
                  </span>{' '}
                  This will only regenerate {targetMeta.short_title}. Other deliverables will remain unchanged.
                </>
              )}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
              Affected Deliverables ({affectedDeliverables.length})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {dependencyChain.map((title, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: 'rgb(var(--accent-primary) / 0.1)',
                      color: 'rgb(var(--accent-primary))',
                      border: '1px solid rgb(var(--accent-primary) / 0.3)',
                    }}
                  >
                    {title}
                  </span>
                  {index < dependencyChain.length - 1 && (
                    <ArrowRight className="w-3 h-3" style={{ color: 'rgb(var(--text-muted))' }} />
                  )}
                </div>
              ))}
              {affectedDeliverables.includes('WR9') && (
                <>
                  <ArrowRight className="w-3 h-3" style={{ color: 'rgb(var(--text-muted))' }} />
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: 'rgb(var(--success) / 0.1)',
                      color: 'rgb(var(--success))',
                      border: '1px solid rgb(var(--success) / 0.3)',
                    }}
                  >
                    QA Report
                  </span>
                </>
              )}
            </div>
          </div>

          <div
            className="p-3 rounded-lg"
            style={{
              background: 'rgb(var(--surface-base))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              The original run_id will be preserved. This means you can always trace changes without proliferating
              IDs. Regeneration typically takes 15-30 seconds depending on the number of deliverables affected.
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3 p-4"
          style={{ borderTop: '1px solid rgb(var(--border-default))' }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'rgb(var(--surface-base))',
              color: 'rgb(var(--text-secondary))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(hasEditedFields ? selectedOption === 'preserve' : false)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              background: 'rgb(var(--accent-primary))',
              color: 'white',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            {hasEditedFields && selectedOption === 'preserve'
              ? 'Regenerate & Keep Edits'
              : 'Confirm Regeneration'}
          </button>
        </div>
      </div>
    </div>
  );
}
