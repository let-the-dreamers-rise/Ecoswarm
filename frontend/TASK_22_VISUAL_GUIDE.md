# Task 22 Visual Implementation Guide

## Dashboard Header - Before and After

### BEFORE (Task 21)
```
┌─────────────────────────────────────────────────────────────────┐
│        EcoSwarm: Autonomous Climate Investment Protocol         │
│                                                                 │
│                    ● Connected                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AFTER (Task 22)
```
┌─────────────────────────────────────────────────────────────────┐
│        EcoSwarm: Autonomous Climate Investment Protocol         │
│                                                                 │
│  ● Connected  [Start Simulation] [Stop Simulation] ● Demo Mode Active │
│                                                                 │
│  ┌───────────────── System Health ─────────────────────┐      │
│  │ Simulation │  Impact   │ Portfolio │  Token  │ Event│      │
│  │   Engine   │Calculator │ Optimizer │ Manager │Recorder│    │
│  │ operational│operational│operational│operational│operational│ │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Demo Mode Controls

#### Start Simulation Button
```
┌──────────────────┐
│ Start Simulation │  ← Green when enabled
└──────────────────┘  ← Gray when disabled/active
```

**States:**
- **Enabled**: Green background, white text, clickable
- **Disabled**: Gray background, gray text, not clickable
- **Disabled When**: Demo already active OR WebSocket disconnected

#### Stop Simulation Button
```
┌─────────────────┐
│ Stop Simulation │  ← Red when enabled
└─────────────────┘  ← Gray when disabled
```

**States:**
- **Enabled**: Red background, white text, clickable
- **Disabled**: Gray background, gray text, not clickable
- **Disabled When**: Demo not active OR WebSocket disconnected

#### Demo Mode Active Indicator
```
┌──────────────────────┐
│ ● Demo Mode Active   │  ← Green pulsing dot
└──────────────────────┘  ← Green background badge
```

**Visibility:**
- **Shown**: When simulation is running
- **Hidden**: When simulation is stopped

**Animation:**
- Pulsing green dot (animate-pulse)
- Green background with darker shade

---

### 2. System Health Display

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                      System Health                          │
├─────────────┬─────────────┬─────────────┬─────────────┬─────┤
│ Simulation  │   Impact    │  Portfolio  │    Token    │Event│
│   Engine    │ Calculator  │  Optimizer  │   Manager   │Rec. │
│             │             │             │             │     │
│ operational │ operational │ operational │ operational │ op. │
└─────────────┴─────────────┴─────────────┴─────────────┴─────┘
```

#### Status Badge Colors

**Operational (Green)**
```
┌─────────────┐
│ operational │  ← bg-green-900, text-green-300
└─────────────┘
```

**Stopped (Yellow)**
```
┌─────────┐
│ stopped │  ← bg-yellow-900, text-yellow-300
└─────────┘
```

**Error (Red)**
```
┌───────┐
│ error │  ← bg-red-900, text-red-300
└───────┘
```

#### Component Names
1. **Simulation Engine** - Can be: operational, stopped, error
2. **Impact Calculator** - Can be: operational, error
3. **Portfolio Optimizer** - Can be: operational, error
4. **Token Manager** - Can be: operational, error
5. **Event Recorder** - Can be: operational, error

---

## User Interaction Flow

### Starting a Simulation

```
1. User sees dashboard with WebSocket connected
   ┌──────────────────┐
   │ Start Simulation │ ← Enabled (green)
   └──────────────────┘

2. User clicks "Start Simulation"
   → WebSocket sends: { action: "start_simulation" }
   
3. Button becomes disabled, indicator appears
   ┌──────────────────┐
   │ Start Simulation │ ← Disabled (gray)
   └──────────────────┘
   ┌──────────────────────┐
   │ ● Demo Mode Active   │ ← Appears
   └──────────────────────┘

4. Backend starts generating events
   → Events appear on map
   → Metrics update
   → Portfolio rebalances
```

### Stopping a Simulation

```
1. Simulation is running
   ┌─────────────────┐
   │ Stop Simulation │ ← Enabled (red)
   └─────────────────┘
   ┌──────────────────────┐
   │ ● Demo Mode Active   │ ← Visible
   └──────────────────────┘

2. User clicks "Stop Simulation"
   → WebSocket sends: { action: "stop_simulation" }
   
3. Button becomes disabled, indicator disappears
   ┌─────────────────┐
   │ Stop Simulation │ ← Disabled (gray)
   └─────────────────┘
   ┌──────────────────────┐
   │ ● Demo Mode Active   │ ← Hidden
   └──────────────────────┘

4. Backend stops generating events
   → No new events appear
   → Dashboard shows last state
```

### Receiving Health Updates

```
1. Backend sends health update via WebSocket:
   {
     type: "health_status",
     components: {
       simulation_engine: "operational",
       impact_calculator: "operational",
       portfolio_optimizer: "operational",
       token_manager: "operational",
       event_recorder: "operational"
     }
   }

2. Dashboard displays health panel:
   ┌─────────────────────────────────────────┐
   │           System Health                 │
   ├──────────┬──────────┬──────────┬────────┤
   │ Sim Eng  │ Impact   │ Portfolio│ Token  │
   │operational│operational│operational│operational│
   └──────────┴──────────┴──────────┴────────┘

3. If component status changes to error:
   {
     type: "health_status",
     components: {
       ...
       portfolio_optimizer: "error",
       ...
     }
   }

4. Dashboard updates that component:
   ┌──────────┐
   │ Portfolio│
   │  error   │ ← Red background
   └──────────┘
```

---

## WebSocket Message Examples

### Outgoing: Start Simulation
```json
{
  "action": "start_simulation"
}
```

### Outgoing: Stop Simulation
```json
{
  "action": "stop_simulation"
}
```

### Incoming: Health Update (All Operational)
```json
{
  "type": "health_status",
  "components": {
    "simulation_engine": "operational",
    "impact_calculator": "operational",
    "portfolio_optimizer": "operational",
    "token_manager": "operational",
    "event_recorder": "operational"
  }
}
```

### Incoming: Health Update (Mixed States)
```json
{
  "type": "health_status",
  "components": {
    "simulation_engine": "stopped",
    "impact_calculator": "operational",
    "portfolio_optimizer": "error",
    "token_manager": "operational",
    "event_recorder": "operational"
  }
}
```

---

## Responsive Design

### Desktop (1920x1080)
```
┌─────────────────────────────────────────────────────────────────┐
│                    Full width header                            │
│  Controls and health display centered                           │
└─────────────────────────────────────────────────────────────────┘
```

### Laptop (1280x720)
```
┌───────────────────────────────────────────────────┐
│              Compact header                       │
│  Controls and health display fit comfortably      │
└───────────────────────────────────────────────────┘
```

### Health Panel Max Width
- Max width: 4xl (56rem / 896px)
- Centered with `mx-auto`
- Prevents stretching on ultra-wide displays

---

## Accessibility Features

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order: Start → Stop → (other elements)
- Enter/Space to activate buttons

### Visual Feedback
- Disabled state clearly indicated
- Color + text for status (not color alone)
- High contrast text on backgrounds

### Screen Readers
- Button labels are descriptive
- Status text is readable
- Component names are clear

---

## Testing Checklist

### Demo Mode Controls
- [ ] Start button sends correct message
- [ ] Stop button sends correct message
- [ ] Indicator appears when active
- [ ] Indicator disappears when stopped
- [ ] Start disabled when active
- [ ] Stop disabled when inactive
- [ ] Both disabled when disconnected

### System Health Display
- [ ] Panel appears after health update
- [ ] All 5 components displayed
- [ ] Operational shows green
- [ ] Stopped shows yellow
- [ ] Error shows red
- [ ] Updates when new message received
- [ ] Panel hidden before first update

---

## Color Reference

### Demo Mode Controls
- **Start Enabled**: `bg-green-600 hover:bg-green-700`
- **Stop Enabled**: `bg-red-600 hover:bg-red-700`
- **Disabled**: `bg-gray-600 text-gray-400`
- **Active Indicator**: `bg-green-900` with `text-green-300`
- **Pulse Dot**: `bg-green-400 animate-pulse`

### System Health
- **Operational**: `bg-green-900 text-green-300`
- **Stopped**: `bg-yellow-900 text-yellow-300`
- **Error**: `bg-red-900 text-red-300`
- **Panel**: `bg-gray-800`
- **Labels**: `text-gray-400`

---

## Implementation Notes

### State Management
```typescript
// Demo Mode state
const [isDemoActive, setIsDemoActive] = useState(false);

// System Health state
const [systemHealth, setSystemHealth] = useState<SystemHealthUpdate['components'] | null>(null);
```

### WebSocket Handlers
```typescript
// Handle health updates
const handleHealthUpdate = (update: SystemHealthUpdate) => {
  setSystemHealth(update.components);
};

// Send demo control
const sendDemoControl = (action: 'start_simulation' | 'stop_simulation') => {
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    const message: DemoControlMessage = { action };
    wsRef.current.send(JSON.stringify(message));
    setIsDemoActive(action === 'start_simulation');
  }
};
```

### Conditional Rendering
```typescript
// Demo Mode indicator
{isDemoActive && (
  <div className="flex items-center gap-2 px-3 py-1 bg-green-900 rounded-lg">
    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
    <span className="text-sm text-green-300 font-semibold">Demo Mode Active</span>
  </div>
)}

// System Health panel
{systemHealth && (
  <div className="bg-gray-800 rounded-lg p-4 max-w-4xl mx-auto">
    {/* Health display */}
  </div>
)}
```

---

## Future Enhancements

### Potential Additions
1. **Simulation Timer**: Show elapsed time during demo
2. **Event Counter**: Display events generated in current session
3. **Health History**: Show component status over time
4. **Manual Controls**: Restart individual components
5. **Simulation Speed**: Adjust event generation rate
6. **Auto-Stop**: Stop after N events or M seconds
7. **Health Alerts**: Notifications when components fail
8. **Component Logs**: View detailed error messages

---

## Summary

Task 22 successfully adds:
- ✅ Interactive Demo Mode controls
- ✅ Real-time System Health monitoring
- ✅ Visual feedback for all states
- ✅ WebSocket integration for control and status
- ✅ Comprehensive test coverage
- ✅ Accessible and responsive design

The dashboard now provides complete control over the simulation and visibility into system health, meeting all requirements for Requirements 7.1, 7.4, 7.5, and 8.4.
