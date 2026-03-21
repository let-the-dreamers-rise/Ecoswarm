#!/bin/bash
# Test script for Task 22 - Demo Mode and System Health

cd "$(dirname "$0")"
npm test -- DemoModeAndHealth.test.tsx --run
