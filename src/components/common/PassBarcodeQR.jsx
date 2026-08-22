// PassBarcodeQR.jsx — Genuine Scannable 2D QR Code + 1D CODE128 Barcode Renderer
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import './PassBarcodeQR.css';

const PassBarcodeQR = ({
  value,
  label = 'GATE ENTRY PASS',
  showBarcode = true,
  showQR = true,
  size = 130,
}) => {
  const barcodeRef = useRef(null);
  const [activeMode, setActiveMode] = useState('both'); // 'both' | 'qr' | 'barcode'

  const cleanValue = value ? String(value).trim() : 'PASS-000000';

  useEffect(() => {
    if (barcodeRef.current && (activeMode === 'both' || activeMode === 'barcode')) {
      try {
        JsBarcode(barcodeRef.current, cleanValue, {
          format: 'CODE128',
          width: 1.8,
          height: 48,
          displayValue: true,
          font: 'monospace',
          fontSize: 12,
          textMargin: 4,
          margin: 6,
          background: '#FFFFFF',
          lineColor: '#0F172A',
        });
      } catch (err) {
        console.warn('JsBarcode render warning:', err);
      }
    }
  }, [cleanValue, activeMode]);

  return (
    <div className="pass-barcode-qr-container">
      {/* Mode Switcher Pills */}
      <div className="pass-code-tabs font-mono">
        <button
          type="button"
          className={`pass-tab-pill ${activeMode === 'both' ? 'active' : ''}`}
          onClick={() => setActiveMode('both')}
        >
          Dual QR + Barcode
        </button>
        <button
          type="button"
          className={`pass-tab-pill ${activeMode === 'qr' ? 'active' : ''}`}
          onClick={() => setActiveMode('qr')}
        >
          QR Only
        </button>
        <button
          type="button"
          className={`pass-tab-pill ${activeMode === 'barcode' ? 'active' : ''}`}
          onClick={() => setActiveMode('barcode')}
        >
          Barcode Only
        </button>
      </div>

      <div className="pass-codes-wrapper">
        {/* Real 2D QR Code */}
        {(activeMode === 'both' || activeMode === 'qr') && (
          <div className="qr-box-wrapper" title="Scan with camera">
            <div className="qr-canvas-card">
              <QRCodeSVG
                value={cleanValue}
                size={size}
                level="M"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
              />
            </div>
            <span className="qr-hint font-mono">⚡ SCAN WITH WEBCAM</span>
          </div>
        )}

        {/* Real 1D Barcode (CODE128) */}
        {(activeMode === 'both' || activeMode === 'barcode') && (
          <div className="barcode-svg-wrapper" title="Scan with laser barcode scanner">
            <div className="barcode-svg-card">
              <svg ref={barcodeRef} className="real-barcode-svg" />
            </div>
            <span className="barcode-hint font-mono">🔍 SCAN WITH LASER / GUN</span>
          </div>
        )}
      </div>

      <div className="pass-security-label font-mono">
        <span>🔒 ENCRYPTED DELEGATE TICKET ID: {cleanValue}</span>
      </div>
    </div>
  );
};

export default PassBarcodeQR;
