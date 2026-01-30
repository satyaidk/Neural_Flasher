# 📋 ESP32-C3 Web Flasher - Cheat Sheet

Quick reference for all operations. Bookmark this page!

---

## 🚀 Basic Flashing (Copy & Paste)

### Step 1: Prepare Firmware (Arduino IDE)
```
1. Sketch → Export compiled Binary
2. Copy these THREE files to firmware/ folder:
   - sketch.ino.bootloader.bin
   - sketch.ino.partitions.bin
   - sketch.ino.firmware.bin
```

### Step 2: Enter Bootloader Mode
```
Hold GPIO0 button → Press RST → Release GPIO0
```

### Step 3: Start Local Server
```bash
# Python
python -m http.server 8000

# Or Node
npx http-server
```

### Step 4: Flash!
```
1. Open http://localhost:8000 in Chrome/Edge
2. Click "Connect Device"
3. Select device
4. Click "Start Flashing"
5. Wait for success message
```

---

## 📂 File Locations

### Firmware Files Must Go Here
```
esp32-web-flasher/
├── firmware/
│   ├── bootloader.bin      ← Optional
│   ├── partitions.bin      ← Optional
│   └── firmware.bin        ← REQUIRED
```

### Open This in Browser
```
esp32-web-flasher/
└── standalone/index.html   ← Open this!
```

---

## 🌐 Deployment (Choose One)

### GitHub Pages (Free, Recommended)
```bash
git init
git add .
git commit -m "Initial"
git branch -M main
git remote add origin https://github.com/YOU/esp32-web-flasher
git push -u origin main
# Then: Settings → Pages → main branch
# Live at: https://username.github.io/esp32-web-flasher
```

### Vercel (Free, Fast)
```bash
npm install -g vercel
vercel
```

### Netlify (Free, Easy)
```
Drag folder → netlify.com
```

---

## 🔧 Common Commands

### Check If File Exists
```bash
ls firmware/firmware.bin    # Mac/Linux
dir firmware\firmware.bin   # Windows
```

### Check File Size
```bash
ls -lh firmware/firmware.bin    # Mac/Linux (should be >50KB)
wc -c firmware/firmware.bin     # Size in bytes
```

### Remove Old Files
```bash
rm firmware/*.bin            # Mac/Linux
del firmware\*.bin          # Windows
```

### Copy Binaries
```bash
# Mac/Linux
cp ~/Arduino/sketch/sketch.ino.*.bin firmware/

# Windows (from Arduino IDE export folder)
copy sketch.ino.*.bin firmware\
```

---

## 🆘 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| "firmware.bin not found" | Check file exists in `firmware/` folder |
| "Device not responding" | Hold GPIO0 + press RST + release GPIO0 |
| "Port already in use" | Close Arduino IDE |
| "No device selected" | Plug in USB cable |
| Device won't boot | Ensure bootloader.bin and partitions.bin copied |
| Flashing too slow | Try different USB port/cable |
| "HTTPS required" error | Use production URL (https://), not http:// |
| Firefox doesn't work | Use Chrome or Edge |

---

## 📊 Flash Memory Map

```
0x0000   → bootloader.bin      (8KB)    Optional
0x8000   → partitions.bin      (4KB)    Optional
0x10000  → firmware.bin        (1MB)    Required!
0x1FA000 → (End of 2MB flash)
```

---

## ⚡ Performance Targets

| Operation | Target Time |
|-----------|-------------|
| Connect device | <1s |
| Flash 1MB | 30-45s |
| Total | ~50s |

---

## 🔒 Security Checklist

```
BEFORE PRODUCTION:
☐ Using HTTPS (not HTTP)
☐ Firmware is from trusted source
☐ Tested on real device
☐ Error handling works
☐ Users understand risks

DURING OPERATION:
☐ Device physically secured
☐ Only authorized users access
☐ Monitor for errors
☐ Keep backup of working firmware
```

---

## 📝 File Sizes Reference

| File | Typical Size | Min Size |
|------|--------------|----------|
| bootloader.bin | 8KB | 7KB |
| partitions.bin | 4KB | 3KB |
| firmware.bin | 200KB-1MB | 50KB |

**If smaller:** Check file isn't corrupted

---

## 🎯 API Quick Reference

```javascript
// In browser console:
await app.connectDevice()       // Connect to device
await app.flashFirmware()       // Start flashing
await app.disconnectDevice()    // Disconnect
app.flashProgress               // Current progress (0-100)
app.isConnected                 // Is device connected?
app.log("message", "info")      // Add log entry
app.clearLogBuffer()            // Clear logs
```

---

## 🌍 URLs by Platform

| Platform | URL Format |
|----------|-----------|
| GitHub Pages | `https://username.github.io/esp32-web-flasher` |
| Vercel | `https://esp32-web-flasher.vercel.app` |
| Netlify | `https://esp32-web-flasher.netlify.app` |
| Local | `http://localhost:8000` |
| Self-hosted | `https://yourdomain.com` |

---

## 📦 Single-File Alternative

If you want just ONE file instead of folder structure:

```html
<!-- Copy everything from standalone/index.html into one file -->
<!-- Import standalone/app.js code directly -->
<!-- Works at any URL -->
```

Not recommended for production, but possible.

---

## 🔌 USB/Serial Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Port not listed | Device not detected | Check USB cable |
| Unknown device | Driver missing | Update drivers |
| Device disappeared | Connection lost | Reseat USB |
| Slow communication | Baud rate too high | Lower from 115200 |
| Timeouts | Interference | Try different port |

---

## 📄 Documentation at a Glance

```
START_HERE.md          ← Start reading here!
  ↓
QUICK_START.md         ← 5-minute overview
  ↓
SETUP.md               ← Full walkthrough
  ↓
README.md              ← Technical details
  ↓
API_REFERENCE.md       ← For customization
```

---

## 🎯 Test Checklist (Minimal)

```
☐ Firmware compiles
☐ Binary exports successful
☐ Files copied to firmware/
☐ Device in bootloader mode
☐ Browser: Chrome/Edge
☐ Local server running
☐ standalone/index.html opens
☐ Device connects
☐ Flashing succeeds
☐ Firmware runs on device
```

---

## ⚙️ Configuration Tweaks (Advanced)

### Increase Timeout
Edit `standalone/app.js`, line ~60:
```javascript
this.TIMEOUT = 10000;  // 10 seconds (default 5)
```

### Change Baud Rate
Edit `standalone/app.js`, line ~52:
```javascript
this.BAUD_RATE = 230400;  // Faster (default 115200)
```
⚠️ Risk: May cause timeouts. Use if reliable.

### Change Flash Offset
Edit `standalone/app.js`, line ~66:
```javascript
firmware: 0x20000,  // Non-standard offset
```

---

## 🐛 Debugging Tips

```javascript
// In browser console (F12):

// Check connection
app.isConnected                    // true/false
app.port                           // SerialPort object

// Check progress
app.flashProgress                  // 0-100
app.isFlashing                     // true/false

// Check logs
app.logBuffer                      // Array of all logs
console.log(app.logBuffer)         // Print to console

// Manual operations
await app.loadFirmware()           // Load files
await app.detectDevice()           // Detect ESP32
await app.eraseFlash()            // Erase only
```

---

## 📲 Mobile Note

**Web Serial API NOT available on phones/tablets yet.**

Expected support:
- Android: 2025+
- iOS: Unknown (Apple controls)

For now: Desktop only (Chrome/Edge).

---

## 🔄 Typical Workflow

```
1. Compile sketch in Arduino IDE
2. Export compiled binary
3. Copy .bin files to firmware/
4. Put device in bootloader
5. Open index.html
6. Click Connect
7. Click Flash
8. Wait ~50 seconds
9. Device resets
10. Done! ✓
```

---

## 💾 Backup & Restore

### Before First Flash
```bash
# Read current device memory (with esptool.py)
esptool.py -p /dev/ttyUSB0 read_flash 0x0000 0x1FA000 backup.bin
# Saves complete flash as backup
```

### Restore to Device
```bash
esptool.py -p /dev/ttyUSB0 write_flash 0x0000 backup.bin
```

---

## 🚨 Emergency Recovery

If device is bricked:

```bash
# Use official esptool.py (Python)
pip install esptool

# Erase entire flash
esptool.py -p /dev/ttyUSB0 erase_flash

# Flash fresh firmware
esptool.py -p /dev/ttyUSB0 write_flash 0x0000 firmware.bin
```

---

## 📞 When Stuck

1. **Check:** [README.md](README.md) - Troubleshooting
2. **Follow:** [SETUP.md](SETUP.md) - Step-by-step
3. **Review:** [CHECKLIST.md](CHECKLIST.md) - Progress
4. **Debug:** Browser console (F12) for errors
5. **Verify:** Device in bootloader mode
6. **Test:** With known working firmware first

---

## ✨ Pro Tips

- 💡 Keep multiple firmware versions in `firmware/v1.0/`, `firmware/v1.1/`, etc.
- 💡 Bookmark your production URL (GitHub Pages/Vercel)
- 💡 Test with small firmware first (~50KB) before 1MB files
- 💡 Use different USB ports if one causes timeouts
- 💡 Keep original `bootloader.bin` safe - don't lose it!
- 💡 Monitor flash success rates if shipping to users
- 💡 Test on Windows, Mac, and Linux if supporting all

---

## 🎓 Learning Path

**Complete Beginner**
→ START_HERE.md → QUICK_START.md → Test

**Got Technical?**
→ SETUP.md → README.md → Deploy

**Want to Hack?**
→ API_REFERENCE.md → Review standalone/app.js → Customize

**Just Need Reference**
→ This page (CHEAT_SHEET.md)

---

## 📊 Decision Tree

```
Need to flash?
  ├─ Never done it → START_HERE.md
  ├─ Need quick overview → QUICK_START.md
  ├─ Need full guide → SETUP.md
  ├─ Having issues → README.md (Troubleshooting)
  ├─ Want to customize → API_REFERENCE.md
  ├─ Lost? → INDEX.md
  └─ Just need reference → This page!
```

---

## 🏁 One More Thing

**Your biggest win:** You now have a zero-installation firmware flasher for ESP32-C3 that works in any browser.

**Your best move:** Test locally first, deploy confidently.

**Your next step:** Open `standalone/index.html` and flash your device! 🚀

---

**Bookmark this page. You'll come back to it!**

*Last updated: January 2026*
