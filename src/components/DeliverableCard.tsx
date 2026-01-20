import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  FileDown,
  Check,
  FileText,
  Layout,
  Mail,
  Share2,
  CheckSquare
} from 'lucide-react';
import { ProcessingResult } from '../types';
import {
  copyToClipboard,
  formatDataForCopy,
  exportContentSummary,
  exportCopyPack,
  exportRunOfShow,
  exportChecklist
} from '../utils/exportUtils';
import LandingPageDisplay from './LandingPageDisplay';
import EmailCampaignDisplay from './EmailCampaignDisplay';
import SocialMediaDisplay from './SocialMediaDisplay';
import RunOfShowDisplay from './RunOfShowDisplay';
import ContentSummaryDisplay from './ContentSummaryDisplay';
import ChecklistDisplay from './ChecklistDisplay';

interface DeliverableCardProps {
  deliverable: {
    id: string;
    name: string;
    stepId: string;
    description: string;
    icon?: string;
    color?: string;
    subSection?: string;
  };
  result: ProcessingResult | undefined;
  status: 'pending' | 'active' | 'completed' | 'error';
  webinarTitle: string;
}

const DeliverableCard: React.FC<DeliverableCardProps> = ({
  deliverable,
  result,
  status,
  webinarTitle
}) => {
  const [isExpanded, setIsExpanded] = useState(status === 'completed');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'active':
        return 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const handleCopy = async () => {
    if (!result?.content) return;

    const text = formatDataForCopy(result.content, deliverable.stepId);
    const success = await copyToClipboard(text);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async () => {
    if (!result?.content) return;

    setIsExporting(true);

    try {
      switch (deliverable.stepId) {
        case 'WR2':
          await exportContentSummary(result.content, webinarTitle);
          break;
        case 'WR4':
          await exportCopyPack(result.content, webinarTitle);
          break;
        case 'WR3':
          await exportRunOfShow(result.content, webinarTitle);
          break;
        case 'WR5':
          await exportChecklist(result.content, webinarTitle);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getIconComponent = () => {
    switch (deliverable.icon) {
      case 'FileText':
        return <FileText className="h-5 w-5" />;
      case 'Layout':
        return <Layout className="h-5 w-5" />;
      case 'Mail':
        return <Mail className="h-5 w-5" />;
      case 'Share2':
        return <Share2 className="h-5 w-5" />;
      case 'Clock':
        return <Clock className="h-5 w-5" />;
      case 'CheckSquare':
        return <CheckSquare className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getColorClasses = () => {
    const baseColor = deliverable.color || 'teal';
    return {
      border: `border-${baseColor}-200 dark:border-${baseColor}-800`,
      bg: `bg-${baseColor}-50 dark:bg-${baseColor}-900/20`,
      icon: `text-${baseColor}-600 dark:text-${baseColor}-400`
    };
  };

  const renderContent = () => {
    if (!result?.content) return null;

    // Handle subsections for WR4 (Copy Pack split into separate deliverables)
    let contentToRender = result.content;
    if (deliverable.subSection) {
      // Extract the specific subsection
      contentToRender = { [deliverable.subSection]: result.content[deliverable.subSection] };
    }

    // Use specialized display components based on deliverable ID
    switch (deliverable.id) {
      case 'landing_page':
        return <LandingPageDisplay content={contentToRender} />;
      case 'email_campaign':
        return <EmailCampaignDisplay content={contentToRender} />;
      case 'social_media':
        return <SocialMediaDisplay content={contentToRender} />;
      case 'run_of_show':
        return <RunOfShowDisplay content={contentToRender} />;
      case 'content_summary':
        return <ContentSummaryDisplay content={contentToRender} />;
      case 'checklist':
        return <ChecklistDisplay content={contentToRender} />;
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-xl border transition-all ${getStatusStyles()}`}>
      <button
        onClick={() => status === 'completed' && setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-xl"
        disabled={status !== 'completed'}
      >
        <div className="flex items-center gap-4">
          {status === 'completed' && deliverable.icon && (
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
              deliverable.color === 'blue' ? 'from-blue-500 to-indigo-500' :
              deliverable.color === 'purple' ? 'from-purple-500 to-pink-500' :
              deliverable.color === 'indigo' ? 'from-indigo-500 to-purple-500' :
              deliverable.color === 'cyan' ? 'from-cyan-500 to-blue-500' :
              deliverable.color === 'teal' ? 'from-teal-500 to-cyan-500' :
              deliverable.color === 'green' ? 'from-green-500 to-emerald-500' :
              'from-teal-500 to-cyan-500'
            } flex items-center justify-center shadow-md`}>
              <div className="text-white">
                {getIconComponent()}
              </div>
            </div>
          )}
          {status !== 'completed' && getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {deliverable.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {status === 'active' ? 'Generating...' : deliverable.description}
            </p>
          </div>
        </div>

        {status === 'completed' && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExport();
              }}
              disabled={isExporting}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition disabled:opacity-50"
              title="Export as DOCX"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        )}
      </button>

      {isExpanded && status === 'completed' && result?.content && (
        <div className="px-6 pb-6 pt-2">
          <div className="max-h-[800px] overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliverableCard;
