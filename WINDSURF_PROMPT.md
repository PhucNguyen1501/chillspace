# 🚀 WINDSURF PROMPT - ChillSpace Web App Builder

## 📋 **PROJECT OVERVIEW**
Build a complete, production-ready web application for ChillSpace - a Chrome extension that enables non-technical users to extract API data using natural language. This is a full-stack SaaS application with the same design system, database, and tech stack as the current landing page, but expanded into a complete web application.

---

## 🎯 **CORE MISSION**
Create a modern, responsive web application that serves as both a marketing landing page AND a functional web companion for the ChillSpace Chrome extension. The app should handle user authentication, API management, data extraction workflows, scheduling, and analytics.

---

## 🛠️ **TECH STACK - EXACT SPECIFICATIONS**

### **Frontend Framework**
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "typescript": "~5.9.3",
  "@types/react": "^19.2.2",
  "@types/react-dom": "^19.2.2"
}
```

### **Build Tools & Development**
```json
{
  "vite": "^7.2.2",
  "@vitejs/plugin-react": "^5.1.0",
  "eslint": "^9.39.1",
  "eslint-plugin-react-hooks": "^7.0.1",
  "eslint-plugin-react-refresh": "^0.4.24"
}
```

### **Styling & UI Framework**
```json
{
  "tailwindcss": "^3.4.18",
  "autoprefixer": "^10.4.22",
  "postcss": "^8.5.6",
  "lucide-react": "^0.553.0",
  "motion": "^12.23.24"
}
```

### **Backend & Database**
```json
{
  "@supabase/supabase-js": "^2.81.1",
  "@supabase/auth-helpers-react": "^0.5.0",
  "@supabase/auth-helpers-nextjs": "^0.10.0"
}
```

### **Analytics & Monitoring**
```json
{
  "@vercel/analytics": "^1.5.0"
}
```

---

## 🎨 **DESIGN SYSTEM - EXACT IMPLEMENTATION**

### **Color Palette - Tailwind Config**
```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],
        'sm': ['1rem', { lineHeight: '1.5rem' }],
        'base': ['1.125rem', { lineHeight: '1.75rem' }],
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],
        'xl': ['1.375rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.75rem', { lineHeight: '2rem' }],
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '4xl': ['2.75rem', { lineHeight: '1.1' }],
        '5xl': ['3.25rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      }
    }
  }
}
```

### **CSS Architecture**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased;
    font-family: "Inter", "Inter fallback", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
}

@layer components {
  .gradient-text {
    @apply text-gray-900 font-bold;
  }
  
  .animate-dot-bounce {
    animation: bounce 2s infinite;
  }
  
  .animate-dot-ping {
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
}
```

---

## 🗄️ **DATABASE SCHEMA - COMPREHENSIVE**

### **Existing Tables (Keep & Enhance)**
```sql
-- Email captures from landing page
CREATE TABLE email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('hero', 'cta', 'signup')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_captures_email_unique UNIQUE (email)
);

-- Enhanced user profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API connections and endpoints
CREATE TABLE api_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('none', 'bearer', 'basic', 'api_key', 'oauth2')),
  auth_headers JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API endpoints extracted from documentation
CREATE TABLE api_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES api_connections(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  path TEXT NOT NULL,
  description TEXT,
  parameters JSONB,
  response_schema JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved queries and templates
CREATE TABLE saved_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES api_connections(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  natural_language_query TEXT NOT NULL,
  generated_request JSONB NOT NULL,
  parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled data extraction jobs
CREATE TABLE scheduled_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query_id UUID REFERENCES saved_queries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once', 'hourly', 'daily', 'weekly', 'monthly', 'custom')),
  schedule_config JSONB,
  export_format TEXT NOT NULL CHECK (export_format IN ('json', 'csv', 'xlsx')),
  export_destination JSONB,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Execution history and results
CREATE TABLE execution_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query_id UUID REFERENCES saved_queries(id) ON DELETE SET NULL,
  job_id UUID REFERENCES scheduled_jobs(id) ON DELETE SET NULL,
  request_url TEXT NOT NULL,
  request_method TEXT NOT NULL,
  request_headers JSONB,
  request_body TEXT,
  response_status INTEGER,
  response_headers JSONB,
  response_body TEXT,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage analytics
CREATE TABLE usage_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team management (for future features)
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Row Level Security Policies**
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own API connections" ON api_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own API connections" ON api_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own API connections" ON api_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own API connections" ON api_connections FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for all other tables...
```

---

## 📱 **APPLICATION ARCHITECTURE**

### **Core Pages & Routes**
```
/                     # Landing page (existing)
/dashboard            # Main dashboard
/connections          # API connections management
/connections/new      # Add new API connection
/connections/:id      # Connection details
/queries              # Saved queries
/queries/new          # Create new query
/queries/:id          # Query editor
/jobs                 # Scheduled jobs
/jobs/new             # Create scheduled job
/jobs/:id             # Job details
/history              # Execution history
/analytics            # Usage analytics
/settings             # User settings
/profile              # Profile management
/team                 # Team management (future)
/billing              # Billing & plans (future)
```

### **Component Structure**
```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── UseCases.tsx
│   │   ├── Pricing.tsx
│   │   └── CTA.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── QuickActions.tsx
│   │   ├── RecentActivity.tsx
│   │   └── StatsCards.tsx
│   ├── connections/
│   │   ├── ConnectionList.tsx
│   │   ├── ConnectionCard.tsx
│   │   ├── ConnectionForm.tsx
│   │   └── EndpointList.tsx
│   ├── queries/
│   │   ├── QueryList.tsx
│   │   ├── QueryEditor.tsx
│   │   ├── QueryCard.tsx
│   │   └── NLPInput.tsx
│   ├── jobs/
│   │   ├── JobList.tsx
│   │   ├── JobForm.tsx
│   │   ├── JobCard.tsx
│   │   └── SchedulePicker.tsx
│   ├── history/
│   │   ├── ExecutionList.tsx
│   │   ├── ExecutionCard.tsx
│   │   └── ResponseViewer.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── PasswordReset.tsx
│   │   └── AuthGuard.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Dropdown.tsx
│       ├── Table.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Spinner.tsx
│       └── Toast.tsx
├── pages/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── api.ts
│   ├── nlp.ts
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useConnections.ts
│   ├── useQueries.ts
│   └── useJobs.ts
└── types/
    ├── auth.ts
    ├── api.ts
    ├── query.ts
    └── job.ts
```

---

## 🔧 **CORE FEATURES - DETAILED SPECIFICATIONS**

### **1. Authentication & User Management**
- Email/password authentication with Supabase Auth
- Social login options (Google, GitHub)
- Password reset functionality
- Email verification
- User profile management
- Session management with auto-refresh

### **2. API Connection Management**
- Add/edit/delete API connections
- Support for multiple auth types (Bearer, Basic, API Key, OAuth2)
- Test connection functionality
- Automatic endpoint discovery from OpenAPI/Swagger specs
- Connection health monitoring
- Usage tracking per connection

### **3. Natural Language Query Builder**
- AI-powered natural language to API call conversion
- Interactive query editor with syntax highlighting
- Parameter suggestions and validation
- Request preview and editing
- Query templates and examples
- Save and organize queries

### **4. API Execution & Response Handling**
- One-click API execution
- Real-time response viewing
- JSON/XML/CSV response formatting
- Error handling and retry logic
- Response caching
- Export functionality

### **5. Data Scheduling & Automation**
- Create scheduled data extraction jobs
- Flexible scheduling options (cron-based)
- Multiple export formats (JSON, CSV, XLSX)
- Export destinations (email, webhook, cloud storage)
- Job monitoring and alerts
- Execution history and logs

### **6. Analytics & Reporting**
- Usage dashboards and statistics
- API call volume and success rates
- Cost tracking and optimization
- Team usage analytics
- Custom reports and exports
- Performance metrics

### **7. Team Collaboration (Future)**
- Team member management
- Role-based permissions
- Shared connections and queries
- Collaboration workflows
- Audit logs

---

## 🎯 **KEY COMPONENTS - DETAILED IMPLEMENTATION**

### **Dashboard Component**
```tsx
interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="API Connections" 
          value={connections.length} 
          icon={Zap}
          color="blue"
        />
        <StatsCard 
          title="Saved Queries" 
          value={queries.length} 
          icon={FileText}
          color="green"
        />
        <StatsCard 
          title="Active Jobs" 
          value={activeJobs.length} 
          icon={Calendar}
          color="orange"
        />
        <StatsCard 
          title="API Calls This Month" 
          value={apiCallsCount} 
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};
```

### **Connection Management Component**
```tsx
interface ConnectionFormProps {
  connection?: ApiConnection;
  onSave: (connection: ApiConnection) => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ connection, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    authType: 'none' as AuthType,
    authHeaders: {},
    description: ''
  });

  return (
    <form className="space-y-6">
      <Input
        label="Connection Name"
        value={formData.name}
        onChange={(value) => setFormData({...formData, name: value})}
        required
      />
      
      <Input
        label="Base URL"
        value={formData.baseUrl}
        onChange={(value) => setFormData({...formData, baseUrl: value})}
        placeholder="https://api.example.com"
        required
      />

      <AuthTypeSelector
        value={formData.authType}
        onChange={(authType) => setFormData({...formData, authType})}
      />

      <AuthConfigForm
        authType={formData.authType}
        config={formData.authHeaders}
        onChange={(authHeaders) => setFormData({...formData, authHeaders})}
      />

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(value) => setFormData({...formData, description: value})}
        rows={3}
      />

      <div className="flex gap-4">
        <Button onClick={() => testConnection(formData)}>
          Test Connection
        </Button>
        <Button onClick={() => onSave(formData)} variant="primary">
          Save Connection
        </Button>
      </div>
    </form>
  );
};
```

### **Query Editor Component**
```tsx
interface QueryEditorProps {
  connection: ApiConnection;
  endpoint?: ApiEndpoint;
  onSave: (query: SavedQuery) => void;
}

const QueryEditor: React.FC<QueryEditorProps> = ({ connection, endpoint, onSave }) => {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [generatedRequest, setGeneratedRequest] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuery = async () => {
    setIsGenerating(true);
    try {
      const request = await nlpService.generateApiCall({
        query: naturalLanguage,
        endpoint,
        connection
      });
      setGeneratedRequest(request);
    } catch (error) {
      console.error('Failed to generate query:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Natural Language Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Describe What You Need</h3>
        <Textarea
          value={naturalLanguage}
          onChange={setNaturalLanguage}
          placeholder="Get all users with status active"
          rows={6}
        />
        <Button 
          onClick={generateQuery}
          disabled={!naturalLanguage || isGenerating}
          className="w-full"
        >
          {isGenerating ? <Spinner /> : <Brain />}
          Generate API Call
        </Button>
      </div>

      {/* Generated Request */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Generated API Call</h3>
        {generatedRequest ? (
          <RequestEditor
            request={generatedRequest}
            onChange={setGeneratedRequest}
          />
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
            Your generated API call will appear here
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🔄 **STATE MANAGEMENT & DATA FLOW**

### **Global State with React Context**
```tsx
// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// API Context
interface ApiContextType {
  connections: ApiConnection[];
  queries: SavedQuery[];
  jobs: ScheduledJob[];
  history: ExecutionHistory[];
  loading: boolean;
  refresh: () => Promise<void>;
}

// UI Context
interface UiContextType {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Notification) => void;
}
```

### **Custom Hooks**
```tsx
// useAuth hook
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// useConnections hook
const useConnections = () => {
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const { data } = await supabase
      .from('api_connections')
      .select('*')
      .order('created_at', { ascending: false });
    
    setConnections(data || []);
    setLoading(false);
  };

  return { connections, loading, refresh: loadConnections };
};
```

---

## 📊 **ANALYTICS & MONITORING**

### **Vercel Analytics Integration**
```tsx
// Track key user actions
import { track } from '@vercel/analytics';

// Connection created
track('connection_created', {
  auth_type: connection.authType,
  has_endpoints: connection.endpoints.length > 0
});

// Query executed
track('query_executed', {
  success: response.success,
  response_time: response.executionTime,
  connection_id: connection.id
});

// Job scheduled
track('job_scheduled', {
  schedule_type: job.scheduleType,
  export_format: job.exportFormat
});
```

### **Custom Analytics Dashboard**
```tsx
const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalConnections: 0,
    totalQueries: 0,
    totalJobs: 0,
    apiCallsThisMonth: 0,
    successRate: 0,
    averageResponseTime: 0
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="API Success Rate"
          value={`${stats.successRate}%`}
          change="+2.3%"
          icon={CheckCircle}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${stats.averageResponseTime}ms`}
          change="-45ms"
          icon={Zap}
        />
        <MetricCard
          title="API Calls This Month"
          value={stats.apiCallsThisMonth}
          change="+124"
          icon={BarChart3}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApiCallsChart />
        <ConnectionsChart />
      </div>
    </div>
  );
};
```

---

## 🔐 **SECURITY IMPLEMENTATION**

### **Authentication Security**
```tsx
// Secure auth configuration
const authConfig = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true
};

// Protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};
```

### **API Security**
```tsx
// Secure API calls with rate limiting
const secureApiCall = async (url: string, options: RequestOptions) => {
  // Add authentication headers
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${await getAuthToken()}`,
    'X-Request-ID': generateRequestId()
  };

  // Rate limiting check
  await checkRateLimit(user.id);

  // Make request with timeout
  const response = await fetch(url, {
    ...options,
    headers,
    signal: AbortSignal.timeout(30000)
  });

  // Log request for analytics
  logApiCall({
    url,
    method: options.method,
    status: response.status,
    userId: user.id
  });

  return response;
};
```

---

## 🚀 **PERFORMANCE OPTIMIZATION**

### **Code Splitting & Lazy Loading**
```tsx
// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Connections = lazy(() => import('./pages/Connections'));
const Queries = lazy(() => import('./pages/Queries'));

// Component lazy loading
const QueryEditor = lazy(() => import('./components/queries/QueryEditor'));

// Preload critical components
const preloadComponent = (componentName: string) => {
  import(`./components/${componentName}`);
};
```

### **Caching Strategy**
```tsx
// React Query for data caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

// API response caching
const cachedApiCall = async (key: string, apiCall: () => Promise<any>) => {
  return queryClient.fetchQuery(key, apiCall);
};
```

---

## 📱 **MOBILE-FIRST RESPONSIVE DESIGN**

### **Responsive Breakpoints**
```css
/* Mobile-first approach */
.component {
  /* Mobile styles (320px+) */
  @apply px-4 py-6 text-base;
}

@screen sm {
  /* Small mobile (640px+) */
  .component {
    @apply px-6 py-8 text-lg;
  }
}

@screen md {
  /* Tablet (768px+) */
  .component {
    @apply px-8 py-10 text-xl;
  }
}

@screen lg {
  /* Desktop (1024px+) */
  .component {
    @apply px-12 py-12;
  }
}
```

### **Mobile Navigation**
```tsx
const MobileNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
            <MobileMenuItems onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests with Jest**
```tsx
// Component testing
describe('QueryEditor', () => {
  it('should generate API call from natural language', async () => {
    const mockGenerate = jest.fn().mockResolvedValue(mockApiCall);
    
    render(<QueryEditor connection={mockConnection} />);
    
    fireEvent.change(screen.getByLabelText('Describe What You Need'), {
      target: { value: 'Get all users' }
    });
    
    fireEvent.click(screen.getByText('Generate API Call'));
    
    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith({
        query: 'Get all users',
        endpoint: undefined,
        connection: mockConnection
      });
    });
  });
});

// Hook testing
describe('useConnections', () => {
  it('should load connections on mount', async () => {
    const mockConnections = [mockConnection];
    
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: mockConnections })
      })
    });

    const { result } = renderHook(() => useConnections());
    
    await waitFor(() => {
      expect(result.current.connections).toEqual(mockConnections);
    });
  });
});
```

### **Integration Tests**
```tsx
// End-to-end workflow testing
describe('API Connection Workflow', () => {
  it('should create connection and execute query', async () => {
    // Login
    await login('test@example.com', 'password');
    
    // Navigate to connections
    navigate('/connections/new');
    
    // Fill connection form
    await fillForm({
      name: 'Test API',
      baseUrl: 'https://api.test.com',
      authType: 'bearer',
      token: 'test-token'
    });
    
    // Save connection
    await click('Save Connection');
    
    // Verify connection saved
    expect(screen.getByText('Test API')).toBeInTheDocument();
    
    // Create query
    navigate('/queries/new');
    await fillForm({
      naturalLanguage: 'Get all users',
      connection: 'Test API'
    });
    
    // Execute query
    await click('Execute Query');
    
    // Verify results
    expect(screen.getByText('Query executed successfully')).toBeInTheDocument();
  });
});
```

---

## 📦 **DEPLOYMENT CONFIGURATION**

### **Vercel Configuration**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  }
}
```

### **Environment Variables**
```env
# Public
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-app.vercel.app

# Private (server-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-key
```

---

## 🎯 **SUCCESS METRICS & KPIs**

### **Technical Metrics**
- Bundle size: < 500KB (gzipped)
- First Contentful Paint: < 2s on 3G
- Lighthouse score: 95+ across all categories
- API response time: < 500ms average
- Uptime: 99.9%

### **User Experience Metrics**
- User registration conversion: > 15%
- API connection success rate: > 95%
- Query execution success rate: > 90%
- User retention (7-day): > 40%
- Feature adoption: > 60% for core features

### **Business Metrics**
- Monthly active users: Target 1000+
- API calls per user: Target 50+/month
- Paid conversion rate: Target 10%
- Customer satisfaction: Target 4.5/5
- Support ticket reduction: Target 50%

---

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1: Core Foundation (Weeks 1-2)**
- [ ] Set up project structure and build pipeline
- [ ] Implement authentication system
- [ ] Create basic layout and navigation
- [ ] Build landing page components
- [ ] Set up database schema and RLS policies

### **Phase 2: API Management (Weeks 3-4)**
- [ ] Build connection management system
- [ ] Implement endpoint discovery
- [ ] Create query editor interface
- [ ] Add natural language processing integration
- [ ] Build request/response handling

### **Phase 3: Automation & Scheduling (Weeks 5-6)**
- [ ] Implement job scheduling system
- [ ] Add export functionality
- [ ] Build execution history tracking
- [ ] Create analytics dashboard
- [ ] Add notification system

### **Phase 4: Polish & Optimization (Weeks 7-8)**
- [ ] Implement comprehensive testing
- [ ] Performance optimization
- [ ] Security audit and hardening
- [ ] Documentation and deployment
- [ ] Beta testing and feedback integration

---

**Build this complete, production-ready web application for ChillSpace with all specified features, maintaining the same professional design system and technical excellence as the current landing page, but expanded into a full-featured SaaS platform.**
