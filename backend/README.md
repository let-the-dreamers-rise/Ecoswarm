# EcoSwarm Backend API

Backend service for the EcoSwarm Climate Investment Platform.

## Directory Structure

```
backend/
├── src/
│   ├── index.ts           # Main Express server with WebSocket
│   ├── models/            # Data models (EnvironmentalEvent, Portfolio, etc.)
│   ├── services/          # Business logic components
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Helper functions
│   └── tests/             # Unit and integration tests
├── dist/                  # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── vitest.config.ts       # Test configuration
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `../.env`:
   - HEDERA_ACCOUNT_ID
   - HEDERA_PRIVATE_KEY
   - BACKEND_PORT (default: 3000)

3. Run development server:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm test
   ```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /events` - Submit environmental event (coming soon)
- `GET /portfolio` - Get current portfolio allocation (coming soon)
- `GET /metrics` - Get aggregate impact metrics (coming soon)
- `GET /tokens` - Get token balances (coming soon)

## WebSocket

WebSocket server runs on the same port as the HTTP server for real-time dashboard updates.
