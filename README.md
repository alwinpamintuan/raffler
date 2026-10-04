# Raffler — the raffle edition

An affectionate raffle parody in honor of [Rappler](https://www.rappler.com/). Independently made and unaffiliated. Built with React 17 and Create React App; deployed under `/raffler/` on GitHub Pages.

## Run locally

```sh
npm ci
npm start
```

For the production preview, including offline behavior and the deployed base path:

```sh
npm run build
npm run preview
```

Open http://localhost:4173/raffler/. Stop the preview with Ctrl+C. `PORT` overrides its default port.

## Raffle workflow

- Add participants individually, paste names on separate lines, or import `.txt` / `.csv` files. Imports show a preview before adding to the existing pool.
- CSV requires a `name` header and optionally `tickets`. Quoted commas, escaped quotes, and multiline fields are supported. Counts must be positive whole numbers. Imports are limited to 1 MB / 10,000 rows; the pool supports up to 1,000,000 tickets.
- Choose **One ticket per name** to ignore repetitions and CSV counts. Choose **Combine repeats into tickets** to add repeated names and CSV weights together. Existing names keep their spelling and stable ID. Matching ignores case and surrounding spaces.
- Edit each participant's ticket count for additional chances. Every ticket has equal probability, using Web Crypto with rejection sampling; animation does not determine the outcome.
- A winner can lose all their tickets, one ticket, or no tickets. Draw one winner at a time, with a three-second reveal or instant mode. Reduced-motion preference also skips suspense.
- Undo restores the last draw's exact pool and removes its result. Editing the pool or clearing history invalidates Undo. Clearing history does not restore removed participants.
- Copy results or export CSV. Presentation mode hides setup; fullscreen is available in supporting browsers. Escape exits presentation.

## Saved sessions and offline use

Saving is **manual** and local to the current browser and device. Refresh starts a fresh raffle. Use **Save session**, then **Saved → Load** to continue later. A saved edition includes the eligible pool, draw rules, and winner history; transient animation and Undo are not stored. Updating, saving a copy, renaming, and deleting are explicit actions. Loading over unsaved changes requires confirmation.

The postbuild step stamps the service worker with the build's asset-manifest hash, so every changed build installs a new offline cache. Completed installation caches the application shell and hashed assets. After one completed online visit, it can reopen offline. External Google Fonts use system fallbacks offline; there are no remote raffle APIs. Browser storage or cache restrictions may prevent saving or offline use, but the online raffle remains usable.

## Verification

```sh
npm test -- --watchAll=false --runInBand
npm run build
```

Tests cover imports, duplicates, weighted selection boundaries, all removal policies, undo, repeated draws, locking and timer cleanup, manual session persistence, storage errors, copy/export, presentation, and service worker caching and isolation. Browser review covers desktop, tablet, 375px mobile, imports, session loading, presentation, and offline reopening.

Publishing is separate: `npm run deploy` builds and publishes to the existing GitHub Pages branch. It is not run during local implementation or verification.
