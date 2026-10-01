# ChemSim / CHEMLAB

## Overview

CHEMLAB is a web-based chemical bonding and reaction visualization platform. It lets learners select elements, form a curated set of supported compounds, and view staged bonding and Lewis-structure visualizations.

## Technology

- React
- Vite
- TypeScript
- Supabase JavaScript client configuration
- CSS

## Features

- Interactive periodic-table element selection and filtering
- Curated chemical reaction recognition
- Bonding, electron-transfer, electron-sharing, and octet-check visual stages
- Compound result and Lewis-structure presentation
- Local quiz-entry interface and student/teacher UI views

The quiz and role views are currently client-side prototype interfaces. Authentication, shared quiz data, and persisted student records are not implemented.

## Local Development

Prerequisite: Node.js and npm.

1. Install dependencies:

   npm install

2. Create a local environment file from the template:

   Copy-Item .env.example .env.local

3. Put the browser-safe Supabase project URL and publishable key in .env.local if a feature imports the Supabase client.

4. Start the Vite development server:

   npm run dev

The Vite development server uses http://localhost:5173.

## Environment Variables

Use .env.example as the tracked template and .env.local for machine-specific values. The latter is ignored by Git.

- VITE_SUPABASE_URL: Supabase project URL
- VITE_SUPABASE_PUBLISHABLE_KEY: browser-safe Supabase publishable key

Never add a Supabase service-role key, database password, or other private credential to a VITE_ variable. VITE_ variables are bundled into the browser application.

## Validation and Build

Run the existing checks:

    npm test
    npm run build

The build command runs the configured TypeScript validation and produces the static production site in dist.

## Deployment

### Vercel

Import the GitHub repository in Vercel. Vercel recognizes this Vite project automatically.

- Framework preset: Vite
- Build command: npm run build
- Output directory: dist
- Install command: npm install

Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the Vercel project environment settings when the deployed application needs the Supabase client.

### Render

Create a Static Site from the GitHub repository.

- Build command: npm install && npm run build
- Publish directory: dist

Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Render's environment settings when required. Do not commit a production .env.local file.

See DEPLOYMENT_GUIDE.md for release and production-testing steps.

## Thesis Context

CHEMLAB is an educational visualization system intended to support chemical-bonding instruction through interactive, visual exploration. It is currently a front-end prototype and should not be represented as an authenticated or persistent learning-management system until those capabilities are implemented and verified.
