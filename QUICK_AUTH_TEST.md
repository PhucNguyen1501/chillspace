# Quick Authentication Test Guide

## 🚀 Test the New Sign In/Sign Out Feature

### 1. **Reload Extension**
```bash
# Extension is already built with auth features
# Just reload it in Chrome:
# 1. Go to chrome://extensions/
# 2. Find "API Documentation Query Builder"
# 3. Click the reload icon 🔄
```

### 2. **Test Sign Up (New User)**
1. **Open extension** (click icon in toolbar)
2. **Click "Sign In"** button in top-right corner
3. **Click "Don't have an account? Sign Up"** link
4. **Fill form:**
   - Email: `test@example.com` (use your email)
   - Password: `password123` (min 6 chars)
   - Confirm: `password123`
5. **Click "Sign Up"**
6. **Check email** for verification link
7. **Verify email** if required

### 3. **Test Sign In**
1. **Open extension**
2. **Click "Sign In"** button
3. **Enter credentials:**
   - Email: your verified email
   - Password: your password
4. **Click "Sign In"**
5. **Success toast** should appear
6. **User menu** should show in header

### 4. **Test User Menu**
1. **Click your avatar** (shows initial)
2. **See dropdown menu:**
   - Your email address
   - "Settings" option
   - "Sign Out" option
3. **Click outside** to close menu

### 5. **Test Sign Out**
1. **Open user menu** (click avatar)
2. **Click "Sign Out"**
3. **Loading toast** appears
4. **Success toast** confirms sign out
5. **Sign In button** returns to header

### 6. **Test Settings Page**
1. **Go to Settings tab**
2. **See auth status card:**
   - **Not signed in**: Blue box with sign in/up buttons
   - **Signed in**: Green box with your email
3. **Try sign in/out from settings**

## 🔍 What You Should See

### ✅ **Success Indicators**
```
✓ Sign In button in header (when not signed in)
✓ User avatar with initial (when signed in)
✓ Toast notifications for all actions
✓ Smooth modal animations
✓ Form validation messages
✓ Loading spinners during operations
✓ Settings page shows auth status
```

### 🔔 **Toast Notifications**
```
✅ "Signed in successfully" + "Welcome back!"
✅ "Account created successfully" + "Check your email"
✅ "Signed out successfully"
❌ "Sign in failed" + error message (if wrong password)
❌ "Please fill in all fields" (if validation fails)
```

### 🎨 **UI Elements**
```
✓ Clean modal with login/signup forms
✓ User avatar with email initial
✓ Dropdown menu with settings/sign out
✓ Loading spinners in buttons
✓ Hover and focus states
✓ Responsive design
```

## 🐛 Troubleshooting

### **Sign In Not Working?**
```bash
1. Check console (F12) for errors
2. Verify email is confirmed
3. Check internet connection
4. Try password reset if needed
```

### **Toast Not Showing?**
```bash
1. Check browser console for JS errors
2. Ensure extension is reloaded
3. Try refreshing the popup
```

### **User Menu Not Appearing?**
```bash
1. Verify you're actually signed in
2. Check if session is persisted
3. Look for console auth errors
```

## 📱 Test Scenarios

### **Happy Path**
1. Sign up → Verify email → Sign in → Use features → Sign out ✅

### **Error Handling**
1. Wrong password → Error toast ✅
2. Invalid email → Validation message ✅
3. Empty fields → Validation error ✅
4. Network error → Error toast ✅

### **Edge Cases**
1. Close modal during sign up → Modal closes ✅
2. Click outside modal → Modal closes ✅
3. Switch between login/signup → Forms toggle ✅
4. Sign out while loading → Graceful handling ✅

## 🎯 Quick Checklist

- [ ] Extension loads without errors
- [ ] Sign In button visible in header
- [ ] Auth modal opens when clicked
- [ ] Can switch between login/signup
- [ ] Form validation works
- [ ] Sign up creates account
- [ ] Sign in works with valid credentials
- [ ] Toast notifications appear
- [ ] User menu shows when signed in
- [ ] Sign out works correctly
- [ ] Settings page shows auth status
- [ ] Session persists after closing popup

## 🔧 Debug Mode

To see detailed auth logs:
1. Open browser console (F12)
2. Look for `[AuthContext]` messages
3. Check for Supabase API calls
4. Monitor toast notifications

## 🎉 Expected Result

After following this guide, you should have:
✅ **Working authentication** with sign in/sign out  
✅ **Beautiful UI** with modals and user menus  
✅ **Toast notifications** for all user actions  
✅ **Form validation** and error handling  
✅ **Session persistence** across popup opens  

**If all ✅ above, authentication is working perfectly!** 🎊

---

**Last Updated**: November 18, 2025  
**Build Version**: dist/assets/popup.js (390.67 kB)
