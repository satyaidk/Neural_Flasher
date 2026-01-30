# ESP32-C3 Web Flasher - Quick Start (5 Minutes)

**TL;DR** - Get flashing in 5 minutes.

---

## Step 1: Prepare Firmware (2 minutes)

### Using Arduino IDE
```
Sketch → Export compiled Binary
```
Copy these three files to `firmware/` folder:
- `sketch.ino.bootloader.bin`
- `sketch.ino.partitions.bin`
- `sketch.ino.firmware.bin`

**Only `firmware.bin` is required.** The others are optional.

---

## Step 2: Test Locally (2 minutes)

### Start Server
```bash
# Python 3
python -m http.server 8000

# Or use Node
npx http-server
```

### Flash Device
1. Put ESP32-C3 in bootloader mode:
   - Hold `GPIO0` button
   - Press `RST` button
   - Release `GPIO0` button

2. Open `http://localhost:8000/standalone/` in Chrome (or open standalone/index.html directly)

3. Click **Connect Device** → Select port → **Start Flashing**

4. Done! Device resets and runs your code.

---

## Step 3: Deploy to Production (1 minute)

### GitHub Pages (Free)
```bash
git init && git add . && git commit -m "Init"
git branch -M main
git remote add origin https://github.com/YOU/esp32-web-flasher
git push -u origin main
```

Then enable GitHub Pages in repository settings. Done!

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
Drag folder into netlify.com

---

## Common Issues

| Problem | Solution |
|---------|----------|
| "No device" | Plug in USB cable, put in bootloader mode |
| "Device not in bootloader" | Hold GPIO0 + press RST + release GPIO0 |
| "firmware.bin not found" | Copy binary to `firmware/` folder |
| "HTTPS required" | Use `https://` domain, not `http://` |
| Won't work in Firefox | Use Chrome or Edge (Web Serial API) |

---

## File Structure
```
esp32-web-flasher/
├── standalone/
│   ├── index.html    ← Open this in browser
│   └── app.js        ← Flashing logic (no changes needed)
├── firmware/
│   ├── firmware.bin   ← Your compiled code here
│   ├── bootloader.bin ← (optional)
│   └── partitions.bin ← (optional)
├── README.md         ← Full docs
├── SETUP.md          ← Detailed setup
└── QUICK_START.md    ← This file
```

---

## Architecture (30-second overview)

```
Chrome Browser ──WebSerial──→ ESP32-C3 USB ──→ Bootloader ──→ Flash Memory
  (your code)       API         (device)       (accepts flashing)    (stores firmware)
```

No backend server needed. Everything in browser!

---

## Security Notes

✅ **Safe because**:
- HTTPS-only in production
- User clicks "Connect" (permission required)
- Runs in browser sandbox
- No elevated privileges needed

---

## What Gets Flashed Where

| File | Location | Size | Purpose |
|------|----------|------|---------|
| bootloader.bin | 0x0000 | 8KB | First-stage boot (optional) |
| partitions.bin | 0x8000 | 4KB | Partition table (optional) |
| firmware.bin | 0x10000 | 200KB-1MB | Your app code (required) |

---

## Next Steps

- **More details**: Read [README.md](README.md)
- **Full setup**: Read [SETUP.md](SETUP.md)
- **Customize**: Edit `standalone/index.html` for branding
- **Deploy**: Follow Phase 3 in SETUP.md

---

## Pro Tips

1. **Test before uploading**: Flash locally first
2. **Version your firmware**: Keep `v1.0`, `v1.1`, etc.
3. **Monitor success rates**: Log which devices flash successfully
4. **Offline fallback**: This works offline after initial load
5. **Batch updates**: One page can update multiple devices

---

**Questions?** See full documentation in README.md and SETUP.md

**Ready?** Open `standalone/index.html` and start flashing! 🚀
