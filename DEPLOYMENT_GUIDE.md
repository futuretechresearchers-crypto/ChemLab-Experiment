# CHEMLAB Deployment Guide

## A. GitHub

1. Install Git for Windows if Git is not available on the development machine.
2. From the project root, initialize the repository if needed:

       git init

3. Confirm .env.local is ignored before staging:

       git status

4. Add the target remote only when no origin remote already exists:

       git remote add origin https://github.com/futuretechresearchers/ChemSim.git

5. Stage, inspect, commit, and push:

       git add .
       git status
       git commit -m "Prepare CHEMLAB for web deployment"
       git push -u origin main

Use GitHub authentication through the normal Git credential flow. Do not embed passwords or access tokens in remote URLs.

## B. Vercel

CHEMLAB is a Vite static frontend.

- Import repository: futuretechresearchers/ChemSim
- Framework preset: Vite
- Install command: npm install
- Build command: npm run build
- Output directory: dist
- Node version: use the active supported Node.js version compatible with the committed lockfile

Add these environment variables in Vercel project settings when a deployed feature imports the Supabase client:

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

The app currently uses in-component page switching rather than URL routes, so no SPA rewrite rule is required for its present screens.

## C. Render

Create a Render Static Site from the GitHub repository.

- Build command: npm install && npm run build
- Publish directory: dist

Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the Render service environment settings when required. Deploy as a static site; no PHP, MySQL, MariaDB, or application server is required by this Vite frontend.

## D. Supabase environment variables

Create production variables in the hosting provider, not in source control:

    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

Only use the browser-safe publishable key. Never expose a service-role key, database password, or private API credential in a Vite environment variable.

The current project contains a Supabase client module but does not yet use it in the active app flow. Configure backend security, RLS, and authenticated product features before treating Supabase as an active production dependency.

## E. Production testing

Before promoting a release:

1. Run npm test and npm run build from a clean install.
2. Check the deployed page on desktop and mobile-sized browsers.
3. Verify element selection, supported reaction results, timer/reset behavior, and modal dismissal.
4. Confirm browser developer tools contain no private credential values.
5. If Supabase-backed features are activated, validate RLS with unauthenticated, student, and teacher accounts.
6. Confirm no .env.local, service-role key, database password, or private file is staged in Git.

## F. Custom domain

When a custom domain is required, add it in the selected host's project or service domain settings and follow the provider's displayed DNS records. Configure the DNS records at the domain registrar, wait for verification, and enable the provider-managed HTTPS certificate.

No application code change is required for a custom domain because the active frontend has no hard-coded backend host or local development path.
