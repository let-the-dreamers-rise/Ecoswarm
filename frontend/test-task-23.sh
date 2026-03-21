#!/bin/bash

echo "Running Task 23 State Persistence Tests..."
echo "=========================================="

cd "$(dirname "$0")"

# Run the state persistence tests
npm test -- StatePersistence.test.tsx

echo ""
echo "Test execution complete!"
