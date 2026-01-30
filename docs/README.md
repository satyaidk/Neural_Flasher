# ESP32-C3 Browser-Based Firmware Flasher — Full Reference

---

## Quick Start

### Prerequisites
- **Browser**: Chrome or Edge (version 89+)
- **Device**: ESP32-C3 with USB connector
- **Firmware**: Pre-compiled `.bin` files

### 1. Prepare Firmware
Compile your ESP32-C3 firmware using Arduino IDE or ESP-IDF and export binaries:

```
firmware/
├── bootloader.bin      (optional, 8KB @ 0x0000)
├── partitions.bin      (optional, 4KB @ 0x8000)
└── firmware.bin        (required, main app @ 0x10000)
```

### 2. Connect Device
1. Put ESP32-C3 in **bootloader mode**:
   - Hold `GPIO0` to GND
   - Click reset button (or power cycle)
   - Release `GPIO0`
2. Connect USB cable to computer

### 3. Flash Firmware
1. Open **standalone/index.html** in Chrome/Edge (or serve the project and open `/standalone/`)
2. Click **Connect Device**
3. Select device from browser dialog
4. Click **Start Flashing**
5. Wait for completion
6. Device resets automatically

---

## Architecture

### System Flow

```
┌─────────────────┐
│   Chrome/Edge   │  Web Serial API (requires HTTPS/localhost)
│   Browser       │
└────────┬────────┘
         │
         │ navigator.serial.requestPort()
         │
┌────────▼────────────────┐
│  ESP32-C3 USB CDC       │
│  Serial Interface       │
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│  ROM Bootloader         │  Handles low-level flash commands
│  (Always Available)     │
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│  Flash Memory           │  1MB total, 3 regions
│  (1MB SPI Flash)        │
└─────────────────────────┘
```

### Flash Memory Layout

| Offset  | Size  | File           | Purpose                      |
|---------|-------|----------------|------------------------------|
| 0x0000  | 8KB   | bootloader.bin | First-stage bootloader       |
| 0x8000  | 4KB   | partitions.bin | Partition table (OTA, app)   |
| 0x10000 | ~1MB  | firmware.bin   | Main application code       |

### Communication Protocol

The ESP32-C3 ROM bootloader is always accessible via serial (USB CDC) and understands the **Espressif bootloader protocol**:

- **Baud Rate**: 115,200 bps
- **Flow Control**: None (CTS/RTS signals used for mode switching)
- **Data Format**: 8N1 (8 bits, no parity, 1 stop bit)

Key signals:
- **RTS = HIGH, DTR = LOW** → Normal operation (app runs)
- **RTS = LOW, DTR = HIGH** → Bootloader mode (flashing)

---

## Project Structure (Restructured)

```
web_firmware_esp32_c3/
├── REQUIREMENTS.txt       ← Quick reference (root)
├── README.md              ← Short entry (root)
├── standalone/            ← Vanilla flasher (no build)
│   ├── index.html         ← Open in Chrome/Edge
│   └── app.js             ← Flashing logic
├── app/, components/, ... ← Next.js app
├── firmware/              ← Place .bin files here
└── docs/                  ← All documentation (this file lives here)
```

---

## Implementation Details

### Web Serial API Implementation

The **Web Serial API** is the modern standard for browser-to-hardware communication:

```javascript
// Request serial port (user gesture required)
const port = await navigator.serial.requestPort();

// Open at standard ESP32 baud rate
await port.open({ baudRate: 115200 });

// Get reader/writer
const reader = port.readable.getReader();
const writer = port.writable.getWriter();
```

**Security Model**:
- ✅ User-initiated only (click button required)
- ✅ Permission prompt shown
- ✅ HTTPS/localhost enforced
- ✅ No background access
- ✅ Browser sandbox isolation

**Browser Support**:
- ✅ Chrome 89+
- ✅ Edge 89+
- ❌ Firefox (not yet)
- ❌ Safari (not yet)

---

## Troubleshooting

### "No device connected"
- Ensure ESP32-C3 is plugged in
- Check USB cable (must support data transfer)
- Verify device appears in system's device manager

### "Device not in bootloader mode"
- Hold GPIO0 to GND
- Press reset button
- Release GPIO0
- Try reconnecting

### "Port already in use"
- Close Arduino IDE or other serial monitors
- Unplug and replug device

### "HTTPS required" error
- Use https:// URL (not http://)
- Or use localhost for development

### Flashing fails mid-way
- Increase timeout in `standalone/app.js` (line ~60): `TIMEOUT = 10000`
- Reduce baud rate: change `BAUD_RATE = 9600`
- Try different USB port

---

## Documentation Index

| Doc | Purpose |
|-----|--------|
| [QUICK_START.md](QUICK_START.md) | 5-minute get started |
| [START_HERE.md](START_HERE.md) | Onboarding |
| [SETUP.md](SETUP.md) | Detailed setup |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Architecture |
| [API_REFERENCE.md](API_REFERENCE.md) | Developer API |
| [FIRMWARE.md](FIRMWARE.md) | How to generate .bin files |
| [CHECKLIST.md](CHECKLIST.md) | Pre-flight checklist |
| [CHEAT_SHEET.md](CHEAT_SHEET.md) | Commands and shortcuts |
| [INDEX.md](INDEX.md) | Doc index |

---

**Built with ❤️ for the ESP32 community**
