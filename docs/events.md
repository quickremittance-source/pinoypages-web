# Filipino Events Calendar

Community events for kabayan across Canada: fiestas, Simbang Gabi, cultural nights, business mixers and more.

Published events live in `content/events.json`. Only events with `"status": "approved"` appear on `/events` and `/events/[slug]`. Pending submissions never auto-publish.

## Schema (`content/events.json`)

```json
{
  "schemaVersion": 1,
  "events": [
    {
      "id": "evt-2026-sample-id",
      "slug": "url-safe-name",
      "title": "Event title (English)",
      "start": "2026-12-16T18:00:00",
      "end": "2026-12-16T21:00:00",
      "timezone": "America/Toronto",
      "city": "GTA",
      "category": "church",
      "venue": "Venue name",
      "address": "123 Main St, Toronto, ON",
      "description": "Plain description. No invented claims.",
      "ticketUrl": "https://example.com/tickets",
      "listingId": "pub-optional-listing-id",
      "sourceUrl": "https://organizer.example/event",
      "sourceConfidence": "confirmed",
      "status": "approved"
    }
  ]
}
```

| Field              | Required       | Notes                                                                                                                     |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`               | yes            | Stable id. Never reuse.                                                                                                   |
| `slug`             | yes            | URL segment under `/events/`.                                                                                             |
| `title`            | yes            | Display title.                                                                                                            |
| `start` / `end`    | yes            | Local datetime without offset; `timezone` applies.                                                                        |
| `timezone`         | yes            | IANA zone, e.g. `America/Toronto`, `America/Winnipeg`.                                                                    |
| `city`             | yes            | One of: `GTA`, `Winnipeg`, `Calgary`, `Edmonton`, `Vancouver`, `Montreal`, `Ottawa`, `Other`.                             |
| `category`         | yes            | One of: `fiesta`, `church`, `community`, `business`, `cultural`.                                                          |
| `venue`            | yes            | Place name.                                                                                                               |
| `address`          | no             | Full street address for maps.                                                                                             |
| `description`      | no             | Body copy.                                                                                                                |
| `ticketUrl`        | no             | External tickets / RSVP link.                                                                                             |
| `listingId`        | no             | Permanent Pinoy Pages `listing_id` (public listings).                                                                     |
| `sourceUrl`        | yes for public | Organizer or listing page that confirmed the event. Events without a source are not published.                            |
| `sourceConfidence` | no             | `confirmed` · `expected` · `recurring` · `low`. Badge “Expected, confirm with organizer” when expected, recurring or low. |
| `status`           | yes            | `approved` (public) or `pending` (hidden).                                                                                |

Jose’s standing rule: do not invent real events. Only publish events you have verified with the organizer.

## Add an approved event

1. Open `content/events.json`.
2. Append an object with `"status": "approved"` and a unique `id` / `slug`.
3. Commit on a branch, open a preview, confirm the event on `/events` and `/events/<slug>`.
4. Merge only after Jose approves.

## Approve a pending submission

Submissions from the “Submit an event” form are stored as JSONL rows with `kind: "community-event"` (local `data/submissions.jsonl` outside Vercel; on Vercel they only appear in function logs — production storage is not persistent yet).

1. Read the pending row (logs or `data/submissions.jsonl`).
2. Confirm details with the organizer.
3. Add a matching object to `content/events.json` with `"status": "approved"`.
4. Redeploy (preview first; production only with Jose’s OK).

## Redeploy

```bash
# from a feature branch
git push -u origin HEAD
# Vercel builds a preview. Check /events on the preview URL.
# Merge to main only after Jose approves.
```

## Routes

- `/events` — month and list views; `?city=`, `?category=`, `?view=list|month`, `?month=YYYY-MM`
- `/events/[slug]` — detail (approved only)
- `/events/ics/[slug]` — `.ics` download

## Storage (submissions)

Event submissions (and other form leads) go through `src/lib/storage`:

- **Postgres** when `DATABASE_URL` is set — `@neondatabase/serverless`, table `submissions` (see `migrations/001_storage.sql`).
- **JSONL fallback** otherwise — `data/submissions.jsonl` locally; on Vercel without a database, rows appear in function logs only.

Analytics counters share the same Postgres when `DATABASE_URL` is set (`listing_stats` in the same migration). No database is provisioned by this repo; apply the migration manually when you attach one.

Pending community events are stored with `kind: "community-event"` and `status: "pending"`. They never appear on `/events` until copied into `content/events.json` with `"status": "approved"`.
