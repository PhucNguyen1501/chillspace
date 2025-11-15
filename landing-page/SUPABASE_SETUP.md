# Supabase Email Capture Setup

This guide walks you through connecting the landing page email capture forms to Supabase for storing user emails.

## Prerequisites

- A [Supabase](https://supabase.com) account
- Node.js and npm installed

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `chillspace-emails` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJ...` (starts with `eyJ`)

## Step 3: Configure Environment Variables

1. Create a file named `.env.local` in your project root
2. Add your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Replace the placeholder values with your actual credentials from Step 2.

## Step 4: Create Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of [`supabase-schema.sql`](./supabase-schema.sql)
4. Click "Run" to execute the SQL

This will create:
- `email_captures` table with proper constraints
- Row Level Security (RLS) policies
- Indexes for performance
- Email validation function

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. Test email submission:
   - Enter an email in the Hero section form
   - Click "Join the Journey"
   - Check browser console for success message

4. Verify in Supabase:
   - Go to **Table Editor** → **email_captures**
   - You should see your submitted email with source 'hero'

5. Test CTA form:
   - Scroll to bottom CTA section
   - Enter email and click "Join Waitlist"
   - Verify it appears in Supabase with source 'cta'

## Troubleshooting

### Common Issues

**"Missing Supabase environment variables" error**
- Ensure `.env.local` exists in project root
- Check variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart development server after adding env vars

**Emails not appearing in Supabase**
- Check browser console for error messages
- Verify RLS policies are enabled (run SQL schema again if needed)
- Ensure you're using the correct project URL and anon key

**Duplicate email errors**
- This is normal - the database prevents duplicate emails
- Check console for "Email already subscribed" message
- Users will still see success message for better UX

**Build size increased significantly**
- Supabase client adds ~178KB to JavaScript bundle
- This is normal for database functionality
- Consider lazy loading if performance is critical

### Verification Commands

Test Supabase connection in browser console:
```javascript
// Open browser console and run:
import { supabase } from './src/lib/supabase.js';
supabase.from('email_captures').select('*').then(console.log);
```

## Managing Captured Emails

### View Emails
1. Go to **Table Editor** → **email_captures**
2. View all submitted emails with timestamps and sources

### Export Emails
1. In **Table Editor**, click the export button
2. Choose format: CSV, JSON, or Excel
3. Download for use in email marketing tools

### Query Examples
```sql
-- Get all emails from Hero form
SELECT email, created_at FROM email_captures WHERE source = 'hero';

-- Get emails from last 7 days
SELECT * FROM email_captures WHERE created_at >= NOW() - INTERVAL '7 days';

-- Count emails by source
SELECT source, COUNT(*) as count FROM email_captures GROUP BY source;
```

## Security Notes

- **RLS Policies**: Only allow inserts from the landing page
- **Email Validation**: Database validates email format
- **Uniqueness**: Prevents duplicate email submissions
- **No PII**: Only stores email addresses and submission metadata

## Next Steps

1. Set up email marketing automation (Mailchimp, ConvertKit, etc.)
2. Create email sequences for new subscribers
3. Monitor email capture rates in Supabase dashboard
4. Consider adding analytics to track conversion rates

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify all setup steps were completed correctly
3. Review Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
