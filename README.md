# QR Asset Tracker

A web application for tracking physical assets using QR codes and GPS. Scan a QR code with any phone browser and the system records the device, location, and timestamp — giving you a live map of where every asset was last seen.

---

## What it does

- **Create assets** — give each physical item (laptop, phone, router, tablet) a name and category. A unique QR code is generated immediately.
- **Scan to track** — anyone with the link (printed on a label or a QR sticker) opens the scan page in their phone browser. The app requests GPS permission and records the location, device info, and time.
- **Live map dashboard** — all active assets appear as pins on a map at their last scanned location. Cluster view keeps it readable when many assets are close together.
- **Scan history** — every scan is stored with coordinates, accuracy, device (type / OS / browser), scanner identity, and notes.
- **Appearance settings** — 12 colour presets and light/dark mode, applied instantly across the whole app.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix UI primitives) |
| Icons | Lucide React |
| Auth | NextAuth.js v5 (Credentials provider, JWT sessions) |
| Database | Neon serverless PostgreSQL |
| ORM | Drizzle ORM |
| Validation | Zod |
| Forms | React Hook Form + @hookform/resolvers |
| Maps | Leaflet + React Leaflet + leaflet.markercluster |
| QR scanning | html5-qrcode |
| QR generation | qrcode (server-side PNG) |
| Data fetching | SWR (30 s polling) |
| Toasts | Sonner |
| Theming | next-themes |
| Password hashing | bcryptjs |

---

## Project structure

```
app/
├── (auth)/login/          # Login page
├── (app)/                 # Authenticated shell (sidebar + topbar)
│   ├── dashboard/         # Map + stats overview
│   ├── assets/            # Asset list, create, and detail pages
│   ├── scan/              # QR code grid + activity feed
│   └── settings/          # Appearance settings
├── (scan)/s/[qrCode]/     # Public scan landing page (no auth required)
└── api/
    ├── assets/            # CRUD + QR PNG download
    ├── scans/             # Record a scan
    └── dashboard/stats/   # Aggregate counts

components/
├── assets/        # AssetTable, CreateAssetForm, AssetDetailTabs, QRCodeDisplay
├── dashboard/     # DashboardShell, StatCard, AssetSidebar
├── layout/        # Sidebar, TopBar, NavItem, MobileNav
├── map/           # AssetMap, AssetPin, AssetPopup, MapControls
├── scan/          # ScanPageClient
├── scanner/       # QRScanner, ScanLanding (the public phone page)
├── settings/      # AppearanceTab
└── ui/            # All shadcn/ui primitives

lib/
├── auth/          # NextAuth config
├── db/            # Drizzle client + schema
├── qr/            # QR code generation helpers
├── validations/   # Zod schemas for assets and scans
├── device.ts      # Browser device/OS/UA detection
├── themes.ts      # 12 colour presets + CSS variable builder
└── utils.ts       # cn(), formatCoords(), formatRelativeTime(), etc.

hooks/
├── useAssets.ts       # SWR list with status/category filters
├── useAsset.ts        # SWR single asset detail
└── useGeolocation.ts  # Browser Geolocation API wrapper

scripts/
└── seed.ts        # Populates DB with demo assets and scans

types/
└── index.ts       # Shared TypeScript interfaces
```

---

## Database schema

Three tables in Neon PostgreSQL, managed by Drizzle ORM.

```
users
  id          UUID PK
  name        text
  email       text UNIQUE
  password    text (bcrypt hash)
  role        text  — "admin" | "scanner"
  created_at  timestamp

assets
  id          UUID PK
  name        text
  category    text  — laptop | phone | router | tablet | other
  description text
  qr_code     text UNIQUE  — UUID string encoded into the QR image
  status      text  — active | inactive | lost
  created_by  UUID FK → users
  created_at  timestamp

scans
  id          UUID PK
  asset_id    UUID FK → assets
  scanned_by  UUID FK → users
  latitude    numeric(10,7)
  longitude   numeric(10,7)
  accuracy    numeric(6,2)  — GPS accuracy in metres
  notes       text
  device_info text          — JSON blob from collectDeviceInfo()
  scanned_at  timestamp
```

Indexes on `assets.qr_code`, `assets.status`, `scans.asset_id`, and `scans.scanned_at`.

Assets are never hard-deleted — deactivation sets `status = 'inactive'`.

---

## How a scan works end-to-end

1. An admin creates an asset. The server generates a UUID, stores it as `qr_code`, and returns a PNG from `/api/assets/[id]/qr` (encoded URL: `APP_URL/s/<uuid>`).
2. The QR is printed and stuck to the physical item.
3. A user scans it with their phone camera. The browser opens `APP_URL/s/<uuid>`.
4. `ScanLanding` (client component) calls `collectDeviceInfo()` to capture device type, OS, browser, and screen size.
5. It then calls the browser Geolocation API (`useGeolocation` hook) to get GPS coordinates.
6. A `POST /api/scans` request is sent with `{ qr_code, latitude, longitude, accuracy, deviceInfo }`.
7. The API resolves the `qr_code` UUID to an `asset_id`, validates the payload with Zod, writes a row to `scans`, and returns success.
8. The dashboard map re-fetches via SWR and moves the pin to the new location.

---

## Authentication

NextAuth v5 with the Credentials provider. Email + bcrypt-hashed password only (no OAuth). Sessions use JWT strategy. The `AUTH_SECRET` environment variable signs tokens. All `(app)` routes are protected — the root layout calls `auth()` and redirects to `/login` if there is no session.

Two roles exist in the schema (`admin`, `scanner`) but both currently have the same access. The role field is available for future permission gating.

---

## Theming

Global styles live in `app/globals.css` using Tailwind v4's `@theme inline` CSS variable system. Two base themes (light/dark) are defined there. On top of that, `lib/themes.ts` defines 12 colour presets (Violet Space, Indigo, Electric Blue, Sky, Teal, Emerald, Lime, Amber, Sunset, Rose, Fuchsia, Crimson). Each preset is a single hue value (0–360); `applyPreset(hue, dark)` writes a handful of derived CSS variables directly to `document.documentElement.style`, which beats stylesheet specificity and takes effect instantly.

The selected preset is persisted in `localStorage`. `components/providers.tsx` re-applies it on every page load and on theme (dark/light) toggle.

---

## Local development

### Prerequisites

- Node.js 20+
- pnpm
- A Neon PostgreSQL database (free tier is enough)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create environment file
cp .env.example .env      # then fill in the values below

# 3. Push schema to the database
pnpm db:migrate

# 4. (Optional) Seed demo data
pnpm db:seed

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Login with `admin@qrasset.local` / `password123` if you ran the seed.

### Environment variables

```env
# PostgreSQL connection string from Neon dashboard
DATABASE_URI="postgresql://..."

# Any long random string — used to sign JWT tokens
AUTH_SECRET="..."

# Public base URL — used to build QR code scan URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Display name shown in the app
NEXT_PUBLIC_APP_NAME="QR Asset Tracker"

# CartoDB map tile URLs (defaults below work as-is)
NEXT_PUBLIC_MAP_TILE_LIGHT=https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
NEXT_PUBLIC_MAP_TILE_DARK=https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=© OpenStreetMap contributors © CARTO
```

Add `AUTH_URL=http://localhost:3000` to `.env.local` for the NextAuth redirect to work in development.

### Database commands

```bash
pnpm db:generate   # generate a new migration after schema changes
pnpm db:migrate    # apply pending migrations
pnpm db:studio     # open Drizzle Studio (visual table browser)
pnpm db:seed       # populate demo users, assets, and scans
```

---

## API reference

### Assets

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/assets` | List assets. Query: `?status=active&category=laptop` |
| `POST` | `/api/assets` | Create asset. Body: `{ name, category, description? }` |
| `GET` | `/api/assets/[id]` | Single asset with scans |
| `PATCH` | `/api/assets/[id]` | Update name / category / status / description |
| `DELETE` | `/api/assets/[id]` | Soft-delete (sets status to inactive) |
| `GET` | `/api/assets/[id]/qr` | Download QR code as PNG |

### Scans

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/scans` | Record a scan. Body: `{ qr_code, latitude, longitude, accuracy?, notes?, deviceInfo? }` |
| `GET` | `/api/scans/[assetId]` | Paginated scans for an asset. Query: `?page=1&limit=20` |

### Dashboard

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Returns `{ totalAssets, activeToday, lastScanTime, totalScans }` |

---

## Key design decisions

**Drizzle `selectDistinctOn` instead of correlated subqueries** — Drizzle's `sql` template generates unqualified column references in correlated subqueries when run against Neon's HTTP adapter, causing every `latestScan` to return `null`. All "latest scan per asset" queries use `selectDistinctOn([scans.assetId])` ordered by `desc(scans.scannedAt)` instead.

**`"use client"` wrapper for NextAuth ThemeProvider** — Next.js 16 + React 19 surfaces a console error when a third-party library injects a `<script>` tag during server rendering. Wrapping `ThemeProvider` in `components/providers.tsx` with the `"use client"` directive creates a proper client boundary and eliminates the warning.

**CSS variable theming via inline styles** — Tailwind v4 resolves CSS variables at build time, so runtime overrides via `document.documentElement.style.setProperty` use inline style specificity (highest) to win over the stylesheet. This lets colour presets apply instantly without a page reload or class swap.

**GPS stored as `numeric(10,7)`** — Gives 7 decimal places of precision (~1 cm), avoids JavaScript floating-point drift when reading back from the database.

**Device info captured before geolocation** — `collectDeviceInfo()` runs synchronously from the browser before the async GPS request. Even if the user denies location permission the device record is captured client-side so it can be included in the scan payload.
