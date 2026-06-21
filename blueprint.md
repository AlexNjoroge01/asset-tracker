# BLUEPRINT.md — QR Asset Tracker

> A web + mobile application for scanning QR-coded assets, auto-capturing GPS location, and visualising all assets on a live interactive map dashboard.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication](#5-authentication)
6. [API Routes](#6-api-routes)
7. [Pages & Components](#7-pages--components)
8. [Map Dashboard (Detail)](#8-map-dashboard-detail)
9. [QR Code System](#9-qr-code-system)
10. [Scanner Flow](#10-scanner-flow)
11. [shadcn/ui Component Map](#11-shadcnui-component-map)
12. [Notifications (Sonner)](#12-notifications-sonner)
13. [UI Design System](#13-ui-design-system)
14. [Environment Variables](#14-environment-variables)
15. [Build Order for Coding Agent](#15-build-order-for-coding-agent)

---

## 1. Project Overview

**App Name:** QR Asset Tracker (working title — rename as needed)

**Routing:** Next.js App Router exclusively. No `pages/` directory. All routes live under `app/`.

**Purpose:** Scan a QR code attached to any physical device or asset using a phone camera. The browser auto-captures the phone's GPS coordinates at scan time and saves the asset's location to a PostgreSQL database. A dashboard displays all tracked assets on a live map with pins, cluster groups, scan history, and metadata panels.

**Core User Journey:**
```
User opens app on phone
  → Navigates to /scan
    → Points camera at QR code on asset
      → Browser captures GPS coordinates
        → POST to API → saved to DB
          → Sonner toast confirms
            → Map on dashboard updates with new pin
```

**Two main actors:**
- **Admin** — manages assets, generates QR codes, views full dashboard
- **Scanner** — scans assets in the field (can be the same person or a field agent)

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15.1.1+ | App Router, TypeScript, `src/` optional |
| Language | TypeScript | Strict mode enabled |
| Styling | Tailwind CSS v4 | With CSS variables for theming |
| Component Library | shadcn/ui | All UI primitives — see Section 11 |
| Auth | NextAuth.js v5 (Auth.js) | Credentials provider, JWT strategy |
| Database | Neon | PostgreSQL serverless |
| ORM | Drizzle ORM | With `drizzle-kit` for migrations |
| Map | Leaflet.js via `react-leaflet` | Dynamic import only (`ssr: false`) |
| Map Clustering | `leaflet.markercluster` | Group pins when zoomed out |
| QR Scanner | `html5-qrcode` | Mobile browser camera access |
| QR Generator | `qrcode` (npm) | Server-side PNG generation |
| Notifications | Sonner | Integrated via shadcn/ui Sonner component |
| Icons | Lucide React | Bundled with shadcn/ui |
| Date formatting | `date-fns` | |
| Package manager | pnpm | |

---

## 3. Project Structure

```
qr-asset-tracker/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                    # Minimal centered layout for auth pages
│   │   └── login/
│   │       └── page.tsx                  # Login page
│   ├── (app)/
│   │   ├── layout.tsx                    # App shell: sidebar + topbar + <Toaster />
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Live map dashboard (default route)
│   │   ├── assets/
│   │   │   ├── page.tsx                  # Asset list table
│   │   │   ├── new/
│   │   │   │   └── page.tsx              # Create asset + QR generation
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Asset detail + scan history
│   │   ├── scan/
│   │   │   └── page.tsx                  # QR scanner (mobile-first)
│   │   └── settings/
│   │       └── page.tsx                  # App settings
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── assets/
│   │   │   ├── route.ts                  # GET all assets, POST new
│   │   │   └── [id]/
│   │   │       ├── route.ts              # GET one, PATCH, DELETE
│   │   │       └── qr/
│   │   │           └── route.ts          # GET QR PNG for asset
│   │   └── scans/
│   │       ├── route.ts                  # POST new scan
│   │       └── [assetId]/
│   │           └── route.ts              # GET scan history
│   ├── globals.css                       # Tailwind + shadcn CSS variables
│   └── layout.tsx                        # Root layout (fonts, html/body)
│
├── components/
│   ├── map/
│   │   ├── AssetMap.tsx                  # Leaflet map — dynamic import wrapper
│   │   ├── AssetMapInner.tsx             # Actual MapContainer (client-only)
│   │   ├── AssetPin.tsx                  # Custom DivIcon marker per category
│   │   ├── AssetPopup.tsx                # Leaflet Popup content using shadcn Card
│   │   └── MapControls.tsx               # Fit-all button, layer picker, category filter
│   ├── scanner/
│   │   ├── QRScanner.tsx                 # html5-qrcode wrapper — dynamic import
│   │   └── ScanResult.tsx                # Post-scan confirmation using shadcn Card + Badge
│   ├── assets/
│   │   ├── AssetCard.tsx                 # shadcn Card for grid view
│   │   ├── AssetTable.tsx                # shadcn Table + shadcn Badge for status
│   │   ├── AssetTableSkeleton.tsx        # shadcn Skeleton rows
│   │   ├── AssetFilters.tsx              # shadcn Select + Input for filtering
│   │   ├── CreateAssetForm.tsx           # shadcn Form + Input + Select + Button
│   │   └── QRCodeDisplay.tsx             # QR image + shadcn Button for download/print
│   ├── dashboard/
│   │   ├── StatCard.tsx                  # shadcn Card variant for metric tiles
│   │   ├── StatCardSkeleton.tsx          # shadcn Skeleton for stat cards
│   │   ├── AssetSidebar.tsx              # Scrollable sidebar with asset list items
│   │   └── DashboardShell.tsx            # Layout container for map + sidebar + stats
│   ├── layout/
│   │   ├── Sidebar.tsx                   # shadcn Sheet (mobile) / static (desktop)
│   │   ├── TopBar.tsx                    # shadcn DropdownMenu for user menu
│   │   ├── MobileNav.tsx                 # Bottom navigation for mobile
│   │   └── NavItem.tsx                   # Individual nav link with active state
│   └── ui/
│       └── EmptyState.tsx                # Custom empty state using shadcn Card
│
├── lib/
│   ├── db/
│   │   ├── index.ts                      # Drizzle client (neon http adapter)
│   │   └── schema.ts                     # All table definitions
│   ├── auth/
│   │   └── index.ts                      # NextAuth config + session types
│   ├── qr/
│   │   └── generate.ts                   # qrcode npm helper
│   ├── validations/
│   │   ├── asset.ts                      # Zod schemas for asset forms
│   │   └── scan.ts                       # Zod schemas for scan POST
│   └── utils.ts                          # cn(), formatCoords(), formatRelativeTime()
│
├── hooks/
│   ├── useAssets.ts                      # SWR/fetch hook for asset list
│   ├── useAsset.ts                       # SWR/fetch hook for single asset
│   └── useGeolocation.ts                 # GPS capture hook with permission state
│
├── types/
│   └── index.ts                          # Shared TS types: Asset, Scan, User, etc.
│
├── drizzle/
│   └── migrations/                       # Auto-generated by drizzle-kit
│
├── public/
│   └── marker-icons/                     # Custom Leaflet marker SVGs per category
│
├── middleware.ts                          # Auth route protection
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── components.json                        # shadcn/ui config
└── .env.local
```

---

## 4. Database Schema

### Tables

#### `users`
```
id          uuid          PK, default gen_random_uuid()
name        text          not null
email       text          unique, not null
password    text          nullable  — bcrypt hash
role        text          default 'scanner'  — 'admin' | 'scanner'
created_at  timestamp     default now()
```

#### `assets`
```
id            uuid        PK, default gen_random_uuid()
name          text        not null               — "Dell Laptop #4"
category      text        not null               — "laptop" | "phone" | "router" | "tablet" | "other"
description   text        nullable
qr_code       text        unique, not null       — UUID v4 encoded in QR image
status        text        default 'active'       — 'active' | 'inactive' | 'lost'
created_by    uuid        FK → users.id
created_at    timestamp   default now()
```

#### `scans`
```
id            uuid           PK, default gen_random_uuid()
asset_id      uuid           FK → assets.id, not null
scanned_by    uuid           FK → users.id, not null
latitude      numeric(10,7)  not null
longitude     numeric(10,7)  not null
accuracy      numeric(6,2)   nullable   — GPS accuracy in metres
notes         text           nullable
device_info   text           nullable   — user agent string
scanned_at    timestamp      default now()
```

### Key Relationships

- One `asset` → many `scans`
- Latest scan per asset = current pin location on map
- `qr_code` on asset is encoded into the QR image; scanner reads it, API looks it up

### Indexes

```sql
CREATE INDEX idx_scans_asset_id ON scans(asset_id);
CREATE INDEX idx_scans_scanned_at ON scans(scanned_at DESC);
CREATE INDEX idx_assets_qr_code ON assets(qr_code);
CREATE INDEX idx_assets_status ON assets(status);
```

---

## 5. Authentication

**Provider:** NextAuth.js v5 with `CredentialsProvider` (email + password).

### Config (`lib/auth/index.ts`)

- Use `CredentialsProvider`
- Sign-in: query `users` by email, compare password with `bcryptjs.compare()`
- Session strategy: `jwt`
- Session includes: `user.id`, `user.role`, `user.name`, `user.email`
- Extend the default session type in `lib/auth/index.ts` via TypeScript module augmentation

### Middleware (`middleware.ts`)

- Protect all routes matching `/(app)/*`
- Redirect unauthenticated requests to `/login`
- Public routes: `/login`, `/api/auth/*`

### Login Page (`app/(auth)/login/page.tsx`)

- Uses `shadcn/ui`: `Card`, `CardHeader`, `CardContent`, `Input`, `Button`, `Label`, `Form`
- Full-page centered layout, dark background matching app theme
- On submit: call `signIn("credentials", ...)` from NextAuth
- On error: `toast.error("Invalid email or password.")` via Sonner

> No self-registration. Seed the first admin user via a script or direct DB insert.

---

## 6. API Routes

All under `app/api/`. All routes check session via `auth()` from Auth.js. Return `401` if unauthenticated.

### `GET /api/assets`
- Returns all assets with latest scan coordinates joined
- Uses a subquery: `SELECT DISTINCT ON (asset_id) ... ORDER BY asset_id, scanned_at DESC`
- Query params: `?status=active&category=laptop`
- Response: `Asset[]` with `latestScan: { latitude, longitude, scanned_at, accuracy } | null`

### `POST /api/assets`
- Body: `{ name, category, description? }`
- Validated with Zod (`lib/validations/asset.ts`)
- Generates `qr_code` as `crypto.randomUUID()`
- Returns created asset

### `GET /api/assets/[id]`
- Returns full asset + all scans ordered `scanned_at DESC`

### `PATCH /api/assets/[id]`
- Body: `{ name?, category?, description?, status? }`
- Validated with Zod (partial schema)

### `DELETE /api/assets/[id]`
- Soft delete: sets `status = 'inactive'`
- Returns `{ success: true }`

### `GET /api/assets/[id]/qr`
- Generates QR PNG server-side using `qrcode` npm package
- Encodes `asset.qr_code` value (UUID only — not a URL)
- Returns `image/png` with `Content-Disposition: attachment; filename="qr-[name].png"`

### `POST /api/scans`
- Body: `{ qr_code, latitude, longitude, accuracy?, notes? }`
- Validated with Zod (`lib/validations/scan.ts`)
- Looks up asset by `qr_code` → 404 if not found
- Inserts scan with `scanned_by` from session
- Returns `{ scan, asset }`

### `GET /api/scans/[assetId]`
- Paginated scan history
- Query params: `?page=1&limit=20`
- Returns `{ scans, total, page, totalPages }`

---

## 7. Pages & Components

### `app/(auth)/login/page.tsx`

**shadcn components used:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Button`

- Server component that renders the login `Card` centred on screen
- `LoginForm` is a client component handling `signIn` and Sonner error toast
- Button shows `<Loader2 className="animate-spin" />` while submitting

---

### `app/(app)/dashboard/page.tsx`

**Primary page.** See Section 8 for full map detail.

**shadcn components used:** `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Skeleton`, `Badge`, `Separator`, `ScrollArea`, `Input`, `Button`, `Tooltip`, `TooltipContent`, `TooltipTrigger`

- Server component that fetches initial asset data (SSR for first paint)
- Passes data to `DashboardShell` client component
- `StatCard` tiles at top: Total Assets, Active Today, Last Scan, Total Scans
- `AssetSidebar` on left: scrollable list using `ScrollArea`
- `AssetMap` filling remaining space (dynamic import)
- Loading state: `StatCardSkeleton` × 4, `Skeleton` for sidebar items

---

### `app/(app)/assets/page.tsx`

**shadcn components used:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Badge`, `Button`, `Input`, `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `Skeleton`

- Server component with search params for filtering
- `AssetFilters` client component for status + category dropdowns
- `AssetTable` renders rows; each row has: Name, Category `Badge`, Status `Badge`, Last Seen (relative time), Coordinates (mono font), Actions `DropdownMenu`
- Loading: `AssetTableSkeleton` — 8 rows of `Skeleton` cells
- Empty state: `EmptyState` component with icon + CTA button

---

### `app/(app)/assets/new/page.tsx`

**shadcn components used:** `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Textarea`, `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `Button`, `Separator`, `Alert`, `AlertDescription`

- `CreateAssetForm` client component
- On success: show `QRCodeDisplay` component inline below the form
- `QRCodeDisplay` shows QR `<img>` inside a `Card` with Download + Print `Button`s
- Sonner `toast.success("Asset created. QR code ready to download.")`

---

### `app/(app)/assets/[id]/page.tsx`

**shadcn components used:** `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Badge`, `Button`, `Separator`, `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Skeleton`, `Tooltip`, `TooltipContent`, `TooltipTrigger`

- Asset header: name, category `Badge`, status `Badge`
- `Tabs`: "Overview" | "Scan History" | "QR Code"
- **Overview tab:** mini Leaflet map showing scan trail + last scan details in a `Card`
- **Scan History tab:** `Table` of all scans with pagination `Button`s
- **QR Code tab:** `QRCodeDisplay` component
- Edit inline via a `Dialog` form
- Delete via confirmation `Dialog` (shadcn `AlertDialog` variant)

---

### `app/(app)/scan/page.tsx`

**shadcn components used:** `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Button`, `Badge`, `Alert`, `AlertDescription`, `Separator`, `Skeleton`

- Mobile-optimised, full viewport height
- `QRScanner` (dynamic import, `ssr: false`) occupies main area
- `ScanResult` card slides up after successful scan showing asset name, category `Badge`, timestamp, coordinates
- Permission denied state: `Alert` component with instructions
- "Scan Again" `Button` resets the scanner

---

### `app/(app)/settings/page.tsx`

**shadcn components used:** `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`, `Separator`, `Button`, `Input`, `Label`, `Switch`, `Form`

- Profile settings: display name, password change
- App preferences: map tile style toggle (light/dark)

---

## 8. Map Dashboard (Detail)

The dashboard is the operational heart of the app. It must feel like a professional asset operations console.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TopBar: Logo + App name           Search         User avatar dropdown   │
├───────────────────┬─────────────────────────────────────────────────────┤
│                   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  Asset Sidebar    │  │  Total   │ │  Active  │ │ Last Scan│ │ Scans  │ │
│  (ScrollArea)     │  │  Assets  │ │  Today   │ │  Time    │ │ Today  │ │
│                   │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  [Search input]   │  ┌──────────────────────────────────────────────────┤
│                   │  │                                                   │
│  ● Asset Name     │  │                                                   │
│    2 hrs ago      │  │              LEAFLET MAP                          │
│                   │  │              (fills remaining height)             │
│  ● Asset Name     │  │                                                   │
│    5 hrs ago      │  │                                                   │
│                   │  │                                                   │
│  ● Asset Name     │  │                                                   │
│    Yesterday      │  └──────────────────────────────────────────────────┘
└───────────────────┴─────────────────────────────────────────────────────┘
```

On mobile (`< md`): sidebar hidden by default behind a `Sheet` drawer; map is full screen; floating `Button` (FAB) bottom-right links to `/scan`.

### Stat Cards

Four `StatCard` components using shadcn `Card`:
- **Total Assets** — count of all active assets
- **Active Today** — assets with a scan in the last 24 hours
- **Last Scan** — relative time of most recent scan across all assets
- **Total Scans** — total scan count all time

Loading state: `StatCardSkeleton` using shadcn `Skeleton` (replaces number and label).

### Map Implementation

**Component:** `AssetMap.tsx` wraps `AssetMapInner.tsx` with `next/dynamic({ ssr: false })`.

**Tile layer:** CartoDB Positron (light, clean):
```
https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
```
Or CartoDB Dark Matter for dark mode:
```
https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```
Respect user's dark mode preference via CSS `prefers-color-scheme` or a settings toggle.

**Markers (`AssetPin.tsx`):**
- Custom `L.divIcon` per asset — circular coloured dot with asset initials
- Colour by category: laptop = `#38BDF8` (sky), phone = `#4ADE80` (green), router = `#FB923C` (orange), tablet = `#A78BFA` (purple), other = `#94A3B8` (slate)
- Active asset: solid fill; inactive: 40% opacity; lost: red border pulse animation
- Size: 36×36px circle

**Clustering:**
- Use `leaflet.markercluster` via `react-leaflet-cluster`
- Cluster icon: dark circle with white count number
- Click cluster → map auto-zooms and spiderifies

**Pin Popup (`AssetPopup.tsx`):**
Built as Leaflet `Popup` with custom HTML styled to match the dark theme:
```
┌──────────────────────────────────────┐
│  🟢  Dell Laptop #4        [×]       │
│  ─────────────────────────────────── │
│  Category      Laptop                │
│  Last scan     2 hours ago           │
│  Scanned by    Alex N.               │
│  Coordinates   -1.2921, 36.8219      │
│  Accuracy      ±8m                   │
│                                      │
│  [View Full History →]               │
└──────────────────────────────────────┘
```
"View Full History" is a link → `/assets/[id]`.

**Map Controls (`MapControls.tsx`):**
Positioned top-right as a Leaflet control:
- "Fit All Assets" button — calls `map.fitBounds()` across all pin coords
- Category filter — shadcn `Select` floating over map, filters visible pins
- Optional tile style toggle (light / dark)

**Live Updates:**
- Poll `GET /api/assets` every 30 seconds via `setInterval` in `useEffect`
- On new/moved pin: brief CSS scale pulse on the marker
- Cleanup interval on unmount

**Sidebar interaction:**
- Click any asset in `AssetSidebar` → `map.flyTo([lat, lng], 16)` + open popup
- Active/selected asset highlighted in sidebar with `bg-accent/10 border-l-2 border-accent`

---

## 9. QR Code System

### Generation

- Server-side via `qrcode` npm package in `lib/qr/generate.ts`
- Encoded value: `asset.qr_code` (UUID only — not a URL, not a full link)
- Options: `{ errorCorrectionLevel: 'H', width: 300, margin: 2 }`
- Output: base64 PNG data URL for display, or raw Buffer for the API response

### API Endpoint (`GET /api/assets/[id]/qr`)

- Calls `generate.ts`, returns `image/png`
- Sets `Content-Disposition: attachment; filename="qr-[asset-name].png"`

### `QRCodeDisplay` Component

- Fetches QR from `/api/assets/[id]/qr` and renders as `<img>`
- Wrapped in shadcn `Card` with padding
- Two shadcn `Button`s below:
  - **Download** — anchor with `download` attribute
  - **Print** — `window.print()` targeting just the QR card via a print CSS class

### Physical Workflow

1. Print and affix QR label to the physical device
2. Scanner opens `/scan` on their phone
3. Points camera at QR label
4. App reads UUID → looks up asset → records scan with GPS
5. Dashboard pin updates within 30 seconds

---

## 10. Scanner Flow

### `QRScanner.tsx`

Dynamically imported with `next/dynamic({ ssr: false })`.

**Initialisation:**
1. Mount `<div id="qr-reader" />` in the DOM
2. Initialise `Html5QrcodeScanner` with:
   ```
   fps: 10
   qrbox: { width: 250, height: 250 }
   rememberLastUsedCamera: true
   aspectRatio: 1.0
   ```
3. Request camera permission on mount; if denied → show shadcn `Alert` with instructions

**On successful decode (`onScanSuccess`):**
1. Call `scanner.clear()` — pause scanning
2. Call `navigator.geolocation.getCurrentPosition()`:
   - Options: `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }`
3. On GPS success → `POST /api/scans` with `{ qr_code, latitude, longitude, accuracy }`
4. On GPS error → `toast.error("Location access required.")` + show retry `Button`
5. On API 404 → `toast.warning("QR code not recognised.")`
6. On API success → show `ScanResult` component

**`ScanResult.tsx`:**
- shadcn `Card` sliding up from bottom
- Shows: asset name, category `Badge`, status `Badge`, coordinates, scan time
- Two `Button`s: "Scan Another" (resets scanner) + "View Asset" (links to `/assets/[id]`)

**GPS Accuracy:**
- `accuracy > 100m` → still save, but `toast.warning("Low accuracy (±Xm). Consider moving outdoors.")`
- Show accuracy reading on `ScanResult` card with colour-coded `Badge`:
  - `< 20m` → green "High"
  - `20–100m` → yellow "Medium"
  - `> 100m` → red "Low"

**`useGeolocation` hook (`hooks/useGeolocation.ts`):**
- Manages permission state: `'idle' | 'requesting' | 'granted' | 'denied' | 'error'`
- Exposes `getPosition(): Promise<GeolocationCoordinates>`
- Used by both `QRScanner` and manual location capture anywhere in the app

---

## 11. shadcn/ui Component Map

Install shadcn and initialise with `npx shadcn@latest init`. Then add each component with `npx shadcn@latest add [component]`.

### Full list of components to install

```bash
npx shadcn@latest add alert
npx shadcn@latest add alert-dialog
npx shadcn@latest add badge
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add scroll-area
npx shadcn@latest add select
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add skeleton
npx shadcn@latest add switch
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add textarea
npx shadcn@latest add toast
npx shadcn@latest add tooltip
npx shadcn@latest add sonner
npx shadcn@latest add avatar
npx shadcn@latest add popover
```

### Where each component is used

| shadcn Component | Used In |
|---|---|
| `Alert` | Scanner permission denied, low GPS accuracy warning |
| `AlertDialog` | Delete asset confirmation |
| `Avatar` | User avatar in `TopBar` |
| `Badge` | Asset status, category labels, GPS accuracy level in `ScanResult` |
| `Button` | Every interactive action across all pages |
| `Card` / `CardHeader` / `CardContent` / `CardFooter` | Stat tiles, login form, asset cards, scan result, QR display, popups |
| `Dialog` | Edit asset modal |
| `DropdownMenu` | Asset row actions table, user menu in `TopBar` |
| `Form` / `FormField` / `FormItem` / `FormLabel` / `FormControl` / `FormMessage` | Login form, create asset form, settings form |
| `Input` | All text inputs — login, asset name, sidebar search, asset filters |
| `Label` | All form labels (used inside `Form`) |
| `Popover` | Map filter overlay on desktop |
| `ScrollArea` | Asset sidebar on dashboard, scan history list |
| `Select` / `SelectTrigger` / `SelectValue` / `SelectContent` / `SelectItem` | Category filter, status filter, create asset category picker |
| `Separator` | Visual dividers in sidebar, cards, detail pages |
| `Sheet` | Mobile sidebar drawer, mobile filter panel |
| `Skeleton` | All loading states: stat cards, asset table rows, sidebar items, asset detail |
| `Switch` | Map tile style toggle (light/dark) in settings |
| `Table` / `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell` | Asset list table, scan history table |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | Asset detail page (Overview / Scan History / QR Code) |
| `Textarea` | Asset description field, scan notes field |
| `Tooltip` / `TooltipContent` / `TooltipTrigger` | Map control buttons, coordinate copy button |
| `Sonner` (via shadcn) | `<Toaster />` placed once in `app/(app)/layout.tsx` |

### Skeleton usage guide

Every page that fetches data must have a skeleton loading state. Use shadcn `Skeleton` component (`<Skeleton className="h-4 w-full" />`).

| Loading state | Component | Skeleton shape |
|---|---|---|
| Dashboard stat cards | `StatCardSkeleton` | `Card` with 2 `Skeleton` lines |
| Dashboard sidebar assets | inline in `AssetSidebar` | Circle skeleton + 2 line skeletons per item |
| Asset table rows | `AssetTableSkeleton` | 8 rows × 6 cells of `Skeleton` |
| Asset detail header | inline in page | Title skeleton + 2 badge skeletons |
| Scan history table | inline in tab | 5 rows × 5 cells of `Skeleton` |
| QR code image | inside `QRCodeDisplay` | Square `Skeleton` 200×200 |
| Map area | inside `AssetMap` | Full-area `Skeleton` with map-like aspect ratio |

---

## 12. Notifications (Sonner)

Installed via `npx shadcn@latest add sonner`. Place `<Toaster />` once in `app/(app)/layout.tsx`.

### Toaster config

```tsx
<Toaster
  position="top-right"
  richColors
  closeButton
  duration={4000}
  theme="dark"
/>
```

### Toast catalogue

| Event | Call | Message |
|---|---|---|
| Scan recorded | `toast.success()` | `"Scan recorded — Dell Laptop #4"` |
| Asset created | `toast.success()` | `"Asset created. QR code ready to download."` |
| Asset updated | `toast.success()` | `"Changes saved."` |
| Asset deactivated | `toast.info()` | `"Asset deactivated."` |
| QR not recognised | `toast.warning()` | `"QR code not recognised. Check the asset register."` |
| GPS denied | `toast.error()` | `"Location access required. Enable it in browser settings."` |
| Low GPS accuracy | `toast.warning()` | `"Location captured but accuracy is low (±83m)."` |
| Network/API error | `toast.error()` | `"Something went wrong. Please try again."` |
| Session expired | `toast.error()` | `"Session expired. Signing you out."` |
| Copied to clipboard | `toast.success()` | `"Coordinates copied."` |

---

## 13. UI Design System

### Palette (CSS Variables in `globals.css`)

The design uses a dark operations-console aesthetic — slate backgrounds, sky-blue accent, high contrast data surfaces. All colours are set as CSS variables so shadcn components inherit them correctly.

| Token | Hex | Tailwind class | Usage |
|---|---|---|---|
| Background | `#0F172A` | `bg-slate-950` | App background |
| Surface | `#1E293B` | `bg-slate-800` | Cards, sidebar, panels |
| Border | `#334155` | `border-slate-700` | Dividers, input borders |
| Accent | `#38BDF8` | `text-sky-400` | Links, highlights, active states |
| Success | `#4ADE80` | `text-green-400` | Active badge, success toasts |
| Warning | `#FACC15` | `text-yellow-400` | Low accuracy, warning states |
| Danger | `#F87171` | `text-red-400` | Error states, lost asset badge |
| Text Primary | `#F1F5F9` | `text-slate-100` | Main readable text |
| Text Muted | `#94A3B8` | `text-slate-400` | Timestamps, secondary labels |

### Typography

- **All text:** `Inter` (Google Fonts) — `font-sans` via Tailwind
- **Coordinates / IDs / QR codes:** `JetBrains Mono` — apply via `font-mono` utility class
- Load both fonts in `app/layout.tsx` via `next/font/google`

### shadcn Theme Config (`components.json`)

```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

Use `baseColor: "slate"` to match the dark navy palette.

### Status Badge Variants

Extend shadcn `Badge` with these custom variants in `components/ui/badge.tsx`:

| Status | Classes |
|---|---|
| `active` | `bg-green-500/15 text-green-400 border border-green-500/30` |
| `inactive` | `bg-slate-500/15 text-slate-400 border border-slate-500/30` |
| `lost` | `bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse` |

Category badge variants:
| Category | Classes |
|---|---|
| `laptop` | `bg-sky-500/15 text-sky-400` |
| `phone` | `bg-green-500/15 text-green-400` |
| `router` | `bg-orange-500/15 text-orange-400` |
| `tablet` | `bg-purple-500/15 text-purple-400` |
| `other` | `bg-slate-500/15 text-slate-400` |

### Mobile Considerations

- Minimum tap target: 44×44px — all `Button` components meet this by default
- Sidebar collapses to shadcn `Sheet` (slide-in from left) on `< md` breakpoint
- Scanner page: full viewport height, overflow hidden, no scroll
- Floating scan FAB: `fixed bottom-6 right-6 z-50` — shadcn `Button` with `size="lg"` and `rounded-full`
- Bottom navigation (`MobileNav`) visible only on `< md`

---

## 14. Environment Variables

```env
# .env.local

# Database (Neon)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# NextAuth v5
AUTH_SECRET=your-secret-here-min-32-chars
AUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_NAME="QR Asset Tracker"
NEXT_PUBLIC_MAP_TILE_LIGHT=https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
NEXT_PUBLIC_MAP_TILE_DARK=https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=© OpenStreetMap contributors © CARTO
```

> In NextAuth v5, the env var is `AUTH_SECRET` (not `NEXTAUTH_SECRET`) and `AUTH_URL` (not `NEXTAUTH_URL`).

---

## 15. Build Order for Coding Agent

Follow this sequence exactly. Each phase is independently testable before proceeding.

---

### Phase 1 — Project Bootstrap

1. Scaffold: `pnpm create next-app@latest qr-asset-tracker --typescript --tailwind --app --no-src-dir`
2. Install all dependencies from the stack table
3. Initialise shadcn: `npx shadcn@latest init` — choose `slate` base colour, CSS variables on, dark mode `class`
4. Install all shadcn components listed in Section 11
5. Set up `drizzle.config.ts` pointing at `DATABASE_URL`
6. Write full schema in `lib/db/schema.ts`
7. Run `pnpm drizzle-kit generate` then `pnpm drizzle-kit migrate`
8. Write and run a seed script: 1 admin user, 3 assets (mixed categories), 5 scans each with realistic Nairobi coordinates
9. Verify tables and seed data in Neon console

---

### Phase 2 — Auth

1. Write `lib/auth/index.ts` with `CredentialsProvider`, bcrypt compare, JWT strategy
2. Wire `app/api/auth/[...nextauth]/route.ts`
3. Write `middleware.ts` to protect `/(app)` routes
4. Build `app/(auth)/login/page.tsx` using shadcn `Card`, `Form`, `Input`, `Button`
5. Test: login succeeds, wrong password shows Sonner error, unauthenticated redirect works

---

### Phase 3 — Asset API

1. `GET /api/assets` with latest scan join
2. `POST /api/assets` with Zod validation + UUID generation
3. `GET /api/assets/[id]`
4. `PATCH /api/assets/[id]`
5. `DELETE /api/assets/[id]` (soft)
6. `GET /api/assets/[id]/qr` returning PNG
7. Test all with a REST client (Hoppscotch or Insomnia) using a valid session cookie

---

### Phase 4 — Scan API

1. `POST /api/scans` with Zod validation + qr_code lookup
2. `GET /api/scans/[assetId]` with pagination
3. Test: POST scan with known qr_code → verify DB row created

---

### Phase 5 — App Shell

1. Build `app/(app)/layout.tsx` with `Sidebar`, `TopBar`, and `<Toaster />`
2. Build `Sidebar.tsx` — static on desktop, shadcn `Sheet` on mobile
3. Build `TopBar.tsx` — logo, app name, shadcn `DropdownMenu` for user avatar
4. Build `MobileNav.tsx` — bottom tab bar visible only below `md`
5. Confirm navigation works between all route stubs

---

### Phase 6 — Map Dashboard

1. Install `react-leaflet`, `leaflet`, `@types/leaflet`, `react-leaflet-cluster`
2. Fix Leaflet default icon issue (known Next.js issue — import marker icons manually)
3. Build `AssetMapInner.tsx` as a pure client component (`"use client"`)
4. Build `AssetMap.tsx` wrapping with `next/dynamic({ ssr: false })`
5. Render asset pins from seeded data using `AssetPin.tsx` (`L.divIcon` circles)
6. Build `AssetPopup.tsx` inside Leaflet `Popup`
7. Add `react-leaflet-cluster` for grouping
8. Build `MapControls.tsx`: fit-all button + category filter `Select`
9. Build `DashboardShell.tsx` with stats bar, sidebar, and map area
10. Build `StatCard.tsx` and `StatCardSkeleton.tsx` using shadcn `Card` and `Skeleton`
11. Build `AssetSidebar.tsx` using shadcn `ScrollArea` with fly-to on click
12. Add 30-second polling: `setInterval` → `GET /api/assets` → update pins
13. Test full dashboard: pins visible, clustering works, sidebar click flies to pin

---

### Phase 7 — Asset Management Pages

1. `/assets` — `AssetTable` + `AssetFilters` + `AssetTableSkeleton` + `EmptyState`
2. `/assets/new` — `CreateAssetForm` + post-creation `QRCodeDisplay`
3. `/assets/[id]` — `Tabs` with overview mini-map, scan history `Table`, QR display

---

### Phase 8 — Scanner Page

1. Install `html5-qrcode`
2. Build `QRScanner.tsx` (dynamic import, `ssr: false`) with `Html5QrcodeScanner`
3. Build `useGeolocation.ts` hook
4. Wire scan → GPS → POST → `ScanResult.tsx` flow
5. Handle all error states with shadcn `Alert` and Sonner toasts
6. Test on a real mobile device (HTTPS or localhost tunnel)

---

### Phase 9 — Polish

1. Add `Skeleton` loading states to every data-fetching page (see Section 11 skeleton guide)
2. Add `EmptyState` to asset table and scan history when no records exist
3. Responsive audit: test at 375px (mobile), 768px (tablet), 1280px (desktop)
4. Add `<head>` meta in root `layout.tsx`: `theme-color`, `viewport`, `apple-mobile-web-app-capable`
5. Add favicon and app name

---

### Phase 10 — Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add all env vars from Section 14 in Vercel project settings
4. Run `pnpm build` locally and fix any TypeScript or import errors before pushing
5. Deploy to Vercel — verify HTTPS (required for camera + GPS)
6. End-to-end smoke test: login → create asset → download QR → scan on mobile → confirm pin appears on dashboard within 30s

> ⚠️ **HTTPS is mandatory** for `getUserMedia` (camera) and `getCurrentPosition` (GPS) on mobile browsers. Vercel provides HTTPS by default. For local mobile testing, use `ngrok` to tunnel `localhost:3000`.

---

*End of BLUEPRINT.md*