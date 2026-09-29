# Chapter by Chapter — New Testament Reading Tracker

A simple, responsive New Testament chapter tracker for GitHub Pages or Netlify.

## Features
- 27 New Testament books, Matthew through Revelation (260 chapters)
- Mark chapters completed and save reading dates
- Personal chapter notes and study list
- Reading goal and consecutive-day streaks
- Excel backup/import and progress report (`Reading Summary`, `Chapter Tracker`, `Personal Notes` worksheets)
- Light/dark theme, mobile layout, print-friendly progress page
- Local browser storage; no account or backend required

## Run locally
Open `index.html` in a modern browser. Excel import/export uses SheetJS loaded from a CDN, so that feature requires an internet connection. Core tracking works without it.

## Publish on GitHub Pages
1. Create a repository and upload `index.html`, `style.css`, `script.js`, and `README.md`.
2. In repository **Settings → Pages**, select the branch and root folder.
3. Save and open the published URL.

## Data & privacy
Reading progress and notes are stored in localStorage in the browser on the device. Export an Excel backup regularly. Importing a workbook with the expected `Chapter Tracker` sheet replaces current local tracker data after confirmation.
