# ⚽ MatchesNearby

> **Discover live football matches happening in your city, right now.**

MatchesNearby is a mobile application that instantly connects football fans with local games. Built with a decoupled frontend and a highly optimized Python backend, the platform bypasses restrictive third-party API limits through a custom "Sync & Cache" engine, delivering instant results to users.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=Capacitor&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 📱 App Preview

<table>
  <tr>
    <td align="center"><b>Home Screen</b></td>
    <td align="center"><b>City Filter</b></td>
    <td align="center"><b>Match Details</b></td>
  </tr>
  <tr>
    <!-- <td><img src="./assets/homeScreen.png" width="250" alt="Explore Screen"></td> -->
    <!-- <td><img src="./assets/searchScreen.png" width="250" alt="Search Screen"></td> -->
    <!-- <td><img src="./assets/matchDetails.png" width="250" alt="Match Details"></td> -->
    <td>*Coming Soon 🚧*</td>
    <td>*Coming Soon 🚧*</td>
    <td>*Coming Soon 🚧*</td>
  </tr>
</table>

---

## 🎯 The Problem & The Solution

**The Problem:** Sports APIs (like API-Football) provide incredible data but enforce strict daily rate limits (e.g., 100 requests/day). A standard mobile app fetching data directly from the API would crash after 100 user opens. Furthermore, mobile apps doing heavy mathematical geocoding drain battery and rely on expensive mapping APIs.

**The Solution:** 1. **The Sync Engine:** A FastAPI middleware layer acts as a gatekeeper. It fetches data from API-Football *once*, caches it in a highly scalable Supabase PostgreSQL database, and serves thousands of mobile users practically for free.
2. **Lean Location Architecture:** Instead of doing complex backend coordinate math, the app uses an efficient text-based city filter and offloads the actual routing and distance calculations to the user's native phone OS (Apple Maps / Google Maps) via deep links.

---

## ✨ Key Features

* **Instant "City Vicinity" Filtering:** Type your city and instantly see all matches in your area via optimized Postgres `ILIKE` queries.
* **Smart Caching:** Built-in `sync_log` ensures the third-party API is only hit when data is genuinely stale (e.g., >6 hours old).
* **Server-Driven UI (SDUI):** Filter and sort chips (e.g., "League", "Cup", "Nearest") are delivered by the backend. New categories can be added without forcing users to download an app update.
* **Native Map Handoff:** Tapping a stadium name fires a deep link (`maps://?q=Stadium+Name`), utilizing the phone's native hardware for live traffic and routing.

---

## 🏗️ Architecture Overview

The project is split into two distinct repositories/folders:

### 1. Mobile Frontend (`/frontend`)
* **Framework:** React, built with Vite and packaged for native mobile via **Capacitor**.
* **Styling:** Tailwind CSS with a highly modular, reusable component system.
* **State Management:** React Query (`useMatches.ts`) handles data fetching, loading states, and integrates with the backend via environment variables.

### 2. Backend API (`/backend`)
* **Framework:** Python **FastAPI** (Asynchronous, lightning-fast).
* **Database:** **Supabase** (PostgreSQL).
* **Infrastructure:** Fully containerized via Docker for seamless CI/CD and deployment.

#### Data Flow Model
```text
User Opens App 
 └── GET /api/matches?city=Munich 
      └── FastAPI checks Supabase 'sync_log'
           ├── [CACHE HIT]: Read Matches from DB ──> Return JSON
           └── [CACHE MISS]: Fetch API-Football ──> Transform ──> Save to DB ──> Return JSON
