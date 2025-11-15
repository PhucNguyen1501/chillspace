# API Documentation Query Builder

Chrome extension to read API documentation, convert natural language to API queries, and schedule data extraction jobs.

## Features

- **Documentation Reader**: Parse API docs from webpages (OpenAPI, Swagger, REST, GraphQL)
- **Natural Language Interface**: Convert plain English to API requests
- **Query Execution**: Execute API calls with authentication
- **Scheduled Jobs**: Automate data extraction on schedules
- **Data Export**: Export to JSON, CSV, or XLSX

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
- Supabase URL and Anon Key
- Claude API Key (for NL processing)

4. Build the extension:
```bash
npm run build
```

5. Load in Chrome:
- Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` folder

## Development

```bash
npm run dev
```

## Documentation

All detailed documentation is organized in the `changelog/` directory:

### 📁 Documentation Topics
- **Setup & Installation** → `changelog/setup/SETUP.md`
- **Development Guidelines** → `changelog/development/DEVELOPMENT.md`
- **Testing Suite (92 tests)** → `changelog/testing/`
- **Feature Enhancements** → `changelog/features/PARSER_IMPROVEMENTS.md`
- **Deployment Guide** → `changelog/deployment/PHASE4_DEPLOYMENT.md`

### 🚀 Quick Start
1. **New to the project?** Start with `changelog/setup/SETUP.md`
2. **Want to contribute?** Read `changelog/development/DEVELOPMENT.md`
3. **Need to test?** Check `changelog/testing/TESTING_COMPLETE.md`
4. **Deploying?** Follow `changelog/deployment/PHASE4_DEPLOYMENT.md`

### 🧪 Current Test Status
✅ **All 92 tests passing** - See `changelog/testing/TESTING_COMPLETE.md` for details

## Project Structure

```
api-doc-extension/
├── src/
│   ├── background/      # Service worker
│   ├── content/         # Content scripts & parsers
│   ├── popup/           # Extension popup UI
│   ├── lib/             # Utilities & Supabase
│   └── types/           # TypeScript types
├── public/
│   └── manifest.json    # Extension manifest
├── changelog/           # Documentation organized by topic
│   ├── development/     # Development guidelines
│   ├── deployment/      # Deployment instructions
│   ├── features/        # Feature documentation
│   ├── setup/           # Setup instructions
│   └── testing/         # Testing documentation
└── supabase/            # Backend (migrations, functions)
```

## Usage

1. **Parse API Documentation**:
   - Navigate to an API documentation page
   - Click the extension icon
   - Click "Parse Page" to extract API schema

2. **Query with Natural Language**:
   - Select an API schema
   - Type a natural language query (e.g., "Get all users")
   - Review and execute the generated API call

3. **Schedule Jobs**:
   - Go to the Jobs tab
   - Create a new scheduled job
   - Set frequency and output format

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Supabase (auth, database, edge functions)
- **Extension**: Chrome Manifest V3
- **NL Processing**: Claude API

## Phases

- **Phase 1-3** (MVP): Extension setup, Supabase backend, documentation parser
- **Phase 4**: Natural language query conversion
- **Phase 5**: Query execution with auth
- **Phase 6**: Job scheduling
- **Phase 7**: Data export & storage

## License

MIT
