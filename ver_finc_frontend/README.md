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
├── components/          # React components
│   ├── TransactionCard.tsx
│   └── MonthlyGroup.tsx
├── pages/              # Page components
│   └── TransactionsPage.tsx
├── services/           # API services
│   ├── api.ts
│   ├── transactionService.ts
│   └── categoryService.ts
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Utility functions
│   └── transactions.ts
├── App.tsx            # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

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
