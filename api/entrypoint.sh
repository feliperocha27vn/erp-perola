#!/bin/sh
set -e

echo "Running database migrations..."
node --import dotenv/config dist/db/migrate.js

echo "Starting server..."
exec node dist/server.js