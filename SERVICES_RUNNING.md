# EcoSwarm Services - Now Running! 🚀

## All Services Started Successfully

### 1. AI Service ✅
- **Status:** Running
- **Port:** 8001
- **URL:** http://localhost:8001
- **Terminal ID:** 6
- **Health Check:** http://localhost:8001/health

### 2. Backend API ✅
- **Status:** Running
- **Port:** 3000
- **URL:** http://localhost:3000
- **Terminal ID:** 3
- **WebSocket:** ws://localhost:3000
- **Health Check:** http://localhost:3000/health

### 3. Frontend Dashboard ✅
- **Status:** Running
- **Port:** 5173
- **URL:** http://localhost:5173
- **Terminal ID:** 4

## How to Access the Demo

1. **Open your browser** and navigate to:
   ```
   http://localhost:5173
   ```

2. **Click "Start Simulation"** button in the dashboard header

3. **Watch the autonomous system** for 60 seconds:
   - Environmental events appear on the map
   - Impact scores calculate in real-time
   - Portfolio rebalances automatically
   - Tokens mint for each category
   - Hedera transactions record (mock mode)
   - AI decision logic displays

## System Status

- ✅ AI Portfolio Optimizer: Running on port 8001
- ✅ Backend API: Running on port 3000
- ✅ Frontend Dashboard: Running on port 5173
- ✅ WebSocket: Connected and ready
- ⚠️ Hedera: Operating in mock mode (no credentials configured)

## Quick Actions

### Stop All Services
Use the Kiro terminal panel to stop the background processes, or run:
- Stop AI Service: Terminal ID 6
- Stop Backend: Terminal ID 3
- Stop Frontend: Terminal ID 4

### View Logs
Check the terminal output for each service to see real-time logs.

### Test the API
```bash
# Test backend health
curl http://localhost:3000/health

# Test AI service health
curl http://localhost:8001/health

# Get current portfolio
curl http://localhost:3000/portfolio

# Get metrics
curl http://localhost:3000/metrics
```

## Demo Features

When you start the simulation, you'll see:

1. **Environmental Events Map** (top-left)
   - Color-coded markers by category
   - Pulse animations on new events
   - Hover for event details

2. **Impact Scores** (top-right)
   - Total CO2 reduced
   - Total energy generated
   - Total projects funded

3. **AI Portfolio Allocation** (center)
   - Pie chart with smooth animations
   - Current allocation percentages
   - Token balances for each category

4. **AI Decision Logic** (below portfolio)
   - Current allocations
   - Impact-per-dollar ratios
   - Recommended changes
   - Decision explanations

5. **Hedera Event Stream** (bottom)
   - Recent blockchain events
   - Transaction IDs (mock mode)
   - Event types and timestamps

6. **System Health** (header)
   - Component status indicators
   - Demo mode active indicator
   - Connection status

## Notes

- **Hedera Mock Mode:** The system is running in mock mode because Hedera credentials are not configured in `.env`. All functionality works, but transactions are simulated rather than sent to the actual Hedera testnet.

- **Port Change:** The AI service was moved from port 8000 to 8001 due to a port conflict.

- **Performance:** All services are running with hot-reload enabled for development.

## Troubleshooting

If you encounter issues:

1. **Check terminal outputs** for error messages
2. **Verify ports are not in use** by other applications
3. **Restart services** if needed using the terminal panel
4. **Check browser console** for frontend errors

## Ready for Demo!

The EcoSwarm Climate Investment Platform is now fully operational and ready for demonstration. Open http://localhost:5173 and click "Start Simulation" to see autonomous climate capital allocation in action!
