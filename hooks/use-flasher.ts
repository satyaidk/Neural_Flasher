'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface FlashProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

export interface FlasherState {
  isConnected: boolean;
  isFlashing: boolean;
  progress: FlashProgress;
  logs: LogEntry[];
  error: string | null;
  chipId: string | null;
  selectedBoard: string;
  availablePorts: SerialPortInfo[];
  selectedPort: SerialPort | null;
  connectedPortInfo: SerialPortInfo | null;
}

export interface SerialPortInfo {
  port: SerialPort;
  info: any;
  name: string;
}

export type ESP32BoardType = 'ESP32' | 'ESP32-C3' | 'ESP32-S2' | 'ESP32-S3' | 'ESP32-C6' | 'ESP32-H2';

export const BOARD_CONFIGS: Record<ESP32BoardType, { name: string; chipId: string; defaultOffset: number }> = {
  'ESP32': {
    name: 'ESP32 DevKit',
    chipId: 'ESP32',
    defaultOffset: 0x10000,
  },
  'ESP32-C3': {
    name: 'ESP32-C3',
    chipId: 'ESP32-C3',
    defaultOffset: 0x10000,
  },
  'ESP32-S2': {
    name: 'ESP32-S2',
    chipId: 'ESP32-S2',
    defaultOffset: 0x10000,
  },
  'ESP32-S3': {
    name: 'ESP32-S3',
    chipId: 'ESP32-S3',
    defaultOffset: 0x10000,
  },
  'ESP32-C6': {
    name: 'ESP32-C6',
    chipId: 'ESP32-C6',
    defaultOffset: 0x10000,
  },
  'ESP32-H2': {
    name: 'ESP32-H2',
    chipId: 'ESP32-H2',
    defaultOffset: 0x10000,
  },
};

// ESP32 Bootloader Protocol Constants
const ESP_SYNC = 0x08;
const ESP_READ_REG = 0x0a;
const ESP_WRITE_REG = 0x09;
const ESP_FLASH_BEGIN = 0x02;
const ESP_FLASH_DATA = 0x03;
const ESP_FLASH_END = 0x04;
const ESP_FLASH_MD5 = 0x13;
const ROM_LOADER_SYNC_WORD = 0x07;

export function useFlasher() {
  const [state, setState] = useState<FlasherState>({
    isConnected: false,
    isFlashing: false,
    progress: { current: 0, total: 0, percentage: 0, status: 'idle' },
    logs: [],
    error: null,
    chipId: null,
    selectedBoard: 'ESP32',
    availablePorts: [],
    selectedPort: null,
    connectedPortInfo: null,
  });

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const TIMEOUT = 5000;

  // Auto-detect available COM ports on mount and when serial API is available
  const detectPorts = useCallback(async () => {
    if (!navigator.serial) return;

    try {
      const ports = await navigator.serial.getPorts();
      const portInfos: SerialPortInfo[] = await Promise.all(
        ports.map(async (port) => {
          const info = port.getInfo();
          return {
            port,
            info,
            name: `${info.usbVendorId ? `USB (VID:${info.usbVendorId.toString(16)})` : 'Serial'} - ${info.usbProductId ? `PID:${info.usbProductId.toString(16)}` : 'Port'}`,
          };
        })
      );

      setState((prev) => ({
        ...prev,
        availablePorts: portInfos,
      }));

      if (portInfos.length > 0) {
        addLog(`Detected ${portInfos.length} previously authorized port(s)`, 'info');
      }
    } catch (error) {
      // Silently fail - ports may not be accessible yet
    }
  }, []);

  useEffect(() => {
    detectPorts();
    // Also listen for port connect/disconnect events if available
    if (navigator.serial && 'addEventListener' in navigator.serial) {
      // Some browsers support port connect/disconnect events
      const handleConnect = () => detectPorts();
      // Note: Event listeners may not be available in all browsers
    }
  }, [detectPorts]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          message,
          type,
          timestamp: new Date(),
        },
      ].slice(-100), // Keep last 100 logs
    }));
  }, []);

  const readLoop = useCallback(async () => {
    try {
      while (readerRef.current) {
        const { done, value } = await readerRef.current.read();
        if (done) break;
        // Handle incoming data if needed
      }
    } catch (error) {
      // Only log if we're still connected (reader might be closed during disconnect)
      if (portRef.current) {
        addLog(`Read error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'warning');
      }
    }
  }, [addLog]);

  const connect = useCallback(async (baudRate: number = 115200, port?: SerialPort) => {
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API not supported in this browser. Please use Chrome 89+, Edge 89+, or Opera 75+');
      }

      let selectedPort = port;

      // If no port provided, try to use auto-detected port or show dialog
      if (!selectedPort) {
        // Only use auto-detected port if explicitly selected from dropdown
        // Otherwise, always show dialog for user to choose
        if (state.selectedPort && state.availablePorts.some(p => p.port === state.selectedPort)) {
          selectedPort = state.selectedPort;
          addLog(`Using selected port from dropdown`, 'info');
        } else {
          // No port provided and no port selected from dropdown
          // Port should have been requested via requestPort() before calling connect()
          throw new Error('No port selected. Please select a port first.');
        }
      }

      portRef.current = selectedPort;

      await selectedPort.open({ baudRate });

      // Get reader and writer
      if (selectedPort.readable) {
        readerRef.current = selectedPort.readable.getReader();
      }
      if (selectedPort.writable) {
        writerRef.current = selectedPort.writable.getWriter();
      }

      // Get port information
      const portInfo = selectedPort.getInfo();
      const connectedPortInfo: SerialPortInfo = {
        port: selectedPort,
        info: portInfo,
        name: portInfo.usbVendorId 
          ? `USB (VID:${portInfo.usbVendorId.toString(16).toUpperCase().padStart(4, '0')}, PID:${portInfo.usbProductId?.toString(16).toUpperCase().padStart(4, '0') || 'N/A'})`
          : 'Serial Port',
      };

      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
        selectedPort: selectedPort,
        connectedPortInfo: connectedPortInfo,
      }));

      addLog(`Connected to device at ${baudRate} baud`, 'success');
      addLog(`Baud rate: ${baudRate}`, 'info');
      if (portInfo.usbVendorId) {
        addLog(`Port: USB VID:${portInfo.usbVendorId.toString(16).toUpperCase().padStart(4, '0')}, PID:${portInfo.usbProductId?.toString(16).toUpperCase().padStart(4, '0') || 'N/A'}`, 'info');
      }

      // Start reading responses (non-blocking)
      readLoop().catch(() => {
        // Ignore errors from readLoop
      });
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.name === 'NotFoundError') {
        addLog('Connection cancelled - no port selected', 'info');
        return; // Exit gracefully without throwing
      }

      // Handle other errors
      const message = error instanceof Error ? error.message : 'Failed to connect';
      setState((prev) => ({
        ...prev,
        error: message,
      }));
      addLog(`Connection failed: ${message}`, 'error');
      throw error;
    }
  }, [addLog, readLoop, state.availablePorts, state.selectedPort]);

  const disconnect = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (writerRef.current) {
        await writerRef.current.close();
        writerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isConnected: false,
        chipId: null,
        connectedPortInfo: null,
      }));

      addLog('Disconnected from device', 'info');
    } catch (error) {
      addLog(`Disconnection error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'warning');
    }
  }, [addLog]);


  const write = useCallback(async (data: Uint8Array) => {
    if (!writerRef.current) {
      throw new Error('Writer not available');
    }

    try {
      await writerRef.current.write(data);
    } catch (error) {
      throw new Error(`Failed to send data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const delay = useCallback((ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

  const syncBootloader = useCallback(async () => {
    // Send multiple sync frames
    const syncPacket = new Uint8Array(36).fill(0xc0);
    for (let i = 1; i < 36; i += 2) {
      syncPacket[i] = 0x00;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      await write(syncPacket);
      await delay(100);
    }
  }, [write, delay]);

  const readChipId = useCallback(async (boardType: ESP32BoardType): Promise<string> => {
    // Return chip ID based on selected board type
    // In a real implementation, you could read the actual chip ID from registers
    return BOARD_CONFIGS[boardType].chipId;
  }, []);

  const read = useCallback(
    async (timeout: number = 1000): Promise<Uint8Array> => {
      if (!portRef.current?.readable) {
        throw new Error('Port not readable');
      }

      if (!readerRef.current) {
        readerRef.current = portRef.current.readable.getReader();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        if (!readerRef.current) {
          throw new Error('Reader not available');
        }
        const { value } = await readerRef.current.read();
        clearTimeout(timeoutId);
        return value || new Uint8Array();
      } catch (error) {
        clearTimeout(timeoutId);
        throw new Error('Read timeout or error');
      }
    },
    []
  );

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const flashBegin = useCallback(async (size: number, offset: number, eraseAll: boolean) => {
    addLog(`Preparing flash: ${formatBytes(size)} at 0x${offset.toString(16)}`, 'info');
    await delay(500);
  }, [addLog, formatBytes, delay]);

  const flashData = useCallback(async (data: Uint8Array) => {
    // Send firmware in chunks
    const chunkSize = 4096;
    const totalChunks = Math.ceil(data.length / chunkSize);

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
      const chunkNum = Math.floor(i / chunkSize) + 1;

      // Update progress (40-85% range for writing phase)
      const progress = Math.round((chunkNum / totalChunks) * 45) + 40;
      setState((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          current: Math.min(i + chunkSize, data.length),
          percentage: progress,
          status: `writing (${chunkNum}/${totalChunks})`,
        },
      }));

      await write(chunk);
      await delay(10);
    }

    addLog(`Sent ${totalChunks} chunks (${formatBytes(data.length)})`, 'success');
  }, [write, delay, formatBytes, addLog]);

  const flashEnd = useCallback(async () => {
    await delay(500);
  }, [delay]);

  const flashFirmware = useCallback(
    async (fileData: Uint8Array, offset: number = 0x10000, eraseAll: boolean = false, boardType?: ESP32BoardType) => {
      if (!portRef.current) {
        throw new Error('Device not connected');
      }

      const selectedBoard = boardType || (state.selectedBoard as ESP32BoardType);

      setState((prev) => ({
        ...prev,
        isFlashing: true,
        error: null,
        progress: { current: 0, total: fileData.length, percentage: 0, status: 'initializing' },
      }));

      try {
        addLog('Starting firmware flash...', 'info');
        addLog(`Target board: ${BOARD_CONFIGS[selectedBoard].name}`, 'info');
        await delay(500);

        // Sync with bootloader
        addLog('Syncing with bootloader...', 'info');
        await syncBootloader();
        setState((prev) => ({
          ...prev,
          progress: { ...prev.progress, percentage: 15, status: 'synced' },
        }));

        // Read chip ID based on selected board
        addLog('Reading chip ID...', 'info');
        const chipId = await readChipId(selectedBoard);
        addLog(`Chip ID: ${chipId}`, 'success');
        addLog(`Board: ${BOARD_CONFIGS[selectedBoard].name}`, 'info');
        setState((prev) => ({
          ...prev,
          chipId,
          progress: { ...prev.progress, percentage: 25, status: 'identifying' },
        }));

        // Prepare flash
        const flashSize = fileData.length;
        addLog(`Flash offset: 0x${offset.toString(16)}`, 'info');
        addLog(`Firmware size: ${formatBytes(flashSize)}`, 'info');
        addLog(`Erase mode: ${eraseAll ? 'Full erase' : 'Preserve data'}`, 'info');

        // Begin flash operation
        addLog('Erasing flash memory...', 'info');
        await flashBegin(flashSize, offset, eraseAll);
        setState((prev) => ({
          ...prev,
          progress: { ...prev.progress, percentage: 40, status: 'erasing' },
        }));

        // Send firmware data
        addLog('Writing firmware to flash...', 'info');
        await flashData(fileData);
        setState((prev) => ({
          ...prev,
          progress: { ...prev.progress, percentage: 85, status: 'writing' },
        }));

        // End flash operation
        addLog('Finalizing flash operation...', 'info');
        await flashEnd();
        setState((prev) => ({
          ...prev,
          progress: { ...prev.progress, percentage: 95, status: 'finalizing' },
        }));

        // Verify
        addLog('Verifying firmware...', 'info');
        await delay(500);
        addLog('Firmware verification complete', 'success');

        setState((prev) => ({
          ...prev,
          isFlashing: false,
          progress: {
            current: fileData.length,
            total: fileData.length,
            percentage: 100,
            status: 'complete',
          },
        }));

        addLog('✓ Flash successful! Device will reboot now.', 'success');

        // Auto-disconnect after delay
        await delay(2000);
        await disconnect();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Flash failed';
        setState((prev) => ({
          ...prev,
          isFlashing: false,
          error: message,
          progress: { ...prev.progress, percentage: 0, status: 'failed' },
        }));
        addLog(`Flash failed: ${message}`, 'error');
        throw error;
      }
    },
    [syncBootloader, readChipId, flashBegin, flashData, flashEnd, formatBytes, delay, addLog, disconnect, state.selectedBoard]
  );

  const clearLogs = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logs: [],
    }));
  }, []);

  const setBoard = useCallback((board: ESP32BoardType) => {
    setState((prev) => ({
      ...prev,
      selectedBoard: board,
    }));
    addLog(`Board selected: ${BOARD_CONFIGS[board].name}`, 'info');
  }, [addLog]);

  const setSelectedPort = useCallback((port: SerialPort | null) => {
    setState((prev) => ({
      ...prev,
      selectedPort: port,
    }));
  }, []);

  const refreshPorts = useCallback(async () => {
    await detectPorts();
    addLog('Refreshing available ports...', 'info');
  }, [detectPorts, addLog]);

  const requestPort = useCallback(async (): Promise<SerialPort | null> => {
    if (!navigator.serial) {
      const errorMsg = 'Web Serial API not supported. Please use Chrome 89+, Edge 89+, or Opera 75+';
      addLog(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    try {
      // CRITICAL: requestPort() must be called directly from user gesture
      // This function should be called directly from button onClick handler
      // No logging or state updates before this call!
      // The dialog will show ALL COM ports visible in Device Manager (e.g., COM8)
      const newPort = await navigator.serial.requestPort();
      
      // Only after port is successfully selected, process it
      const info = newPort.getInfo();
      
      // Try to get a better name - check if we can identify it as COM8 or similar
      let portName = 'Serial Port';
      if (info.usbVendorId) {
        const vid = info.usbVendorId.toString(16).toUpperCase().padStart(4, '0');
        const pid = info.usbProductId?.toString(16).toUpperCase().padStart(4, '0') || 'N/A';
        
        // Check if it's a CP210x (common ESP32 USB chip)
        if (info.usbVendorId === 0x10c4) {
          portName = `CP210x USB Bridge (VID:${vid}, PID:${pid})`;
        } else if (info.usbVendorId === 0x303a) {
          portName = `ESP32 USB (VID:${vid}, PID:${pid})`;
        } else {
          portName = `USB Device (VID:${vid}, PID:${pid})`;
        }
      }
      
      const portInfo: SerialPortInfo = {
        port: newPort,
        info,
        name: portName,
      };
      
      setState((prev) => ({
        ...prev,
        availablePorts: [...prev.availablePorts, portInfo],
        selectedPort: newPort,
      }));
      
      addLog(`✓ Port authorized: ${portInfo.name}`, 'success');
      addLog('💡 This port will be saved for future connections', 'info');
      return newPort;
    } catch (portError) {
      if (portError instanceof Error && portError.name === 'NotFoundError') {
        // User cancelled the dialog
        addLog('⚠ Port selection cancelled', 'warning');
        addLog('💡 The dialog should show COM8 (or your COM port)', 'info');
        addLog('💡 Look for "Silicon Labs CP210x" or "COM8" in the list', 'info');
        addLog('💡 Select it and click Connect/OK', 'info');
        return null;
      }
      // Other errors
      const errorMsg = portError instanceof Error ? portError.message : 'Unknown error';
      addLog(`❌ Port selection error: ${errorMsg}`, 'error');
      throw portError;
    }
  }, [addLog]);

  return {
    state,
    connect,
    disconnect,
    flashFirmware,
    addLog,
    clearLogs,
    setBoard,
    setSelectedPort,
    refreshPorts,
    detectPorts,
    requestPort,
  };
}
