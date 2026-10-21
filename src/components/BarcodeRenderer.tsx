import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeRendererProps {
  value: string;
  type?: 'barcode' | 'qr' | 'both';
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  type = 'barcode',
  width = 1.8,
  height = 50,
  displayValue = true,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate 1D Barcode (Code 128)
  useEffect(() => {
    if ((type === 'barcode' || type === 'both') && svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: 13,
          margin: 6,
          background: 'transparent',
          lineColor: '#1e293b',
        });
      } catch (e) {
        console.warn('JsBarcode rendering error:', e);
      }
    }
  }, [value, type, width, height, displayValue]);

  // Generate QR Code
  useEffect(() => {
    if (type === 'qr' || type === 'both') {
      QRCode.toDataURL(value, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff00',
        },
      })
        .then((url: string) => setQrDataUrl(url))
        .catch((err: unknown) => console.warn('QR code gen error:', err));
    }
  }, [value, type]);

  if (type === 'qr') {
    return qrDataUrl ? (
      <img
        src={qrDataUrl}
        alt={`QR Code ${value}`}
        className={`inline-block ${className}`}
      />
    ) : (
      <div className="w-20 h-20 bg-slate-100 animate-pulse rounded" />
    );
  }

  if (type === 'both') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex-1 flex justify-center">
          <svg ref={svgRef} className="max-w-full" />
        </div>
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt={`QR ${value}`}
            className="w-16 h-16 rounded border border-slate-200 p-1 bg-white"
          />
        )}
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
};
