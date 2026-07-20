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
  assert.match(page, /function formatCaseAlert/);
  assert.match(page, /function copyTextWithFallback/);
  assert.match(page, /Copied\. Paste it into SMS, WhatsApp or the rescue chat\./);
  assert.match(page, /Could not auto-copy here/);
  assert.match(page, /Responder alert text/);
  assert.match(page, /\[WRM-DATA\]/);
  assert.match(page, /function extractCaseFromAlert/);
  assert.match(page, /Import case to this phone/);
  assert.match(page, /Paste a WRM alert text/);
  assert.match(page, /copyCaseAlert/);
  assert.match(page, /deleteLocalCase/);
  assert.match(page, /deleted from this phone/);
  assert.match(page, /Sure\?/);
  assert.match(page, /sms:\$\{CONTACT_NUMBER\}/);
  assert.match(page, /Open WRM Cases:/);
  assert.match(page, /Copy this whole text into the "Paste a WRM alert text" field/);
  assert.match(page, /Text Wildlife Rescue/);
  assert.match(page, /locationSource\?: "gps" \| "pin" \| "description"/);
  assert.match(page, /Use the pin I dropped/);
  assert.match(page, /Tag my position/);
  assert.match(page, /one-time tag/);
  assert.match(page, /without turning on live map tracking/);
  assert.match(page, /Improving accuracy/);
  assert.match(page, /Best position tagged/);
  assert.match(page, /window\.setTimeout\(finish,\s*12000\)/);
  assert.match(page, /WRM Field Archive/);
  assert.match(page, /wrm-field-archive/);
  assert.match(page, /function casesToCsv/);
  assert.match(page, /Backup archive/);
  assert.match(page, /Reporting CSV/);
  assert.match(page, /Merge archive/);
  assert.match(page, /There is no WRM database/);
  assert.match(page, /Recently dead or not moving/);
  assert.match(page, /Report immediately — a joey may still be saved/);
  assert.match(page, /Treat a recently dead kangaroo as urgent/);
  assert.match(page, /Treat a recently dead wallaby as urgent/);
  assert.match(page, /Case \/ type \/ place/);
  assert.match(page, /All animals/);
  assert.match(page, /Newest/);
  assert.match(page, /Oldest/);
  assert.match(page, /Animal A–Z/);
  assert.match(page, /Case ID/);
  assert.match(page, /href="#field-archive"/);
  assert.match(page, /href="#cases-top"/);
  assert.doesNotMatch(page, /cases\.slice\(0,\s*8\)/);
  assert.match(realMap, /Drop pin/);
  assert.match(realMap, /Tap map/);
  assert.match(realMap, /onDropPosition/);
  assert.match(realMap, /Map imagery information/);
  assert.match(realMap, /map-attribution-panel/);
  assert.doesNotMatch(realMap, /new maplibregl\.AttributionControl/);
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
  assert.doesNotMatch(realMap, /Map view/);
  assert.doesNotMatch(realMap, />Field</);
  assert.doesNotMatch(realMap, />Aerial</);
  assert.match(realMap, /Roads/);
  assert.match(realMap, /Labels/);
  assert.match(realMap, /Cases/);
  assert.match(realMap, /maxBounds:\s*ISLAND_BOUNDS/);
  assert.match(realMap, /INITIAL_ZOOM\s*=\s*10\.55/);
  assert.match(realMap, /INITIAL_VIEW_BOUNDS:\s*\[\[number,\s*number\],\s*\[number,\s*number\]\]/);
  assert.match(realMap, /\[153\.34,\s*-27\.55\]/);
  assert.match(realMap, /\[153\.57,\s*-27\.37\]/);
  assert.match(realMap, /fitBounds\(INITIAL_VIEW_BOUNDS/);
  assert.match(serviceWorker, /wrm-shell-v14/);
  assert.match(realMap, /minZoom:\s*INITIAL_ZOOM/);
  assert.match(realMap, /zoom:\s*Math\.max\(map\.getZoom\(\),\s*14\)/);
  assert.match(realMap, /isOnMinjerribah/);
  assert.doesNotMatch(realMap, /clip-path|polygon\(/);
  assert.match(styles, /\.real-map\.maplibregl-map/);
  assert.match(styles, /\.real-case-marker\s*\{[\s\S]*background:\s*#e9e5da/);
  assert.match(styles, /\.real-case-marker\.urgency-now::after\s*\{[\s\S]*background:\s*var\(--coral\)/);
  assert.match(styles, /\.real-case-marker\.urgency-watch::after\s*\{[\s\S]*background:\s*#4f8b58/);
  assert.match(styles, /\.real-case-marker\[data-animal="koala"\]/);
  assert.match(realMap, /element\.addEventListener\("click"/);
  assert.match(realMap, /zoom:\s*Math\.max\(map\.getZoom\(\),\s*14\)/);
  assert.match(styles, /height:\s*100%/);
  assert.match(page, /className="map-tab-frame"/);
  assert.match(page, /className="map-tab"/);
  assert.match(styles, /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*620px\)/);
  assert.match(styles, /max-width:\s*none/);
  assert.match(styles, /\.map-tab\s*\{/);
  assert.match(styles, /grid-template-columns:\s*minmax\(0,\s*1\.7fr\)\s*minmax\(255px,\s*\.8fr\)/);
  assert.match(styles, /\.real-map-wrap\s*\{[\s\S]*height:\s*auto/);
  assert.match(serviceWorker, /caches\.open/);
  assert.match(serviceWorker, /servePmtilesRange/);
  assert.ok(mapArchive.byteLength > 1_000_000);
  assert.match(manifest, /"display":\s*"standalone"/);
  assert.match(triageReview, /REGIONAL REVIEW COPY/);
  assert.match(triageReview, /\[WRM VERIFY\]/);
  assert.match(triageReview, /11\. SHARK OR RAY/);
  assert.match(triageReview, /12\. PELICAN OR LARGE WATERBIRD/);
});
