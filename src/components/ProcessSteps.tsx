import React from 'react';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';
import { processingSteps } from '../constants';
import { Job } from '../types';

interface ProcessStepsProps {
  job: Job;
}

const ProcessSteps: React.FC<ProcessStepsProps> = ({ job }) => {
  const getStepStatus = (stepId: string) => {
    if (job.completedSteps.includes(stepId)) {
      return 'completed';
    }

    if (job.currentStep === stepId) {
      return 'active';
    }

    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-teal-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h3 className="font-semibold mb-4">Processing Steps</h3>

      <div className="space-y-3">
        {processingSteps.map((step) => {
          const status = getStepStatus(step.id);

          return (
            <div
              key={step.id}
              className={`flex items-start p-3 rounded-md border ${
                status === 'active'
                  ? 'border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-900/20'
                  : status === 'completed'
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="mr-3 mt-0.5">
                {getStepIcon(status)}
              </div>

              <div>
                <div className="font-medium">
                  {step.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessSteps;
