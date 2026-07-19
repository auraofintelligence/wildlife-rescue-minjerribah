# Wildlife Rescue Minjerribah

An offline-first smartphone app for safe wildlife reporting and volunteer response on
Minjerribah (North Stradbroke Island).

## What this first version proves

- A geographically accurate Minjerribah vector map with a voluntary live GPS toggle.
- Safety-first draft triage across fifteen animal groups.
- Accurate incident location using GPS, landmarks and field prompts.
- Cases saved locally on the phone without an account or server.
- Human-readable responder alerts containing a compact importable data packet.
- An installable app shell containing its own offline island map.

## Safety status

The triage wording is a **working draft**, not approved operational advice.
`TRIAGE-TREE.md` is the review document for Wildlife Rescue Minjerribah's trained and
licensed people. Contact details and every decision path must be verified before public use.

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

The bundled map is a Minjerribah extract of the 19 July 2026 Protomaps basemap,
derived from OpenStreetMap and Natural Earth data. It is rendered by MapLibre and
PMTiles. OpenStreetMap attribution remains visible on the map.
