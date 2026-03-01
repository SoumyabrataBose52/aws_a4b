# Nexus Solo - UI & Frontend Documentation

## 1. Overview
The Nexus Solo frontend is a modern, premium SaaS dashboard tailored for AI-powered creator management. It employs a dark, neon-purple aesthetic heavily utilizing glassmorphism, smooth animations, and high-contrast accents to deliver a "Command Center" feel.

## 2. Tech Stack
* **Framework**: Next.js (App Router)
* **Styling**: Tailwind CSS v4
* **UI Components**: Shadcn UI (Radix UI primitives)
* **Icons**: Lucide React
* **Typography**: Inter (Google Fonts)

## 3. Design System & Theme
The design system is managed globally in `src/app/globals.css` and utilizes custom Tailwind v4 theme variables.

### Core Color Palette:
* **Background Primary**: `#0a0a0f` (Deep space dark)
* **Background Secondary/Sidebar**: `#12121a`
* **Card Background**: `#1a1a2e`
* **Card Hover**: `#1e1e35`
* **Brand Accent**: `#6c5ce7` (Neon Purple)
* **Accent Glow**: `rgba(108, 92, 231, 0.3)`
* **Gradient**: `#6c5ce7` to `#a29bfe`
* **State Colors**:
  * Success: `#00d2d3` (Cyan)
  * Warning: `#feca57` (Yellow)
  * Danger: `#ff6b6b` (Red)

## 4. Key UI Components

### 4.1. Premium Custom Components (`src/components/ui/premium/`)
These components were custom-built to elevate the UI beyond standard Shadcn primitives:
* **`GlassPanel`**: A highly reusable container component featuring a semi-transparent background, deep blur (`backdrop-filter: blur(12px)`), and a subtle border that glows on hover.
* **`ShimmerButton`**: A high-conversion primary CTA button that features a continuous sweeping shimmer animation across its surface, perfect for AI action triggers.
* **`AnimatedNumber`**: A React component that smoothly transitions numerical values up or down when data updates, used heavily in the Analytics and Overview dashboards.
* **`BentoGrid`**: A responsive, masonry-style grid layout component used to display disparate widgets (like the creator roster and trending lists) in a cohesive, interlocking layout.

### 4.2. Core Shadcn Components (`src/components/ui/`)
Standardized interactive elements customized to fit the dark theme:
* **Sidebar**: A fully collapsible, responsive left-navigation sidebar using the latest Shadcn Sidebar patterns (utilizing React Context and cookies for state persistence).
* **DropdownMenu, Select, Dialog, Sheet**: Overridden to use `#12121a` backgrounds and `#2a2a3e` borders to match the dark theme seamlessly without harsh contrast breaks.

## 5. Dashboard Page Structure

All internal tool pages are nested under the `/dashboard` route group and share the `LayoutShell` component which injects the globally persistent `AppSidebar`.

* **Overview (`/dashboard`)**: The main command center. Features top-level health metrics, a BentoGrid containing the active creator roster, and a real-time trending video widget.
* **Content Workspace (`/dashboard/content`)**: A split-view AI workspace. Left panel contains the generation configuration (Creator, Topic, Platforms), and the right panel features a scrollable history and rich output text boxes.
* **Deals Pipeline (`/dashboard/deals`)**: A CRM-style view of brand sponsorships. Features a glassmorphic table list with expandable AI analysis panes for negotiation strategies.
* **Crisis Monitor (`/dashboard/crisis`)**: A high-alert dashboard focusing on negative sentiment. Uses deep red danger accents and displays expanding cards containing AI-generated mitigation strategies.
* **Analytics (`/dashboard/analytics`)**: Detailed metrics page utilizing Shadcn Tabs to switch between creators, featuring large statistical callouts and platform-specific breakdowns.
* **Trends (`/dashboard/trends`)**: An interactive discovery feed displaying YouTube trending data in visual Video Cards with thumbnail backgrounds and semi-transparent overlay text.

## 6. CSS & Animation Strategy
* Custom CSS classes are defined in `globals.css` to keep component class lists manageable.
* **`@theme` directives**: Tailwind v4 is used to inject CSS variables directly into the utility class pipeline.
* **Micro-interactions**: Hovering over cards, buttons, or list items generally triggers a subtle `transform: translateY(-1px)` and a dynamic border color shift, accompanied by a soft box-shadow glow (`box-shadow: 0 0 20px var(--accent-glow)`).

## 7. Responsive Design (Mobile)
* The `AppSidebar` collapses into a mobile-friendly hamburger menu (`Sheet` component) on screens below `md` (768px).
* Layouts shift from multi-column grids (like BentoGrid and split-views) into single, vertically scrolling columns on mobile to preserve usability.
