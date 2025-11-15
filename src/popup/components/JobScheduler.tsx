import { useState, useEffect } from 'react';
import { Calendar, Play, Pause, Trash2, Plus } from 'lucide-react';
import type { Job } from '../../types';

export default function JobScheduler(): JSX.Element {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['jobs'], (result) => {
      if (result.jobs) {
        setJobs(result.jobs);
      }
    });
  }, []);

  const handleToggleJob = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const updatedJob = { ...job, enabled: !job.enabled };
    const updatedJobs = jobs.map((j) => (j.id === jobId ? updatedJob : j));
    setJobs(updatedJobs);
    await chrome.storage.local.set({ jobs: updatedJobs });

    if (updatedJob.enabled) {
      await chrome.runtime.sendMessage({
        type: 'SCHEDULE_JOB',
        payload: updatedJob,
      });
    } else {
      await chrome.runtime.sendMessage({
        type: 'CANCEL_JOB',
        payload: { jobId },
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const updatedJobs = jobs.filter((j) => j.id !== jobId);
    setJobs(updatedJobs);
    await chrome.storage.local.set({ jobs: updatedJobs });
    await chrome.runtime.sendMessage({
      type: 'CANCEL_JOB',
      payload: { jobId },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Scheduled Jobs</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md hover:opacity-90"
        >
          <Plus className="w-3 h-3" />
          New Job
        </button>
      </div>

      {showCreateForm && (
        <div className="border border-border rounded-md p-4 space-y-3">
          <h3 className="text-sm font-medium">Create New Job</h3>
          <p className="text-xs text-muted-foreground">
            Job creation UI will be enhanced in Phase 6
          </p>
          <button
            onClick={() => setShowCreateForm(false)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No scheduled jobs yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border border-border rounded-md p-3 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{job.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {job.schedule.type} • {job.outputFormat.toUpperCase()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleJob(job.id)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {job.enabled ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs bg-accent/30 rounded p-2 font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">
                    {job.query.method}
                  </span>
                  <span className="truncate">{job.query.endpoint}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${
                    job.enabled
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {job.enabled ? 'Active' : 'Paused'}
                </span>
                {job.schedule.nextRun && (
                  <span className="text-xs text-muted-foreground">
                    Next: {new Date(job.schedule.nextRun).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
