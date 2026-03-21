#!/bin/bash

echo "Installing Task 18 dependencies..."
cd "$(dirname "$0")"

# Install dependencies
npm install

# Run tests
echo ""
echo "Running EventMap tests..."
npm test -- EventMap.test.tsx

echo ""
echo "Task 18 installation complete!"
echo "The Event Map visualization is now ready to use."
