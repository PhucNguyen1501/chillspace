import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { JobService, type Job, type JobRun } from '../../lib/jobService';
import { toast } from 'sonner';

interface Props {
  job: Job;
  onBack: () => void;
}

export default function JobRunHistory({ job, onBack }: Props): JSX.Element {
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { user } = useAuth();
  const jobService = JobService.getInstance();

  useEffect(() => {
    if (user) {
      loadRuns();
    }
  }, [job.id, user]);

  const loadRuns = async () => {
    if (!user || !job.id) return;

    setLoading(true);
    try {
      const jobRuns = await jobService.getJobRuns(job.id);
      setRuns(jobRuns);
    } catch (error) {
      console.error('Error loading job runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'xlsx') => {
    if (!user || !job.id) return;

    setExporting(true);
    try {
      const blob = await jobService.exportJobRuns(job.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'xlsx' ? 'xlsx' : format;
      a.download = `${job.name}-runs.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully', {
        description: `Downloaded ${runs.length} job runs`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'running':
        return 'Running';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (started: string, completed?: string) => {
    if (!completed) return 'Running...';
    
    const start = new Date(started).getTime();
    const end = new Date(completed).getTime();
    const duration = end - start;
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}m`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">{job.name}</h2>
            <p className="text-xs text-muted-foreground">Execution History</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadRuns}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {runs.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 transition-colors"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                className="px-2 py-1 text-xs bg-accent-600 hover:bg-accent-700 text-white rounded-md disabled:opacity-50 transition-colors"
              >
                Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-background border border-border rounded-md">
          <p className="text-2xl font-bold">{runs.length}</p>
          <p className="text-xs text-muted-foreground">Total Runs</p>
        </div>
        <div className="text-center p-3 bg-background border border-border rounded-md">
          <p className="text-2xl font-bold text-green-600">
            {runs.filter(r => r.status === 'completed').length}
          </p>
          <p className="text-xs text-muted-foreground">Successful</p>
        </div>
        <div className="text-center p-3 bg-background border border-border rounded-md">
          <p className="text-2xl font-bold text-destructive">
            {runs.filter(r => r.status === 'failed').length}
          </p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
      </div>

      {/* Runs List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading run history...</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No executions yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Runs will appear here when the job executes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className="p-3 bg-background border border-border rounded-md"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(run.status)}
                  <span className="text-sm font-medium">
                    {getStatusText(run.status)}
                  </span>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {getDuration(run.started_at, run.completed_at)}
                  </p>
                  {run.result_count !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {run.result_count} records
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Started: {formatDate(run.started_at)}</p>
                {run.completed_at && (
                  <p>Completed: {formatDate(run.completed_at)}</p>
                )}
                {run.error && (
                  <p className="text-destructive">Error: {run.error}</p>
                )}
                {run.output_url && (
                  <p>
                    Output:{' '}
                    <a
                      href={run.output_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Download
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
