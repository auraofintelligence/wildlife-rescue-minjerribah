import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server renders the Wildlife Rescue app shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Wildlife Rescue Minjerribah<\/title>/i);
  assert.match(html, /Wildlife needs help\?/i);
  assert.match(html, /Show my location/i);
  assert.match(html, /Start a wildlife report/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps offline, GPS, real-map and safety features in the product source", async () => {
  const [page, realMap, styles, serviceWorker, manifest, mapArchive, triageReview] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/RealMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/maps/minjerribah.pmtiles", import.meta.url)),
    readFile(new URL("../MINJERRIBAH-TRIAGE-REVIEW.txt", import.meta.url), "utf8"),
  ]);

  assert.match(page, /watchPosition/);
  assert.match(page, /enableHighAccuracy:\s*true/);
  assert.match(page, /localStorage\.setItem\("wrm-cases"/);
  assert.match(page, /isLocalPreview/);
  assert.match(page, /Draft guidance awaiting Wildlife Rescue Minjerribah review/);
  assert.match(page, /id:\s*"koala"/);
  assert.match(page, /id:\s*"snake"/);
  assert.match(page, /Sea snake/);
  assert.match(page, /Eastern brown or brown-looking snake/);
  assert.match(page, /Red-bellied black or similar black snake/);
  assert.match(page, /Common or green tree snake/);
  assert.match(page, /id:\s*"goanna"/);
  assert.match(page, /id:\s*"blue-tongue"/);
  assert.match(page, /id:\s*"shark"/);
  assert.match(page, /id:\s*"pelican"/);
  assert.match(page, /Assume it may defend itself/);
  assert.match(page, /id:\s*"bat"/);
  assert.match(page, /id:\s*"unsure"/);
  assert.match(realMap, /maplibregl\.Map/);
  assert.match(realMap, /minjerribah\.pmtiles/);
  assert.match(realMap, /OpenStreetMap/);
  assert.match(realMap, /LatestStateProgram_AllUsers/);
  assert.match(realMap, /Field/);
  assert.match(realMap, /Aerial/);
  assert.match(realMap, /Roads/);
  assert.match(realMap, /Labels/);
  assert.match(realMap, /Cases/);
  assert.match(realMap, /maxBounds:\s*ISLAND_BOUNDS/);
  assert.match(realMap, /minZoom:\s*11\.1/);
  assert.match(realMap, /isOnMinjerribah/);
  assert.doesNotMatch(realMap, /clip-path|polygon\(/);
  assert.match(styles, /\.real-map\.maplibregl-map/);
  assert.match(styles, /height:\s*100%/);
  assert.match(serviceWorker, /caches\.open/);
  assert.match(serviceWorker, /servePmtilesRange/);
  assert.ok(mapArchive.byteLength > 1_000_000);
  assert.match(manifest, /"display":\s*"standalone"/);
  assert.match(triageReview, /REGIONAL REVIEW COPY/);
  assert.match(triageReview, /\[WRM VERIFY\]/);
  assert.match(triageReview, /11\. SHARK OR RAY/);
  assert.match(triageReview, /12\. PELICAN OR LARGE WATERBIRD/);
});
