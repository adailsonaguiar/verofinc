# Vero Finc Frontend

Modern financial management dashboard built with React, TypeScript, Vite, and TailwindCSS.

## Features

- 📊 Monthly transaction overview
- 💰 Income and expense tracking
- 🎨 Modern and elegant UI with TailwindCSS
- 📱 Responsive design
- 🔄 Real-time data from backend API

## Prerequisites

- Node.js 18+
- Backend API running on port 3000

## Installation

```bash
npm install
```

## Configuration

The app is configured to proxy API requests to `http://localhost:3000`. Make sure your backend is running before starting the frontend.

## Running the app

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components + shared UI primitives
│   ├── Header.tsx            # Sticky page header (title, search, actions)
│   ├── Sidebar.tsx           # Navy navigation + user footer
│   ├── Button.tsx            # .btn variants (primary/ghost/outline)
│   ├── Chip.tsx              # Status/label chip
│   ├── StatCard.tsx          # KPI block (uppercase label + mono value)
│   ├── SectionTitle.tsx      # Playfair heading + caption
│   ├── MonthSelector.tsx     # Shared month navigation
│   ├── CashFlowChart.tsx     # Area chart (inflow/outflow)
│   └── ...
├── pages/               # Page components
│   └── DashboardPage.tsx
├── services/            # API services
│   ├── api.ts
│   ├── transactionService.ts
│   └── categoryService.ts
├── types/               # TypeScript types
│   └── index.ts
├── utils/               # Utility functions
│   └── transactions.ts
├── App.tsx            # Main app component
├── main.tsx           # App entry point
└── index.css          # Design system (tokens + component classes)
```

## Design System

The interface follows the "private banking classic" reference in
`controle-financeiro.html`:

- **Typography**: `Playfair Display` for headings (`font-display`), `IBM Plex Sans`
  for UI text, `IBM Plex Mono` with `tabular-nums` for every number (`.num`).
- **Palette** (declared in `tailwind.config.js`): `navy` (50–950), `gold` (400–600)
  and `bone` (`#f7f6f2` background, `#e6e3d9` borders, `#eeece3` dividers).
- **Surfaces**: the `.card` class — white, hairline border, small radius, no shadows.
- **Component classes** (`src/index.css`): `.card`, `.btn`/`.btn-primary`/`.btn-ghost`/`.btn-outline`,
  `.chip`, `.nav-link`, `.divide-classic`, `.input`, `.label`, `.stat-label`, `.num`.
- Layout is full-width: pages use `p-4 md:p-8` and CSS-grid rows, without a
  centered `max-w-*` container.

## Features Overview

### Dashboard
- Overall statistics (Total Income, Total Expenses, Total Balance)
- Monthly transaction grouping
- Collapsible month sections
- Transaction cards with details

### Transaction Display
- Color-coded by type (income/expense)
- Status indicators (paid/unpaid)
- Category labels
- Date formatting
- Currency formatting (BRL)

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **date-fns** - Date utilities
- **lucide-react** - Icons
