#!/bin/bash

# Apply database migration using drizzle-kit
# This script will automatically respond "Yes" to the confirmation prompt

echo "Yes, I want to execute all statements" | npx drizzle-kit push