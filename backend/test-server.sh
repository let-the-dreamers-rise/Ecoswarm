#!/bin/bash
# Quick manual test script for the Express server endpoints

echo "Testing EcoSwarm Backend API Endpoints"
echo "======================================="
echo ""

# Test health endpoint
echo "1. Testing GET /health"
curl -s http://localhost:3000/health | jq .
echo ""

# Test GET /portfolio
echo "2. Testing GET /portfolio"
curl -s http://localhost:3000/portfolio | jq .
echo ""

# Test GET /metrics
echo "3. Testing GET /metrics"
curl -s http://localhost:3000/metrics | jq .
echo ""

# Test GET /tokens
echo "4. Testing GET /tokens"
curl -s http://localhost:3000/tokens | jq .
echo ""

# Test POST /events with valid event
echo "5. Testing POST /events (valid Solar event)"
curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "Solar",
    "location_coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "energy_kwh": 100,
    "co2_reduction_kg": 50,
    "ecosystem_restoration_units": 30,
    "timestamp": "2024-01-15T10:00:00Z"
  }' | jq .
echo ""

# Test POST /events with invalid event (negative metric)
echo "6. Testing POST /events (invalid - negative metric)"
curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "Solar",
    "location_coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "energy_kwh": -10,
    "co2_reduction_kg": 50,
    "ecosystem_restoration_units": 30,
    "timestamp": "2024-01-15T10:00:00Z"
  }' | jq .
echo ""

# Check updated metrics after event submission
echo "7. Testing GET /metrics (after event submission)"
curl -s http://localhost:3000/metrics | jq .
echo ""

# Check updated tokens after event submission
echo "8. Testing GET /tokens (after event submission)"
curl -s http://localhost:3000/tokens | jq .
echo ""

echo "======================================="
echo "API endpoint tests complete!"
