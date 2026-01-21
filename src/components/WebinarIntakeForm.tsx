import React, { useState } from 'react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { WebinarIntake, CTAOption, ToneOption } from '../types';
import { deliverables } from '../constants';
import { useJobContext } from '../context/JobContext';
import { startProcessingJob } from '../api/processWebinarRev';
import { parseAndPrefillFromTranscript } from '../api/parseAndPrefill';
import { calculateCompleteness } from '../utils/completenessCheck';
import { CompletenessCheck } from './CompletenessCheck';

const WebinarIntakeForm: React.FC = () => {
  const { createJob } = useJobContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<WebinarIntake>>({
    primaryCTAType: 'book_call',
    tone: 'Professional'
  });

  const [transcript, setTranscript] = useState('');

  const completeness = calculateCompleteness(formData, transcript);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'webinarLengthMinutes' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleParseAndPrefill = async () => {
    if (!transcript.trim()) {
      setFetchError('Please paste a transcript first');
      return;
    }

    setIsParsing(true);
    setFetchError(null);

    try {
      const parsed = await parseAndPrefillFromTranscript(transcript, formData.notes);
      setFormData(prev => ({
        ...prev,
        ...parsed
      }));
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to parse transcript');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const finalIntake: WebinarIntake = {
        clientName: formData.clientName || '',
        company: formData.company || '',
        webinarTitle: formData.webinarTitle || '',
        targetAudience: formData.targetAudience || '',
        offer: formData.offer || '',
        tone: formData.tone || 'Professional',
        primaryCTAType: formData.primaryCTAType || 'book_call',
        primaryCTALink: formData.primaryCTALink,
        speakerName: formData.speakerName,
        speakerTitle: formData.speakerTitle,
        webinarDate: formData.webinarDate,
        webinarLengthMinutes: formData.webinarLengthMinutes || 60,
        notes: formData.notes
      };

      const job = await createJob(finalIntake, transcript);
      await startProcessingJob(job.id, finalIntake, transcript);
    } catch (error) {
      console.error('Error starting job:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to start processing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Transcript & Auto-Parse
            </h3>

            {fetchError && (
              <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                {fetchError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Intake Call Transcript <span className="text-red-500">*</span>
              </label>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                placeholder="Paste intake call transcript here..."
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {transcript.length.toLocaleString()} characters
                </p>
                <button
                  type="button"
                  onClick={handleParseAndPrefill}
                  disabled={!transcript.trim() || isParsing}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-medium"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Parse & Prefill
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="Any additional context or special requirements..."
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client & Company</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webinar Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Webinar Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="webinarTitle"
                  value={formData.webinarTitle || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="How to 10X Your Revenue in 90 Days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Target Audience <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="B2B SaaS founders with 10-50 employees"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Webinar Date
                  </label>
                  <input
                    type="date"
                    name="webinarDate"
                    value={formData.webinarDate || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Length (minutes)
                  </label>
                  <input
                    type="number"
                    name="webinarLengthMinutes"
                    value={formData.webinarLengthMinutes || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Speaker Name
                  </label>
                  <input
                    type="text"
                    name="speakerName"
                    value={formData.speakerName || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Speaker Title
                  </label>
                  <input
                    type="text"
                    name="speakerTitle"
                    value={formData.speakerTitle || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="CEO & Founder"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Offer & CTA</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Offer <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="offer"
                  value={formData.offer || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="6-month coaching program with weekly group calls and 1-on-1 strategy sessions"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Primary CTA Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="primaryCTAType"
                    value={formData.primaryCTAType || 'book_call'}
                    onChange={handleInputChange}
                    aria-label="Primary CTA Type"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="book_call">Book a Call</option>
                    <option value="buy">Buy Now</option>
                    <option value="waitlist">Join Waitlist</option>
                    <option value="download">Download</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    CTA Link
                  </label>
                  <input
                    type="text"
                    name="primaryCTALink"
                    value={formData.primaryCTALink || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Desired Tone
                </label>
                <select
                  name="tone"
                  value={formData.tone || 'Professional'}
                  onChange={handleInputChange}
                  aria-label="Desired Tone"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Direct">Direct</option>
                  <option value="Bold">Bold</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CompletenessCheck check={completeness} />

      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Deliverables Generated:</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {deliverables.map((deliverable) => (
            <div key={deliverable.id} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{deliverable.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{deliverable.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || completeness.requiredMissing.length > 0}
        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold text-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Deliverables...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Webinar Deliverables
          </>
        )}
      </button>
    </form>
  );
};

export default WebinarIntakeForm;
