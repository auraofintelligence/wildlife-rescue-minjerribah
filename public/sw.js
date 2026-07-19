const CACHE_NAME = "wrm-shell-v4";
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/maps/minjerribah.pmtiles",
  "/maps/fonts/Noto%20Sans%20Regular/0-255.pbf",
  "/maps/fonts/Noto%20Sans%20Medium/0-255.pbf",
  "/maps/fonts/Noto%20Sans%20Italic/0-255.pbf",
  "/maps/sprites/light.json",
  "/maps/sprites/light.png",
  "/maps/sprites/light@2x.json",
  "/maps/sprites/light@2x.png",
];

async function servePmtilesRange(request) {
  const cache = await caches.open(CACHE_NAME);
  const fullRequest = new Request(new URL(request.url).toString(), {
    method: "GET",
  });
  let fullResponse = await cache.match(fullRequest);

  if (!fullResponse) {
    fullResponse = await fetch(fullRequest);
    if (fullResponse.ok) {
      await cache.put(fullRequest, fullResponse.clone());
    }
  }

  const buffer = await fullResponse.arrayBuffer();
  const range = request.headers.get("range");
  const match = range && /bytes=(\d+)-(\d+)?/.exec(range);
  if (!match) return new Response(buffer, fullResponse);

  const start = Number(match[1]);
  const end = Math.min(
    match[2] ? Number(match[2]) : buffer.byteLength - 1,
    buffer.byteLength - 1,
  );
  const headers = new Headers(fullResponse.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${start}-${end}/${buffer.byteLength}`);
  headers.set("Content-Length", String(end - start + 1));

  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    statusText: "Partial Content",
    headers,
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (
    url.origin === self.location.origin &&
    url.pathname === "/maps/minjerribah.pmtiles"
  ) {
    event.respondWith(servePmtilesRange(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("/"));
    }),
  );
});
