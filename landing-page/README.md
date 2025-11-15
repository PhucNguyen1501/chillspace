# API Query Builder - Landing Page

Modern, SEO-optimized landing page for the API Query Builder Chrome extension.

## 🚀 Features

- **SEO Optimized** - Comprehensive meta tags for search engines and social media
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Performance** - Built with Vite for lightning-fast load times
- **Email Capture** - Integrated with Supabase for waitlist management
- **Modern UI** - Clean design with gradient accents and smooth animations

## 📦 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (optional, for email capture)
- **Deployment**: Netlify / Vercel / Cloudflare Pages

## 🛠️ Local Development

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables (optional)
cp .env.example .env

# Start development server
npm run dev
```

The site will be available at `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions covering:

- ✅ **Netlify** (Recommended)
- Vercel
- Cloudflare Pages
- GitHub Pages
- Supabase Storage

### Quick Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## 📝 Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: Only required if implementing email capture functionality.

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize the primary color palette:

```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

### Content
- **Hero**: `src/components/Hero.tsx`
- **Features**: `src/components/Features.tsx`
- **How It Works**: `src/components/HowItWorks.tsx`
- **Use Cases**: `src/components/UseCases.tsx`
- **CTA**: `src/components/CTA.tsx`
- **Footer**: `src/components/Footer.tsx`

### SEO Meta Tags
Update in `index.html` for:
- Page title
- Description
- Keywords
- Open Graph tags
- Twitter Card tags

## 📊 Analytics

To add Google Analytics, create a component:

```tsx
// src/components/GoogleAnalytics.tsx
import { useEffect } from 'react';

export function GoogleAnalytics() {
  useEffect(() => {
    // Add GA4 script
  }, []);
  return null;
}
```

Or use Plausible Analytics (privacy-friendly) by adding to `index.html`:

```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

## 🔒 Email Capture with Supabase

To enable email capture:

1. **Create Supabase Table**

```sql
create table waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table waitlist enable row level security;

-- Allow inserts from anyone
create policy "Allow public inserts" on waitlist
  for insert with check (true);
```

2. **Update Hero.tsx and CTA.tsx**

```tsx
import { supabase } from '../lib/supabase';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const { error } = await supabase
    .from('waitlist')
    .insert([{ email }]);
  
  if (!error) {
    setSubmitted(true);
  }
};
```

3. **Create Supabase Client**

```tsx
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 📱 Component Structure

```
src/
├── components/
│   ├── Hero.tsx          # Main hero section with CTA
│   ├── Features.tsx      # Feature cards grid
│   ├── HowItWorks.tsx    # Step-by-step guide
│   ├── UseCases.tsx      # Target audience sections
│   ├── CTA.tsx           # Final call-to-action
│   └── Footer.tsx        # Footer with links
├── App.tsx               # Main app component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## 🎯 Performance

- Lighthouse Score: 95+
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Bundle Size: < 200KB (gzipped)

### Optimization Tips
- Images are lazy-loaded
- Code is split automatically by Vite
- Tailwind CSS is purged in production
- All assets are hashed for cache busting

## 📄 License

MIT

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 📧 Support

For questions or issues, please open a GitHub issue or contact hello@apiquery.dev
