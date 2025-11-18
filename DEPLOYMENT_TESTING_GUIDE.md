# 🚀 Deployment & Testing Guide

## 📋 **Prerequisites**
- Chrome browser installed
- Supabase project created
- Node.js and npm installed
- Claude API key (for NL-to-API)

---

## 🛠️ **Step 1: Environment Setup**

### **1.1 Configure Environment Variables**
```bash
# In the project root
cp .env.example .env

# Edit .env with your credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### **1.2 Install Dependencies**
```bash
npm install
```

---

## 🗄️ **Step 2: Database Setup**

### **2.1 Run Database Schema**
```sql
-- In Supabase SQL Editor, run:

-- Create tables for schemas
CREATE TABLE IF NOT EXISTS api_schemas (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT,
  base_url TEXT,
  schema_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables for jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query JSONB NOT NULL,
  schedule JSONB NOT NULL,
  output_format TEXT NOT NULL,
  destination JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables for job runs
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  result_count INTEGER,
  output_url TEXT
);

-- Create tables for extracted data
CREATE TABLE IF NOT EXISTS extracted_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_run_id UUID REFERENCES job_runs(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables for queries
CREATE TABLE IF NOT EXISTS queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  natural_language TEXT NOT NULL,
  generated_query JSONB NOT NULL,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE api_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own api_schemas" ON api_schemas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api_schemas" ON api_schemas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api_schemas" ON api_schemas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api_schemas" ON api_schemas FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own job_runs" ON job_runs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = job_runs.job_id AND jobs.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own job_runs" ON job_runs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = job_runs.job_id AND jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own extracted_data" ON extracted_data FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM job_runs WHERE job_runs.id = extracted_data.job_run_id
    AND EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_runs.job_id AND jobs.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert own extracted_data" ON extracted_data FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM job_runs WHERE job_runs.id = extracted_data.job_run_id
    AND EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_runs.job_id AND jobs.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view own queries" ON queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queries" ON queries FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## ⚡ **Step 3: Deploy Edge Functions**

### **3.1 Install Supabase CLI**
```bash
# If not already installed
npm install -g supabase
```

### **3.2 Login to Supabase**
```bash
supabase login
supabase link --project-ref your-project-ref
```

### **3.3 Set Claude API Key**
```bash
supabase secrets set CLAUDE_API_KEY=your-claude-api-key
```

### **3.4 Deploy Functions**
```bash
# Deploy NL-to-API function
supabase functions deploy nl-to-api

# Deploy job execution function
supabase functions deploy execute-job
```

---

## 🔨 **Step 4: Build Extension**

### **4.1 Build for Production**
```bash
npm run build
```

### **4.2 Verify Build**
```bash
# Check dist folder contains:
# - dist/index.html
# - dist/assets/popup.js
# - dist/assets/popup.css
# - dist/src/background/index.js
# - dist/src/content/index.js
```

---

## 📦 **Step 5: Install Extension**

### **5.1 Open Chrome Extensions**
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)

### **5.2 Load Extension**
1. Click "Load unpacked"
2. Select the `dist/` folder from your project
3. Extension should appear in the list

### **5.3 Verify Installation**
- Extension icon should appear in Chrome toolbar
- Click icon to open popup
- Should see the main interface with tabs

---

## 🧪 **Step 6: Testing Guide**

### **6.1 Authentication Testing**

#### **Test Sign Up**
1. Open extension popup
2. Click "Sign In" button
3. Click "Don't have an account? Sign Up"
4. Enter email and password (min 6 chars)
5. Click "Sign Up"
6. **Expected**: Success toast and verification email
7. Check email and verify account
8. Try signing in with verified credentials

#### **Test Sign In**
1. Open extension popup
2. Click "Sign In" button
3. Enter verified email and password
4. Click "Sign In"
5. **Expected**: Success toast and user menu appears

#### **Test Sign Out**
1. Click user avatar in header
2. Click "Sign Out" in dropdown
3. **Expected**: Success toast and sign in button returns

### **6.2 Schema Sync Testing**

#### **Test Local Storage (Unauthenticated)**
1. Don't sign in
2. Navigate to any API documentation page (e.g., petstore.swagger.io)
3. Open extension and go to "Schemas" tab
4. Click "Parse Current Page"
5. **Expected**: Schema parsed and saved locally
6. Close and reopen extension
7. **Expected**: Schema still visible

#### **Test Cloud Sync (Authenticated)**
1. Sign in to your account
2. Parse a new schema
3. **Expected**: Toast says "saved to cloud"
4. Sign out and sign back in
5. **Expected**: Schema still visible (loaded from cloud)

### **6.3 NL-to-API Testing**

#### **Test Query Generation**
1. Select a parsed schema
2. Go to "Query" tab
3. Enter natural language: "Get all users"
4. Click "Generate"
5. **Expected**: API call generated and displayed

#### **Test Query Execution**
1. With generated query visible
2. Click "Execute" button
3. **Expected**: Loading spinner, then results or error

#### **Test Job Scheduling**
1. With generated query visible
2. Click calendar icon "Schedule as job"
3. Fill job form:
   - Name: "Daily User Sync"
   - Schedule: "Every hour"
   - Output: "JSON"
   - Destination: "Download"
4. Click "Create Job"
5. **Expected**: Success toast and job appears in Jobs tab

### **6.4 Job Scheduler Testing**

#### **Test Job Management**
1. Go to "Jobs" tab
2. **Expected**: See created job with status "Active"
3. Click play button to run manually
4. **Expected**: Loading, then success toast
5. Click history button to view runs
6. **Expected**: See execution history

#### **Test Job Execution**
1. Enable a job if disabled
2. Wait for scheduled time or run manually
3. Check job history
4. **Expected**: See completed run with results

#### **Test Export**
1. In job history, click "JSON" or "CSV"
2. **Expected**: File downloads with job run data

### **6.5 Error Handling Testing**

#### **Test Network Errors**
1. Disconnect from internet
2. Try to sign in or execute query
3. **Expected**: Error toast with network message

#### **Test Validation Errors**
1. Try to create job without name
2. Try to sign up with invalid email
3. **Expected**: Validation error messages

#### **Test Edge Cases**
1. Close modal during loading
2. Switch tabs during operations
3. **Expected**: Graceful handling, no crashes

---

## 🔍 **Step 7: Debugging**

### **7.1 Check Console Logs**
1. Right-click extension popup
2. Select "Inspect"
3. Check Console tab for errors
4. Look for `[AuthContext]`, `[DataSync]`, `[JobService]` logs

### **7.2 Check Network Requests**
1. In DevTools, go to Network tab
2. Try authentication or API operations
3. Check for failed requests to Supabase

### **7.3 Check Edge Function Logs**
```bash
# View function logs
supabase functions logs nl-to-api
supabase functions logs execute-job
```

### **7.4 Common Issues**

#### **Extension Not Loading**
- Check if `dist/` folder is complete
- Verify Developer mode is enabled
- Check for manifest.json errors

#### **Authentication Not Working**
- Verify Supabase URL and keys in .env
- Check CORS settings in Supabase
- Verify email confirmation

#### **Jobs Not Executing**
- Check Edge Function deployment
- Verify Claude API key is set
- Check function logs for errors

---

## ✅ **Step 8: Success Criteria**

### **All Tests Pass If:**
- [ ] Extension loads without errors
- [ ] Authentication works (sign up/in/out)
- [ ] Schemas parse and sync correctly
- [ ] NL-to-API conversion works
- [ ] Jobs can be created and executed
- [ ] Data exports successfully
- [ ] Toast notifications appear
- [ ] Error handling works gracefully
- [ ] UI is responsive and polished

### **Performance Checks:**
- [ ] Extension loads in <2 seconds
- [ ] API calls complete in <5 seconds
- [ ] Memory usage stays reasonable
- [ ] No memory leaks on repeated use

---

## 🚨 **Troubleshooting**

### **Build Errors**
```bash
# Clear build cache
rm -rf dist node_modules/.vite
npm run build
```

### **Authentication Issues**
```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/
```

### **Edge Function Issues**
```bash
# Redeploy functions
supabase functions deploy nl-to-api --no-verify-jwt
supabase functions deploy execute-job --no-verify-jwt
```

### **Database Issues**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 🎉 **Deployment Complete!**

Once all tests pass, your Chrome extension is ready for production use! Users can:

1. **Sign up/sign in** with email authentication
2. **Parse API schemas** from documentation pages
3. **Generate API calls** from natural language
4. **Schedule recurring jobs** with various outputs
5. **Sync data across devices** with cloud storage
6. **Export results** in multiple formats

The extension provides a complete API automation workflow with professional UI/UX and robust error handling.

---

**📞 Need Help?**
- Check the complete feature guide: `COMPLETE_FEATURE_GUIDE.md`
- Review error logs in browser DevTools
- Verify Supabase configuration
- Test Edge Functions individually

**🎊 Happy Coding!**

---

*Last Updated: November 18, 2025*  
*Version: 2.0.0*  
*Status: ✅ Production Ready*
