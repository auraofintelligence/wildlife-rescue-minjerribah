# Roadmap

The app is free, offline-first, and shares by text message. Everything below is an upgrade the
group can choose later, in rough order of value.

## Next

- **Shared live database.** Today the group chat is the courier: text codes move reports
  between phones, and the coordinator's merges heal any gaps. A free-tier backend (for example
  Supabase) would replace the courier only: every "I've just seen it" would appear on every
  phone instantly, photos and video would travel, and the lookout board would update itself.
  The duck that several people watched across days is the whole business case.
- **Triage tree sign-off.** TRIAGE-TREE.md is drafted; the team's licensed people own the
  words. Their review turns the draft band off.
- **Printable evidence packs.** Turn the Report page's hotspot and cause tables into a
  one-page PDF for council or grant applications: vehicle-strike signs for this bend,
  line-disposal bins for that jetty.

## Later

- **App-store app.** Wrap the site with Capacitor for Play Store and App Store listings. The web app already installs to a home screen, so this is about reach, not features.
- **Contribute to science.** Export records in a shape that Atlas of Living Australia or iNaturalist can ingest, so island records strengthen national datasets.
- **QWildlife hand-off.** The Queensland Government's QWildlife app takes marine stranding reports. A "report this to QWildlife too" prompt on marine records would close that loop.
- **Seasonal alerts.** Koala breeding season, shearwater wreck season, turtle nesting: gentle banners that prime responders for what is coming.

## Already done (was on this roadmap)

- Photos and under-30-second video on records (device-local, IndexedDB).
- The whole island's map offline: a single Protomaps vector file ships with the app.

## Non-goals

- Ads, analytics, tracking, accounts-for-the-sake-of-accounts.
- Anything that moves ownership of the data away from the volunteers who collected it.
