# MatchNearby — Backend Integration Contract

This document describes the API contract between the MatchNearby frontend and your **FastAPI middleware layer**. The FastAPI backend proxies API-Football, transforms the data, and returns clean responses.

---

## Architecture

```
Frontend (React) --> Your FastAPI --> API-Football (v3.football.api-sports.io)
```

The frontend never calls API-Football directly. Your FastAPI handles authentication, data transformation, and filtering.

---

## Base URL

Set via environment variable `VITE_API_BASE_URL`. Defaults to `/api`.

---

## Endpoints

### 1. `GET /api/matches`

Returns upcoming matches, optionally filtered and sorted.

**Query params the frontend sends:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filter` | string | `"all"` | `all`, `league`, `cup`, `international` |
| `sort` | string | `"date"` | `"date"` or `"distance"` |
| `date` | string | — | `YYYY-MM-DD` format, filters to that day |
| `city` | string | — | User's city name (e.g. `"Munich"`). When present, backend geocodes it to compute distances. Required for `sort=distance` to be meaningful. |
| `next` | number | `50` | Number of upcoming fixtures |

**Example request — user in Munich, today's matches, sorted by nearest:**

```
GET /api/matches?sort=distance&date=2026-03-15&city=Munich
```

**Response** (`200 OK`):

```json
{
  "matches": [
    {
      "id": "12345",
      "homeTeam": "Arsenal",
      "awayTeam": "Liverpool",
      "homeTeamBadge": "https://media.api-sports.io/football/teams/42.png",
      "awayTeamBadge": "https://media.api-sports.io/football/teams/40.png",
      "competition": "Premier League",
      "competitionType": "league",
      "gameweek": "Regular Season - 28",
      "kickoff": "2026-03-15T15:00:00+00:00",
      "venue": "Emirates Stadium",
      "venueCity": "London",
      "latitude": 51.5549,
      "longitude": -0.1084,
      "distance": 3.2,
      "isLive": false
    }
  ]
}
```

### 2. `GET /api/filters` (optional)

```json
{
  "filters": [
    { "id": "f1", "label": "All", "value": "all" },
    { "id": "f2", "label": "League", "value": "league" },
    { "id": "f3", "label": "Cup", "value": "cup" },
    { "id": "f4", "label": "International", "value": "international" }
  ]
}
```

### 3. `GET /api/sorts` (optional)

```json
{
  "sorts": [
    { "id": "s1", "label": "Soonest", "value": "date" },
    { "id": "s2", "label": "Nearest", "value": "distance" }
  ]
}
```

---

## Error Responses

Non-200 responses should return:

```json
{
  "error": "Human-readable error message",
  "code": 500
}
```

The frontend throws on any non-200 status (`useMatches.ts` line 62), so the middleware should return appropriate HTTP status codes (400, 404, 500, 502) with the above shape.

---

## API-Football to Response Mapping

Your FastAPI calls `GET https://v3.football.api-sports.io/fixtures?season=YYYY&next=50` with the `x-apisports-key` header and maps the response:

| API-Football Field | → Response Field | Notes |
|---|---|---|
| `fixture.id` | `id` | Convert to string |
| `teams.home.name` | `homeTeam` | |
| `teams.away.name` | `awayTeam` | |
| `teams.home.logo` | `homeTeamBadge` | |
| `teams.away.logo` | `awayTeamBadge` | |
| `league.name` | `competition` | |
| `league.type` | `competitionType` | `"League"` → `"league"`, `"Cup"` → `"cup"`. For international competitions (e.g. World Cup qualifiers, Nations League), set `"international"` based on league metadata or a curated list. |
| `league.round` | `gameweek` | e.g. "Regular Season - 28" or "Quarter-finals" |
| `fixture.date` | `kickoff` | ISO 8601 |
| `fixture.venue.name` | `venue` | |
| `fixture.venue.city` | `venueCity` | |

### `isLive` Detection

Set `isLive: true` when `fixture.status.short` is one of:

| Status Code | Meaning |
|-------------|---------|
| `1H` | First half |
| `2H` | Second half |
| `HT` | Half-time |
| `ET` | Extra time |
| `P` | Penalties |
| `BT` | Break time |
| `LIVE` | Live (generic) |

All other status values → `isLive: false` (or omit the field).

### Venue Coordinates

**Important:** API-Football fixture responses do **not** include venue latitude/longitude. The middleware must source coordinates separately:

- **Option A (recommended):** Call `GET /venues?search={venue_name}` and cache results. The `/venues` endpoint returns `venue.address`, `venue.city`, and sometimes GPS data.
- **Option B:** Maintain a static lookup table of known venue coordinates.
- **Option C:** Use a geocoding API (e.g. Google Maps, Nominatim) with `"{venue_name}, {venue_city}"` as the query.

If coordinates cannot be resolved, omit `latitude` and `longitude` from the response. The frontend adapter defaults them to `0, 0` (see `matchAdapter.ts` line 54–55).

### Distance Calculation

When the frontend sends the `city` query param:

1. **Geocode the city name** to lat/lng coordinates (cache results to avoid repeated lookups).
2. **Compute Haversine distance** (in km) between the geocoded city coordinates and each venue's coordinates.
3. **Include the result** as the `distance` field (number, in km) in each match object.
4. If `sort=distance`, return matches **ordered by `distance` ascending**.
5. When no `city` param is provided, omit the `distance` field entirely.

---

## Frontend Adapter

The frontend includes `src/lib/matchAdapter.ts` which maps the response above into the internal `Match` type. Key transformations:

- `venueCity` → `venueAddress`
- `latitude` / `longitude` default to `0` if missing
- `competitionType` defaults to `"league"` if missing

---

## How to Connect

1. Set `VITE_API_BASE_URL=https://your-api.com/api` in your environment
2. Set `IS_DEVELOPER = false` in `src/lib/constants.ts`
3. The `useMatches` hook will automatically switch from mock data to real API calls

---

## TypeScript Types

| File | Contains |
|------|----------|
| `src/types/sdui.ts` | `Match`, `FilterOption`, `SortOption` — the internal frontend types used by all UI components |
| `src/lib/matchAdapter.ts` | `BackendMatch` interface (the exact JSON shape from FastAPI) and `toMatch()` / `toMatchList()` adapter functions |
