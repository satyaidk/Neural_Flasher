# ESP32-C3 Web Flasher - API Reference

Advanced documentation for developers who want to customize or extend the flasher.

---

## Core API: ESP32Flasher Class

All flashing logic is encapsulated in the `ESP32Flasher` class. The class is exposed globally as `app`.

### Properties

```javascript
// Hardware state
app.port              // SerialPort object (null if disconnected)
app.reader            // ReadableStreamDefaultReader (null if disconnected)
app.writer            // WritableStreamDefaultWriter (null if disconnected)
app.isConnected       // Boolean - connection state
app.isFlashing        // Boolean - flashing in progress
app.flashProgress     // Number - progress 0-100

// Configuration
app.BAUD_RATE         // Serial baud rate (115200)
app.TIMEOUT           // Command timeout in ms (5000)

// Flash offsets (bytes)
app.FLASH_OFFSETS = {
  bootloader: 0x0000,   // 8KB bootloader
  partitions: 0x8000,   // 4KB partition table
  firmware: 0x10000,    // Application firmware
}
```

---

## Methods

### Connection Management

#### `connectDevice()`
Requests serial port and opens connection to ESP32-C3.

```javascript
await app.connectDevice();
```

**Returns**: `Promise<void>`

**Throws**: 
- `NotFoundError` if user cancels port selection
- `SecurityError` if HTTPS not used
- Custom error if connection fails

**Example**:
```javascript
try {
  await app.connectDevice();
  console.log("Connected!");
} catch (error) {
  console.error("Connection failed:", error);
}
```

---

#### `disconnectDevice()`
Closes serial port and cleans up resources.

```javascript
await app.disconnectDevice();
```

**Returns**: `Promise<void>`

**Example**:
```javascript
await app.disconnectDevice();
app.isConnected; // → false
```

---

### Flashing

#### `flashFirmware()`
Main entry point for firmware flashing process.

```javascript
await app.flashFirmware();
```

**Returns**: `Promise<void>`

**Process**:
1. Validates device connection
2. Loads firmware binaries from `/firmware/`
3. Erases flash memory
4. Writes bootloader, partitions, firmware
5. Verifies flash integrity
6. Resets device

**Example**:
```javascript
// Flash when user clicks button
document.getElementById("flashBtn").addEventListener("click", async () => {
  try {
    await app.flashFirmware();
    console.log("Success!");
  } catch (error) {
    console.error("Flashing failed:", error);
  }
});
```

---

#### `loadFirmware()`
Loads binary files from `/firmware/` directory.

```javascript
const firmwares = await app.loadFirmware();
```

**Returns**: `Promise<object>`
```javascript
{
  bootloader: Uint8Array | undefined,
  partitions: Uint8Array | undefined,
  firmware: Uint8Array | undefined
}
```

**Example**:
```javascript
const fw = await app.loadFirmware();
console.log(`Firmware size: ${fw.firmware.length} bytes`);
```

---

#### `writeFlash(offset, data, label)`
Writes firmware binary to specific flash offset.

```javascript
await app.writeFlash(0x10000, firmwareData, "firmware");
```

**Parameters**:
- `offset` (number): Flash memory address (e.g., 0x10000)
- `data` (Uint8Array): Firmware binary
- `label` (string): Name for logging

**Returns**: `Promise<void>`

**Example**:
```javascript
const firmware = new Uint8Array([0xAA, 0xBB, 0xCC, ...]);
await app.writeFlash(0x10000, firmware, "custom_firmware");
```

---

#### `eraseFlash()`
Clears all flash memory before writing.

```javascript
await app.eraseFlash();
```

**Returns**: `Promise<void>`

---

#### `verifyFlash(data, offset)`
Reads back written firmware and compares with original.

```javascript
await app.verifyFlash(originalData, 0x10000);
```

**Parameters**:
- `data` (Uint8Array): Original firmware binary
- `offset` (number): Flash memory address

**Returns**: `Promise<void>`

**Throws**: Error if verification fails

---

#### `resetDevice()`
Triggers device reset to exit bootloader and start application.

```javascript
await app.resetDevice();
```

**Returns**: `Promise<void>`

---

### Device Detection

#### `detectDevice()`
Syncs with ESP32-C3 ROM bootloader.

```javascript
await app.detectDevice();
```

**Returns**: `Promise<void>`

**Throws**: Warning logged if bootloader not detected

---

### Low-Level Communication

#### `sendCommand(command, description)`
Sends raw command to ROM bootloader.

```javascript
const packet = new Uint8Array([0xC1, 0x30, ...]);
await app.sendCommand(packet, "Erase Flash");
```

**Parameters**:
- `command` (Uint8Array): Command bytes
- `description` (string): For logging

**Returns**: `Promise<any>` (response from device)

---

#### `waitForResponse(timeout)`
Reads response from device with timeout.

```javascript
const response = await app.waitForResponse(5000);
```

**Parameters**:
- `timeout` (number): Milliseconds to wait

**Returns**: `Promise<any>`

**Throws**: Error if timeout exceeded

---

#### `readResponse()`
Reads data from serial port.

```javascript
const data = await app.readResponse();
```

**Returns**: `Promise<Uint8Array | null>`

---

### Utility

#### `sleep(ms)`
Helper to pause execution.

```javascript
await app.sleep(1000); // Wait 1 second
```

**Returns**: `Promise<void>`

---

#### `log(message, level)`
Logs message with timestamp and level.

```javascript
app.log("Firmware loaded", "success");
app.log("Warning: device slow", "warning");
app.log("Error occurred", "error");
```

**Parameters**:
- `message` (string): Log message
- `level` (string): 'info' | 'success' | 'warning' | 'error'

**Updates UI** with color-coded log entry

---

#### `clearLogBuffer()`
Clears all log entries.

```javascript
app.clearLogBuffer();
```

---

#### `updateProgress(percent)`
Updates progress bar.

```javascript
app.updateProgress(50); // 50%
```

**Parameters**:
- `percent` (number): 0-100

---

#### `setStatus(status)`
Updates status badge.

```javascript
app.setStatus('flashing');  // Shows "Flashing..."
app.setStatus('success');   // Shows "Success!"
app.setStatus('error');     // Shows "Error"
app.setStatus('idle');      // Shows "Ready"
```

---

#### `updateUI()`
Enables/disables buttons based on connection state.

```javascript
app.updateUI();
```

---

## Bootloader Protocol (Advanced)

### Command Format

Commands sent to ROM bootloader follow this structure:

```
Byte 0: Command Code
Byte 1-N: Command Parameters
```

### Common Commands

| Command | Code | Purpose |
|---------|------|---------|
| Erase Flash | 0xC0 | Clear all flash |
| Write Flash | 0xC1 | Write data to flash |
| Read Flash | 0xC2 | Read from flash |
| Reset Device | 0xC3 | Restart device |

### Example: Write Command Packet

```javascript
// Create write packet
const packet = new Uint8Array([
  0xC1,                           // Command: Write Flash
  (offset >> 0) & 0xff,          // Address byte 0
  (offset >> 8) & 0xff,          // Address byte 1
  (offset >> 16) & 0xff,         // Address byte 2
  (offset >> 24) & 0xff,         // Address byte 3
  (length >> 0) & 0xff,          // Length byte 0
  (length >> 8) & 0xff,          // Length byte 1
  (length >> 16) & 0xff,         // Length byte 2
  (length >> 24) & 0xff,         // Length byte 3
  ...firmwareData,               // Payload
]);

await app.sendCommand(packet, "Write block");
```

---

## Web Serial API Reference

The flasher uses the modern **Web Serial API** for browser-to-hardware communication.

### Checking Support

```javascript
if (!navigator.serial) {
  console.error("Web Serial API not supported");
}
```

### Requesting Port

```javascript
// User gesture required (button click)
const port = await navigator.serial.requestPort();

// Get device info
const info = port.getInfo();
// → { usbVendorId, usbProductId }
```

### Opening Port

```javascript
await port.open({
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none"
});
```

### Reading Data

```javascript
const reader = port.readable
  .pipeThrough(new TextDecoderStream())
  .getReader();

const { value, done } = await reader.read();
// value → string of data
// done → true if stream closed
```

### Writing Data

```javascript
const writer = port.writable.getWriter();
await writer.write(new Uint8Array([0xAA, 0xBB]));
writer.releaseLock();
```

### Setting Signals

```javascript
// Control RTS/DTR lines for bootloader entry
await port.setSignals({
  requestToSend: false,      // RTS
  dataTerminalReady: true,   // DTR
  break: false               // Break signal
});
```

### Closing Port

```javascript
reader.cancel();
writer.releaseLock();
await port.close();
```

---

## Customization Examples

### Change Baud Rate

```javascript
app.BAUD_RATE = 9600;
await app.connectDevice();
```

### Increase Timeout

```javascript
app.TIMEOUT = 10000; // 10 seconds
```

### Custom Firmware Path

Edit `loadFirmware()` method:
```javascript
const response = await fetch(`/my-firmware/${fileName}.bin`);
```

### Change Flash Offsets

```javascript
app.FLASH_OFFSETS.firmware = 0x20000; // Custom offset
```

### Add Pre-Flash Hook

```javascript
const originalFlash = app.flashFirmware;
app.flashFirmware = async function() {
  console.log("Pre-flash verification...");
  await originalFlash.call(this);
  console.log("Post-flash cleanup...");
};
```

### Monitor Progress Events

```javascript
// Polling approach
const interval = setInterval(() => {
  console.log(`Progress: ${app.flashProgress}%`);
  if (!app.isFlashing) clearInterval(interval);
}, 500);

await app.flashFirmware();
```

---

## Error Handling

### Error Types

```javascript
// Connection errors
if (error.name === 'NotFoundError') {
  // User canceled port selection
}

if (error.name === 'SecurityError') {
  // HTTPS required, not using HTTPS
}

// Device communication errors
if (error.message.includes('timeout')) {
  // Device not responding
}

if (error.message.includes('not found')) {
  // File or device not found
}
```

### Implementing Retry Logic

```javascript
async function flashWithRetry(maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      app.log(`Flash attempt ${attempt}/${maxAttempts}`, 'info');
      await app.flashFirmware();
      return;
    } catch (error) {
      app.log(`Attempt ${attempt} failed: ${error.message}`, 'warning');
      if (attempt < maxAttempts) {
        await app.sleep(2000);
      }
    }
  }
  throw new Error("Flashing failed after all attempts");
}

await flashWithRetry(3);
```

---

## Performance Tuning

### Faster Flashing

```javascript
// Increase baud rate (risky, may cause timeouts)
app.BAUD_RATE = 230400;

// Larger write blocks
const BLOCK_SIZE = 512; // Default 256, increase cautiously
```

### Progress Reporting

```javascript
// More granular progress
app.updateProgress(25);
await someTask1();
app.updateProgress(50);
await someTask2();
app.updateProgress(75);
await someTask3();
app.updateProgress(100);
```

---

## Testing

### Mock Device for Development

```javascript
// Create stub device
const mockPort = {
  open: async () => {},
  close: async () => {},
  getInfo: () => ({ usbVendorId: 0x1234 }),
  readable: { pipeThrough: () => ({ getReader: () => ({}) }) },
  writable: { getWriter: () => ({ write: async () => {} }) },
  setSignals: async () => {},
};

app.port = mockPort;
app.isConnected = true;
```

---

## Browser Compatibility

### Feature Detection

```javascript
// Check Web Serial API support
if (!navigator.serial) {
  console.warn("Web Serial API not supported");
}

// Check ReadableStreamDefaultReader
if (!ReadableStreamDefaultReader) {
  console.warn("ReadableStreamDefaultReader not supported");
}
```

---

## Security Considerations

### Input Validation

```javascript
// Validate firmware size before flashing
if (data.length > 1_000_000) {
  throw new Error("Firmware too large");
}

// Validate offset
if (offset < 0 || offset > 0x1FA000) {
  throw new Error("Invalid flash offset");
}
```

### Certificate Pinning

```javascript
// For production, consider validating firmware signature
function validateFirmwareSignature(data, signature) {
  // Use crypto API to verify
  // crypto.subtle.verify(...)
}
```

---

## Debugging

### Enable Verbose Logging

```javascript
// Intercept sendCommand for debugging
const originalSendCommand = app.sendCommand;
app.sendCommand = async function(cmd, desc) {
  console.log(`[SEND] ${desc}:`, Array.from(cmd).map(b => '0x' + b.toString(16)));
  const result = await originalSendCommand.call(this, cmd, desc);
  console.log(`[RECV]`, result);
  return result;
};
```

### Console Access

All `app` methods available in browser console:
```javascript
// In browser console
await app.connectDevice()
await app.flashFirmware()
app.flashProgress
app.logBuffer
```

---

## Further Reading

- [Web Serial API Spec](https://wicg.github.io/serial/)
- [ESP32-C3 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf)
- [ESP-IDF Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/)
- [Espressif Bootloader Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32c3/api-guides/bootloader.html)

---

**Made for developers who want to extend or customize the flasher!**
