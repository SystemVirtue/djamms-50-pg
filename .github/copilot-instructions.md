# djamms-prototype Project Guidelines

## Project Overview
This is a production-ready YouTube-based music player system for bars/venues built with TypeScript, React, Vite, and AppWrite.

## Structure
- **apps/**: Frontend applications (landing, auth, dashboard, player, admin, kiosk)
- **packages/**: Shared code (shared, appwrite-client, youtube-player)
- **scripts/**: Utility scripts (schema-manager)
- **functions/**: AppWrite Cloud Functions
- **tests/**: Unit and E2E tests

## Development Rules
- Use TypeScript for all code
- Follow React hooks patterns
- Use Vite for all app builds
- Store secrets in .env (never commit)
- Use AppWrite SDK for backend
- Implement real-time sync via AppWrite Realtime API
- Test with Vitest (unit) and Playwright (E2E)

## Key Features
- Magic-link + JWT authentication
- Master player system with heartbeats
- Dual YouTube iframes for crossfading
- Real-time queue synchronization
- Venue-scoped permissions
