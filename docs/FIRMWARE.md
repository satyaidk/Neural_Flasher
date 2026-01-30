# Firmware Binaries Directory

This directory contains the pre-compiled ESP32-C3 firmware binaries to be flashed onto devices.

## Required Files

### `firmware.bin` (REQUIRED)
- Main application firmware
- Flash offset: `0x10000`
- Size: typically 200KB - 1MB
- **This file is mandatory** for flashing to work

### `bootloader.bin` (OPTIONAL)
- First-stage bootloader
- Flash offset: `0x0000`
- Size: ~8KB
- Only needed if you've modified the bootloader

### `partitions.bin` (OPTIONAL)
- Partition table (defines storage layout)
- Flash offset: `0x8000`
- Size: ~4KB
- Only needed if you've modified partition configuration

## How to Generate Binaries

### Using Arduino IDE (Easiest)

1. **Write your sketch** and verify it compiles:
   ```cpp
   void setup() {
     Serial.begin(115200);
     delay(1000);
     Serial.println("ESP32-C3 Ready!");
   }

   void loop() {
     delay(1000);
   }
   ```

2. **Export compiled binary**:
   - Go to `Sketch` → `Export compiled Binary`
   - Files will appear in the sketch folder:
     - `YourSketch.ino.bootloader.bin`
     - `YourSketch.ino.partitions.bin`
     - `YourSketch.ino.firmware.bin`

3. **Copy to this directory**:
   ```bash
   cp ~/Arduino/sketches/YourSketch/YourSketch.ino.*.bin firmware/
   ```

### Using ESP-IDF (Advanced)

1. **Setup ESP-IDF**:
   ```bash
   git clone --recursive https://github.com/espressif/esp-idf.git
   cd esp-idf
   ./install.sh
   . ./export.sh
   ```

2. **Build example**:
   ```bash
   cd examples/get-started/hello_world
   idf.py set-target esp32c3
   idf.py menuconfig    # Optional: customize settings
   idf.py build
   ```

3. **Copy binaries**:
   ```bash
   cp build/bootloader/bootloader.bin firmware/
   cp build/partition_table/partition-table.bin firmware/partitions.bin
   cp build/hello_world.bin firmware/firmware.bin
   ```

## Testing Binaries Locally

1. **Place files in this directory**
2. **Start local web server**:
   ```bash
   # Python 3
   python -m http.server 8000

   # Or Node.js
   npx http-server
   ```
3. **Open in Chrome**: `http://localhost:8000`
4. **Connect device and flash**

## Flash Memory Layout Reference

```
0x0000    ┌──────────────────┐
          │  bootloader.bin  │  8KB
0x8000    ├──────────────────┤
          │ partitions.bin   │  4KB
0x10000   ├──────────────────┤
          │   firmware.bin   │  Variable (usually 200KB-1MB)
0x1FA000  └──────────────────┘
          (for 2MB flash devices)
```

## Troubleshooting

### "firmware.bin not found" error
- Ensure `firmware.bin` exists in this directory
- Check file name (case-sensitive on Linux/Mac)
- Verify file is not empty (0 bytes)

### Flashing fails partway through
- Binary may be corrupted
- Try regenerating from source code
- Check flash memory isn't write-protected

### Device doesn't run after flash
- Bootloader or partitions table may be wrong
- Ensure you're using correct device-specific binaries
- Some binaries include multiple partitions; verify offsets match

## Security Notes

- **Verify firmware integrity** before placing in this directory
- **Use version control** to track firmware changes (store hashes, not binaries)
- **Keep backups** of working firmware versions
- **Never flash untrusted binaries** from unknown sources

## Production Deployment

For production systems:

1. **Host binaries on CDN** (not in repository)
2. **Sign binaries** with ESP32 secure boot if enabled
3. **Version binaries** with build metadata
4. **Monitor flash process** with logging/telemetry
5. **Implement rollback** strategy for failed flashes

---

**Tip**: After successfully flashing, the device will automatically reset and start running your firmware!
