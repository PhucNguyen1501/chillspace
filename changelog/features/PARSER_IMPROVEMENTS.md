# API Documentation Parser Improvements

## Overview
Enhanced the API documentation parser to dynamically detect and parse API specs from any website, with proper user feedback through toast notifications.

## Changes Made

### 1. Dynamic Swagger UI Parser
**File:** `src/content/parser.ts`

The Swagger UI parser now tries **4 different methods** to extract API specs:

#### Method 1: Modern Swagger UI API
```typescript
if (win.ui && win.ui.specSelectors) {
  const spec = win.ui.specSelectors.specJson().toJS();
  // Parse spec...
}
```

#### Method 2: Window Global Variables
```typescript
if (win.swaggerSpec || win.spec) {
  // Parse spec from global variable...
}
```

#### Method 3: HTML Data Attributes
```typescript
const specUrlElement = document.querySelector('[data-spec-url]') ||
                       document.querySelector('[spec-url]') ||
                       document.querySelector('link[rel="api-spec"]');
```

#### Method 4: Common Spec URL Patterns
Automatically tries these common paths:
- `/swagger.json`
- `/swagger.yaml`
- `/api-docs`
- `/api/swagger.json`
- `/v2/swagger.json`
- `/v3/api-docs`
- `/openapi.json`
- `/openapi.yaml`

Supports both JSON and YAML formats automatically based on content-type or file extension.

### 2. Toast Notifications
**File:** `src/popup/App.tsx`

Added **sonner** toast library for user-friendly notifications:

#### Success Notification
```typescript
toast.success(`Successfully parsed ${schema.title}`, {
  description: `Found ${endpoints.length} endpoints`,
});
```

#### Error Notification
```typescript
toast.error('No API documentation found', {
  description: 'This page does not appear to contain parseable API documentation',
});
```

#### Loading States
```typescript
const toastId = toast.loading('Parsing API documentation...');
// ... operation ...
toast.success('Done!', { id: toastId }); // Updates the same toast
```

### 3. Enhanced Error Handling

All parsing operations now have:
- **Try-catch blocks** for graceful failure
- **Detailed console logging** for debugging
- **User-friendly error messages** via toasts
- **No silent failures** - users always get feedback

## Testing Instructions

### Test on Various API Documentation Sites

1. **Swagger/OpenAPI Sites**
   - `https://petstore.swagger.io/` ✅
   - `https://api.example.com/swagger-ui` (your own APIs)

2. **GitHub REST API**
   - `https://docs.github.com/en/rest`
   - Expected: Will try to detect but may not find parseable spec

3. **Custom API Docs**
   - Any site with `/swagger.json` endpoint
   - Any site with OpenAPI/Swagger UI embedded

### Expected Behavior

#### ✅ When API Docs Found
1. Shows loading toast: "Parsing API documentation..."
2. Extracts endpoints from spec
3. Shows success toast with endpoint count
4. Schema appears in dropdown
5. Ready for natural language queries

#### ❌ When No API Docs Found
1. Shows loading toast: "Parsing API documentation..."
2. Tries all parsing methods
3. Shows error toast: "No API documentation found"
4. Descriptive message about the page not containing parseable docs

#### 🔄 During Execution
1. Loading toast appears
2. Request executes
3. Success/error toast with status code
4. Response displayed in viewer

## Benefits

### For Users
- ✅ Clear feedback on what's happening
- ✅ No confusion when parsing fails
- ✅ Professional user experience
- ✅ Works on multiple API doc platforms

### For Developers
- ✅ Detailed console logs for debugging
- ✅ Easy to add new parsing strategies
- ✅ Graceful error handling
- ✅ Extensible architecture

## Future Enhancements

### Additional Parsers
- [ ] Postman Collection detection
- [ ] API Blueprint format
- [ ] RAML specifications
- [ ] GraphQL introspection query

### Smart Detection
- [ ] Detect API docs in iframes
- [ ] Parse multiple specs on same page
- [ ] Auto-refresh when page content changes
- [ ] Suggest spec URLs based on page structure

### User Preferences
- [ ] Remember parsing preferences per domain
- [ ] Custom spec URL patterns
- [ ] Disable specific parsers
- [ ] Toast notification duration settings

## Architecture

```
User Action (Parse Page)
    ↓
Background Script (Message Router)
    ↓
Content Script (Inject Parser)
    ↓
Parser Strategies (Try All)
    ↓
    ├─ parseOpenApiSpec()
    ├─ parseSwaggerUI()      ← Enhanced with 4 methods
    ├─ parseRedoc()
    ├─ parseGraphQL()
    └─ parseRestApiTable()
    ↓
Convert to Schema
    ↓
Save to Storage
    ↓
Toast Notification ← New!
    ↓
Update UI
```

## Files Modified

1. **src/content/parser.ts**
   - Enhanced `parseSwaggerUI()` function
   - Added common spec URL patterns
   - Added YAML support
   - Improved error logging

2. **src/popup/App.tsx**
   - Added `sonner` toast library
   - Enhanced `handleParseCurrentPage()` with toasts
   - Enhanced `handleExecuteQuery()` with toasts
   - Added `<Toaster />` component

3. **package.json**
   - Added `sonner` dependency

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Toast notifications appear correctly
- [ ] petstore.swagger.io parses successfully
- [ ] Non-API pages show "not found" toast
- [ ] Console logs provide debugging info
- [ ] Multiple parses don't duplicate schemas
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly

## Usage

```bash
# Rebuild the extension
npm run build

# Reload in Chrome
chrome://extensions/ → Click refresh icon

# Test
1. Visit petstore.swagger.io
2. Open extension popup
3. Click "Parse Current Page"
4. See success toast with endpoint count

# Test error case
1. Visit any non-API page (e.g., google.com)
2. Click "Parse Current Page"
3. See error toast: "No API documentation found"
```
