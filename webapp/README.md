# ChillSpace Web Application

Production-ready SaaS web application for ChillSpace - API data extraction made simple.

## 🚀 Features

### Phase 1: Core Foundation (Completed)
- ✅ **Authentication System**: Email/password with Supabase Auth
- ✅ **Protected Routes**: Secure routing with authentication guards
- ✅ **Dashboard**: User dashboard with stats and quick actions
- ✅ **UI Components**: Reusable Button, Input, Card, Spinner components
- ✅ **TypeScript**: Full type safety throughout the application

### Coming in Phase 2
- 🔜 **API Connection Management**
- 🔜 **Natural Language Query Builder**
- 🔜 **Query Execution & Response Handling**

### Coming in Phase 3
- 🔜 **Job Scheduling & Automation**
- 🔜 **Analytics Dashboard**
- 🔜 **Export Functionality**

## 🛠️ Tech Stack

- **Frontend**: React 19.2.0 + TypeScript 5.9.3
- **Build Tool**: Vite 7.2.2
- **Styling**: Tailwind CSS 3.4.18
- **Router**: React Router DOM 6.28.0
- **Icons**: Lucide React 0.553.0
- **Backend**: Supabase 2.81.1
- **Analytics**: Vercel Analytics 1.5.0
- **Animation**: Motion 12.23.24

## 📋 Prerequisites

1. **Node.js**: v18 or higher
2. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
3. **Supabase Project**: Create a new project in your Supabase dashboard

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# The schema file is located at:
./database-schema.sql
```

Copy and paste the contents into your Supabase SQL Editor and run it.

### 3. Configure Environment Variables

Copy the environment template:

```bash
cp env.example .env
```

Then edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=http://localhost:5174
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the "Project URL" and "anon/public" API key

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5174`

### 5. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
webapp/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── ui/             # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Spinner.tsx
│   │   ├── layout/         # Layout components (future)
│   │   ├── dashboard/      # Dashboard components (future)
│   │   ├── connections/    # API connections (future)
│   │   └── queries/        # Query builder (future)
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/
│   │   └── supabase.ts     # Supabase client
│   ├── pages/
│   │   └── Dashboard.tsx   # Dashboard page
│   ├── types/
│   │   └── database.ts     # TypeScript types
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── database-schema.sql     # Database schema
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎨 Design System

### Colors

- **Primary (Blue)**: Used for secondary actions and highlights
  - Main: `#0ea5e9` (primary-500)
  
- **Accent (Orange)**: Used for primary actions and branding
  - Main: `#f97316` (accent-600)

### Typography

- **Font**: Inter (loaded from Google Fonts)
- **Font Sizes**: Mobile-first responsive typography

## 🔐 Authentication Flow

1. **Sign Up**: Create account with email/password
2. **Email Verification**: Supabase sends verification email
3. **Sign In**: Log in with verified credentials
4. **Protected Routes**: Authenticated users access dashboard
5. **Session Management**: Auto-refresh tokens, persistent sessions

## 📊 Database Schema

The application uses the following tables:

- **profiles**: User profile information
- **email_captures**: Email signups from landing page
- **api_connections**: API connection configurations
- **api_endpoints**: Extracted API endpoints
- **saved_queries**: Saved user queries
- **scheduled_jobs**: Scheduled data extraction jobs
- **execution_history**: Query execution logs
- **usage_analytics**: User activity tracking

See `database-schema.sql` for full schema details.

## 🧪 Development

### Run Tests

```bash
npm run test
```

### Lint Code

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Production

Make sure to set these in your deployment platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL` (your production URL)

## 📖 Next Steps

1. **Set up Supabase**: Follow the Quick Start guide above
2. **Run the app**: `npm run dev`
3. **Create an account**: Sign up at `/signup`
4. **Explore dashboard**: View the dashboard at `/dashboard`

## 🐛 Troubleshooting

### "Module not found" errors
- Run `npm install` to install dependencies

### "Missing Supabase environment variables"
- Check that your `.env` file exists and has correct values
- Restart the dev server after changing `.env`

### Authentication not working
- Verify Supabase project URL and anon key are correct
- Check that database schema has been run
- Enable email auth in Supabase dashboard (Authentication → Providers)

### Build errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`

## 📝 License

Private project - All rights reserved

## 🤝 Support

For issues or questions, refer to the main project README or contact the development team.
