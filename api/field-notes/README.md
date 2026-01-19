# Field Notes Subdomain Setup

This directory contains the Field Notes functionality that will be deployed to notes.scottbertrand.com

## Deployment Options

### Option 1: Separate Vercel Project (Recommended)

1. Create a new Vercel project for notes.scottbertrand.com
2. Deploy the contents of `/api/field-notes/` as the root
3. Set up the custom domain: notes.scottbertrand.com

### Option 2: Vercel Monorepo

Use Vercel's monorepo support with the main project serving both domains.

## Current Structure

- `/api/field-notes.js` - API endpoint for fetching all entries
- `/api/field-notes/[id].js` - API endpoint for fetching individual entries
- `/field-notes.html` - Archive index page (becomes index.html in subdomain)
- `/field-note.html` - Individual entry template
- `/field-notes.css` - Styles for Field Notes pages
