# Filipino Food Finder (`/food`)

Preview-only feature. Lists restaurants, bakeries, groceries and caterers from
`content/public-listings.json` — never scraped or invented.

## Classification

| Source category | Food type |
| --- | --- |
| `groceries` | grocery |
| `food` + name matches bakery keywords | bakery |
| `food` + name matches catering keywords | caterer |
| remaining `food` | restaurant |

Listings outside `food` / `groceries` are excluded. Food-adjacent names in other
categories (for example catering under `events`) are reported as unclassified;
they are not shown until an editor moves them into the right category.

Dish tags are **never** inferred from names. They stay empty until an owner
submits a suggestion and an editor approves it into `content/food-meta.json`.

## Owner updates (moderation)

1. Owner fills **Suggest an update** on `/food` (dish tags, menu URL; featured
   dishes only when the listing tier is `business_card` or `premium`).
2. Payload is stored with `status: "pending"`:
   - Postgres (`submissions` + `food_updates`) when `DATABASE_URL` is set
   - otherwise `data/submissions.jsonl` (local only)
3. Editor reviews pending rows, then copies approved fields into
   `content/food-meta.json` and deploys. Nothing is auto-published.

Apply `migrations/001_storage.sql` once on the Neon database (Preview).

## Menu freshness

Menu URL is free. Uploaded / featured dishes are a paid perk. Both show
**Last updated**; after 90 days a stale flag appears.

## GA4

`food_search`, `dish_tag_click`, `menu_view` with `listing_id` / `tier`. No-ops
without `NEXT_PUBLIC_GA_ID`.
