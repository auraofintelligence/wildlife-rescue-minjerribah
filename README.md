# Wildlife Rescue Minjerribah

An offline-first smartphone app for safe wildlife reporting and volunteer response on
Minjerribah (North Stradbroke Island).

## What this first version proves

- A geographically accurate, island-locked Minjerribah field map with an official Queensland
  aerial view, optional roads, labels and case layers, plus a voluntary live GPS toggle.
- Safety-first draft triage across the island's major wildlife groups, including separate
  paths for goannas, blue-tongues, sharks, pelicans and snake identification.
- Accurate incident location using GPS, landmarks and field prompts.
- Cases saved locally on the phone without an account or server.
- Human-readable responder alerts containing a compact importable data packet.
- An installable app shell containing its own offline island map.

## Safety status

The triage wording is a **working draft**, not approved operational advice.
`MINJERRIBAH-TRIAGE-REVIEW.txt` is the current plain-text review document for Wildlife Rescue
Minjerribah's trained and licensed people. Contact details and every decision path must be
verified before public use. `TRIAGE-TREE.md` is retained as the earlier design draft.

## Hosting status

The current `chatgpt.site` deployment is a private development preview only. It is not the
public delivery model.

The real volunteer release must use ordinary public HTTPS hosting and a trusted custom domain,
with no ChatGPT account, app account or AI branding required to open it. The release build must
remain installable as a PWA and continue working after the phone loses reception. Public access
should wait until Wildlife Rescue Minjerribah has approved the triage and contact wording.

## Run it locally on Windows

Open the folder in VS Code, then open its terminal and run:

```powershell
npm install
npm run dev
```

Open the local address shown in the terminal. Press `Ctrl+C` when you want to stop it.

## Validate a change

```powershell
npm test
```

The app stores prototype cases in the browser's local storage. Clearing browser site data
will clear those cases.

## Map data

The bundled offline map is a Minjerribah extract of the 19 July 2026 Protomaps basemap,
derived from OpenStreetMap and Natural Earth data. It is rendered by MapLibre and PMTiles.
The optional online aerial view uses the Queensland Government's Latest State Program public
imagery service. Source attribution remains visible in both views.
