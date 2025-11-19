// Supabase Edge Function for executing scheduled jobs
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore - Deno global
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface JobRequest {
  jobId: string;
  userId: string;
}

interface Job {
  id: string;
  name: string;
  query: any;
  schedule: any;
  output_format: string;
  destination: any;
  enabled: boolean;
  user_id: string;
}

interface JobRun {
  id: string;
  job_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  error?: string;
  result_count?: number;
  output_url?: string;
}

// @ts-ignore - Deno serve function type
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('Job execution function called');
    
    const { jobId, userId }: JobRequest = await req.json();

    // Validate inputs
    if (!jobId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing jobId or userId' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return new Response(
        JSON.stringify({ success: false, error: 'Job not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!job.enabled) {
      return new Response(
        JSON.stringify({ success: false, error: 'Job is disabled' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create job run record
    const { data: jobRun, error: runError } = await supabase
      .from('job_runs')
      .insert({
        job_id: jobId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !jobRun) {
      console.error('Failed to create job run:', runError);
      throw new Error('Failed to create job run');
    }

    console.log(`Executing job: ${job.name} (ID: ${jobId})`);

    try {
      // Execute the API query
      const result = await executeApiQuery(job.query);
      
      // Process results based on output format
      const processedData = await processResults(result, job.output_format);
      
      // Save extracted data
      if (processedData.data && processedData.data.length > 0) {
        const { error: dataError } = await supabase
          .from('extracted_data')
          .insert(
            processedData.data.map((item: any) => ({
              job_run_id: jobRun.id,
              data: item,
            }))
          );

        if (dataError) {
          console.error('Failed to save extracted data:', dataError);
        }
      }

      // Handle destination (download, email, webhook)
      let outputUrl = null;
      if (job.destination.type === 'download') {
        outputUrl = await generateDownloadUrl(processedData, job.output_format);
      } else if (job.destination.type === 'webhook') {
        await sendToWebhook(job.destination.config.url, processedData);
      } else if (job.destination.type === 'email') {
        await sendEmail(job.destination.config.email, job.name, processedData, job.output_format);
      }

      // Update job run as completed
      const { error: updateError } = await supabase
        .from('job_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_count: processedData.data?.length || 0,
          output_url: outputUrl,
        })
        .eq('id', jobRun.id);

      if (updateError) {
        console.error('Failed to update job run:', updateError);
      }

      console.log(`Job completed successfully: ${job.name}`);

      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          jobRunId: jobRun.id,
          resultCount: processedData.data?.length || 0,
          outputUrl,
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (executionError) {
      console.error('Job execution failed:', executionError);
      
      // Update job run as failed
      const { error: updateError } = await supabase
        .from('job_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: executionError instanceof Error ? executionError.message : 'Unknown error',
        })
        .eq('id', jobRun.id);

      if (updateError) {
        console.error('Failed to update failed job run:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: executionError instanceof Error ? executionError.message : 'Job execution failed',
          jobRunId: jobRun.id,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

  } catch (error) {
    console.error('Error in job execution:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

async function executeApiQuery(query: any): Promise<any> {
  try {
    const response = await fetch(query.endpoint, {
      method: query.method || 'GET',
      headers: query.headers || {},
      body: query.body ? JSON.stringify(query.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    console.error('API query execution failed:', error);
    throw error;
  }
}

async function processResults(result: any, outputFormat: string): Promise<{ data: any[]; format: string }> {
  if (!result.success || !result.data) {
    return { data: [], format: outputFormat };
  }

  // Handle different response structures
  let data: any[] = [];
  
  if (Array.isArray(result.data)) {
    data = result.data;
  } else if (typeof result.data === 'object') {
    // Look for common array properties
    const arrayProps = ['data', 'items', 'results', 'records'];
    for (const prop of arrayProps) {
      if (Array.isArray(result.data[prop])) {
        data = result.data[prop];
        break;
      }
    }
    
    // If no array found, wrap the object
    if (data.length === 0) {
      data = [result.data];
    }
  }

  // Convert based on output format
  if (outputFormat === 'csv') {
    // TODO: Implement CSV conversion
    return { data, format: 'csv' };
  } else if (outputFormat === 'xlsx') {
    // TODO: Implement Excel conversion
    return { data, format: 'xlsx' };
  }

  return { data, format: 'json' };
}

async function generateDownloadUrl(data: any, format: string): Promise<string> {
  // For now, return a placeholder URL
  // In a real implementation, you'd upload to storage and return a signed URL
  const timestamp = Date.now();
  return `https://storage.example.com/downloads/job-${timestamp}.${format}`;
}

async function sendToWebhook(url: string, data: any): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        data: data.data,
        format: data.format,
        count: data.data.length,
      }),
    });

    if (!response.ok) {
      console.error(`Webhook delivery failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send webhook:', error);
    // Don't throw here - webhook failure shouldn't fail the job
  }
}

async function sendEmail(to: string, jobName: string, data: any, format: string): Promise<void> {
  try {
    // @ts-ignore - Deno env
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured - skipping email');
      return;
    }

    const resultCount = data.data?.length || 0;
    const timestamp = new Date().toISOString();
    
    // Format data preview (first 5 items)
    const preview = data.data.slice(0, 5).map((item: any, idx: number) => 
      `${idx + 1}. ${JSON.stringify(item, null, 2)}`
    ).join('\n\n');

    const emailBody = `
Job Execution Results

Job Name: ${jobName}
Completed: ${timestamp}
Results Count: ${resultCount}
Format: ${format}

--- Data Preview ---
${preview}
${resultCount > 5 ? `\n... and ${resultCount - 5} more items` : ''}

--- Full Data ---
See attached data or access via your dashboard.
    `.trim();

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChillSpace Jobs <jobs@chillspace.app>',
        to: [to],
        subject: `Job Results: ${jobName} (${resultCount} results)`,
        text: emailBody,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0284c7;">Job Execution Results</h2>
            <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Job Name:</strong> ${jobName}</p>
              <p><strong>Completed:</strong> ${timestamp}</p>
              <p><strong>Results Count:</strong> ${resultCount}</p>
              <p><strong>Format:</strong> ${format}</p>
            </div>
            <h3>Data Preview</h3>
            <pre style="background: #f9fafb; padding: 12px; border-radius: 4px; overflow-x: auto;">${preview}</pre>
            ${resultCount > 5 ? `<p style="color: #6b7280;">... and ${resultCount - 5} more items</p>` : ''}
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
              Access the full data in your ChillSpace dashboard.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Email delivery failed: ${response.status}`, errorData);
    } else {
      console.log(`Email sent successfully to ${to}`);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw here - email failure shouldn't fail the job
  }
}
