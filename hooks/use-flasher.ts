'use client';

import { useState, useCallback, useRef } from 'react';

export interface FlashProgress {
  current: number;
  total: number;
  percentage: number;
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
}

const ROM_LOADER_SYNC_WORD = 0x07;
const ROM_LOADER_FLASH_BEGIN_CMD = 0x02;
const ROM_LOADER_FLASH_DATA_CMD = 0x03;
const ROM_LOADER_FLASH_END_CMD = 0x04;

export function useFlasher() {
  const [state, setState] = useState<FlasherState>({
    isConnected: false,
    isFlashing: false,
    progress: { current: 0, total: 0, percentage: 0 },
    logs: [],
    error: null,
  });

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

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

  const connect = useCallback(async (baudRate: number = 115200) => {
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API not supported in this browser');
      }

      const port = await navigator.serial.requestPort();
      portRef.current = port;

      await port.open({ baudRate });

      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
      }));

      addLog(`Connected to device at ${baudRate} baud`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      setState((prev) => ({
        ...prev,
        error: message,
      }));
      addLog(`Connection failed: ${message}`, 'error');
      throw error;
    }
  }, [addLog]);

  const disconnect = useCallback(async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }

    if (portRef.current && portRef.current.readable) {
      try {
        await portRef.current.close();
      } catch {
        // Already closed
      }
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
    }));

    addLog('Disconnected from device', 'info');
  }, [addLog]);

  const write = useCallback(async (data: Uint8Array) => {
    if (!portRef.current?.writable) {
      throw new Error('Port not writable');
    }

    const writer = portRef.current.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
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

  const flashFirmware = useCallback(
    async (fileData: Uint8Array, offset: number = 0x10000) => {
      if (!portRef.current) {
        throw new Error('Not connected to device');
      }

      setState((prev) => ({
        ...prev,
        isFlashing: true,
        error: null,
        progress: { current: 0, total: fileData.length, percentage: 0 },
      }));

      try {
        addLog('Starting firmware flash...', 'info');
        addLog(`File size: ${fileData.length} bytes`, 'info');
        addLog(`Flash offset: 0x${offset.toString(16)}`, 'info');

        // Flash begin command
        const flashBegin = new Uint8Array([
          ROM_LOADER_FLASH_BEGIN_CMD,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          (fileData.length >> 0) & 0xff,
          (fileData.length >> 8) & 0xff,
          (fileData.length >> 16) & 0xff,
          (fileData.length >> 24) & 0xff,
          (offset >> 0) & 0xff,
          (offset >> 8) & 0xff,
          (offset >> 16) & 0xff,
          (offset >> 24) & 0xff,
        ]);

        await write(flashBegin);
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Flash data in chunks
        const chunkSize = 256;
        for (let i = 0; i < fileData.length; i += chunkSize) {
          const chunk = fileData.slice(i, Math.min(i + chunkSize, fileData.length));
          const chunkData = new Uint8Array([
            ROM_LOADER_FLASH_DATA_CMD,
            chunk.length & 0xff,
            (chunk.length >> 8) & 0xff,
            0x00,
            ...chunk,
          ]);

          await write(chunkData);
          await new Promise((resolve) => setTimeout(resolve, 50));

          const progress = Math.min(i + chunkSize, fileData.length);
          setState((prev) => ({
            ...prev,
            progress: {
              current: progress,
              total: fileData.length,
              percentage: Math.round((progress / fileData.length) * 100),
            },
          }));

          addLog(`Flashed ${progress}/${fileData.length} bytes`, 'info');
        }

        // Flash end command
        const flashEnd = new Uint8Array([ROM_LOADER_FLASH_END_CMD, 0x00]);
        await write(flashEnd);
        await new Promise((resolve) => setTimeout(resolve, 500));

        setState((prev) => ({
          ...prev,
          isFlashing: false,
          progress: {
            current: fileData.length,
            total: fileData.length,
            percentage: 100,
          },
        }));

        addLog('Firmware flash completed successfully!', 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Flash failed';
        setState((prev) => ({
          ...prev,
          isFlashing: false,
          error: message,
        }));
        addLog(`Flash error: ${message}`, 'error');
        throw error;
      }
    },
    [write, addLog]
  );

  const clearLogs = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logs: [],
    }));
  }, []);

  return {
    state,
    connect,
    disconnect,
    flashFirmware,
    addLog,
    clearLogs,
  };
}
