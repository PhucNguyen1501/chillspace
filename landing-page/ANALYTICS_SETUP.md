# Web Analytics Setup Guide

This guide covers adding web analytics to your ChillSpace landing page for tracking visitor behavior, conversions, and performance metrics.

## 🎯 Analytics Options

### Option 1: Vercel Analytics (Recommended - Free & Easy)

**Best for**: Quick setup, privacy-friendly, basic metrics
- ✅ **Free** with Vercel deployment
- ✅ **Privacy-focused** (no cookies needed)
- ✅ **Zero-config** setup
- ✅ **Web Vitals** tracking
- ✅ **Custom events** support

**What it tracks**:
- Page views and unique visitors
- Web Vitals (Core Web Vitals, LCP, FID, CLS)
- Custom events (email submissions, button clicks)
- Geographic data
- Referrer information
- Device/browser data

---

### Option 2: Google Analytics 4 (Advanced - Free)

**Best for**: Detailed user behavior, conversion funnels, Google integration
- ✅ **Free** unlimited usage
- ✅ **Detailed user journeys**
- ✅ **Conversion tracking**
- ✅ **Google Ads integration**
- ❌ **Heavier** script (~45KB)
- ❌ **Privacy concerns** (cookies, consent required)
- ❌ **Setup complexity**

**What it tracks**:
- Everything Vercel Analytics tracks +
- User sessions and engagement time
- Conversion funnels
- Demographic data
- Custom dimensions/metrics
- Real-time reporting

---

### Option 3: Plausible Analytics (Privacy-focused - Paid)

**Best for**: Privacy-conscious users, lightweight alternative
- ✅ **Lightweight** (<1KB)
- ✅ **Privacy-first** (no cookies, GDPR compliant)
- ✅ **Simple dashboard**
- ❌ **Paid** (~$9/month for 100K pageviews)
- ❌ **Basic features** compared to GA4

---

## 🚀 Quick Setup: Vercel Analytics (Already Implemented)

Your landing page already has Vercel Analytics configured:

### 1. Installation ✅
```bash
npm install @vercel/analytics
```

### 2. Component Integration ✅
- `src/components/VercelAnalytics.tsx` - Analytics component
- Added to `src/App.tsx` - Tracks all page views
- Event tracking in Hero and CTA components

### 3. Event Tracking ✅
Currently tracking:
- `email_submitted` events from Hero form
- `email_submitted` events from CTA form
- Includes `source` and `location` properties

### 4. View Analytics
1. Deploy to Vercel
2. Go to your Vercel project dashboard
3. Click **"Analytics"** tab
4. View real-time data and reports

---

## 📊 Google Analytics 4 Setup (Optional)

If you need advanced tracking and conversion funnels:

### 1. Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com)
2. Click **"Admin"** → **"Create Account"**
3. Enter account name: "ChillSpace"
4. Create property: "chillspace.net"
5. Select industry and time zone
6. Create data stream: "Web"
7. Enter your website URL: `https://chillspace.net`
8. Get your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Add GA4 to Your Site

Create `src/components/GoogleAnalytics.tsx`:

```tsx
import { useEffect } from 'react';

export function GoogleAnalytics() {
  useEffect(() => {
    // Add Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=G-YOUR_MEASUREMENT_ID`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-YOUR_MEASUREMENT_ID');
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return null;
}
```

### 3. Update App Component
```tsx
import GoogleAnalytics from './components/GoogleAnalytics';

// In App component JSX:
<GoogleAnalytics />
```

### 4. Add Conversion Tracking
```tsx
// Track email submissions
gtag('event', 'email_submitted', {
  source: 'hero',
  location: 'hero_section'
});

// Track button clicks
gtag('event', 'cta_click', {
  button_name: 'join_waitlist',
  location: 'hero'
});
```

---

## 🔧 Advanced Event Tracking

### Track Important User Actions

Add these events throughout your components:

```tsx
import { Analytics } from '@vercel/analytics/react';

// Track feature section views
Analytics.track('feature_view', {
  feature: 'smart_parser',
  location: 'features_section'
});

// Track navigation clicks
Analytics.track('navigation_click', {
  destination: 'features',
  link_text: 'Features'
});

// Track time on page (custom implementation)
const startTime = Date.now();
window.addEventListener('beforeunload', () => {
  const timeOnPage = Math.round((Date.now() - startTime) / 1000);
  Analytics.track('time_on_page', {
    duration_seconds: timeOnPage,
    page: 'landing'
  });
});
```

### Track Conversion Goals

```tsx
// Track successful email submission
Analytics.track('conversion', {
  type: 'email_signup',
  source: 'hero_form',
  value: 1 // Optional value for goal tracking
});

// Track Chrome extension clicks (when added)
Analytics.track('conversion', {
  type: 'extension_install',
  source: 'cta_button',
  value: 1
});
```

---

## 📱 Privacy & Compliance

### Cookie Consent (for GA4)

If using Google Analytics, add cookie consent:

```tsx
// src/components/CookieConsent.tsx
import { useState } from 'react';

export function CookieConsent() {
  const [accepted, setAccepted] = useState(localStorage.getItem('cookies_accepted'));

  if (accepted) return null;

  const acceptCookies = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setAccepted('true');
    // Load Google Analytics after consent
    loadGoogleAnalytics();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <p className="text-sm">
          We use cookies to analyze website traffic and improve your experience.
        </p>
        <button
          onClick={acceptCookies}
          className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-sm"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
```

---

## 📈 Analytics Dashboard Guide

### Vercel Analytics Dashboard

1. **Overview Tab**
   - Page views and unique visitors
   - Web Vitals scores
   - Top pages and referrers
   - Geographic distribution

2. **Events Tab**
   - Custom events (email submissions)
   - Event counts and trends
   - Event properties breakdown

3. **Web Vitals Tab**
   - Core Web Vitals performance
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)

### Google Analytics Dashboard

1. **Reports → Acquisition**
   - Traffic sources
   - User acquisition channels
   - Campaign performance

2. **Reports → Engagement**
   - Events and conversions
   - Page engagement
   - User retention

3. **Reports → Conversions**
   - Conversion funnels
   - Goal completions
   - Revenue tracking (if applicable)

---

## 🎯 Key Metrics to Track

### For Your Landing Page

1. **Conversion Metrics**
   - Email submission rate (Hero vs CTA)
   - Form completion time
   - Drop-off points in forms

2. **Engagement Metrics**
   - Time on page
   - Scroll depth
   - Section interactions

3. **Traffic Metrics**
   - Visitor sources (direct, social, search)
   - Geographic distribution
   - Device types (mobile vs desktop)

4. **Performance Metrics**
   - Page load speed
   - Core Web Vitals
   - Error rates

### Setting Up Goals

```tsx
// Vercel Analytics - Track conversion goals
Analytics.track('goal_completed', {
  goal_name: 'email_signup',
  step: 'form_submitted',
  value: 1
});

// GA4 - Configure goals in dashboard
// Admin → Goals → New Goal → Custom
```

---

## 🛠️ Testing Analytics

### Local Testing

1. **Vercel Analytics**: Works in development
2. **Google Analytics**: May need production domain
3. **Event Testing**: Use browser console

```javascript
// Test Vercel Analytics events
import { Analytics } from '@vercel/analytics/react';
Analytics.track('test_event', { test: true });

// Test GA4 events
gtag('event', 'test_event', { test: true });
```

### Debug Mode

```tsx
// Enable debug mode for testing
if (process.env.NODE_ENV === 'development') {
  window.dataLayer = window.dataLayer || [];
  gtag('config', 'G-YOUR_ID', { debug_mode: true });
}
```

---

## 📊 Analytics Best Practices

1. **Start Simple**: Begin with Vercel Analytics
2. **Track Conversions**: Focus on email submissions first
3. **Privacy First**: Use cookie consent for GA4
4. **Regular Review**: Check analytics weekly
5. **A/B Testing**: Use analytics to test variations
6. **Performance Impact**: Monitor script load times

---

## 🚀 Next Steps

1. **Deploy with Vercel Analytics** (already configured)
2. **Review initial data** after launch
3. **Add GA4** if detailed tracking needed
4. **Set up conversion goals**
5. **Create weekly analytics reports**
6. **Optimize based on data**

---

## 🔗 Troubleshooting

### Common Issues

**Analytics not showing data**
- Wait 24-48 hours for data to appear
- Check deployment status
- Verify tracking code is present

**Events not tracking**
- Check browser console for errors
- Verify event syntax
- Test with debug mode enabled

**Privacy banner issues**
- Check localStorage functionality
- Verify consent logic
- Test on different browsers

---

**Need help?** Check your analytics dashboard or refer to platform documentation:
- [Vercel Analytics Docs](https://vercel.com/docs/concepts/analytics)
- [Google Analytics Docs](https://support.google.com/analytics)
