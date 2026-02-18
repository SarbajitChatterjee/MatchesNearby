-- =================================================================
-- MatchNearby — Database Schema
-- =================================================================
-- MATCHES TABLE
-- -----------------------------------------------------------------
-- Stores transformed match data from API-Football.
-- Acts as both a cache (avoid repeated API calls) and persistent
-- storage (historical data for analytics later).
--
-- The primary key is the API-Football fixture ID (as text).
-- Using UPSERT means: if the match already exists, update it
-- (kickoff time might change, match might go live); if it's new,
-- insert it.
-- -----------------------------------------------------------------

CREATE TABLE matches (
    id                  TEXT PRIMARY KEY,        -- API-Football fixture ID (stored as string)
    home_team           TEXT NOT NULL,
    away_team           TEXT NOT NULL,
    home_team_badge     TEXT,                    -- URL to team crest image
    away_team_badge     TEXT,                    -- URL to team crest image
    competition         TEXT NOT NULL,           -- e.g. "Premier League", "Champions League"
    competition_type    TEXT NOT NULL,           -- 'league', 'cup', or 'international'
    gameweek            TEXT,                    -- e.g. "Regular Season - 28" or "Quarter-finals"
    kickoff             TIMESTAMPTZ NOT NULL,    -- Full date + time + timezone
    venue               TEXT,                    -- Stadium name (used by frontend to open maps)
    venue_city          TEXT,                    -- City name (combined with venue for maps deep link)
    is_live             BOOLEAN DEFAULT FALSE,   -- True when the match is currently in progress
    league_id           INTEGER NOT NULL,        -- API-Football league ID (for sync tracking)
    match_date          DATE NOT NULL,           -- Derived from kickoff; enables fast date queries
    synced_at           TIMESTAMPTZ DEFAULT NOW(), -- When this row was last refreshed from the API
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Primary query pattern: "show me all matches on 2026-03-15"
CREATE INDEX idx_matches_date ON matches(match_date);

-- Filter by competition type: "show me only league matches"
CREATE INDEX idx_matches_competition_type ON matches(competition_type);

-- Combined: "show me league matches on 2026-03-15" (most common frontend query)
CREATE INDEX idx_matches_date_type ON matches(match_date, competition_type);


-- -----------------------------------------------------------------
-- SYNC LOG TABLE
-- -----------------------------------------------------------------
-- Tracks WHEN we last fetched data for each league + date combo.
-- This is the decision-maker for "should we call API-Football?"
--
-- Why a separate table? Because a date might have ZERO matches.
-- If the PL has no games on a Wednesday, there are no match rows
-- to check. The sync_log records "we checked and found nothing"
-- vs "we haven't checked yet." Without this, the system would
-- call API-Football on every request for that empty date.
-- -----------------------------------------------------------------

CREATE TABLE sync_log (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    league_id       INTEGER NOT NULL,
    sync_date       DATE NOT NULL,
    synced_at       TIMESTAMPTZ DEFAULT NOW(),

    -- One entry per league + date combination.
    -- UPSERT uses this constraint to update the timestamp on re-sync.
    UNIQUE(league_id, sync_date)
);

-- Fast lookup: "was league 39 synced for 2026-03-15 recently?"
CREATE INDEX idx_sync_log_lookup ON sync_log(league_id, sync_date);
