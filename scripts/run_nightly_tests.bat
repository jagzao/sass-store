@echo off
echo "Starting nightly E2E test run..."
cd C:\Dev\Zo\sass-store
echo "Updating dependencies..."
call npm install
echo "Running all E2E tests..."
call npm run test:e2e:all
echo "Nightly test run finished."
