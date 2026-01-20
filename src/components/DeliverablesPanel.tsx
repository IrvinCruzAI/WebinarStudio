import React from 'react';
import { CheckCircle, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Job } from '../types';
import { deliverables, processingSteps } from '../constants';
import DeliverableCard from './DeliverableCard';
import QADashboard from './QADashboard';
import { useJobContext } from '../context/JobContext';

interface DeliverablesPanelProps {
  job: Job;
}

const DeliverablesPanel: React.FC<DeliverablesPanelProps> = ({ job }) => {
  const { retryJob } = useJobContext();
  const currentStepInfo = processingSteps.find(s => s.id === job.currentStep);

  const handleRetry = async () => {
    await retryJob(job.id);
  };

  const getDeliverableStatus = (stepId: string): 'pending' | 'active' | 'completed' | 'error' => {
    if (job.status === 'failed' && job.currentStep === stepId) {
      return 'error';
    }
    if (job.completedSteps.includes(stepId)) {
      return 'completed';
    }
    if (job.currentStep === stepId) {
      return 'active';
    }
    return 'pending';
  };

  const getResult = (stepId: string, subSection?: string) => {
    const result = job.results.find(r => r.stepId === stepId);
    // If this deliverable uses a subsection, we still return the full result
    // The DeliverableCard will handle extracting the subsection
    return result;
  };

  const completedCount = deliverables.filter(
    d => job.completedSteps.includes(d.stepId)
  ).length;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 py-3 md:-mx-6 md:px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {job.status === 'completed' ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">All deliverables ready</span>
              </div>
            ) : job.status === 'failed' ? (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Error occurred</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">
                  {currentStepInfo?.name || 'Processing'}...
                </span>
              </div>
            )}
          </div>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{deliverables.length} deliverables
          </span>
        </div>

        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              job.status === 'error'
                ? 'bg-red-500'
                : job.status === 'completed'
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500'
            }`}
            style={{ width: `${job.progress}%` }}
          />
        </div>

        {job.status === 'processing' && currentStepInfo && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Step {job.completedSteps.length + 1} of {processingSteps.length}: {currentStepInfo.description}
          </p>
        )}

        {job.status === 'failed' && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            {job.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {job.error}
              </p>
            )}
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Processing
            </button>
          </div>
        )}
      </div>

      {/* QA Dashboard */}
      {job.status === 'completed' && job.qa && (
        <QADashboard qa={job.qa} />
      )}

      <div className="space-y-5">
        {deliverables.map((deliverable) => (
          <DeliverableCard
            key={deliverable.id}
            deliverable={deliverable}
            result={getResult(deliverable.stepId, (deliverable as any).subSection)}
            status={getDeliverableStatus(deliverable.stepId)}
            webinarTitle={job.intake?.webinarTitle || job.title}
          />
        ))}
      </div>

      {job.status === 'completed' && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            All assets ready!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click on any deliverable to expand and view the content. Use the copy button to copy as markdown,
            or export as a DOCX file for easy sharing.
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliverablesPanel;
