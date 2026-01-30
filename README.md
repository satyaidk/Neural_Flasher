# ESP32-C3 Web Firmware Flasher

Browser-based firmware flasher for ESP32-C3 using the Web Serial API. No native tools required.

## Quick understand & reference

- **REQUIREMENTS.txt** — Project overview, folder structure, how to run, config, debugging. Start here for quick understanding and debugging.

## Documentation

All guides live in **docs/**:

| Doc | Purpose |
|-----|--------|
| [docs/QUICK_START.md](docs/QUICK_START.md) | Get flashing in 5 minutes |
| [docs/START_HERE.md](docs/START_HERE.md) | Onboarding |
| [docs/README.md](docs/README.md) | Full reference |
| [docs/SETUP.md](docs/SETUP.md) | Setup guide |
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Architecture |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Developer API |
| [docs/FIRMWARE.md](docs/FIRMWARE.md) | How to generate .bin files |

## How to run

**Main Application (Next.js):**
```bash
npm install
npm run dev
```
Then open **http://localhost:3000** in Chrome or Edge.

All logic is integrated — frontend UI and backend flashing logic run together in one app.

## Folder structure (summary)

- **app/** — Next.js pages and layout
- **components/** — React UI components (firmware-flasher.tsx is the main UI)
- **hooks/** — React hooks (use-flasher.ts contains all ESP32 protocol logic)
- **firmware/** — Place your .bin files here
- **docs/** — All documentation
- **standalone/** — Legacy vanilla HTML/JS version (optional backup)

**Architecture:** Frontend (components) + Backend Logic (hooks) = Single Next.js App

See **REQUIREMENTS.txt** for the full structure and details.
