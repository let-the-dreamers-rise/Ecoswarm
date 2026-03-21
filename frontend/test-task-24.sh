#!/bin/bash

echo "Running Task 24 Tests: AI Decision Display"
echo "==========================================="

cd "$(dirname "$0")"

# Run the specific test file
npx vitest run src/tests/AIDecisionDisplay.test.tsx

echo ""
echo "Test execution complete!"
