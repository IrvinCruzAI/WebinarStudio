import React from 'react';
import { useJobContext } from '../context/JobContext';
import { Trash2, Presentation } from 'lucide-react';
import { Job } from '../types';
import { processingSteps } from '../constants';

interface JobItemProps {
  job: Job;
  onDelete: (id: string) => void;
}

const JobItem: React.FC<JobItemProps> = ({ job, onDelete }) => {
  const { setActiveJob } = useJobContext();

  const handleClick = () => {
    setActiveJob(job.id);
  };

  const getStatusColor = () => {
    if (job.status === 'error') return 'bg-red-500';
    if (job.status === 'completed') return 'bg-green-500';
    return 'bg-gradient-to-r from-teal-500 to-cyan-500';
  };

  return (
    <div
      onClick={handleClick}
      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition relative border border-gray-200 dark:border-gray-600"
    >
      <div className="flex items-start justify-between">
        <div className="truncate flex-1 flex items-start gap-2">
          <div className="w-8 h-8 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
            <Presentation className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate text-gray-900 dark:text-white">
              {job.title || 'New Webinar'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {job.intake?.clientName || 'Unknown Client'} • {job.intake?.company || 'Unknown Company'}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(job.id);
          }}
          className="text-gray-400 hover:text-red-600 transition-colors p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getStatusColor()}`}
            style={{ width: `${job.progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs ${
            job.status === 'error'
              ? 'text-red-500'
              : job.status === 'completed'
              ? 'text-green-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {job.status === 'error'
              ? 'Error'
              : job.status === 'completed'
              ? 'Complete'
              : 'Processing...'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {job.completedSteps.length}/{processingSteps.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JobItem;
