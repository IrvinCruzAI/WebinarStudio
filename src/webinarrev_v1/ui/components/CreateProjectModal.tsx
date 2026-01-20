import { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import type { CTA, AudienceTemperature } from '../../contracts';

const DEMO_DATA: ProjectFormData = {
  title: 'Demo: AI Coaching Platform Launch',
  buildTranscript: `Client: Sarah Chen
Company: CoachAI Solutions
Offer: AI-Powered Coaching Platform - $497/month
Target Audience: Executive coaches and consultants looking to scale their practice
Webinar Goal: Get them to book a demo call to see the platform in action

Key Points from Call:
- They want to emphasize the time-saving benefits (coaches spend 60% less time on admin)
- Main pain point: coaches are overwhelmed with client management, scheduling, and follow-ups
- The AI assistant handles all the repetitive work so coaches can focus on actual coaching
- Proof points: 127 coaches using it, average client load increased from 8 to 23 clients
- Case study: Jennifer Martinez went from $8K/month to $28K/month in 6 months
- Tone should be professional but warm, speaking to ambitious coaches who want to grow
- CTA: Book a 15-minute platform walkthrough call
- They want to include a live demo during the webinar showing the AI assistant in action
- Address objection: "Will my clients know they're talking to an AI?" - No, it's behind the scenes handling admin only`,
  intakeTranscript: `Additional context from intake call:
- Speaker: Sarah Chen, Founder & CEO
- Company founded 2 years ago, bootstrap profitable
- Main differentiator: AI trained specifically on coaching methodologies
- Target client: established coaches making $5K-$15K/month wanting to scale to $30K+
- Secondary benefit: Better client outcomes due to consistent follow-up
- Testimonial available from Jennifer Martinez
- Metric: 94% client retention rate vs industry average of 68%
- They have screen recordings of the platform for demo purposes`,
  ctaMode: 'hybrid',
  audienceTemperature: 'warm',
  webinarLengthMinutes: 60,
};

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}

export interface ProjectFormData {
  title: string;
  buildTranscript: string;
  intakeTranscript: string;
  ctaMode: CTA;
  audienceTemperature: AudienceTemperature;
  webinarLengthMinutes: number;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    buildTranscript: '',
    intakeTranscript: '',
    ctaMode: 'book_call',
    audienceTemperature: 'warm',
    webinarLengthMinutes: 60,
  });

  if (!isOpen) return null;

  function loadDemoData() {
    setFormData(DEMO_DATA);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Create New Project</h2>
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={loadDemoData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium hover:bg-teal-500/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Demo Data
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Project Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Launch Webinar Q1 2025"
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Build Transcript
            </label>
            <textarea
              required
              value={formData.buildTranscript}
              onChange={(e) =>
                setFormData({ ...formData, buildTranscript: e.target.value })
              }
              placeholder="Paste the build call transcript here..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              The transcript from your webinar build/planning call
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Intake Transcript (Optional)
            </label>
            <textarea
              value={formData.intakeTranscript}
              onChange={(e) =>
                setFormData({ ...formData, intakeTranscript: e.target.value })
              }
              placeholder="Paste the intake call transcript here (optional)..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                CTA Mode
              </label>
              <select
                value={formData.ctaMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ctaMode: e.target.value as CTA,
                  })
                }
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
              >
                <option value="book_call">Book Call</option>
                <option value="buy_now">Buy Now</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Audience Temperature
              </label>
              <select
                value={formData.audienceTemperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    audienceTemperature: e.target.value as AudienceTemperature,
                  })
                }
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
              >
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="hot">Hot</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration (min)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                value={formData.webinarLengthMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    webinarLengthMinutes: parseInt(e.target.value, 10) || 60,
                  })
                }
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.buildTranscript}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium hover:from-teal-400 hover:to-cyan-500 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create & Start Pipeline'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
