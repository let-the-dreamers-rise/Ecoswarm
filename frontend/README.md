# EcoSwarm Frontend Dashboard

React-based dashboard for the EcoSwarm Climate Investment Platform.

## Features

- Real-time WebSocket connection to backend
- Dark theme UI with Tailwind CSS
- Four main sections:
  - Environmental Events (map visualization)
  - Impact Scores (aggregate metrics)
  - AI Portfolio Allocation (percentages + token balances)
  - Hedera Event Stream (blockchain events)

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Vitest + React Testing Library for testing
- WebSocket for real-time updates

## Setup

### Install Dependencies

```bash
npm install
```

Or use the helper script:
- Windows: `install-and-test.bat`
- Linux/Mac: `./install-and-test.sh`

### Run Development Server

```bash
npm run dev
```

Dashboard will be available at `http://localhost:5173`

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Dashboard.tsx       # Main dashboard component
│   ├── tests/
│   │   ├── Dashboard.test.tsx  # Dashboard unit tests
│   │   └── setup.ts            # Test configuration
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── public/                     # Static assets
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Vitest configuration
├── tailwind.config.js          # Tailwind configuration
└── package.json                # Dependencies
```

## Configuration

### Backend Connection

The dashboard connects to:
- REST API: `http://localhost:3000`
- WebSocket: `ws://localhost:3000`

Make sure the backend server is running before starting the frontend.

### Environment Variables

No environment variables required for basic operation. The backend URLs are hardcoded for the hackathon demo.

## Testing

The test suite includes:
- Component rendering tests
- WebSocket connection tests
- Data fetching tests
- Layout structure tests
- Mock data display tests

Run tests with:
```bash
npm test
```

## Development

### Adding New Components

1. Create component in `src/components/`
2. Add TypeScript types in `src/types/`
3. Create test file in `src/tests/`
4. Import and use in `Dashboard.tsx` or `App.tsx`

### Styling

Uses Tailwind CSS utility classes. Main theme:
- Background: `bg-gray-900`
- Cards: `bg-gray-800`
- Text: `text-white`
- Accents: Category-specific colors (yellow, blue, green, gray)

## Troubleshooting

### WebSocket Connection Failed

Make sure the backend server is running:
```bash
cd ../backend
npm run dev
```

### Tests Failing

Ensure dependencies are installed:
```bash
npm install
```

### Port Already in Use

Change the port in `vite.config.ts`:
```typescript
server: {
  port: 5174, // Change to any available port
}
```

## Next Steps

Future enhancements:
1. Leaflet map integration for event visualization
2. D3.js pie chart for portfolio display
3. Demo mode controls (Start/Stop buttons)
4. Real-time animations for events
5. Hedera transaction links to testnet explorer

## License

MIT
