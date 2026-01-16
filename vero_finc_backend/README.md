# Vero Finc Backend

Financial transactions management system built with NestJS and MongoDB.

## Features

- Financial transactions management (income and expenses)
- Dynamic categories system (create, update, delete categories)
- Transaction status tracking (paid/unpaid)
- MongoDB integration with Docker
- RESTful API

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- npm or yarn

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Start MongoDB with Docker:

```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017 (user: admin, password: admin123)
- Mongo Express (web UI) on port 8081 (user: admin, password: admin123)

3. Access Mongo Express at: http://localhost:8081

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run start:prod
```

## API Endpoints

### Categories

- `GET /categories` - Get all categories (use ?active=true for active only)
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create new category
- `PATCH /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Transactions

- `GET /transactions` - Get all transactions (supports filters: type, category, status, startDate, endDate)
- `GET /transactions/:id` - Get transaction by ID
- `POST /transactions` - Create new transaction
- `PATCH /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

## Data Schemas

### Category Schema

```json
{
  "name": "string (unique)",
  "description": "string (optional)",
  "icon": "string (optional)",
  "active": "boolean (default: true)"
}
```

### Transaction Schema

```json
{
  "description": "string",
  "amount": "number",
  "date": "Date",
  "type": "income | expense",
  "categoryId": "ObjectId (reference to Category)",
  "status": "paid | unpaid"
}
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Stop and remove volumes (delete all data)
docker-compose down -v
```
