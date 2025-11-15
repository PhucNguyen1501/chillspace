import { useState, useEffect } from 'react';
import { Database, Search, Calendar, Settings } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import QueryInput from './components/QueryInput';
import ApiPreview from './components/ApiPreview';
import JobScheduler from './components/JobScheduler';
import ResponseViewer from './components/ResponseViewer';
import type { ApiSchema, GeneratedApiCall } from '../types';

type Tab = 'query' | 'jobs' | 'schemas' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('query');
  const [schemas, setSchemas] = useState<ApiSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [generatedQuery, setGeneratedQuery] = useState<GeneratedApiCall | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load schemas from storage
    chrome.storage.local.get(['schemas'], (result) => {
      if (result.schemas) {
        setSchemas(result.schemas);
        if (result.schemas.length > 0 && !selectedSchema) {
          setSelectedSchema(result.schemas[0].id);
        }
      }
    });
  }, []);

  const handleParseCurrentPage = async () => {
    setLoading(true);
    const toastId = toast.loading('Parsing API documentation...');
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'PARSE_CURRENT_PAGE' 
      });
      
      if (response.success) {
        const newSchemas = [...schemas, response.data.schema];
        setSchemas(newSchemas);
        setSelectedSchema(response.data.schema.id);
        await chrome.storage.local.set({ schemas: newSchemas });
        
        toast.success(`Successfully parsed ${response.data.schema.title}`, {
          id: toastId,
          description: `Found ${response.data.schema.endpoints.length} endpoints`,
        });
      } else {
        toast.error('No API documentation found', {
          id: toastId,
          description: response.error || 'This page does not appear to contain parseable API documentation',
        });
      }
    } catch (error) {
      toast.error('Failed to parse page', {
        id: toastId,
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQueryGenerated = (query: GeneratedApiCall) => {
    setGeneratedQuery(query);
    setResponse(null);
  };

  const handleExecuteQuery = async (query: GeneratedApiCall) => {
    setLoading(true);
    setResponse(null);
    const toastId = toast.loading('Executing API request...');
    
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'EXECUTE_QUERY',
        payload: { query }
      });
      setResponse(result);
      
      if (result.success) {
        toast.success('Request successful', {
          id: toastId,
          description: `Status: ${result.data?.status || 'OK'}`,
        });
      } else {
        toast.error('Request failed', {
          id: toastId,
          description: result.error || 'An error occurred',
        });
      }
    } catch (error) {
      const errorResult = { success: false, error: 'Failed to execute query' };
      setResponse(errorResult);
      toast.error('Request failed', {
        id: toastId,
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'query' as Tab, label: 'Query', icon: Search },
    { id: 'jobs' as Tab, label: 'Jobs', icon: Calendar },
    { id: 'schemas' as Tab, label: 'Schemas', icon: Database },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-[600px] h-[700px] bg-background text-foreground flex flex-col">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">API Doc Query Builder</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Convert natural language to API queries
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'query' && (
          <div className="p-4 space-y-4">
            {schemas.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No API schemas loaded yet
                </p>
                <button
                  onClick={handleParseCurrentPage}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Parsing...' : 'Parse Current Page'}
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Schema
                  </label>
                  <select
                    value={selectedSchema || ''}
                    onChange={(e) => setSelectedSchema(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  >
                    {schemas.map((schema) => (
                      <option key={schema.id} value={schema.id}>
                        {schema.title} ({schema.url})
                      </option>
                    ))}
                  </select>
                </div>

                <QueryInput
                  schema={schemas.find(s => s.id === selectedSchema) || null}
                  onQueryGenerated={handleQueryGenerated}
                  loading={loading}
                  setLoading={setLoading}
                />

                {generatedQuery && (
                  <ApiPreview
                    query={generatedQuery}
                    onExecute={handleExecuteQuery}
                    loading={loading}
                  />
                )}

                {response && <ResponseViewer response={response} />}
              </>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="p-4">
            <JobScheduler />
          </div>
        )}

        {activeTab === 'schemas' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold">API Schemas</h2>
              <button
                onClick={handleParseCurrentPage}
                disabled={loading}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Parsing...' : 'Parse Page'}
              </button>
            </div>

            {schemas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No schemas loaded yet
              </p>
            ) : (
              <div className="space-y-2">
                {schemas.map((schema) => (
                  <div
                    key={schema.id}
                    className="p-3 border border-border rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-sm">{schema.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {schema.url}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {schema.endpoints.length} endpoints
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            <h2 className="text-sm font-semibold mb-4">Settings</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Theme
              </label>
              <select className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Auto-parse API documentation
              </label>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-muted-foreground">
                  Automatically detect and parse API docs on page load
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Request timeout (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                defaultValue="30"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum stored schemas
              </label>
              <input
                type="number"
                min="1"
                max="100"
                defaultValue="50"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              />
            </div>

            <div className="pt-4 space-y-2">
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
                Save Settings
              </button>
              
              <button className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90">
                Clear All Data
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-2">About</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>API Documentation Query Builder v1.0.0</p>
                <p>Convert natural language to API calls</p>
                <p className="pt-2">
                  Configuration is handled through environment variables during development.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
