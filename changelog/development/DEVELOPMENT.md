# Development Guide

## Phase Implementation Roadmap

### ✅ Phase 1-3: MVP Foundation (COMPLETED)

The foundation is complete with:
- Chrome extension architecture with Vite + React
- Supabase backend with full database schema
- Documentation parsers for OpenAPI, Swagger, REST APIs
- Basic UI with tabs for queries, jobs, schemas, settings
- Service worker with message passing
- Content script with auto-detection

### Phase 4: Natural Language Query Interface (NEXT)

**Goal**: Integrate Claude API for converting natural language to API calls.

**Tasks**:
1. Complete integration with Supabase Edge Function `nl-to-api`
2. Update `src/lib/nlp.ts` to call edge function instead of placeholder
3. Enhance prompt engineering for better API call generation
4. Add query validation before execution
5. Implement query history and favorites
6. Add syntax highlighting for generated code

**Files to modify**:
- `src/popup/components/QueryInput.tsx` - Connect to real NL processing
- `src/lib/nlp.ts` - Replace placeholder with actual API call
- `supabase/functions/nl-to-api/index.ts` - Optimize prompts

**Testing**:
- Test with various natural language queries
- Validate against different API schemas
- Test error handling for ambiguous queries

### Phase 5: Query Execution Engine

**Goal**: Execute API requests with full authentication support.

**Tasks**:
1. Implement auth configuration UI in Settings tab
2. Support OAuth 2.0 flow (popup-based)
3. Add request interceptors for auth injection
4. Implement response caching
5. Add request/response history
6. Support file uploads and downloads

**Files to modify**:
- `src/background/index.ts` - Enhanced `handleExecuteQuery`
- `src/popup/App.tsx` - Auth settings UI
- New: `src/lib/auth.ts` - Authentication helpers

**Authentication Types**:
```typescript
// API Key (header or query)
// Bearer Token
// Basic Auth
// OAuth 2.0 (authorization code flow)
// Custom headers
```

### Phase 6: Job Scheduler

**Goal**: Full cron support and job management.

**Tasks**:
1. Build job creation form with cron expression builder
2. Implement proper cron parsing (use `cron-parser` library)
3. Add job run history viewer
4. Implement retry logic for failed jobs
5. Add job notification system
6. Support job templates

**Files to modify**:
- `src/popup/components/JobScheduler.tsx` - Complete UI
- `src/lib/scheduler.ts` - Real cron parsing
- `src/background/index.ts` - Enhanced job execution

**Cron Builder UI**:
```
┌───────── minute (0 - 59)
│ ┌─────── hour (0 - 23)
│ │ ┌───── day (1 - 31)
│ │ │ ┌─── month (1 - 12)
│ │ │ │ ┌─ day of week (0 - 6)
* * * * *
```

### Phase 7: Data Export & Storage

**Goal**: Complete data pipeline with multiple export formats.

**Tasks**:
1. Implement table mapping UI for Supabase storage
2. Add email notifications via Supabase Edge Functions
3. Create webhook integration
4. Add data transformation options (filtering, mapping)
5. Support batch operations
6. Add data visualization preview

**Files to modify**:
- `src/lib/export.ts` - Complete all export formats
- New: `src/lib/transform.ts` - Data transformation
- New: `supabase/functions/notify/index.ts` - Notifications

**Export Pipeline**:
```
API Response → Transform → Format → Destination
                                   ├─ Supabase Table
                                   ├─ Local File
                                   ├─ Webhook
                                   └─ Email
```

## Code Style Guidelines

### TypeScript

- Always use explicit types (avoid `any`)
- Prefer interfaces over types for object shapes
- Use type guards for runtime checks
- Enable strict mode in tsconfig.json

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Avoid inline styles, use Tailwind classes

### Naming Conventions

- **Components**: PascalCase (`QueryInput`, `ApiPreview`)
- **Functions**: camelCase (`parseApiDocumentation`, `executeQuery`)
- **Constants**: UPPER_SNAKE_CASE (`CLAUDE_API_KEY`)
- **Types/Interfaces**: PascalCase (`ApiSchema`, `GeneratedApiCall`)

## Testing Strategy

### Unit Tests (Not yet implemented)

```bash
npm install -D vitest @testing-library/react
```

Test files should be colocated:
```
src/lib/parser.ts
src/lib/parser.test.ts
```

### Integration Tests

Test critical flows:
1. Parse API doc → Store schema → Generate query → Execute
2. Create job → Schedule → Execute → Store results
3. Auth flow → Execute protected endpoint

### Manual Testing Checklist

- [ ] Parse OpenAPI/Swagger docs
- [ ] Parse REST API tables
- [ ] Generate queries from NL
- [ ] Execute GET/POST/PUT/DELETE requests
- [ ] Create and run scheduled jobs
- [ ] Export to JSON/CSV/XLSX
- [ ] Test with different auth methods

## Performance Optimization

### Extension Size

Current build optimizations:
- Tree shaking enabled in Vite
- Code splitting for background/content/popup
- Minification in production

Future optimizations:
- Lazy load heavy libraries (xlsx, papaparse)
- Use dynamic imports for optional features
- Compress assets

### Memory Management

- Clear cache periodically
- Limit stored schemas (max 50)
- Archive old job runs
- Use IndexedDB for large datasets

## Security Considerations

### API Keys

- Never commit `.env` file
- Store keys encrypted in chrome.storage.local
- Clear sensitive data on uninstall
- Warn users about key storage

### Data Privacy

- All data stays local or in user's Supabase
- No telemetry or analytics
- Clear data export options
- Respect CORS policies

### RLS Policies

All Supabase tables have Row Level Security:
```sql
-- Example: Users can only access their own data
CREATE POLICY "Users can view own schemas"
  ON public.api_schemas FOR SELECT
  USING (auth.uid() = user_id);
```

## Debugging Tips

### Service Worker Console

1. Go to `chrome://extensions/`
2. Find extension
3. Click "Service Worker" link
4. View console logs and errors

### Content Script Debugging

1. Right-click on webpage
2. Select "Inspect"
3. Go to Console tab
4. Filter by content script filename

### Popup Debugging

1. Right-click extension icon
2. Select "Inspect popup"
3. Popup DevTools opens

### Common Issues

**Issue**: Extension not updating after changes
**Fix**: Click reload button in `chrome://extensions/`

**Issue**: Content script not injecting
**Fix**: Check `matches` pattern in manifest.json

**Issue**: CORS errors when calling APIs
**Fix**: APIs must allow extension's origin or use background fetch

## Contributing

### Branch Strategy

```
main          # Production-ready code
├─ develop    # Integration branch
   ├─ feature/phase-4-nl-processing
   ├─ feature/phase-5-auth
   └─ bugfix/parser-error-handling
```

### Commit Messages

Format: `type(scope): message`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(parser): add GraphQL introspection support
fix(scheduler): handle invalid cron expressions
docs(readme): update setup instructions
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Unit tests added/updated
- [ ] Integration tests pass

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## Useful Resources

### Chrome Extension APIs

- [chrome.storage](https://developer.chrome.com/docs/extensions/reference/storage/)
- [chrome.alarms](https://developer.chrome.com/docs/extensions/reference/alarms/)
- [chrome.runtime](https://developer.chrome.com/docs/extensions/reference/runtime/)
- [chrome.tabs](https://developer.chrome.com/docs/extensions/reference/tabs/)

### Libraries

- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PapaParse](https://www.papaparse.com/docs)

### API Documentation Formats

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Documentation](https://swagger.io/docs/)
- [GraphQL Schema](https://graphql.org/learn/schema/)

## Future Enhancements

### Optional Features (Beyond Phase 7)

1. **API Mocking**
   - Mock responses for testing
   - Record/replay API calls

2. **Collaboration**
   - Share schemas and queries
   - Team workspaces

3. **Analytics Dashboard**
   - API usage statistics
   - Job success rates
   - Performance metrics

4. **Multi-API Orchestration**
   - Chain multiple API calls
   - Conditional logic
   - Data mapping between APIs

5. **Browser Extension for Other Browsers**
   - Firefox
   - Edge
   - Safari

6. **CLI Tool**
   - Run jobs from terminal
   - CI/CD integration
   - Headless mode

## Questions or Issues?

Check these resources in order:
1. `SETUP.md` - Installation and setup
2. `README.md` - Overview and features
3. This file - Development details
4. Code comments - Inline documentation
5. Browser console - Runtime errors
