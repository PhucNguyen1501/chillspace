# Deployment Guide

This guide covers multiple deployment options for the API Query Builder landing page.

## Prerequisites

- Node.js 18+ installed
- Git repository initialized
- Supabase project (optional, for email capture)

## Option 1: Deploy to Netlify (Recommended)

Netlify offers free hosting with automatic SSL, CDN, and continuous deployment.

### Steps:

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub/GitLab/Bitbucket

2. **Connect Repository**
   ```bash
   # Initialize git if not already done
   git init
   git add .
   git commit -m "Initial commit"
   
   # Push to GitHub/GitLab
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **Deploy on Netlify**
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider
   - Select your repository
   - Build settings are auto-detected from `netlify.toml`:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

4. **Configure Environment Variables** (if using Supabase)
   - Go to Site settings → Environment variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **Custom Domain** (optional)
   - Go to Domain settings
   - Add your custom domain
   - Update DNS records as instructed

### Netlify CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## Option 2: Deploy to Vercel

Vercel provides excellent performance with zero-config deployment.

### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   # Login
   vercel login
   
   # Deploy to production
   vercel --prod
   ```

3. **Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## Option 3: Deploy to Supabase Storage (Static Hosting)

While Supabase doesn't have built-in static hosting like Netlify, you can use Supabase Storage with CDN.

### Steps:

1. **Build the Site**
   ```bash
   npm run build
   ```

2. **Upload to Supabase Storage**
   - Create a public bucket named `landing-page`
   - Upload contents of `dist/` folder
   - Enable public access

3. **Configure CDN** (Cloudflare/CloudFront)
   - Point CDN to your Supabase Storage bucket
   - Configure caching rules
   - Add custom domain

### Alternative: Use with Supabase Functions

You can serve the static site through a Supabase Edge Function:

```typescript
// supabase/functions/landing/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const path = new URL(req.url).pathname
  // Serve static files from storage
  // Implementation details...
})
```

## Option 4: Deploy to GitHub Pages

Free hosting with custom domain support.

### Steps:

1. **Install gh-pages**
   ```bash
   npm install -D gh-pages
   ```

2. **Add Deploy Script to package.json**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **Configure Base Path in vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react()],
   })
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select `gh-pages` branch
   - Save

## Option 5: Deploy to Cloudflare Pages

Fast global CDN with generous free tier.

### Steps:

1. **Connect to Cloudflare Pages**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Connect your Git repository

2. **Build Settings**
   - Build command: `npm run build`
   - Build output: `dist`
   - Root directory: (leave empty)

3. **Deploy**
   - Click "Save and Deploy"
   - Your site will be live in ~1 minute

## Post-Deployment Checklist

- [ ] Test all pages and links
- [ ] Verify email capture functionality
- [ ] Check mobile responsiveness
- [ ] Test form submissions
- [ ] Validate SEO meta tags (use [Meta Tags](https://metatags.io))
- [ ] Run Lighthouse audit
- [ ] Set up analytics (Google Analytics, Plausible, etc.)
- [ ] Configure custom domain and SSL
- [ ] Submit sitemap to search engines

## Performance Optimization

### 1. Enable Compression
Most platforms enable Gzip/Brotli automatically.

### 2. Configure Caching Headers
Add to your hosting platform:
```
Cache-Control: public, max-age=31536000, immutable (for /assets/*)
Cache-Control: no-cache (for /index.html)
```

### 3. Image Optimization
- Use WebP format
- Add lazy loading
- Implement responsive images

### 4. Code Splitting
Already handled by Vite, but verify chunks are optimal:
```bash
npm run build -- --mode production
```

## Monitoring & Analytics

### Google Analytics
1. Create GA4 property
2. Add tracking ID to `.env`:
   ```
   VITE_GA_TRACKING_ID=G-XXXXXXXXXX
   ```
3. Implement in `src/main.tsx`

### Plausible Analytics (Privacy-friendly)
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Clear cache: `rm -rf node_modules dist && npm install`
- Verify environment variables

### Routes Not Working (404)
- Ensure redirect rules are configured
- Check `netlify.toml` or `vercel.json`

### Slow Loading
- Enable CDN
- Optimize images
- Check Lighthouse report

## Security

### Content Security Policy
Add to hosting platform headers:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

### HTTPS
All recommended platforms provide free SSL certificates automatically.

## Cost Comparison

| Platform | Free Tier | Bandwidth | Build Minutes | Custom Domain |
|----------|-----------|-----------|---------------|---------------|
| Netlify | 100GB | Yes | 300 min/mo | Yes |
| Vercel | 100GB | Yes | 6000 min/mo | Yes |
| Cloudflare Pages | Unlimited | Yes | 500 builds/mo | Yes |
| GitHub Pages | 100GB | Yes | N/A | Yes |

## Recommended: Netlify

For this project, **Netlify** is recommended because:
- Zero configuration (uses `netlify.toml`)
- Excellent free tier
- Built-in form handling
- Edge functions support
- Automatic HTTPS
- Preview deployments for PRs

## Need Help?

- [Netlify Documentation](https://docs.netlify.com)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
