import { supabase } from './supabase';
import { toast } from 'sonner';
import type { GeneratedApiCall } from '../types';

export interface Job {
  id?: string;
  name: string;
  query: GeneratedApiCall;
  schedule: {
    type: 'interval' | 'cron';
    value: string; // e.g., "5m" for 5 minutes, "0 */6 * * *" for cron
  };
  output_format: 'json' | 'csv' | 'xlsx';
  destination: {
    type: 'download' | 'email' | 'webhook';
    config: Record<string, any>;
  };
  enabled: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JobRun {
  id?: string;
  job_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error?: string;
  result_count?: number;
  output_url?: string;
}

export class JobService {
  private static instance: JobService;
  
  static getInstance(): JobService {
    if (!JobService.instance) {
      JobService.instance = new JobService();
    }
    return JobService.instance;
  }

  /**
   * Create a new job
   */
  async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<Job> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          ...job,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Job created successfully', {
        description: `"${job.name}" is now scheduled`,
      });
      
      return data as Job;
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all jobs for a user
   */
  async getJobs(userId: string): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Job[];
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs', {
        description: 'Please refresh to try again',
      });
      return [];
    }
  }

  /**
   * Update a job
   */
  async updateJob(jobId: string, updates: Partial<Job>, userId: string): Promise<Job> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Job updated successfully');
      return data as Job;
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Toggle job enabled/disabled
   */
  async toggleJob(jobId: string, enabled: boolean, userId: string): Promise<Job> {
    return this.updateJob(jobId, { enabled }, userId);
  }

  /**
   * Get job runs for a job
   */
  async getJobRuns(jobId: string): Promise<JobRun[]> {
    try {
      const { data, error } = await supabase
        .from('job_runs')
        .select('*')
        .eq('job_id', jobId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as JobRun[];
    } catch (error) {
      console.error('Error loading job runs:', error);
      return [];
    }
  }

  /**
   * Run a job manually
   */
  async runJobManually(jobId: string, userId: string): Promise<void> {
    try {
      // Call the job execution Edge Function
      const { data, error } = await supabase.functions.invoke('execute-job', {
        body: { jobId, userId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to execute job');
      }

      toast.success('Job execution started', {
        description: 'Check job history for results',
      });
    } catch (error) {
      console.error('Error running job:', error);
      toast.error('Failed to run job', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(userId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, enabled')
        .eq('user_id', userId);

      if (jobsError) throw jobsError;

      const { data: runs, error: runsError } = await supabase
        .from('job_runs')
        .select('status')
        .in('job_id', jobs?.map(j => j.id) || []);

      if (runsError) throw runsError;

      const stats = {
        total: jobs?.length || 0,
        active: jobs?.filter(j => j.enabled).length || 0,
        completed: runs?.filter(r => r.status === 'completed').length || 0,
        failed: runs?.filter(r => r.status === 'failed').length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };
    }
  }

  /**
   * Validate job configuration
   */
  validateJob(job: Partial<Job>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!job.name?.trim()) {
      errors.push('Job name is required');
    }

    if (!job.query) {
      errors.push('API query is required');
    }

    if (!job.schedule?.type || !job.schedule?.value) {
      errors.push('Schedule configuration is required');
    }

    if (job.schedule?.type === 'interval') {
      const intervalPattern = /^(\d+)(m|h|d)$/;
      if (!intervalPattern.test(job.schedule.value)) {
        errors.push('Interval format should be like "5m", "1h", "1d"');
      }
    }

    if (!job.output_format) {
      errors.push('Output format is required');
    }

    if (!job.destination?.type) {
      errors.push('Destination type is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export job runs data
   */
  async exportJobRuns(jobId: string, format: 'json' | 'csv'): Promise<string> {
    try {
      const runs = await this.getJobRuns(jobId);
      
      if (format === 'json') {
        return JSON.stringify(runs, null, 2);
      } else if (format === 'csv') {
        const headers = ['ID', 'Status', 'Started At', 'Completed At', 'Result Count', 'Error'];
        const rows = runs.map(run => [
          run.id || '',
          run.status,
          run.started_at,
          run.completed_at || '',
          run.result_count?.toString() || '',
          run.error || '',
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
      
      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting job runs:', error);
      toast.error('Failed to export data', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
