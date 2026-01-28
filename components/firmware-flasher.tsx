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
} from 'lucide-react';

export function FirmwareFlasher() {
  const { state, connect, disconnect, flashFirmware, addLog, clearLogs } = useFlasher();
  const [baudRate, setBaudRate] = useState(115200);
  const [flashOffset, setFlashOffset] = useState('0x10000');
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

  const handleConnect = async () => {
    try {
      await connect(baudRate);
    } catch (error) {
      console.error('[v0] Connection error:', error);
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
      await flashFirmware(new Uint8Array(data), offset);
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

            {/* Connection Card */}
            <Card className="glow-card">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Connection</h2>
                </div>

                <div className="space-y-4">
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
                    onClick={state.isConnected ? disconnect : handleConnect}
                    className="w-full glow-button"
                    disabled={state.isFlashing}
                  >
                    {state.isConnected ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4 mr-2" />
                        Connect Device
                      </>
                    )}
                  </Button>
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

            {/* Logs Card */}
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

            {/* Device Info Card */}
            <Card className="glow-card">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Device Information</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-muted-foreground">Device Type</span>
                    <Badge variant="secondary">ESP32-C3</Badge>
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

                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-muted-foreground">Baud Rate</span>
                    <code className="text-primary font-semibold">{baudRate}</code>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
