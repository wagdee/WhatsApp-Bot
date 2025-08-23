# Repository Overview

## Project
- Name: WhatsApp Bot (Web Interface + Node backend)
- Stack:
  - Frontend: Vite + React + TypeScript + TailwindCSS
  - Backend: Node.js + Express + whatsapp-web.js
  - Database: SQLite (sqlite3)

## Key Paths
- Frontend: src/
  - Pages: src/pages
  - Components: src/components
  - Contexts: src/contexts
  - Services (API): src/services
  - Utils: src/utils
  - Types: src/types
- Backend: server/
  - Entry: server/index.js
  - Routes: server/routes/*.js
  - Services: server/services/*.js
  - Database: server/database/init.js
  - Data (SQLite file): server/data/whatsapp_bot.db

## WhatsApp Status Flow
- Service: server/services/whatsapp.js
  - initializeWhatsApp(): sets up client, handles events (qr, ready, message, disconnected)
  - updateWhatsAppStatus(): persists state in table whatsapp_settings
  - getWhatsAppStatus(): reads latest state
- Status type: src/types/index.ts (BotStatus)
- UI: src/components/WhatsAppStatus.tsx

## Database Schema (Important tables)
- whatsapp_settings: (id, is_connected, phone_number, qr_code, last_activity, created_at, updated_at)
- message_logs: logs incoming/outgoing messages
- scheduled_messages: scheduling info
- auto_replies: auto-reply configuration
- users: auth and roles

## Commands
- Dev frontend: npm run dev
- Build frontend: npm run build
- Start backend: node server/index.js (or use nodemon if configured)

## Notes
- whatsapp-web.js requires a headless Chromium. Puppeteer args are configured in services/whatsapp.js.
- QR codes are exposed via API and displayed in the UI.
- Status UI expects BotStatus from backend.