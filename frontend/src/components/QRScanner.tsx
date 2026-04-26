"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ── QR Scanner Component ──────────────────────────────────────
 * Wraps html5-qrcode to provide camera-based QR scanning.
 * On successful scan, calls onScan(decodedText).
 */

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (err: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const html5QrCodeRef = useRef<any>(null);

  const startScanner = async () => {
    if (scanning) return;
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {
          // Scan error — ignore unless critical
        }
      );
    } catch (err: any) {
      setScanning(false);
      onError?.(err.message || "Failed to start QR scanner");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {}
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div id="qr-reader" ref={scannerRef}
        className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-slate-200"
        style={{ minHeight: scanning ? "300px" : "0px" }}
      />

      <div className="flex gap-3 justify-center">
        {!scanning ? (
          <button onClick={startScanner} className="btn-primary" id="start-qr-btn">
            📷 Start QR Scanner
          </button>
        ) : (
          <button onClick={stopScanner} className="btn-danger" id="stop-qr-btn">
            ⏹ Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
}
