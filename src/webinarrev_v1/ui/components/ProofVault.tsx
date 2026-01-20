import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Quote,
  BarChart3,
  FileText,
  Edit2,
  Save,
  X,
  Plus,
} from 'lucide-react';
import type { WR1, WR3 } from '../../contracts';

interface ProofVaultProps {
  wr1Data: WR1 | null;
  wr3Data: WR3 | null;
  onUpdateProofSource: (index: number, source: string) => void;
  onUpdateLandingProofSource: (index: number, source: string) => void;
}

type ProofType = 'testimonial' | 'metric' | 'case_study';

const PROOF_TYPE_CONFIG: Record<
  ProofType,
  { icon: typeof Quote; color: string; bg: string; label: string }
> = {
  testimonial: {
    icon: Quote,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    label: 'Testimonial',
  },
  metric: {
    icon: BarChart3,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/30',
    label: 'Metric',
  },
  case_study: {
    icon: FileText,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    label: 'Case Study',
  },
};

interface ProofCardProps {
  type: ProofType;
  content: string;
  source: string | null;
  needsSource?: boolean;
  onUpdateSource?: (source: string) => void;
}

function ProofCard({
  type,
  content,
  source,
  needsSource,
  onUpdateSource,
}: ProofCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(source || '');

  const config = PROOF_TYPE_CONFIG[type];
  const TypeIcon = config.icon;
  const hasSource = source && source.trim() !== '';
  const isMissing = needsSource && !hasSource;

  function handleSave() {
    if (onUpdateSource) {
      onUpdateSource(editValue);
    }
    setIsEditing(false);
  }

  function handleCancel() {
    setEditValue(source || '');
    setIsEditing(false);
  }

  return (
    <div
      className={`rounded-xl border transition-all ${
        isMissing
          ? 'border-amber-500/50 bg-amber-500/5'
          : 'border-slate-700/50 bg-slate-800/30'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg border ${config.bg}`}>
            <TypeIcon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              {isMissing ? (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  Source Required
                </span>
              ) : hasSource ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-300">{content}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700/50">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter source (URL, citation, or reference)"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  className="p-1.5 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-teal-500/20 transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {hasSource ? (
                  <p className="text-xs text-slate-400 truncate">
                    Source: {source}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">No source added</p>
                )}
              </div>
              {onUpdateSource && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProofVault({
  wr1Data,
  wr3Data,
  onUpdateProofSource,
  onUpdateLandingProofSource,
}: ProofVaultProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'landing'>('content');

  const contentProofs = wr1Data?.proof_points || [];
  const landingProofs = wr3Data?.proof_blocks || [];

  const contentMissing = contentProofs.filter((p) => !p.source).length;
  const landingMissing = landingProofs.filter((p) => p.needs_source).length;
  const totalMissing = contentMissing + landingMissing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">ProofVault</h3>
            <p className="text-sm text-slate-400">
              {contentProofs.length + landingProofs.length} proof points
              {totalMissing > 0 && (
                <span className="text-amber-400 ml-1">
                  ({totalMissing} need sources)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/50 border border-slate-700/50">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'content'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Content Proofs
          {contentMissing > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
              {contentMissing}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('landing')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'landing'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Landing Proofs
          {landingMissing > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
              {landingMissing}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {activeTab === 'content' ? (
          contentProofs.length === 0 ? (
            <div className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h4 className="text-slate-300 font-medium mb-1">No Content Proofs</h4>
              <p className="text-sm text-slate-500">
                Run WR1 to extract proof points from content
              </p>
            </div>
          ) : (
            contentProofs.map((proof, index) => (
              <ProofCard
                key={index}
                type={proof.type}
                content={proof.content}
                source={proof.source}
                onUpdateSource={(source) => onUpdateProofSource(index, source)}
              />
            ))
          )
        ) : landingProofs.length === 0 ? (
          <div className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h4 className="text-slate-300 font-medium mb-1">No Landing Proofs</h4>
            <p className="text-sm text-slate-500">
              Run WR3 to generate landing page proof blocks
            </p>
          </div>
        ) : (
          landingProofs.map((proof, index) => (
            <ProofCard
              key={index}
              type={proof.type}
              content={proof.content}
              source={proof.source}
              needsSource={proof.needs_source}
              onUpdateSource={(source) => onUpdateLandingProofSource(index, source)}
            />
          ))
        )}
      </div>
    </div>
  );
}
