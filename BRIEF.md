# Minjerribah Wildlife Map: project brief

The refined brief the first build worked to. Written 19 July 2026. The same day's build
sessions grew it well past this scope: the public triage door, sync by text message, cases
with sighting trails, photos and video, and the offline island vector map. README.md describes
what stands; this file stays as the original charter.

## One line

A free, mobile-first web app that lets wildlife rescue volunteers on Minjerribah (North Stradbroke Island) pin rescues and sightings on a map, record what happened, and turn those records into evidence for future signs, training and prevention.

## Who it serves

- **Responders in the field.** Log a rescue in under a minute, one-handed, in full sun, with patchy signal.
- **Coordinators.** Browse and tidy the log, combine records collected on several phones, export clean data.
- **The wider effort.** Reports that show hotspots, causes and seasons, ready to hand to council, rangers or funders.

## Hard constraints

- **Free to run.** A static site on GitHub Pages. No server, no accounts, no API keys, no subscriptions.
- **Island only.** The map is locked to Minjerribah. Records that land outside the island trigger a warning.
- **Mobile first.** Designed for a phone held in one hand; comfortable on a tablet or laptop too.
- **Light and fast.** System fonts, vendored Leaflet, no frameworks, no build step. Bright, simple, minimalist.
- **Works offline.** Records save on the device. The app shell is cached, and map tiles are cached as you use them, because island coverage is patchy.
- **The data belongs to the volunteers.** Everything lives on their own devices. Nothing is uploaded anywhere. Export any time.

## What v0 includes (this build)

Five pages:

1. **Map** (index.html): the heart of the app. See every record as a colour-coded pin, filter by condition, and add a new record by GPS or by tapping the map.
2. **Log** (log.html): every record as a searchable list. Open one to edit or delete it.
3. **Report** (report.html): counts by animal, cause, condition, month and hotspot, over any date range. Export CSV or JSON, print, and merge JSON files from other phones.
4. **Guide** (guide.html): what to do when you find an animal, who to call (verified numbers), how to log well, how to install the app on a phone.
5. **About** (about.html): what this is, data care, backup and clear, licence.

A record holds: date and time, location (GPS or map tap), place name, animal group, species, how many, condition, likely cause, notes, and who logged it.

Plus: installable as a home-screen app (PWA). That is the free "app". A native app-store version stays on the roadmap if the group ever wants it.

## What v0 leaves out (see ROADMAP.md)

A shared live database, photos, logins, an app-store app, and automatic sign generation. All are natural upgrades; none are needed to start collecting good data today.

## Design principles

- Every screen answers one question. Map: where? Log: what happened? Report: what does it add up to?
- Touch targets 44px or bigger, form text 16px or bigger, high contrast for sunlight.
- Plain Australian words. No jargon without a gloss.
- Honest gaps beat fillers: placeholder boxes name what is missing instead of faking it.
- Condition drives colour (red needs help, amber in care, green released), because triage is the first thing a responder's eye needs.
