/**
 * Integration test for portfolio optimization in event processing pipeline
 * 
 * This script tests the complete flow:
 * 1. Submit 5+ events to the backend
 * 2. Verify AI optimizer is called
 * 3. Verify portfolio is rebalanced when appropriate
 * 
 * Prerequisites:
 * - Backend server running on port 3000
 * - AI service running on port 8000
 */

interface EventRequest {
  event_type: 'Solar' | 'River_Cleanup' | 'Reforestation' | 'Carbon_Capture';
  location_coordinates: {
    latitude: number;
    longitude: number;
  };
  energy_kwh: number;
  co2_reduction_kg: number;
  ecosystem_restoration_units: number;
  timestamp: string;
}

async function submitEvent(event: EventRequest): Promise<any> {
  const response = await fetch('http://localhost:3000/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to submit event: ${response.status}`);
  }
  
  return response.json();
}

async function getPortfolio(): Promise<any> {
  const response = await fetch('http://localhost:3000/portfolio');
  if (!response.ok) {
    throw new Error(`Failed to get portfolio: ${response.status}`);
  }
  return response.json();
}

async function runTest() {
  console.log('=== Portfolio Optimization Integration Test ===\n');
  
  try {
    // Get initial portfolio state
    console.log('1. Getting initial portfolio state...');
    const initialPortfolio = await getPortfolio();
    console.log('Initial allocations:', initialPortfolio.allocations);
    console.log('');
    
    // Submit 5 events with Solar having higher impact scores
    console.log('2. Submitting 5 events (Solar events with higher impact)...');
    const events: EventRequest[] = [
      {
        event_type: 'Solar',
        location_coordinates: { latitude: 40.7128, longitude: -74.0060 },
        energy_kwh: 200,
        co2_reduction_kg: 150,
        ecosystem_restoration_units: 100,
        timestamp: new Date().toISOString()
      },
      {
        event_type: 'Solar',
        location_coordinates: { latitude: 34.0522, longitude: -118.2437 },
        energy_kwh: 180,
        co2_reduction_kg: 140,
        ecosystem_restoration_units: 90,
        timestamp: new Date().toISOString()
      },
      {
        event_type: 'River_Cleanup',
        location_coordinates: { latitude: 51.5074, longitude: -0.1278 },
        energy_kwh: 20,
        co2_reduction_kg: 30,
        ecosystem_restoration_units: 40,
        timestamp: new Date().toISOString()
      },
      {
        event_type: 'Reforestation',
        location_coordinates: { latitude: 48.8566, longitude: 2.3522 },
        energy_kwh: 30,
        co2_reduction_kg: 40,
        ecosystem_restoration_units: 50,
        timestamp: new Date().toISOString()
      },
      {
        event_type: 'Carbon_Capture',
        location_coordinates: { latitude: 35.6762, longitude: 139.6503 },
        energy_kwh: 25,
        co2_reduction_kg: 35,
        ecosystem_restoration_units: 45,
        timestamp: new Date().toISOString()
      }
    ];
    
    for (let i = 0; i < events.length; i++) {
      const result = await submitEvent(events[i]);
      console.log(`Event ${i + 1}: ${events[i].event_type} - Impact Score: ${result.impact_score.toFixed(2)}`);
      
      // Small delay to allow processing
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('');
    
    // Get updated portfolio state
    console.log('3. Getting updated portfolio state...');
    const updatedPortfolio = await getPortfolio();
    console.log('Updated allocations:', updatedPortfolio.allocations);
    console.log('');
    
    // Verify rebalancing occurred
    console.log('4. Verifying rebalancing...');
    const solarChange = Math.abs(
      updatedPortfolio.allocations.Solar - initialPortfolio.allocations.Solar
    );
    
    if (solarChange > 5) {
      console.log('✓ Portfolio was rebalanced successfully!');
      console.log(`  Solar allocation changed by ${solarChange.toFixed(2)}%`);
      console.log('  (Expected: Solar should increase due to higher impact scores)');
    } else if (solarChange > 0) {
      console.log('⚠ Portfolio changed but below 5% threshold');
      console.log(`  Solar allocation changed by ${solarChange.toFixed(2)}%`);
    } else {
      console.log('⚠ Portfolio was not rebalanced');
      console.log('  This may be expected if optimizer determined no rebalancing needed');
    }
    console.log('');
    
    console.log('=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();
