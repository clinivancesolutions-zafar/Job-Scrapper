# Syronza Job Scraper — zero-install prototype

This is a deploy-ready prototype built from the supplied Syronza Supabase scraper.

## What works

- Live Greenhouse job-board scraping
- Live Lever job-board scraping
- 30+ starter health/health-tech boards
- Keyword filtering
- Location filtering
- Source filtering
- Deduplication
- CSV export
- Simple Syronza dashboard
- No local Node/Python/Supabase installation required

## Run it with nothing installed

The intended path is **Vercel**:

1. Put this folder in a GitHub repository, or upload it to Vercel.
2. Deploy as a normal Vercel project.
3. Open the deployed URL.
4. Click **Scrape jobs**.

There is no environment variable and no database required for this prototype.

## How it works

`index.html` is the UI.

`api/jobs.js` runs server-side on Vercel and calls the public Greenhouse and Lever endpoints, so the browser does not need to deal with cross-origin restrictions.

## Add more companies

Edit `api/jobs.js` and add:

Greenhouse:
`{ats:"greenhouse", token:"company-slug", label:"Company Name"}`

Lever:
`{ats:"lever", token:"company-slug", label:"Company Name"}`

The token is normally the slug used in the public ATS URL.

## Production Syronza path

The supplied Supabase Edge Function remains useful when you want persistent storage, scheduled scraping, deduplication across runs, and the Syronza app to query a `jobs` table.

This prototype is deliberately smaller: it is meant to be immediately demonstrable without setting up a database.

## Important limitation

This prototype covers Greenhouse and Lever. It does not attempt to bypass bot protection or scrape JS-only career sites. For other ATS/career sites, use their permitted public feeds/APIs or add a compliant adapter.


## Fixed version
This version uses a Vercel Node 20 serverless function, safely handles non-JSON upstream responses, and the UI reports the actual API error instead of throwing a JSON parse error.
