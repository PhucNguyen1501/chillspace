# Setup Guide - API Documentation Query Builder

## Prerequisites

- Node.js 18+ and npm
- Chrome browser
- Supabase account (free tier works)
- Claude API key (for NL processing in Phase 4)

## Quick Start

### 1. Install Dependencies

```bash
cd api-doc-extension
npm install
```

### 2. Environment Setup

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_CLAUDE_API_KEY=your-claude-key-here
```

### 3. Supabase Setup

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Deploy edge functions
supabase functions deploy nl-to-api
```

#### Option B: Manual Setup

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to SQL Editor
4. Copy and run the migration from `supabase/migrations/20240101000000_initial_schema.sql`
5. Go to Edge Functions
6. Create function `nl-to-api` and paste code from `supabase/functions/nl-to-api/index.ts`
7. Set environment variable `CLAUDE_API_KEY` in the function settings

### 4. Add Extension Icons

Create or download 4 icon files and place them in `public/icons/`:
- `icon16.png` (16x16)
- `icon32.png` (32x32)  
- `icon48.png` (48x48)
- `icon128.png` (128x128)

For development, you can use placeholder icons from [placeholder.com](https://placeholder.com/).

### 5. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with the built extension.

### 6. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist` folder from this project

## Development Mode

For active development with hot reload:

```bash
npm run dev
```

Note: For Chrome extensions, you'll still need to manually reload the extension in `chrome://extensions/` after changes to background scripts or manifest.

## Testing the Extension

### Test Documentation Parser

1. Navigate to an API documentation page (e.g., https://petstore.swagger.io/)
2. Click the extension icon
3. Go to the "Schemas" tab
4. Click "Parse Page"
5. Verify the API schema is extracted

### Test Query Interface

1. Select a parsed schema
2. Go to the "Query" tab
3. Type a natural language query
4. Review the generated API call
5. Execute to see results

### Test Job Scheduler

1. Go to the "Jobs" tab
2. Click "New Job"
3. Configure schedule and output format
4. Enable the job
5. Check `chrome://extensions/` > Service worker > Console for execution logs

## Project Structure

```
api-doc-extension/
├── public/
│   ├── manifest.json          # Extension manifest (V3)
│   └── icons/                 # Extension icons
├── src/
│   ├── background/            # Service worker
│   │   └── index.ts           # Background script with alarms
│   ├── content/               # Content scripts
│   │   ├── index.ts           # Content script entry
│   │   └── parser.ts          # API doc parsers
│   ├── popup/                 # Extension UI
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # React entry point
│   │   ├── index.css          # Tailwind styles
│   │   └── components/        # React components
│   ├── lib/                   # Shared utilities
│   │   ├── supabase.ts        # Supabase client
│   │   ├── nlp.ts             # NL processing
│   │   ├── scheduler.ts       # Job scheduling
│   │   ├── export.ts          # Data export
│   │   └── utils.ts           # Common utilities
│   └── types/
│       └── index.ts           # TypeScript types
├── supabase/
│   ├── migrations/            # Database migrations
│   ├── functions/             # Edge functions
│   └── config.toml            # Supabase config
└── index.html                 # Popup HTML
```

## Troubleshooting

### Extension Won't Load

- Check for errors in `chrome://extensions/`
- Verify all icons exist in `public/icons/`
- Run `npm run build` again
- Check `dist/manifest.json` is valid

### Parser Not Working

- Check browser console for errors
- Verify content script is injected (check Elements panel)
- Try on known API doc sites (Swagger, Redoc)

### Supabase Connection Failed

- Verify `.env` variables are set correctly
- Check Supabase project is active
- Verify RLS policies in Supabase dashboard
- Check browser console for CORS errors

### Jobs Not Running

- Open extension service worker console: `chrome://extensions/` > Extension > Service Worker
- Check for alarm creation logs
- Verify `chrome.alarms` permission in manifest
- Check job is enabled in Jobs tab

## Phase Completion Status

- ✅ **Phase 1**: Extension setup with Vite + React
- ✅ **Phase 2**: Supabase backend schema
- ✅ **Phase 3**: Documentation parser (OpenAPI, Swagger, REST)
- ⏳ **Phase 4**: NL query (requires Claude API integration)
- ⏳ **Phase 5**: Full query execution with auth
- ⏳ **Phase 6**: Advanced scheduling with cron
- ⏳ **Phase 7**: Complete data export pipeline

## Next Steps

1. **Install dependencies**: `npm install`
2. **Configure environment**: Add API keys to `.env`
3. **Setup Supabase**: Run migrations and deploy functions
4. **Add icons**: Place 4 PNG files in `public/icons/`
5. **Build**: Run `npm run build`
6. **Test**: Load extension in Chrome and test on API docs

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)

## Support

For issues or questions:
1. Check this setup guide
2. Review code comments
3. Check browser/service worker console logs
4. Verify all prerequisites are installed
