import React, { createContext, useContext, useEffect } from 'react';
import { Job, JobContextType, WebinarIntake } from '../types';
import { create } from 'zustand';
import { jobService } from '../services/jobService';
import { startProcessingJob, regenerateDeliverable as regenerateDeliverableAPI } from '../api/processWebinarRev';

export const useJobContext = create<JobContextType>((set, get) => ({
  jobs: [],
  activeJob: null,

  createJob: async (intake: WebinarIntake, transcript: string) => {
    const newJob = await jobService.createJob(intake, transcript);

    set((state) => ({
      jobs: [newJob, ...state.jobs],
      activeJob: newJob.id
    }));

    return newJob;
  },

  updateJob: async (id, updates) => {
    await jobService.updateJob(id, updates);

    set((state) => {
      const updatedJobs = state.jobs.map((job) => {
        if (job.id === id) {
          const updatedJob = { ...job, ...updates };

          if (updates.results) {
            const wr2Result = updates.results.find(r => r.stepId === 'WR2');
            if (wr2Result && job.title === 'New Webinar') {
              const firstTakeaway = wr2Result.content?.keyTakeaways?.[0];
              if (firstTakeaway) {
                updatedJob.title = firstTakeaway.length > 50
                  ? firstTakeaway.substring(0, 50) + '...'
                  : firstTakeaway;
              }
            }
          }

          return updatedJob;
        }
        return job;
      });

      return { jobs: updatedJobs };
    });
  },

  deleteJob: async (id) => {
    await jobService.deleteJob(id);

    set((state) => {
      const updatedJobs = state.jobs.filter(job => job.id !== id);
      const newActiveJob = state.activeJob === id ? null : state.activeJob;

      return {
        jobs: updatedJobs,
        activeJob: newActiveJob
      };
    });
  },

  retryJob: async (id) => {
    const job = get().jobs.find(j => j.id === id);
    if (!job) return;

    await jobService.updateJob(id, {
      status: 'processing',
      progress: 0,
      currentStep: null,
      completedSteps: [],
      results: [],
      error: undefined
    });

    set((state) => ({
      jobs: state.jobs.map(j =>
        j.id === id
          ? { ...j, status: 'processing', progress: 0, currentStep: null, completedSteps: [], results: [], error: undefined }
          : j
      )
    }));

    await startProcessingJob(id, job.intake, job.transcript);
  },

  regenerateDeliverable: async (jobId, stepId) => {
    const job = get().jobs.find(j => j.id === jobId);
    if (!job) return;

    await regenerateDeliverableAPI(jobId, stepId, job);
  },

  setActiveJob: (id) => {
    set({ activeJob: id });
  },

  loadJobsFromStorage: async () => {
    try {
      const jobs = await jobService.getAllJobs();
      set({ jobs });
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }
}));

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const jobStore = useJobContext();

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      try {
        await jobStore.loadJobsFromStorage();
      } catch (error) {
        if (mounted) {
          console.error('[JobProvider] Failed to load jobs on mount:', error);
        }
      }
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, [jobStore]);

  return (
    <JobContext.Provider value={jobStore}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobContextReact = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobContext must be used within a JobProvider');
  }
  return context;
};
