/* Only Raffler's own scope and assets are cached. Hashed build assets are
   precached on install, so the first completed online visit works offline. */
const scopeURL = new URL(self.registration.scope);
const cachePrefix = `raffler-${scopeURL.pathname.replace(/\W/g, "_")}-`;
const cacheName = `${cachePrefix}__BUILD_REVISION__`;
const shellURL = new URL("index.html", scopeURL).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const manifestResponse = await fetch(
        new URL("asset-manifest.json", scopeURL),
        { cache: "no-store" },
      );
      if (!manifestResponse.ok)
        throw new Error("Build assets are unavailable.");
      const manifest = await manifestResponse.json();
      const assets = Object.values(manifest.files)
        .filter((path) => !path.endsWith(".map"))
        .map((path) => new URL(path, scopeURL).href)
        .filter(
          (url) =>
            new URL(url).origin === scopeURL.origin &&
            new URL(url).pathname.startsWith(scopeURL.pathname),
        );
      const cache = await caches.open(cacheName);
      await cache.addAll([
        ...new Set([
          shellURL,
          new URL("manifest.json", scopeURL).href,
          new URL("favicon.ico", scopeURL).href,
          new URL("ios/180.png", scopeURL).href,
          new URL("android/android-launchericon-192-192.png", scopeURL).href,
          new URL("maskable_icon.png", scopeURL).href,
          ...assets,
        ]),
      ]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(cachePrefix) && name !== cacheName)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== scopeURL.origin ||
    !url.pathname.startsWith(scopeURL.pathname)
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(cacheName);
        try {
          // The cached shell and its hashed bundles belong to the same build.
          // A new worker installs the next build as a complete set.
          const response = await fetch(request);
          if (response.ok) return response;
          return (await cache.match(shellURL)) || response;
        } catch {
          return (
            (await cache.match(shellURL)) ||
            new Response(
              "Raffler needs one online visit before it can open offline.",
              { status: 503, headers: { "Content-Type": "text/plain" } },
            )
          );
        }
      })(),
    );
  } else {
    event.respondWith(
      (async () => {
        const cache = await caches.open(cacheName),
          cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (
          response.ok &&
          /\.(js|css|png|ico|woff2?|json)$/.test(url.pathname)
        ) {
          event.waitUntil(cache.put(request, response.clone()));
        }
        return response;
      })(),
    );
  }
});
