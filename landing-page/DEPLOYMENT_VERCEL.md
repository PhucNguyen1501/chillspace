# Deploy to chillspace.net with Vercel

This guide walks you through deploying your ChillSpace landing page to chillspace.net using Vercel.

## Prerequisites

- A [Vercel](https://vercel.com) account (sign up with GitHub)
- Ownership of the chillspace.net domain
- Supabase project set up (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))

## Step 1: Push to GitHub

First, push your code to a GitHub repository:

```bash
# If you haven't already, initialize git
git init
git add .
git commit -m "Initial commit - landing page with Supabase integration"

# Create GitHub repository and push
git branch -M main
git remote add origin https://github.com/yourusername/chillspace-landing.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Through Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite project
5. Configure settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. Click **"Deploy"**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd /path/to/landing-page
vercel --prod
```

## Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add your Supabase credentials:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://your-project-id.supabase.co`
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `your_anon_key_here`

3. Select **Environment**: Production, Preview, Development
4. Click **"Save"**

5. Redeploy to apply environment variables:
   - Go to **Deployments** → **Latest**
   - Click **"Redeploy"**

## Step 4: Add Custom Domain (chillspace.net)

### Option A: Buy Domain Through Vercel (Easiest)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Click **"Buy Domain"**
3. Search for `chillspace.net`
4. Complete purchase (Vercel handles DNS automatically)

### Option B: Use Existing Domain

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter `chillspace.net`
4. Vercel will show DNS records to add

5. **Update DNS at your domain registrar** (GoDaddy, Namecheap, etc.):
   ```
   Type: CNAME
   Name: @
   Value: cname Verizonable **"Add"**
3. Enter `www.chillspace.net`
4. Add both domains for redundancy

## Step 5: Verify Deployment

### Check the Site

1. **Basic functionality**: Visit `https://chillspace.net`
   - Page should load with hero background image
   - All sections should be visible
   - No console errors

2. **Email forms**: Test both email capture forms
   - Submit test email in Hero section
   - Submit test email in CTA section
   - Check Supabase dashboard for submissions

3. **Mobile responsiveness**: Test on mobile devices
   - Responsive layout should work
   - Forms should be usable on mobile

### Performance Check

1. **Page speed**: Use [Google PageSpeed Insights](https://pagesin
   - Target: 90+ score on mobile
   - Check Core Web Vitals

2. **SEO**: Check meta tags and title
   - Title should show "ChillSpace - API Doc Query Builder"
   - Meta description should be present

## Step 6: Post-Deployment Checklist

### Security

- [ ] Supabase RLS policies are enabled
- [ ] Environment variables are not exposed
- [ ] HTTPS is enforced (automatic with Vercel)

### Monitoring

- [ ] Set up Vercel Analytics (free tier available)
- [ ] Monitor Supabase usage and costs
- [ ] Set up error tracking if needed

### Backup

- [ ] Git repository is up to date
- [ ] Supabase data export is scheduled
- [ ] Domain registration is current

## Troubleshooting

### Common Issues

**"Site not found" error**
- Check DNS propagation (can take 5-30 minutes)
- Verify CNAME records are correct
- Clear browser cache

**Email forms not working**
- Verify environment variables in Vercel dashboard
- Check browser console for Supabase errors
- Test Supabase connection directly

**Background image not loading**
- Ensure `hero-grid-bg.jpg` is in `public/` folder
- Check file path in Hero component
- Verify image exists in deployed build

**Build failures**
- Check Vercel build logs
- Verify `package.json` scripts are correct
- Ensure all dependencies are installed

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)

## Next Steps

1. **Set up analytics**: Google Analytics or Vercel Analytics
2. **Email marketing**: Integrate with Mailchimp or ConvertKit
3. **SEO optimization**: Add meta tags, sitemap, robots.txt
4. **Performance monitoring**: Set up alerts for uptime

## Cost Summary

- **Vercel**: Free tier (up to 100GB bandwidth/month)
- **Supabase**: Free tier (up to 500MB database, 50k API calls/month)
- **Domain**: $10-20/year (if not purchased through Vercel)

**Total estimated cost**: $10-20/year for domain only

---

Your ChillSpace landing page is now live at chillspace.net! 🎉
