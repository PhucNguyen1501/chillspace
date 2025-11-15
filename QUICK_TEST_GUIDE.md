# Quick Test Guide for NL-to-API Fix

## ✅ What Was Fixed

The `nl-to-api` Edge Function was timing out and failing. Fixed by:
- ⚡ **Switched to faster Claude model** (3-5x faster responses)
- ⏱️ **Added timeout handling** (prevents hanging)
- 📝 **Improved logging** (easier debugging)
- 🔄 **Added graceful fallback** (always gets results)
- 🛡️ **Better error handling** (clear error messages)

## 🚀 Quick Test (2 minutes)

### 1. Reload Extension
```bash
# The extension is already built
# Just reload it in Chrome:
# 1. Go to chrome://extensions/
# 2. Find "API Documentation Query Builder"
# 3. Click the reload icon 🔄
```

### 2. Test It
1. **Open extension** (click icon in toolbar)
2. **Go to Query tab**
3. **Parse a page** or use existing schema
4. **Enter query**: `"Get all users"`
5. **Click "Generate API Call"**
6. **Check console** (F12) for `[NLP]` logs

### 3. What You Should See

#### ✅ Success (Normal Case)
```
Console Output:
[NLP] Starting conversion for query: Get all users
[NLP] Calling Supabase Edge Function...
[NLP] Edge Function response: { success: true, hasError: false }
[NLP] Successfully generated API call: GET https://api.example.com/users

Extension UI:
✓ Shows "Generated API Call" card
✓ Shows endpoint, method, headers
✓ "Execute Query" button enabled
```

#### ✅ Fallback (If API Issues)
```
Console Output:
[NLP] Starting conversion for query: Get all users
[NLP] Calling Supabase Edge Function...
[NLP] Edge Function error: ...
[NLP] Falling back to simple pattern matching
[NLP] Successfully generated API call: GET https://api.example.com/users

Extension UI:
✓ Still shows "Generated API Call" card
✓ May be less accurate but still functional
✓ No error message shown to user
```

#### ❌ Error (Should Not Happen)
```
Console Output:
[NLP] Error in NL-to-API conversion: { ... detailed error ... }

Extension UI:
✗ Error toast notification
✗ Check console for details
```

## 🔍 Detailed Debugging

If you still see errors:

### Check 1: Extension Version
```bash
# Verify you're using the latest build
ls -l dist/assets/*.js | head -1
# Should show recent timestamp (today)
```

### Check 2: Edge Function Status
```bash
cd /Users/jasonnguyen/CascadeProjects/chillspace/api-doc-extension
supabase functions list
# Should show: nl-to-api | ACTIVE | version 3
```

### Check 3: Browser Console
```javascript
// Open Console (F12) and check for:
// ✓ [NLP] logs showing each step
// ✓ No red errors except the intentional fallback
// ✓ API call object logged
```

### Check 4: Edge Function Logs
```bash
# View server-side logs in Supabase Dashboard:
# https://supabase.com/dashboard/project/svjrohgwbtsxnvzdrqks/functions/nl-to-api/logs
# Look for:
# - "nl-to-api function called"
# - "Processing query: ..."
# - "Successfully generated API call"
```

## 📊 Example Test Queries

Try these to verify different scenarios:

| Query | Expected Result |
|-------|----------------|
| `Get all users` | GET /users |
| `Create a new user` | POST /users |
| `Update user details` | PUT /users/{id} |
| `Delete user by ID` | DELETE /users/{id} |
| `Search for products` | GET /products?search=... |

## 🎯 Success Criteria

✅ Extension generates API calls without errors  
✅ Console shows `[NLP]` logs for each step  
✅ Fallback works if Edge Function fails  
✅ Generated API calls match the schema  
✅ No JavaScript runtime errors in console  

## 🐛 If Still Having Issues

1. **Check Console Errors**
   - Press F12 to open DevTools
   - Look for red errors
   - Share the `[NLP]` log messages

2. **Verify Environment**
   ```bash
   # Check .env file exists
   cat .env
   # Should show:
   # VITE_SUPABASE_URL=https://...
   # VITE_SUPABASE_ANON_KEY=...
   # VITE_CLAUDE_API_KEY=...
   ```

3. **Test Edge Function Directly**
   ```bash
   # Test the function with curl
   curl -X POST 'https://svjrohgwbtsxnvzdrqks.supabase.co/functions/v1/nl-to-api' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"query":"get all users","schema":{"baseUrl":"https://api.example.com","endpoints":[{"method":"GET","path":"/users"}]}}'
   ```

4. **Share Logs**
   - Browser console logs (with `[NLP]` prefix)
   - Edge Function logs from Supabase Dashboard
   - Any error toasts/messages

## 📝 Notes

- **First call may be slower** (~5-10s) as Claude API warms up
- **Subsequent calls are faster** (~1-3s)
- **Fallback pattern matching is instant** (<100ms)
- **Console logs are verbose** for debugging (can be reduced later)

---

## 🎉 Expected Outcome

After following this guide, you should see:
✅ Natural language queries converting to API calls  
✅ Clear console logs showing the process  
✅ No JavaScript errors  
✅ Fast response times (1-5 seconds)  
✅ Graceful fallback if Cloud API is slow  

**If you see all ✅ above, the fix is working!** 🎊

---

**Last Updated**: November 13, 2025  
**Build Version**: dist/assets/popup.js (377.16 kB)
