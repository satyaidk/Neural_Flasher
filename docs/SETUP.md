# ESP32-C3 Web Flasher - Complete Setup Guide

This guide walks you through every step: from preparing firmware to hosting in production.

---

## Phase 1: Prepare Your Firmware

### Option A: Using Arduino IDE (Recommended for Beginners)

#### Step 1: Install Arduino IDE
- Download from [arduino.cc](https://www.arduino.cc/en/software)
- Install official ESP32 board support:
  - File → Preferences
  - Add to "Additional Boards Manager URLs":
    ```
    https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
    ```
  - Tools → Board Manager → Search "esp32" → Install

#### Step 2: Select ESP32-C3
- Tools → Board → ESP32 Arduino → "ESP32-C3 Dev Module"
- Tools → Port → Select your device's COM port

#### Step 3: Write Your Code
```cpp
// Example: Simple WiFi connection
#include <WiFi.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
}

void loop() {
  if (WiFi.isConnected()) {
    Serial.println("Connected!");
  }
  delay(1000);
}
```

#### Step 4: Export Binary
1. Click **Sketch** → **Export compiled Binary**
2. Files appear in the sketch folder
3. Look for these three files:
   - `sketch_name.ino.bootloader.bin`
   - `sketch_name.ino.partitions.bin`
   - `sketch_name.ino.firmware.bin`

#### Step 5: Copy to Web Flasher
```bash
# From Arduino sketch folder
cp sketch_name.ino.bootloader.bin /path/to/esp32-web-flasher/firmware/bootloader.bin
cp sketch_name.ino.partitions.bin /path/to/esp32-web-flasher/firmware/partitions.bin
cp sketch_name.ino.firmware.bin /path/to/esp32-web-flasher/firmware/firmware.bin
```

---

### Option B: Using ESP-IDF (Advanced - Full Control)

#### Step 1: Install ESP-IDF
```bash
# Clone the repository
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf

# Run installer
./install.sh esp32c3

# Source the environment
. ./export.sh
```

#### Step 2: Create Your Project
```bash
cp -r examples/get-started/hello_world ~/my-esp32-project
cd ~/my-esp32-project
```

#### Step 3: Configure Target
```bash
idf.py set-target esp32c3
```

#### Step 4: Customize (Optional)
```bash
# Open menuconfig for advanced settings
idf.py menuconfig
# Navigate: Component config → Optional settings
# Adjust clock speed, WiFi power, debug levels, etc.
```

#### Step 5: Build
```bash
idf.py build
```

Binaries are created in `build/`:
- `build/bootloader/bootloader.bin`
- `build/partition_table/partition-table.bin`
- `build/hello_world.bin`

#### Step 6: Copy to Web Flasher
```bash
mkdir -p ~/esp32-web-flasher/firmware
cp build/bootloader/bootloader.bin ~/esp32-web-flasher/firmware/
cp build/partition_table/partition-table.bin ~/esp32-web-flasher/firmware/partitions.bin
cp build/hello_world.bin ~/esp32-web-flasher/firmware/firmware.bin
```

---

## Phase 2: Local Testing

### Step 1: Verify Firmware Files
```bash
cd esp32-web-flasher/firmware
ls -lh
# Should show:
# -rw-r--r-- bootloader.bin (8KB)
# -rw-r--r-- partitions.bin (4KB)
# -rw-r--r-- firmware.bin    (200KB+)
```

### Step 2: Prepare Device
1. Connect ESP32-C3 to USB
2. **Put device in bootloader mode**:
   - Hold down `GPIO0` button (labeled BOOT on most boards)
   - Press `RST` button (reset) once
   - Release `GPIO0` button
   - LED should stop blinking (device waiting for flash)

### Step 3: Start Local Server

#### Using Python (Simplest)
```bash
cd esp32-web-flasher
python3 -m http.server 8000
# Server running at http://localhost:8000
```

#### Using Node.js
```bash
cd esp32-web-flasher
npx http-server
# Server running at http://127.0.0.1:8080
```

#### Using VS Code Live Server
1. Install "Live Server" extension
2. Right-click `standalone/index.html`
3. Select "Open with Live Server"

### Step 4: Flash Via Browser
1. Open browser (Chrome or Edge)
2. Navigate to `http://localhost:8000` (or your server URL)
3. Click **"Connect Device"**
4. Select your device from the popup
5. Click **"Start Flashing"**
6. Watch the log for progress
7. Device resets automatically when done

### Step 5: Verify Success
- Look for: **"✓ Firmware flashing completed successfully!"**
- Device should restart and run your application
- Check device's serial output or status LEDs

---

## Phase 3: Deploy to Production

### Option A: GitHub Pages (Free, Recommended)

#### Step 1: Create GitHub Repository
```bash
cd esp32-web-flasher
git init
git add .
git commit -m "Initial ESP32 Web Flasher"
```

#### Step 2: Push to GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/esp32-web-flasher
git push -u origin main
```

#### Step 3: Enable GitHub Pages
1. Go to repository on github.com
2. Settings → Pages
3. Source: `main` branch
4. GitHub creates HTTPS certificate automatically
5. Your flasher is live at: `https://YOUR_USERNAME.github.io/esp32-web-flasher`

#### Step 4: Share Link
- Send users to: `https://YOUR_USERNAME.github.io/esp32-web-flasher`
- They connect device and flash (no installation needed!)

---

### Option B: Vercel (Instant Deploy, Custom Domain)

#### Step 1: Create Vercel Account
- Visit [vercel.com](https://vercel.com)
- Sign up with GitHub

#### Step 2: Deploy Project
```bash
# Install Vercel CLI
npm install -g vercel

# From project directory
cd esp32-web-flasher
vercel
```

#### Step 3: Configuration
- Select "Other" for framework
- Accept defaults for other settings
- Vercel builds and deploys instantly

#### Step 4: Custom Domain (Optional)
- In Vercel dashboard → Settings → Domains
- Add your domain (e.g., `flasher.yourcompany.com`)
- HTTPS certificate created automatically

---

### Option C: Netlify (Drag & Drop)

#### Step 1: Create Account
- Visit [netlify.com](https://netlify.com)
- Sign up

#### Step 2: Deploy
- Drag your `esp32-web-flasher` folder onto Netlify
- Or connect GitHub for auto-deploy on push

#### Step 3: Configure Domain
- Netlify → Site settings → Domain management
- Custom domain with free HTTPS

---

### Option D: Self-Hosted (Full Control)

#### Step 1: Get Server
- Rent VPS from: DigitalOcean, Linode, AWS, etc.
- Minimum: 1GB RAM, 10GB disk

#### Step 2: Install Web Server
```bash
# Using Nginx (recommended)
sudo apt update && sudo apt install -y nginx

# Copy files to web root
sudo cp -r esp32-web-flasher/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html

# Start Nginx
sudo systemctl start nginx
```

#### Step 3: Setup HTTPS
```bash
# Install Let's Encrypt Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get free certificate
sudo certbot certonly --nginx -d yourdomain.com

# Configure Nginx for HTTPS
sudo nano /etc/nginx/sites-available/default
# Add SSL certificate paths in config file
```

#### Step 4: Deploy
- Domain points to your server
- HTTPS enabled automatically
- Users access via `https://yourdomain.com`

---

## Phase 4: Advanced Configuration

### Customize Branding

Edit `standalone/index.html` to match your brand:

```html
<!-- Change title -->
<title>My Company - ESP32 Flasher</title>

<!-- Change heading -->
<h1>My Company Device Flasher</h1>
<p class="subtitle">Professional Firmware Updates</p>

<!-- Update colors in <style> section -->
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Change to your brand colors */
```

### Add Instructions/Documentation

Create `instructions.html` linking from main page:

```html
<a href="instructions.html" target="_blank">Setup Instructions</a>
```

### Version Firmware Files

```bash
firmware/
├── v1.0.0/
│   └── firmware.bin
├── v1.0.1/
│   └── firmware.bin
└── latest/
    └── firmware.bin (symlink to v1.0.1)
```

Update standalone/app.js to load from version folder:
```javascript
const response = await fetch(`/firmware/${version}/firmware.bin`);
```

---

## Troubleshooting Checklist

### Device Won't Connect
- [ ] Device plugged in via USB cable (data cable, not charge-only)
- [ ] Port appears in Windows Device Manager or Mac System Report
- [ ] No other serial monitor open (close Arduino IDE)
- [ ] Try different USB port
- [ ] Update USB drivers (Windows)

### Device Won't Enter Bootloader
- [ ] Hold GPIO0 button, press RST, release GPIO0
- [ ] Try holding GPIO0 for full 2 seconds
- [ ] Check if buttons are working (they may be reversed)
- [ ] Some boards have built-in reset circuit—hold GPIO0 while applying power instead

### Flashing Fails Partway
- [ ] Firmware file is valid binary (not 0 bytes)
- [ ] Reduce baud rate in standalone/app.js from 115200 to 9600
- [ ] Increase timeout: `TIMEOUT = 10000`
- [ ] Try different USB port/cable
- [ ] Firmware may be corrupted—regenerate from source

### Flash Seems Complete But Device Doesn't Run
- [ ] Bootloader and partitions may be missing—flash all three files
- [ ] Device may have incorrect partition table
- [ ] Try flashing official bootloader from Espressif examples

### Browser Says "HTTPS Required"
- [ ] Use `https://` URL, not `http://`
- [ ] GitHub Pages/Vercel/Netlify provide HTTPS automatically
- [ ] Local development works at `http://localhost`

### Firefox/Safari Not Supported
- [ ] Web Serial API only in Chromium browsers currently
- [ ] Use Chrome 89+ or Edge 89+
- [ ] Firefox support coming in future versions

---

## Security Best Practices

### Firmware Verification
- Always verify firmware source before flashing
- Check file hashes: `sha256sum firmware.bin`
- Only flash from trusted sources

### Network Security
- HTTPS only for production (enforced by browser)
- Don't flash over public WiFi
- Monitor logs for unusual activity

### Device Security
- Protect bootloader mode with physical access control
- Consider secure boot (advanced ESP-IDF option)
- Regular firmware updates for security patches

---

## Testing Checklist Before Production

- [ ] Firmware compiles without errors
- [ ] Local testing successful on real device
- [ ] All three binaries present (bootloader, partitions, firmware)
- [ ] Flashing completes in <2 minutes
- [ ] Device runs correctly after flashing
- [ ] Documentation updated with version info
- [ ] Error messages are user-friendly
- [ ] Tested on multiple devices (if possible)
- [ ] Tested in Chrome and Edge
- [ ] HTTPS working on production domain
- [ ] Firmware rollback plan documented

---

## Performance Optimization

### For Faster Flashing
- Increase baud rate (careful: may cause timeouts)
- Use SSD (faster file serving)
- Minimize network latency (CDN, local servers)
- Compress firmware if possible

### For Better UX
- Pre-load firmware files
- Show device detection progress
- Implement retry logic
- Cache firmware after first flash

---

## Next Steps

1. **Complete Phase 1** - Generate firmware binaries
2. **Complete Phase 2** - Test locally
3. **Complete Phase 3** - Deploy to production
4. **Monitor** - Track flashing success rates
5. **Iterate** - Gather user feedback and improve

Your ESP32-C3 Web Flasher is now production-ready! 🚀

---

**Questions or issues?** Check the main [README.md](README.md) for additional details.
