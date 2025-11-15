import type { MessageType, MessageResponse, Job, GeneratedApiCall, AuthConfig } from '../types';

console.log('Background service worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('API Doc Query Builder installed');
  
  // Initialize storage
  chrome.storage.local.get(['schemas', 'auth', 'queries', 'settings'], (result) => {
    if (!result.schemas) {
      chrome.storage.local.set({
        schemas: [],
        auth: {},
        queries: [],
        settings: {
          theme: 'light'
        }
      });
    }
  });
});

// Message handler
chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message: MessageType): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case 'PARSE_PAGE':
        return await handleParsePage(message.payload.url);
      
      case 'PARSE_CURRENT_PAGE':
        return await handleParseCurrentPage();
      
      case 'EXECUTE_QUERY':
        return await handleExecuteQuery(message.payload.query, message.payload.auth);
      
      case 'SCHEDULE_JOB':
        return await handleScheduleJob(message.payload);
      
      case 'CANCEL_JOB':
        return await handleCancelJob(message.payload.jobId);
      
      case 'CONVERT_NL_QUERY':
        return await handleConvertNLQuery(message.payload.text, message.payload.schemaId);
      
      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('Background script error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function handleParsePage(_url: string): Promise<MessageResponse> {
  // This will be called from content script
  // For now, return a placeholder
  return { success: true, data: { message: 'Parser will be implemented in Phase 3' } };
}

async function handleParseCurrentPage(): Promise<MessageResponse> {
  try {
    console.log('Handling PARSE_CURRENT_PAGE request');
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      console.error('No active tab found');
      return { success: false, error: 'No active tab found' };
    }

    console.log('Sending message to content script in tab:', tab.id);

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'PARSE_CURRENT_PAGE' 
    });

    console.log('Received response from content script:', response);
    return response;
  } catch (error) {
    console.error('Error parsing current page:', error);
    
    // Check if it's a content script injection error
    if (error instanceof Error && error.message.includes('Receiving end does not exist')) {
      return { 
        success: false, 
        error: 'Content script not loaded. Please refresh the page and try again.' 
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse current page'
    };
  }
}

async function handleExecuteQuery(query: GeneratedApiCall, auth?: AuthConfig): Promise<MessageResponse> {
  try {
    const headers: HeadersInit = { ...query.headers };
    
    // Add authentication
    if (auth) {
      if (auth.method.type === 'apiKey') {
        const { name, in: location } = auth.method;
        if (location === 'header' && auth.credentials.apiKey) {
          headers[name] = auth.credentials.apiKey;
        }
      } else if (auth.method.type === 'bearer' && auth.credentials.token) {
        headers['Authorization'] = `Bearer ${auth.credentials.token}`;
      } else if (auth.method.type === 'basic' && auth.credentials.username && auth.credentials.password) {
        const encoded = btoa(`${auth.credentials.username}:${auth.credentials.password}`);
        headers['Authorization'] = `Basic ${encoded}`;
      }
    }

    // Build URL with query params
    let url = query.endpoint;
    if (query.queryParams) {
      const params = new URLSearchParams(query.queryParams);
      url += `?${params.toString()}`;
    }

    // Execute request
    const response = await fetch(url, {
      method: query.method,
      headers,
      body: query.body ? JSON.stringify(query.body) : undefined,
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      success: response.ok,
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: data,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed'
    };
  }
}

async function handleScheduleJob(job: Job): Promise<MessageResponse> {
  try {
    // Create alarm for the job
    const alarmName = `job-${job.id}`;
    
    let periodInMinutes: number | undefined;
    if (job.schedule.type === 'hourly') {
      periodInMinutes = 60;
    } else if (job.schedule.type === 'daily') {
      periodInMinutes = 60 * 24;
    } else if (job.schedule.type === 'weekly') {
      periodInMinutes = 60 * 24 * 7;
    }

    if (periodInMinutes) {
      await chrome.alarms.create(alarmName, {
        periodInMinutes,
        when: Date.now() + 1000, // Start in 1 second
      });
    }

    // Store job in local storage
    const result = await chrome.storage.local.get('jobs');
    const jobs = result.jobs || [];
    jobs.push(job);
    await chrome.storage.local.set({ jobs });

    return { success: true, data: { jobId: job.id, alarmName } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule job'
    };
  }
}

async function handleCancelJob(jobId: string): Promise<MessageResponse> {
  try {
    const alarmName = `job-${jobId}`;
    await chrome.alarms.clear(alarmName);

    // Remove job from storage
    const result = await chrome.storage.local.get('jobs');
    const jobs = (result.jobs || []).filter((j: Job) => j.id !== jobId);
    await chrome.storage.local.set({ jobs });

    return { success: true, data: { jobId } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel job'
    };
  }
}

async function handleConvertNLQuery(_text: string, _schemaId: string): Promise<MessageResponse> {
  // This is now handled directly in the popup through the NLP library
  // The background script is no longer needed for NL conversion
  return { 
    success: false, 
    error: 'NL conversion is now handled in the popup. Please update your client code.' 
  };
}

// Alarm listener for scheduled jobs
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('job-')) {
    const jobId = alarm.name.replace('job-', '');
    await executeScheduledJob(jobId);
  }
});

async function executeScheduledJob(jobId: string) {
  try {
    console.log(`Executing scheduled job: ${jobId}`);
    
    // Get job from storage
    const result = await chrome.storage.local.get('jobs');
    const jobs: Job[] = result.jobs || [];
    const job = jobs.find(j => j.id === jobId);
    
    if (!job || !job.enabled) {
      console.log('Job not found or disabled');
      return;
    }

    // Get auth config
    const authResult = await chrome.storage.local.get('auth');
    const auth = authResult.auth?.[job.id];

    // Execute query
    const response = await handleExecuteQuery(job.query, auth);
    
    console.log('Job execution result:', response);
    
    // TODO: Save results based on job.destination in Phase 7
  } catch (error) {
    console.error('Error executing scheduled job:', error);
  }
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('Service worker started');
});
