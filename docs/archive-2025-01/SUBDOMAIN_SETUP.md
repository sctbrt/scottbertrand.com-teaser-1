# Setting Up notes.scottbertrand.com Subdomain

This guide explains how to deploy Field Notes to the notes.scottbertrand.com subdomain on Vercel.

## Architecture

- **Main site**: scottbertrand.com (current project)
- **Field Notes subdomain**: notes.scottbertrand.com (separate Vercel project)

## Step-by-Step Setup

### 1. Create a New GitHub Repository for Field Notes

Create a new repository called `scottbertrand.com-field-notes` with the following structure:

```
scottbertrand.com-field-notes/
├── index.html           # (copy from field-notes.html)
├── field-note.html      # Individual entry template
├── field-notes.css      # Styles
├── assets/              # Copy shared assets (logos, etc.)
├── api/
│   ├── field-notes.js
│   └── field-notes/
│       └── [id].js
├── package.json
├── vercel.json
└── .env.example
```

### 2. Copy Field Notes Files

From your main project, copy these files to the new repository:

```bash
# Create new repo directory
mkdir ~/Sites/scottbertrand.com-field-notes
cd ~/Sites/scottbertrand.com-field-notes

# Initialize git
git init

# Copy Field Notes files from main project
cp ~/Sites/scottbertrand.com-teaser-1/field-notes.html ./index.html
cp ~/Sites/scottbertrand.com-teaser-1/field-note.html ./
cp ~/Sites/scottbertrand.com-teaser-1/field-notes.css ./
cp -r ~/Sites/scottbertrand.com-teaser-1/api ./

# Copy necessary assets
mkdir -p assets
cp ~/Sites/scottbertrand.com-teaser-1/assets/sb-monogram-* ./assets/
cp ~/Sites/scottbertrand.com-teaser-1/assets/scott-bertrand-wordmark-* ./assets/
cp ~/Sites/scottbertrand.com-teaser-1/assets/field-notes-* ./assets/
cp ~/Sites/scottbertrand.com-teaser-1/assets/still-goods-* ./assets/

# Copy config files
cp ~/Sites/scottbertrand.com-teaser-1/package.json ./
cp ~/Sites/scottbertrand.com-teaser-1/.env.example ./
cp ~/Sites/scottbertrand.com-teaser-1/theme.js ./
cp ~/Sites/scottbertrand.com-teaser-1/modal.js ./
cp ~/Sites/scottbertrand.com-teaser-1/styles.css ./
```

### 3. Update index.html (formerly field-notes.html)

Edit `index.html` and update asset paths and navigation:

```html
<!-- Update navigation links -->
<a href="https://scottbertrand.com" class="nav-imprint-image">
    <!-- This should go back to main site -->
</a>

<!-- Or keep navigation consistent if desired -->
<a href="/" class="nav-imprint-image">
    <!-- Link to Field Notes home -->
</a>
```

### 4. Create vercel.json for Subdomain

Create `vercel.json` in the Field Notes repository:

```json
{
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": ".",
  "devCommand": "npx vite --port 8002",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/:id",
      "destination": "/field-note.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 5. Update package.json

Ensure the Field Notes project has the necessary dependencies:

```json
{
  "name": "scottbertrand.com-field-notes",
  "version": "1.0.0",
  "description": "Field Notes subdomain for scottbertrand.com",
  "type": "module",
  "scripts": {
    "dev": "vite --port 8002",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@notionhq/client": "^2.2.3"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### 6. Create vite.config.js

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8002,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        'field-note': 'field-note.html',
      },
    },
  },
});
```

### 7. Deploy to Vercel

1. Push the Field Notes repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial Field Notes subdomain setup"
   git branch -M main
   git remote add origin git@github.com:yourusername/scottbertrand.com-field-notes.git
   git push -u origin main
   ```

2. In Vercel Dashboard:
   - Click "Add New Project"
   - Import the `scottbertrand.com-field-notes` repository
   - Configure environment variables:
     - `NOTION_API_KEY` = your_secret_token
     - `NOTION_DATABASE_ID` = 2ed87253fff18013981fef46f830262e
   - Deploy

3. Set up custom domain:
   - Go to Project Settings → Domains
   - Add domain: `notes.scottbertrand.com`
   - Follow Vercel's DNS instructions to configure your domain

### 8. DNS Configuration

Add these DNS records to your domain provider (e.g., Cloudflare, Namecheap):

```
Type: CNAME
Name: notes
Value: cname.vercel-dns.com
```

Or if using A records:

```
Type: A
Name: notes
Value: 76.76.21.21  # Vercel's IP
```

### 9. Update Main Site Navigation

The main site (scottbertrand.com) navigation already points to `https://notes.scottbertrand.com`, so once the subdomain is live, the links will work automatically.

## Alternative: Vercel Monorepo Approach

If you prefer to keep everything in one repository:

1. Keep Field Notes files in the main project
2. Update `vercel.json` to handle subdomain routing
3. Configure Vercel to deploy the same repo to multiple domains
4. Add subdomain configuration in Vercel project settings

This is more complex but keeps all code in one place.

## Testing Locally

Run both projects simultaneously:

```bash
# Terminal 1: Main site
cd ~/Sites/scottbertrand.com-teaser-1
npm run dev  # Runs on port 8001

# Terminal 2: Field Notes subdomain
cd ~/Sites/scottbertrand.com-field-notes
npm run dev  # Runs on port 8002
```

Test navigation:
- Main site: http://localhost:8001
- Field Notes: http://localhost:8002

## Troubleshooting

**Field Notes link returns 404:**
- Verify the subdomain is deployed and DNS is configured
- Check Vercel deployment logs
- Ensure environment variables are set

**Assets not loading:**
- Verify asset paths are correct (use absolute paths or proper relative paths)
- Check that assets were copied to the Field Notes repository

**API endpoints failing:**
- Verify Notion API key and database ID are set in Vercel environment variables
- Check API logs in Vercel dashboard
- Ensure the integration is connected to your Notion database

## Future Enhancements

- Set up preview deployments for Field Notes
- Add analytics tracking for subdomain
- Configure separate caching strategies
- Set up monitoring and error tracking
