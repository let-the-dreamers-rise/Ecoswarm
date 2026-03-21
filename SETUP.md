# EcoSwarm Platform Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Hedera testnet account (get from https://portal.hedera.com/register)

## Quick Start

### 1. Install Dependencies

From the root directory:

```bash
# Install all dependencies
npm run install:all
```

Or install individually:

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# AI Service
cd ai-service
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Edit the `.env` file in the root directory with your Hedera testnet credentials:

```env
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
HEDERA_NETWORK=testnet
```

### 3. Run All Services

From the root directory:

```bash
npm run dev
```

This starts:
- Backend API on http://localhost:3000
- AI Service on http://localhost:8000
- Frontend Dashboard on http://localhost:5173

Or run services individually:

```bash
# Backend
npm run dev:backend

# AI Service
npm run dev:ai

# Frontend
npm run dev:frontend
```

## Project Structure

```
ecoswarm-platform/
├── backend/              # Node.js/Express backend API
│   ├── src/
│   │   ├── index.ts      # Main server with WebSocket
│   │   ├── models/       # Data models
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript types
│   │   ├── utils/        # Helper functions
│   │   └── tests/        # Tests
│   └── package.json
├── ai-service/           # Python/FastAPI AI optimizer
│   ├── main.py           # FastAPI server
│   ├── tests/            # Tests
│   └── requirements.txt
├── frontend/             # React/TypeScript dashboard
│   ├── src/
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   └── package.json
└── .env                  # Environment configuration
```

## Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# AI service tests
cd ai-service
pytest
```

## Development Workflow

1. Start all services with `npm run dev`
2. Access dashboard at http://localhost:5173
3. Backend API available at http://localhost:3000
4. AI optimizer available at http://localhost:8000

## Infrastructure Components

### Backend (Port 3000)
- Express REST API
- WebSocket server for real-time updates
- Hedera SDK integration
- Event processing pipeline

### AI Service (Port 8000)
- FastAPI REST API
- Portfolio optimization algorithm
- NumPy for calculations

### Frontend (Port 5173)
- React 18 with TypeScript
- Vite dev server
- Tailwind CSS (dark theme)
- WebSocket client

## Next Steps

After setup, the implementation will add:
- Data models (EnvironmentalEvent, Portfolio, TokenBalances)
- Impact score calculator
- Event parser
- Simulation engine
- Hedera integration (Token Service, Consensus Service)
- Dashboard visualizations (map, charts, event stream)
