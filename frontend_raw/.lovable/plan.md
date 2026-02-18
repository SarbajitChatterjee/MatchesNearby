

# Add City-Based Proximity to useMatches

Replace the undocumented `lat`/`lng` params with a single `city` string param for "nearest" sorting.

---

## What Changes

### 1. `src/hooks/useMatches.ts`
- Add `city?: string` to `UseMatchesOptions`
- Include `city` in the React Query key so it refetches when city changes
- In the real API path, append `city` as a query param when present
- Mock mode: no change needed (mock distances are static)

### 2. `src/screens/ExploreScreen.tsx`
- Add a `userCity` state (string, initially empty)
- When user taps "Nearest" sort, prompt for location via `navigator.geolocation`
- On success, reverse-geocode coordinates to a city name using the Nominatim API (`https://nominatim.openstreetmap.org/reverse?lat=...&lon=...&format=json`) and store in `userCity`
- Pass `city: userCity` to `useMatches`
- Show the detected city as a small label near the sort chips (e.g. "Near Munich")

### 3. `BACKEND_CONTRACT.md`
- Replace `lat`/`lng` params with `city` param in the query params table
- Update the Distance Calculation section: backend receives city name, geocodes it server-side, computes Haversine
- Update the scenario example

### 4. `src/screens/SearchScreen.tsx`
- No changes needed — SearchScreen does its own client-side filtering

---

## Files Affected

| File | Action |
|------|--------|
| `src/hooks/useMatches.ts` | Modify — add `city` option, pass as query param |
| `src/screens/ExploreScreen.tsx` | Modify — detect user city via geolocation + reverse geocode, pass to hook |
| `BACKEND_CONTRACT.md` | Modify — replace `lat`/`lng` with `city`, update distance section |

---

## Technical Details

### Reverse Geocoding (client-side)
When user selects "Nearest" sort:
1. Call `navigator.geolocation.getCurrentPosition()`
2. On success, call `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json`
3. Extract `address.city` or `address.town` from response
4. Store in state, pass to `useMatches({ city })`
5. On failure (denied/timeout), show a toast and fall back to "date" sort

### Updated Query Param Table for `/api/matches`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filter` | string | `"all"` | `all`, `league`, `cup`, `international` |
| `sort` | string | `"date"` | `"date"` or `"distance"` |
| `date` | string | -- | `YYYY-MM-DD` format, filters to that day |
| `city` | string | -- | User city name for proximity sort. Backend geocodes to compute distances. |

### Backend Expectation
When `city` is provided, the backend should:
1. Geocode the city name to lat/lng (cache results)
2. Compute Haversine distance from that point to each venue
3. Populate the `distance` field (km) in each match object
4. If `sort=distance`, return matches ordered by `distance` ascending
