import React from 'react';
import WebinarIntakeForm from './WebinarIntakeForm';
import DeliverablesPanel from './DeliverablesPanel';
import { useJobContext } from '../context/JobContext';
import { FileText, Sparkles, Download } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeJob, jobs } = useJobContext();
  const currentJob = activeJob ? jobs.find(job => job.id === activeJob) : null;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {!currentJob ? (
          <div>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Generate Webinar <span className="text-teal-600">Assets</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Create landing pages, email sequences, run-of-show documents, and checklists from your webinar content in minutes.
              </p>
            </div>

            <WebinarIntakeForm />

            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white">How It Works</h2>

              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                    <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="text-teal-600 dark:text-teal-400 font-bold text-lg mb-2">1. Fill Intake</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Enter client details, webinar info, and paste your transcript
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="text-teal-600 dark:text-teal-400 font-bold text-lg mb-2">2. AI Generation</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Our AI creates 6 comprehensive deliverables tailored to your brand and audience
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                    <Download className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="text-teal-600 dark:text-teal-400 font-bold text-lg mb-2">3. Export & Use</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Copy or download your assets as DOCX files ready for use
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentJob.intake?.webinarTitle || currentJob.title}
              </h2>
              {currentJob.intake?.targetAudience && (
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Target: {currentJob.intake.targetAudience}
                </p>
              )}
            </div>

            <DeliverablesPanel job={currentJob} />
          </div>
        )}
      </div>
    </main>
  );
};

export default MainContent;
