import { useState } from 'react';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { JobService } from '../../lib/jobService';
import { validateCronExpression, validateUrl, validateEmail, validateRequired, validateInterval } from '../../lib/validation';
import type { GeneratedApiCall } from '../../types';

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
  initialQuery?: GeneratedApiCall;
}

export default function CreateJobForm({ onCancel, onSuccess, initialQuery }: Props): JSX.Element {
  const [formData, setFormData] = useState({
    name: '',
    schedule: {
      type: 'interval' as 'interval' | 'cron',
      value: '1h',
    },
    output_format: 'json' as 'json' | 'csv' | 'xlsx',
    destination: {
      type: 'download' as 'download' | 'email' | 'webhook',
      config: {},
    },
    enabled: true,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const jobService = JobService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate form with enhanced validation
    const validationErrors: string[] = [];
    
    if (!initialQuery) {
      validationErrors.push('API query is required');
    }

    // Validate name
    const nameValidation = validateRequired(formData.name, 'Job name');
    if (!nameValidation.isValid) {
      validationErrors.push(...nameValidation.errors);
    }

    // Validate schedule
    if (formData.schedule.type === 'cron') {
      const cronValidation = validateCronExpression(formData.schedule.value);
      if (!cronValidation.isValid) {
        validationErrors.push(...cronValidation.errors);
      }
    } else if (formData.schedule.type === 'interval') {
      const intervalValidation = validateInterval(formData.schedule.value);
      if (!intervalValidation.isValid) {
        validationErrors.push(...intervalValidation.errors);
      }
    }

    // Validate destination
    if (formData.destination.type === 'webhook') {
      const webhookUrl = (formData.destination.config as any)?.url || '';
      const urlValidation = validateUrl(webhookUrl);
      if (!urlValidation.isValid) {
        validationErrors.push('Webhook: ' + urlValidation.errors.join(', '));
      }
    } else if (formData.destination.type === 'email') {
      const emailAddress = (formData.destination.config as any)?.email || '';
      const emailValidation = validateEmail(emailAddress);
      if (!emailValidation.isValid) {
        validationErrors.push('Email: ' + emailValidation.errors.join(', '));
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      if (!initialQuery) {
        throw new Error('API query is required');
      }
      
      await jobService.createJob({
        ...formData,
        query: initialQuery,
      }, user.id);

      onSuccess();
    } catch (error) {
      console.error('Error creating job:', error);
      setErrors(['Failed to create job. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setErrors([]);
  };

  const handleScheduleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value,
      },
    }));
    setErrors([]);
  };

  const handleDestinationChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      destination: {
        ...prev.destination,
        [field]: value,
      },
    }));
    setErrors([]);
  };

  if (!initialQuery) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground mb-4">
          Please generate an API query first before creating a job
        </p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900 mb-1">Please fix the following errors:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold">Create Scheduled Job</h2>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm font-medium text-destructive mb-1">Please fix the following errors:</p>
          <ul className="text-sm text-destructive list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Job Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Job Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
          placeholder="e.g., Daily User Sync"
          disabled={loading}
        />
      </div>

      {/* Schedule */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Schedule
        </label>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleScheduleChange('type', 'interval')}
              className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                formData.schedule.type === 'interval'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }`}
            >
              Interval
            </button>
            <button
              type="button"
              onClick={() => handleScheduleChange('type', 'cron')}
              className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                formData.schedule.type === 'cron'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }`}
            >
              Cron Expression
            </button>
          </div>

          {formData.schedule.type === 'interval' ? (
            <select
              value={formData.schedule.value}
              onChange={(e) => handleScheduleChange('value', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              disabled={loading}
            >
              <option value="5m">Every 5 minutes</option>
              <option value="15m">Every 15 minutes</option>
              <option value="30m">Every 30 minutes</option>
              <option value="1h">Every hour</option>
              <option value="6h">Every 6 hours</option>
              <option value="12h">Every 12 hours</option>
              <option value="1d">Every day</option>
              <option value="1w">Every week</option>
            </select>
          ) : (
            <input
              type="text"
              value={formData.schedule.value}
              onChange={(e) => handleScheduleChange('value', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              placeholder="0 */6 * * *"
              disabled={loading}
            />
          )}
        </div>
      </div>

      {/* Output Format */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Output Format
        </label>
        <select
          value={formData.output_format}
          onChange={(e) => handleInputChange('output_format', e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
          disabled={loading}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="xlsx">Excel (.xlsx)</option>
        </select>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Destination
        </label>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDestinationChange('type', 'download')}
              className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                formData.destination.type === 'download'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Download
            </button>
            <button
              type="button"
              onClick={() => handleDestinationChange('type', 'email')}
              className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                formData.destination.type === 'email'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => handleDestinationChange('type', 'webhook')}
              className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                formData.destination.type === 'webhook'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Webhook
            </button>
          </div>

          {formData.destination.type === 'email' && (
            <div>
              <input
                type="email"
                value={(formData.destination.config as any)?.email || ''}
                onChange={(e) => handleDestinationChange('config', { ...formData.destination.config, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                placeholder="recipient@example.com"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Job results will be emailed to this address
              </p>
            </div>
          )}
          
          {formData.destination.type === 'webhook' && (
            <div>
              <input
                type="url"
                value={(formData.destination.config as any)?.url || ''}
                onChange={(e) => handleDestinationChange('config', { ...formData.destination.config, url: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                placeholder="https://your-webhook-url.com"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Results will be sent via HTTP POST
              </p>
            </div>
          )}
        </div>
      </div>

      {/* API Query Preview */}
      <div>
        <label className="block text-sm font-medium mb-2">
          API Query
        </label>
        <div className="p-3 bg-accent/20 rounded-md border border-accent">
          <div className="text-xs space-y-1">
            <p><span className="font-medium">Method:</span> {initialQuery.method}</p>
            <p><span className="font-medium">URL:</span> {initialQuery.endpoint}</p>
            {initialQuery.body && (
              <p><span className="font-medium">Body:</span> {JSON.stringify(initialQuery.body)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Enabled Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled}
          onChange={(e) => handleInputChange('enabled', e.target.checked)}
          className="rounded"
          disabled={loading}
        />
        <label htmlFor="enabled" className="text-sm">
          Enable job immediately
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Create Job
            </>
          )}
        </button>
      </div>
    </form>
  );
}
