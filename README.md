# Caire Scheduling

> A modern field service routing optimization platform built with Next.js, Bryntum SchedulerPro, and Timefold API.

![Next.js 14](https://img.shields.io/badge/Next.js-14.2-000000?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat&logo=tailwindcss)
![Bryntum](https://img.shields.io/badge/Bryntum-7.0-6366F1?style=flat)

---

## 🤖 AI Tools Used

This project was developed with AI-assisted coding tools:

| Tool | Purpose |
|------|---------|
| **Cursor IDE** | AI-powered code editor for development workflow |
| **Claude Code Terminal** | Terminal-based AI assistant for debugging and implementation |
| **Claude Opus 4.5** (Anthropic) | **Main brain model** — Core logic, architecture, API integration, state management |
| **Gemini 3 Pro** (Google) | **UI/UX design** — Professional interface design, styling, responsive layouts |

The combination of Opus 4.5 for backend logic and complex TypeScript implementations, alongside Gemini 3 Pro for polished UI components and design decisions, enabled rapid development while maintaining code quality.

---

## Overview

Caire Scheduling is a work sample demonstrating intelligent route optimization for field service operations. It visualizes technician schedules, optimizes visit assignments using the Timefold solver, and provides real-time KPI tracking.

The application allows users to:
- Load demo datasets (from Timefold API or local Stockholm home care data)
- View baseline schedules with visits distributed across technicians
- Run route optimization with configurable time limits
- Compare baseline vs. optimized schedules side-by-side
- Track key performance indicators (utilization, travel time, costs)
- Interact with the schedule via drag-and-drop

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Integration](#api-integration)
- [Components](#components)
- [Styling & Theming](#styling--theming)
- [Known Limitations](#known-limitations)
- [Development Notes](#development-notes)

---

## Quick Start

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm** or **pnpm**
- **Timefold API Key** (provided in `.env`)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd prov

# 2. Install dependencies
npm install

# 3. Create environment file
# Copy the .env file or create .env with your API key
echo "TIMEFOLD_API_KEY=your_api_key_here" > starts with tf_*_********************************
echo "TIMEFOLD_BASE_URL=your_base_url" > starts with https://app.timefold.ai/***********
echo "TIMEFOLD_CONFIG_ID=your_config_ID" > starts with : 6ba51ef5-********

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint for code quality |

---

## Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Dataset Loading** | Fetch demo datasets from Timefold or use local Stockholm home care data |
| **Baseline View** | Visualize unoptimized schedule with round-robin visit distribution |
| **Route Optimization** | Submit jobs to Timefold solver with configurable time limits |
| **Optimized View** | Display solver results with actual timing and assignments |
| **View Toggle** | Switch between baseline and optimized views for comparison |
| **Interactive Filters** | Filter events by status (Planned, Unplanned, Optimized, Completed) |

### Visualization

- **Bryntum SchedulerPro** integration with Stockholm Light theme
- Interactive Gantt-style timeline (day, week, 14-day, month views)
- Drag-and-drop event repositioning and resizing
- Color-coded events by status (gray=baseline, teal=optimized, amber=adjusted)
- Tooltips showing visit details (name, address, travel time)
- Zoom controls with percentage display

### KPI Dashboard

The insights panel tracks:

- **Utilization** — Percentage of shift time used productively
- **Work Hours** — Total service + travel + wait time
- **Travel Time** — Time spent driving between visits
- **Wait Time** — Idle time between arrival and service start
- **Visit Counts** — Planned vs. assigned vs. unassigned
- **Cost Estimates** — Based on hourly rates (450 SEK/hour)
- **Savings** — Cost difference between baseline and optimized

### Additional Features

- **Export** — Download schedule as JSON or CSV
- **New Visit Modal** — Add visits with patient name, address, duration, priority
- **Settings Panel** — Theme selection (Light/Dark/Ocean), language, notifications
- **Local Simulation** — Fallback when Timefold API is unavailable
- **Inspector Mode** — View raw JSON input/output with syntax highlighting
- **Responsive Design** — Full mobile support with adaptive layouts

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌─────────┐ ┌────────┐ │
│  │ Sidebar │ │  TopBar  │ │ FilterBar │ │Scheduler│ │KpiPanel│ │
│  └────┬────┘ └────┬─────┘ └─────┬─────┘ └────┬────┘ └───┬────┘ │
│       │           │             │            │          │      │
│       └───────────┴──────┬──────┴────────────┴──────────┘      │
│                          │                                      │
│                    ┌─────┴─────┐                                │
│                    │  page.tsx │  (Main state management)       │
│                    └─────┬─────┘                                │
└──────────────────────────│──────────────────────────────────────┘
                           │
┌──────────────────────────│──────────────────────────────────────┐
│                          │        Next.js Server               │
│                    ┌─────┴─────┐                                │
│                    │ API Routes│                                │
│                    └─────┬─────┘                                │
│     ┌────────────────────┼────────────────────┐                │
│     │                    │                    │                │
│ ┌───┴────┐        ┌──────┴──────┐      ┌─────┴─────┐          │
│ │demo-data│        │ route-plans │      │   [id]    │          │
│ └───┬────┘        └──────┬──────┘      └─────┬─────┘          │
│     │                    │                   │                 │
│     └────────────────────┼───────────────────┘                 │
│                          │                                      │
│                    ┌─────┴─────┐                                │
│                    │timefold   │  (API Client)                  │
│                    │Client.ts  │                                │
│                    └─────┬─────┘                                │
└──────────────────────────│──────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Timefold Cloud API   │
              │  (Field Service Routing)│
              └────────────────────────┘
```

### Data Flow

1. **Load Dataset** → Fetch model input from `/api/timefold/demo-data/[id]`
2. **Map to Baseline** → `mapping.ts` transforms vehicles/visits to scheduler format
3. **Display** → Bryntum SchedulerPro renders the timeline
4. **Optimize** → POST to `/api/timefold/route-plans` with termination limit
5. **Poll** → GET `/api/timefold/route-plans/[id]` every 2 seconds
6. **Complete** → Map optimized routes, compute KPIs, update display

---

## Project Structure

```
prov/
├── app/
│   ├── api/
│   │   └── timefold/
│   │       ├── demo-data/
│   │       │   ├── route.ts          # GET /api/timefold/demo-data
│   │       │   └── [id]/route.ts     # GET /api/timefold/demo-data/[id]
│   │       └── route-plans/
│   │           ├── route.ts          # POST /api/timefold/route-plans
│   │           └── [id]/route.ts     # GET /api/timefold/route-plans/[id]
│   ├── globals.css                   # Tailwind + custom styles + Bryntum overrides
│   ├── layout.tsx                    # Root layout with fonts
│   └── page.tsx                      # Main application (state management)
│
├── components/
│   ├── BryntumScheduler.tsx          # Bryntum SchedulerPro wrapper
│   ├── SchedulerView.tsx             # Schedule container with zoom controls
│   ├── TopBar.tsx                    # Navigation, date picker, actions
│   ├── FilterBar.tsx                 # Status/entity filter pills
│   ├── KpiPanel.tsx                  # Collapsible insights sidebar
│   ├── Sidebar.tsx                   # Navigation sidebar with user menu
│   ├── JsonPanel.tsx                 # JSON inspector with syntax highlighting
│   ├── LoadingOverlay.tsx            # Full-screen loading state
│   ├── ErrorMessage.tsx              # Error display with guidance
│   └── index.ts                      # Barrel exports
│
├── lib/
│   ├── types.ts                      # TypeScript interfaces
│   ├── timefoldClient.ts             # Server-side API client
│   └── mapping.ts                    # Data transformation utilities
│
├── data/
│   └── demoInput.json                # Local Stockholm home care demo
│
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── next.config.js                    # Next.js configuration
└── package.json                      # Dependencies and scripts
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Required: Timefold API Key (get yours from timefold.ai)
TIMEFOLD_API_KEY=your_api_key_here

# Optional: Override defaults
TIMEFOLD_BASE_URL=https://app.timefold.ai/models/field-service-routing/v1
TIMEFOLD_CONFIG_ID=6ba51ef5-6642-44d5-8cef-9be1caa05389
```

### Optimization Speed Options

| Speed | Time Limit | Use Case |
|-------|------------|----------|
| Quick | 1 minute | Fast feedback, good quality |
| Standard | 2 minutes | Balanced speed and quality |
| Full | No limit | Best quality, longer runtime |

---

## API Integration

### Timefold Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/demo-data` | GET | List available demo datasets |
| `/v1/demo-data/{id}/input` | GET | Fetch model input for a dataset |
| `/v1/route-plans` | POST | Submit optimization job |
| `/v1/route-plans/{id}` | GET | Poll for solver status |

### Solver Status Flow

```
NOT_STARTED → SOLVING_SCHEDULED → SOLVING_ACTIVE → SOLVING_COMPLETED
                                              ↓
                                    DATASET_INVALID (validation error)
```

### Request/Response Examples

**POST /api/timefold/route-plans**
```json
{
  "modelInput": {
    "vehicles": [...],
    "visits": [...]
  },
  "datasetId": "BASIC",
  "terminationLimit": "PT2M"
}
```

**Response**
```json
{
  "success": true,
  "id": "abc123",
  "solverStatus": "SOLVING_SCHEDULED"
}
```

---

## Components

### BryntumScheduler

The core visualization component wrapping Bryntum SchedulerPro.

**Key Configuration:**
- View presets: hourAndDay, dayAndWeek, weekAndDay, weekAndMonth
- Row height scales with zoom level
- Mouse wheel zoom disabled (use buttons instead)
- Custom event renderer for status-based coloring
- Tooltip template with visit details

### FilterBar

Interactive filter pills for event visibility:

| Filter | Color | Shows |
|--------|-------|-------|
| Oplanerad | Orange | Unplanned baseline events |
| Planerad | Blue | Scheduled baseline events |
| Optimerad | Green | Optimized events |
| Utförd | Purple | Manually adjusted events |

### KpiPanel

Collapsible insights sidebar with four sections:

1. **Effektivitet** (Efficiency) — Utilization, work hours
2. **Tidfördelning** (Time Distribution) — Travel, wait, non-billable
3. **Besök** (Visits) — Counts and unassigned warnings
4. **Ekonomi** (Economy) — Costs and savings

### Sidebar

Expandable navigation with:
- Hover-to-expand interaction
- Schema, Personal, Inställningar navigation
- New Visit quick action
- User profile menu with logout

---

## Styling & Theming

### Design System

The application uses a custom design system built on Tailwind CSS:

**Typography:**
- Display: Outfit (headings)
- Body: DM Sans (UI text)
- Mono: JetBrains Mono (code)

**Colors:**
- Brand: Indigo (#6366F1)
- Success: Emerald (#10B981)
- Warning: Amber (#F59E0B)
- Info: Blue (#3B82F6)

**Themes:**
- Light (default)
- Dark
- Ocean

### Bryntum Overrides

Custom CSS in `globals.css` adjusts:
- Event styling (border-radius, shadows, min-width)
- Header formatting (uppercase, letter-spacing)
- Tooltip appearance (rounded, shadowed)
- Responsive column widths

---

## Known Limitations

### Timefold API

1. **Map Coverage** — Trial API only supports US Georgia map. Stockholm demo data will fail optimization but works for baseline display.
2. **Rate Limits** — Shared trial key may have usage limits.
3. **Timeout** — Solver polling times out after 5 minutes.

### Bryntum

1. **Trial Watermark** — Trial version displays watermark.
2. **SSR** — Component loaded dynamically with `ssr: false`.

### Workarounds

- **Simulate Locally** button provides demo optimization when API fails
- Fallback table view if Bryntum fails to load
- Local demo dataset always available

---

## Development Notes

### Type Safety

All API responses and internal state are fully typed:

```typescript
// Example: SchedulerEvent
interface SchedulerEvent {
  id: string;
  resourceId: string;
  startDate: string;
  endDate: string;
  name: string;
  eventType: "visit" | "travel" | "break";
  status: "baseline" | "optimized" | "adjusted";
  isAdjusted?: boolean;
}
```

### State Management

The main `page.tsx` uses React hooks for state:
- `useState` for UI state (filters, view mode, panels)
- `useCallback` for memoized handlers
- `useMemo` for computed values (filtered schedule, KPIs)
- `useRef` for tracking initial load

### Data Transformation

The `mapping.ts` module handles:
- ISO duration parsing (`PT30M` → 30 minutes)
- Baseline schedule generation (round-robin assignment)
- Optimized schedule mapping (from Timefold routes)
- KPI computation (utilization, costs, deltas)
- Local simulation (compress travel time by 40%)

### Responsive Breakpoints

```typescript
xs: 475px   // Extra small phones
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Small laptops
xl: 1280px  // Desktops
2xl: 1536px // Large screens
```

---

## AI Assistance Disclosure

This project was built with assistance from AI tools:

- **Cursor IDE** with Claude for code generation
- AI helped with: scaffolding, TypeScript types, Bryntum integration, data mapping, CSS styling

All code was reviewed, tested, and refined for production quality.

---

## Time Estimate

Approximate development time: **6-8 hours**

- Setup and research: ~2 hours
- Core functionality: ~3 hours
- Polish and testing: ~2 hours
- Documentation: ~1 hour

---

## License

This is a work sample for CAIRE AB. Not intended for production use.

---

<div align="center">

**Built with care for the CAIRE technical assessment**

[Next.js](https://nextjs.org) • [Bryntum](https://bryntum.com) • [Timefold](https://timefold.ai) • [Tailwind CSS](https://tailwindcss.com)

</div>
