export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          title: string
          status: string
          progress: number
          current_step: string | null
          completed_steps: string[]
          created_at: string
          updated_at: string
          transcript: string
          webinar_title: string
          webinar_length: number | null
          webinar_date: string | null
          target_audience: string | null
          brand_voice: string | null
          offer_details: string | null
          speaker_names: string | null
          additional_notes: string | null
        }
        Insert: {
          id?: string
          title: string
          status?: string
          progress?: number
          current_step?: string | null
          completed_steps?: string[]
          created_at?: string
          updated_at?: string
          transcript: string
          webinar_title: string
          webinar_length?: number | null
          webinar_date?: string | null
          target_audience?: string | null
          brand_voice?: string | null
          offer_details?: string | null
          speaker_names?: string | null
          additional_notes?: string | null
        }
        Update: {
          id?: string
          title?: string
          status?: string
          progress?: number
          current_step?: string | null
          completed_steps?: string[]
          created_at?: string
          updated_at?: string
          transcript?: string
          webinar_title?: string
          webinar_length?: number | null
          webinar_date?: string | null
          target_audience?: string | null
          brand_voice?: string | null
          offer_details?: string | null
          speaker_names?: string | null
          additional_notes?: string | null
        }
      }
      deliverables: {
        Row: {
          id: string
          job_id: string
          step_id: string
          deliverable_type: string
          title: string
          content: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          step_id: string
          deliverable_type: string
          title: string
          content: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          step_id?: string
          deliverable_type?: string
          title?: string
          content?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
