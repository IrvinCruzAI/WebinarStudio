import { supabase } from '../lib/supabase';
import type { Job, WebinarIntake, ProcessingResult, QAReport } from '../types';

export const jobService = {
  async getAllJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }

    const jobsWithDeliverables = await Promise.all(
      (data || []).map(async (job) => {
        const { data: deliverables } = await supabase
          .from('deliverables')
          .select('*')
          .eq('job_id', job.id);

        const results: ProcessingResult[] = (deliverables || []).map((d) => ({
          stepId: d.step_id,
          deliverableType: d.deliverable_type,
          title: d.title,
          content: d.content as any,
        }));

        const qa: QAReport = {
          assumptions: job.qa_assumptions || [],
          placeholders: job.qa_placeholders || [],
          claimsRequiringProof: job.qa_claims_requiring_proof || [],
        };

        return {
          id: job.id,
          title: job.title,
          status: job.status as 'processing' | 'completed' | 'failed',
          progress: job.progress,
          currentStep: job.current_step,
          completedSteps: job.completed_steps,
          results,
          createdAt: job.created_at,
          intake: {
            clientName: job.client_name || '',
            company: job.company || '',
            webinarTitle: job.webinar_title || '',
            targetAudience: job.target_audience || '',
            offer: job.offer || '',
            tone: job.tone as any,
            primaryCTAType: job.primary_cta_type as any,
            primaryCTALink: job.primary_cta_link,
            speakerName: job.speaker_name,
            speakerTitle: job.speaker_title,
            webinarDate: job.webinar_date,
            webinarLengthMinutes: job.webinar_length,
            notes: job.notes,
            youtubeUrl: job.youtube_url,
          },
          transcript: job.transcript,
          qa,
          error: job.error,
        };
      })
    );

    return jobsWithDeliverables;
  },

  async createJob(intake: WebinarIntake, transcript: string): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        title: intake.webinarTitle || 'New Webinar',
        status: 'processing',
        progress: 0,
        current_step: null,
        completed_steps: [],
        transcript,
        client_name: intake.clientName,
        company: intake.company,
        webinar_title: intake.webinarTitle,
        webinar_length: intake.webinarLengthMinutes,
        webinar_date: intake.webinarDate,
        target_audience: intake.targetAudience,
        offer: intake.offer,
        tone: intake.tone,
        primary_cta_type: intake.primaryCTAType,
        primary_cta_link: intake.primaryCTALink,
        speaker_name: intake.speakerName,
        speaker_title: intake.speakerTitle,
        notes: intake.notes,
        youtube_url: intake.youtubeUrl,
        qa_assumptions: [],
        qa_placeholders: [],
        qa_claims_requiring_proof: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      status: data.status as 'processing' | 'completed' | 'failed',
      progress: data.progress,
      currentStep: data.current_step,
      completedSteps: data.completed_steps,
      results: [],
      createdAt: data.created_at,
      intake,
      transcript,
      qa: {
        assumptions: [],
        placeholders: [],
        claimsRequiringProof: [],
      },
    };
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.currentStep !== undefined) updateData.current_step = updates.currentStep;
    if (updates.completedSteps !== undefined) updateData.completed_steps = updates.completedSteps;
    if (updates.error !== undefined) updateData.error = updates.error;

    if (updates.qa) {
      updateData.qa_assumptions = updates.qa.assumptions;
      updateData.qa_placeholders = updates.qa.placeholders;
      updateData.qa_claims_requiring_proof = updates.qa.claimsRequiringProof;
    }

    const { error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating job:', error);
      throw error;
    }

    if (updates.results) {
      for (const result of updates.results) {
        const { data: existing } = await supabase
          .from('deliverables')
          .select('id')
          .eq('job_id', id)
          .eq('step_id', result.stepId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('deliverables')
            .update({
              deliverable_type: result.deliverableType,
              title: result.title,
              content: result.content as any,
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('deliverables')
            .insert({
              job_id: id,
              step_id: result.stepId,
              deliverable_type: result.deliverableType,
              title: result.title,
              content: result.content as any,
            });
        }
      }
    }
  },

  async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },
};
