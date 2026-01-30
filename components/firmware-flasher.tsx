'use client';

import React from "react"

import { useState, useRef } from 'react';
import { useFlasher } from '@/hooks/use-flasher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Cpu,
  Radio,
  Upload,
  Play,
  X,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { BOARD_CONFIGS, ESP32BoardType } from '@/hooks/use-flasher';

export function FirmwareFlasher() {
  const { state, connect, disconnect, flashFirmware, addLog, clearLogs, setBoard, setSelectedPort, refreshPorts, requestPort } = useFlasher();
  const [baudRate, setBaudRate] = useState(115200);
  const [flashOffset, setFlashOffset] = useState('0x10000');
  const [eraseAll, setEraseAll] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/octet-stream' || file.name.endsWith('.bin')) {
      setSelectedFile(file);
      addLog(`File selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'success');
    } else {
      addLog('Please select a .bin firmware file', 'error');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleConnect = async (port?: SerialPort) => {
    try {
      // Connect with the provided port (from dropdown or from requestPort)
      await connect(baudRate, port);
    } catch (error) {
      // Only log actual errors, not user cancellations
      if (error instanceof Error && error.name !== 'NotFoundError') {
        console.error('[v0] Connection error:', error);
        addLog(`Connection failed: ${error.message}`, 'error');
      }
    }
  };

  const handleFlash = async () => {
    if (!selectedFile) {
      addLog('Please select a firmware file first', 'warning');
      return;
    }

    try {
      const data = await selectedFile.arrayBuffer();
      const offset = parseInt(flashOffset, 16);
      const boardType = state.selectedBoard as ESP32BoardType;
      await flashFirmware(new Uint8Array(data), offset, eraseAll, boardType);
    } catch (error) {
      console.error('[v0] Flash error:', error);
    }
  };

  const logTypeIcons = {
    info: <Info className="w-4 h-4 text-blue-400" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  };

  const logTypeColors = {
    info: 'text-blue-400',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with branding */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Cpu className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold cyber-glow">Neural Flasher</h1>
              <p className="text-xs text-muted-foreground">ESP32-C3 Firmware Flasher</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-primary/20">
              <div
                className={`w-2 h-2 rounded-full ${
                  state.isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              <span className="text-xs font-mono">
                {state.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Firmware Upload Card */}
            <Card className="glow-card">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Firmware Upload</h2>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? 'border-primary bg-primary/10'
                      : 'border-primary/30 hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Zap className="w-8 h-8 text-primary/60" />
                    <p className="text-sm font-medium">Drag & drop firmware here</p>
                    <p className="text-xs text-muted-foreground">or click to select</p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".bin"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {selectedFile && (
                  <div className="mt-4 p-3 rounded-lg bg-green-400/10 border border-green-400/20">
                    <p className="text-xs font-mono text-green-400">
                      ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Board Selection Card */}
            <Card className="glow-card">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Board Selection</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      ESP32 Board Type
                    </label>
                    <select
                      value={state.selectedBoard}
                      onChange={(e) => setBoard(e.target.value as ESP32BoardType)}
                      disabled={state.isConnected || state.isFlashing}
                      className="w-full mt-2 px-3 py-2 rounded-lg bg-input border border-primary/20 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      {Object.keys(BOARD_CONFIGS).map((board) => (
                        <option key={board} value={board}>
                          {BOARD_CONFIGS[board as ESP32BoardType].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Connection Card */}
            <Card className="glow-card">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Connection</h2>
                </div>

                <div className="space-y-4">
                  {/* COM Port Selection */}
                  {state.availablePorts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Detected Ports
                        </label>
                        <button
                          onClick={refreshPorts}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                          title="Refresh ports"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Refresh
                        </button>
                      </div>
                      <select
                        value={state.selectedPort ? state.availablePorts.findIndex(p => p.port === state.selectedPort) : -1}
                        onChange={(e) => {
                          const index = parseInt(e.target.value);
                          if (index >= 0 && index < state.availablePorts.length) {
                            setSelectedPort(state.availablePorts[index].port);
                          } else {
                            setSelectedPort(null);
                          }
                        }}
                        disabled={state.isConnected || state.isFlashing}
                        className="w-full mt-2 px-3 py-2 rounded-lg bg-input border border-primary/20 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      >
                        <option value={-1}>Select port or choose manually...</option>
                        {state.availablePorts.map((portInfo, index) => (
                          <option key={index} value={index}>
                            {portInfo.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {state.availablePorts.length} port(s) detected
                      </p>
                    </div>
                  )}

                  {state.availablePorts.length === 0 && !state.isConnected && (
                    <div className="text-xs text-muted-foreground p-2 rounded bg-primary/5 border border-primary/10">
                      <p className="font-semibold mb-1 text-primary">No previously authorized ports</p>
                      <p className="mb-2">This is normal for first-time use. Click "Connect Device" to authorize your COM port.</p>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mt-2">
                        <p className="font-semibold text-yellow-400 mb-1">💡 Important:</p>
                        <p className="text-xs">Your COM port (e.g., COM8) appears in Device Manager but needs browser authorization.</p>
                        <p className="text-xs mt-1">The system dialog will show ALL available COM ports, including COM8.</p>
                      </div>
                      <p className="mt-2 text-xs opacity-80">After first connection, the port will be saved for future use.</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Baud Rate
                    </label>
                    <select
                      value={baudRate}
                      onChange={(e) => setBaudRate(parseInt(e.target.value))}
                      disabled={state.isConnected}
                      className="w-full mt-2 px-3 py-2 rounded-lg bg-input border border-primary/20 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      <option value={9600}>9600</option>
                      <option value={115200}>115200</option>
                      <option value={230400}>230400</option>
                      <option value={460800}>460800</option>
                      <option value={921600}>921600</option>
                    </select>
                  </div>

                  <Button
                    onClick={async (e) => {
                      if (state.isConnected) {
                        disconnect();
                        return;
                      }

                      // CRITICAL: requestPort() must be called directly from onClick
                      // Don't wrap in preventDefault/stopPropagation or async delays
                      try {
                        let portToUse: SerialPort | null | undefined = state.selectedPort;
                        
                        // If no port selected from dropdown, request one NOW (synchronously from click)
                        if (!portToUse || !state.availablePorts.some(p => p.port === portToUse)) {
                          addLog('Opening port selection dialog...', 'info');
                          addLog('Look for COM8 (Silicon Labs CP210x) in the list', 'info');
                          portToUse = await requestPort();
                          if (!portToUse) {
                            // User cancelled - requestPort already logged
                            return;
                          }
                        }
                        
                        // Connect with the port
                        await handleConnect(portToUse);
                      } catch (error) {
                        if (error instanceof Error && error.name !== 'NotFoundError') {
                          console.error('[v0] Connection error:', error);
                          addLog(`Connection failed: ${error.message}`, 'error');
                        }
                      }
                    }}
                    className="w-full glow-button"
                    disabled={state.isFlashing}
                    title={state.selectedPort ? 'Connect to the selected port' : 'Click to open port selection dialog - COM8 should appear in the list'}
                  >
                    {state.isConnected ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Disconnect
                      </>
                    ) : state.selectedPort ? (
                      <>
                        <Radio className="w-4 h-4 mr-2" />
                        Connect to Selected Port
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4 mr-2" />
                        Connect Device (Select COM8)
                      </>
                    )}
                  </Button>
                  {!state.isConnected && !state.selectedPort && (
                    <div className="text-xs text-muted-foreground mt-2 text-center space-y-1">
                      <p className="font-semibold">Click button above to authorize COM8</p>
                      <p className="text-xs opacity-80">The system dialog will show all COM ports including COM8</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Configuration Card */}
            <Card className="glow-card">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Configuration</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Flash Offset
                    </label>
                    <input
                      type="text"
                      value={flashOffset}
                      onChange={(e) => setFlashOffset(e.target.value)}
                      disabled={state.isFlashing}
                      placeholder="0x10000"
                      className="w-full mt-2 px-3 py-2 rounded-lg bg-input border border-primary/20 text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Flash Mode
                    </label>
                    <select
                      value={eraseAll ? 'true' : 'false'}
                      onChange={(e) => setEraseAll(e.target.value === 'true')}
                      disabled={state.isFlashing}
                      className="w-full mt-2 px-3 py-2 rounded-lg bg-input border border-primary/20 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      <option value="false">Preserve Existing Data</option>
                      <option value="true">Erase Entire Flash</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleFlash}
                    disabled={!state.isConnected || !selectedFile || state.isFlashing}
                    className="w-full glow-button"
                  >
                    {state.isFlashing ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Flashing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Flash
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Progress & Logs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            {state.isFlashing || state.progress.percentage > 0 ? (
              <Card className="glow-card">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Flash Progress</h2>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-mono font-bold text-primary">
                          {state.progress.percentage}%
                        </span>
                      </div>
                      <Progress value={state.progress.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">{state.progress.status}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/20">
                      <div>
                        <p className="text-xs text-muted-foreground">Bytes Written</p>
                        <p className="text-lg font-mono font-bold text-cyan-400">
                          {(state.progress.current / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Size</p>
                        <p className="text-lg font-mono font-bold text-primary">
                          {(state.progress.total / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {/* Error Message */}
            {state.error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <div className="p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-1">Error</h3>
                    <p className="text-sm text-destructive/80">{state.error}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Device Info Card - Moved to Top */}
            <Card className="glow-card">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Device Information</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-muted-foreground">Board Type</span>
                    <Badge variant="secondary">{BOARD_CONFIGS[state.selectedBoard as ESP32BoardType].name}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-muted-foreground">Connection Status</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          state.isConnected ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      <Badge variant={state.isConnected ? 'default' : 'secondary'}>
                        {state.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  </div>

                  {state.isConnected && state.connectedPortInfo && (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-muted-foreground">COM Port</span>
                        <code className="text-primary font-semibold text-xs font-mono">
                          {state.connectedPortInfo.name}
                        </code>
                      </div>

                      {state.connectedPortInfo.info?.usbVendorId && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-muted-foreground">USB VID</span>
                          <code className="text-primary font-semibold font-mono">
                            0x{state.connectedPortInfo.info.usbVendorId.toString(16).toUpperCase().padStart(4, '0')}
                          </code>
                        </div>
                      )}

                      {state.connectedPortInfo.info?.usbProductId && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-muted-foreground">USB PID</span>
                          <code className="text-primary font-semibold font-mono">
                            0x{state.connectedPortInfo.info.usbProductId.toString(16).toUpperCase().padStart(4, '0')}
                          </code>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-muted-foreground">Baud Rate</span>
                    <code className="text-primary font-semibold">{baudRate}</code>
                  </div>

                  {state.chipId && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-muted-foreground">Chip ID</span>
                      <Badge variant="secondary">{state.chipId}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Logs Card - Moved to Bottom */}
            <Card className="glow-card flex flex-col">
              <div className="p-6 border-b border-primary/20 flex items-center justify-between">
                <h2 className="text-lg font-semibold">System Log</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLogs}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-auto max-h-96 p-4 bg-black/20 rounded-b-lg">
                {state.logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Logs will appear here...
                  </p>
                ) : (
                  <div className="space-y-1 font-mono text-xs">
                    {state.logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 text-xs ${logTypeColors[log.type]}`}
                      >
                        {logTypeIcons[log.type]}
                        <span>[{log.timestamp.toLocaleTimeString()}]</span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
