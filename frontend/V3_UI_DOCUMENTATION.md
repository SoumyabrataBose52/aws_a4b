# V3 Minimalist UI Documentation

> Backup created: `frontend_v3_backup_20260301.zip` (contains full `src/` directory)

---

## Design Philosophy

The V3 UI follows a **Linear/Vercel-inspired minimalist** aesthetic:t

- **Flat, borderless cards** with 1px subtle borders
- **High-density layouts** — compact tables, small font sizes, tight spacing
- **Monochrome palette** — black/white/zinc with semantic status colors
- **Zero glassmorphism** — no blurs, glows, or gradients
- **Micro-typography** — uppercase 0.70rem labels with letter-spacing

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Framework   | Next.js 15 (App Router)                 |
| Styling     | Tailwind CSS v4 + Custom CSS Variables  |
| Components  | Shadcn UI (Sidebar, Select, Input)      |
| Icons       | Lucide React                            |
| Fonts       | Inter (system-ui fallback)              |

---

## Color System (`globals.css`)

### Light Mode (`:root`)

| Token            | Value     | Usage                     |
|------------------|-----------|---------------------------|
| `--background`   | `#ffffff` | Page background           |
| `--foreground`   | `#09090b` | Primary text              |
| `--primary`      | `#18181b` | Buttons, headings         |
| `--secondary`    | `#f4f4f5` | Subtle backgrounds        |
| `--muted`        | `#f4f4f5` | Muted sections            |
| `--border`       | `#e4e4e7` | All borders               |
| `--card`         | `#ffffff` | Card backgrounds          |
| `--destructive`  | `#ef4444` | Error states              |

### Semantic Colors (Tailwind `@theme`)

| Token                  | Value     | Usage            |
|------------------------|-----------|------------------|
| `--color-success`      | `#10b981` | Active, positive |
| `--color-warning`      | `#f59e0b` | Pending, caution |
| `--color-danger`       | `#ef4444` | Errors, crises   |
| `--color-text-secondary` | `#6b7280` | Muted labels   |

### Dark Mode (`.dark` class)

Full dark mode tokens are defined using zinc-900 shades (`#09090b`, `#27272a`).

---

## Custom CSS Utilities

| Class        | Description                                         |
|--------------|-----------------------------------------------------|
| `.flat-card` | 1px border card with hover darkening                |
| `.text-micro`| 0.70rem uppercase label with letter-spacing         |

---

## Page Architecture

All dashboard pages live under `src/app/dashboard/`.

### `/dashboard` — Overview

- **Header**: Title + system health indicator + date
- **Metrics Row**: 4-column grid of flat stat cards (Creators, Content, Crises, Sentiment)
- **Creators Table**: Responsive table with hover-reveal "Manage" link
- **Trend Feed**: Numbered sidebar list of trending videos

### `/dashboard/creators` — Creator Directory

- **Header**: Title + search input + "Add Creator" button
- **Card Grid**: 3-column grid of creator profile cards
- Each card: Avatar initial, name, platforms, status badge, "View Details" link

### `/dashboard/content` — Content Engine

- **2-panel layout**: 4-col generator form | 8-col output workspace
- **Generator**: Creator select, topic textarea, platforms input, generate button
- **Output**: Platform-separated content blocks with copy buttons
- **Sidebar**: Recent drafts list

### `/dashboard/deals` — Deal Pipeline

- **Header**: Title + search bar
- **Full-width table**: Brand, Creator, Value, Status badge, Date
- Status badges use semantic colors (pending=warning, completed=success)

### `/dashboard/crisis` — Crisis Monitor

- **Empty state**: Shield icon with "System Clear" message
- **Alert cards**: Severity icon + issue title + risk badge + metadata
- **Mitigation box**: Recommended action in a secondary-bg panel
- **Actions**: "Dismiss" and "Take Action" buttons

### `/dashboard/analytics` — Analytics

- **Creator selector tabs**: Pill-style tab switcher in secondary bg
- **4-column stat grid**: Total Content, Avg Sentiment, Platform Reach, Active Deals
- **Chart placeholder**: Dashed border area for future time-series integration

### `/dashboard/trends` — Discovery & Trends

- **Full-width table**: Rank (flame icons for top 3), thumbnail + title, channel, views, date
- **Hover effects**: Play overlay on thumbnails, text color transitions

---

## Sidebar (`app-sidebar.tsx`)

Uses Shadcn `Sidebar` component with collapsible functionality. Navigation links:

- Overview → `/dashboard`
- Creators → `/dashboard/creators`
- Content → `/dashboard/content`
- Analytics → `/dashboard/analytics`
- Trends → `/dashboard/trends`
- Deals → `/dashboard/deals`
- Crisis → `/dashboard/crisis`

---

## API Layer (`lib/api.ts`)

All API calls use `apiFetch()` with `X-API-Key` header authentication. Modules:

- `creators` — CRUD + onboard + DNA
- `content` — list, generate, publish
- `crisis` — list, strategies, simulate, execute
- `deals` — list, create, research, outreach, counter
- `analytics` — dashboard, predict, posting-times, forecast
- `youtube` — trending, channel, search
- `system` — health, events, logs

---

## Key Patterns

1. **`suppressHydrationWarning`** on all date-rendering spans to prevent SSR mismatches
2. **`AnimatedNumber`** component for smooth metric transitions
3. **Semantic status badges** using Tailwind opacity colors (`bg-success/10 text-success`)
4. **Group hover reveals** for action links in tables (`.group` + `group-hover:opacity-100`)
5. **`animate-in fade-in duration-300`** on all page root elements for smooth transitions
