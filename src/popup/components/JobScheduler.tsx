import { useState, useEffect } from 'react';
import { Calendar, Play, Pause, Trash2, Plus, History, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { JobService, type Job } from '../../lib/jobService';
import CreateJobForm from './CreateJobForm';
import JobRunHistory from './JobRunHistory';

export default function JobScheduler(): JSX.Element {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0,
  });

  const { user } = useAuth();
  const jobService = JobService.getInstance();

  useEffect(() => {
    if (user) {
      loadJobs();
      loadStats();
    }
  }, [user]);

  const loadJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userJobs = await jobService.getJobs(user.id);
      setJobs(userJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const jobStats = await jobService.getJobStats(user.id);
      setStats(jobStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleToggleJob = async (jobId: string) => {
    if (!user) return;
    
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    try {
      await jobService.toggleJob(jobId, !job.enabled, user.id);
      await loadJobs();
      await loadStats();
    } catch (error) {
      console.error('Error toggling job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await jobService.deleteJob(jobId, user.id);
      await loadJobs();
      await loadStats();
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleRunJob = async (jobId: string) => {
    if (!user) return;
    
    try {
      await jobService.runJobManually(jobId, user.id);
      await loadJobs();
      await loadStats();
    } catch (error) {
      console.error('Error running job:', error);
    }
  };

  const handleJobCreated = () => {
    setShowCreateForm(false);
    loadJobs();
    loadStats();
  };

  const formatSchedule = (schedule: Job['schedule']) => {
    if (schedule.type === 'interval') {
      const match = schedule.value.match(/(\d+)([mhd])/);
      if (match) {
        const [, num, unit] = match;
        const unitMap = { m: 'minute', h: 'hour', d: 'day' };
        return `Every ${num} ${unitMap[unit as keyof typeof unitMap]}${num > '1' ? 's' : ''}`;
      }
    }
    return schedule.value;
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to create and manage scheduled jobs
        </p>
      </div>
    );
  }

  if (showCreateForm) {
    return <CreateJobForm onCancel={() => setShowCreateForm(false)} onSuccess={handleJobCreated} />;
  }

  if (showHistory && selectedJob) {
    return (
      <JobRunHistory
        job={selectedJob}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-background border border-border rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Total Jobs</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">{stats.active} active</p>
        </div>
        
        <div className="p-4 bg-background border border-border rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Executions</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-destructive">{stats.failed} failed</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Scheduled Jobs</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No jobs scheduled yet
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Create Your First Job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`p-4 border rounded-md transition-colors ${
                selectedJob?.id === job.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent/50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{job.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatSchedule(job.schedule)}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Format: {job.output_format.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Destination: {job.destination.type}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRunJob(job.id!)}
                    className="p-1.5 rounded hover:bg-accent transition-colors"
                    title="Run now"
                  >
                    <Play className="w-4 h-4 text-green-600" />
                  </button>
                  
                  <button
                    onClick={() => handleToggleJob(job.id!)}
                    className="p-1.5 rounded hover:bg-accent transition-colors"
                    title={job.enabled ? 'Disable' : 'Enable'}
                  >
                    {job.enabled ? (
                      <Pause className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Play className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setShowHistory(true);
                    }}
                    className="p-1.5 rounded hover:bg-accent transition-colors"
                    title="View history"
                  >
                    <History className="w-4 h-4 text-blue-600" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteJob(job.id!)}
                    className="p-1.5 rounded hover:bg-accent transition-colors"
                    title="Delete job"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  job.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className={`text-xs font-medium ${
                  job.enabled ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {job.enabled ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
