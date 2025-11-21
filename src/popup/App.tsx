import { useState, useEffect } from 'react';
import { Database, Search, Calendar, Settings, LogIn } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import QueryInput from './components/QueryInput';
import ApiPreview from './components/ApiPreview';
import JobScheduler from './components/JobScheduler';
import ResponseViewer from './components/ResponseViewer';
import AuthModal from '../components/auth/AuthModal';
import UserMenu from '../components/auth/UserMenu';
import CreateJobForm from './components/CreateJobForm';
import ApiKeysManager from './components/ApiKeysManager';
import { DataSyncService } from '../lib/dataSync';
import type { ApiSchema, GeneratedApiCall } from '../types';

type Tab = 'query' | 'jobs' | 'schemas' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('query');
  const [schemas, setSchemas] = useState<ApiSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [generatedQuery, setGeneratedQuery] = useState<GeneratedApiCall | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [jobQuery, setJobQuery] = useState<GeneratedApiCall | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const dataSync = DataSyncService.getInstance();

  useEffect(() => {
    // Load schemas from Supabase or local storage
    const loadSchemas = async () => {
      try {
        const schemas = await dataSync.loadSchemas(user?.id);
        setSchemas(schemas);
        if (schemas.length > 0 && !selectedSchema) {
          setSelectedSchema(schemas[0].id);
        }
      } catch (error) {
        console.error('Error loading schemas:', error);
      }
    };

    loadSchemas();
  }, [user?.id]);

  // Sync local data when user signs in
  useEffect(() => {
    if (user && !authLoading) {
      dataSync.syncLocalToSupabase(user.id);
    }
  }, [user, authLoading]);

  const handleSignIn = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
  };

  const handleCreateJob = (query: GeneratedApiCall) => {
    if (!user) {
      // Show sign in modal if not authenticated
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    
    setJobQuery(query);
    setShowCreateJob(true);
    setActiveTab('jobs');
  };

  const handleJobCreated = () => {
    setShowCreateJob(false);
    setJobQuery(null);
    // Refresh the jobs tab
    setActiveTab('jobs');
  };

  const handleJobCancelled = () => {
    setShowCreateJob(false);
    setJobQuery(null);
  };

  const handleParseCurrentPage = async () => {
    setLoading(true);
    const toastId = toast.loading('Parsing API documentation...');
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'PARSE_CURRENT_PAGE' 
      });
      
      if (response.success) {
        const schema = response.data.schema;
        
        // Save schema using data sync service
        await dataSync.saveSchema(schema, user?.id);
        
        // Update local state
        const newSchemas = [...schemas, schema];
        setSchemas(newSchemas);
        setSelectedSchema(schema.id);
        
        toast.success(`Successfully parsed ${schema.title}`, {
          id: toastId,
          description: `Found ${schema.endpoints.length} endpoints`,
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

  const handleQueryGenerated = (query: GeneratedApiCall, naturalLanguageQuery?: string) => {
    setGeneratedQuery(query);
    setResponse(null);
    // Store the natural language query for later saving
    if (naturalLanguageQuery) {
      (query as any).naturalLanguageQuery = naturalLanguageQuery;
    }
  };

  const handleExecuteQuery = async (query: GeneratedApiCall, naturalLanguageQuery?: string) => {
    setLoading(true);
    setResponse(null);
    const toastId = toast.loading('Executing API request...');
    
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'EXECUTE_QUERY',
        payload: { query }
      });
      setResponse(result);
      
      // Save query to history if provided
      if (naturalLanguageQuery && query) {
        await dataSync.saveQuery(naturalLanguageQuery, query, result, user?.id);
      }
      
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

  if (authLoading) {
    return (
      <div className="w-[600px] h-[700px] bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[600px] h-[700px] bg-white text-gray-900 flex flex-col">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ChillSpace API</h1>
            <p className="text-xs text-gray-600 mt-1">
              Convert natural language to API queries
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === 'query' && (
          <div className="p-4 space-y-4">
            {schemas.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  No API schemas loaded yet
                </p>
                <button
                  onClick={handleParseCurrentPage}
                  disabled={loading}
                  className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? 'Parsing...' : 'Parse Current Page'}
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    API Schema
                  </label>
                  <select
                    value={selectedSchema || ''}
                    onChange={(e) => setSelectedSchema(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
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
                    onExecute={(query) => handleExecuteQuery(query, (generatedQuery as any).naturalLanguageQuery)}
                    onCreateJob={handleCreateJob}
                    loading={loading}
                  />
                )}

                {response && <ResponseViewer response={response} />}
              </>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            {showCreateJob && jobQuery ? (
              <CreateJobForm
                initialQuery={jobQuery}
                onCancel={handleJobCancelled}
                onSuccess={handleJobCreated}
              />
            ) : (
              <JobScheduler />
            )}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            
            {!user && (
              <div className="p-4 bg-primary-50 rounded-md border border-primary-200">
                <h3 className="text-sm font-medium text-primary-900 mb-2">Authentication Required</h3>
                <p className="text-xs text-primary-700 mb-3">
                  Sign in to sync your schemas and queries across devices
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSignIn}
                    className="flex-1 px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded-md transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignUp}
                    className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-md transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
            
            {user && (
              <div className="p-4 bg-green-50 rounded-md border border-green-200">
                <h3 className="text-sm font-medium text-green-800 mb-1">Signed In</h3>
                <p className="text-xs text-green-600">
                  {user.email}
                </p>
              </div>
            )}
            
            {/* API Keys Section */}
            <ApiKeysManager />
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Theme
              </label>
              <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Auto-parse API documentation
              </label>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                <span className="text-sm text-gray-600">
                  Automatically detect and parse API docs on page load
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Request timeout (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                defaultValue="30"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Maximum stored schemas
              </label>
              <input
                type="number"
                min="1"
                max="100"
                defaultValue="50"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              />
            </div>

            <div className="pt-4 space-y-2">
              <button className="w-full px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-md transition-colors">
                Save Settings
              </button>
              
              <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors">
                Clear All Data
              </button>
            </div>

            {/* <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-2">About</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>API Documentation Query Builder v1.0.0</p>
                <p>Convert natural language to API calls</p>
                <p className="pt-2">
                  Configuration is handled through environment variables during development.
                </p>
              </div>
            </div> */}
          </div>
        )}
      </div>
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={handleAuthModalClose} 
        initialMode={authMode}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
