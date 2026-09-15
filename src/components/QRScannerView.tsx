import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { QRPayload } from '../types';
import { Camera, Image as ImageIcon, CheckCircle, AlertCircle, ArrowRight, QrCode } from 'lucide-react';

interface QRScannerViewProps {
  currentTableName: string | null;
  onTableSelected: (tableName: string) => void;
  onNavigateToSearch: () => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  currentTableName,
  onTableSelected,
  onNavigateToSearch,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [parsedPayload, setParsedPayload] = useState<QRPayload | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Camera permission was not granted or is not available. Please upload a shelf QR code photo below.'
      );
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Process Video Frame for QR
  const scanFrame = () => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current
    ) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleScannedString(code.data);
          stopCamera();
          return;
        }
      }
    }
    requestAnimationRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Parse QR text (can be JSON payload or tableName directly)
  const handleScannedString = (qrText: string) => {
    try {
      // Try JSON parsing
      const json = JSON.parse(qrText);
      const targetTable =
        json.tableName || json.collection || json.shelfId || json.table || qrText.trim();
      if (targetTable) {
        const payload: QRPayload = {
          tableName: targetTable,
          action: json.action || 'sync_inventory',
          generatedAt: json.generatedAt || new Date().toISOString(),
          shelfLabel: json.shelfLabel || json.name || targetTable,
        };
        setParsedPayload(payload);
        onTableSelected(payload.tableName);
        return;
      }
    } catch {
      // Fallback: direct table string
      const cleanName = qrText.trim();
      const payload: QRPayload = {
        tableName: cleanName,
        action: 'sync_inventory',
        generatedAt: new Date().toISOString(),
        shelfLabel: cleanName,
      };
      setParsedPayload(payload);
      onTableSelected(payload.tableName);
    }
  };

  // File Upload QR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleScannedString(code.data);
          } else {
            setCameraError('No valid QR code found in uploaded image. Please try another clear QR photo.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-xl mx-auto px-4 py-4 gap-5 pb-28 md:pb-12 overflow-y-auto">
      {/* Title & Instructions */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8083ff]/15 border border-[#8083ff]/30 text-[#c0c1ff] text-xs font-mono mb-1">
          <QrCode className="w-3.5 h-3.5" />
          <span>PHYSICAL QR AUTHENTICATION</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#dae2fd] tracking-tight">
          Scan Physical Shelf QR Code
        </h1>
        <p className="text-xs text-[#c7c4d7] max-w-md mx-auto">
          Scan the QR sticker on the bookcase stack or upload a QR image to unlock real-time shelf inventory, navigation, and book holds.
        </p>
      </div>

      {/* Success Notification Banner after scanning */}
      {parsedPayload && (
        <div
          id="qr-scanned-success-banner"
          className="bg-[#002113] border-2 border-[#4edea3] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#4edea3]/20 flex items-center justify-center text-[#4edea3] shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6ffbbe] font-bold">
                Shelf Connected & Unlocked
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#dae2fd]">
                {parsedPayload.shelfLabel || parsedPayload.tableName}
              </h3>
              <p className="text-[11px] text-[#c7c4d7] font-mono">
                Collection: {parsedPayload.tableName}
              </p>
            </div>
          </div>

          <button
            id="btn-navigate-to-books"
            onClick={onNavigateToSearch}
            className="w-full sm:w-auto bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003922] font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
          >
            <span>Explore Shelf Stacks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Camera Viewport Canvas Card */}
      <div
        id="camera-scan-container"
        className="bg-[#171f33] border border-[#464554] rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]"
      >
        {/* Hidden Canvas for QR Extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {cameraActive ? (
          <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden border-2 border-[#8083ff] shadow-inner bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 border-2 border-[#8083ff]/40 m-8 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-[#8083ff]" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-[#8083ff]" />
              </div>
              <div className="w-full h-0.5 bg-[#ffb95f] opacity-80 animate-bounce" />
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-[#8083ff]" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-[#8083ff]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-6 space-y-4">
            <div className="w-24 h-24 rounded-3xl bg-[#0b1326] border border-[#464554] flex items-center justify-center text-[#8083ff] shadow-inner">
              <Camera className="w-12 h-12 stroke-[1.5]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#dae2fd]">Optical Camera Scanner</h3>
              <p className="text-xs text-[#c7c4d7] mt-1 max-w-xs">
                Activate your camera to scan the QR code affixed to any library bookcase shelf.
              </p>
            </div>

            <button
              id="btn-start-camera"
              onClick={startCamera}
              className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Open Camera Scanner</span>
            </button>
          </div>
        )}

        {/* Camera Stop button if running */}
        {cameraActive && (
          <button
            onClick={stopCamera}
            className="mt-4 bg-[#222a3d] hover:bg-[#32394e] text-[#ffb4ab] border border-[#ffb4ab]/40 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Close Camera
          </button>
        )}

        {/* Camera Error / Fallback Notification */}
        {cameraError && (
          <div className="mt-3 p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs flex items-start gap-2 max-w-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Upload QR Image Option (Only valid method besides direct camera) */}
      <div className="bg-[#171f33] border border-[#464554] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0b1326] border border-[#464554] flex items-center justify-center text-[#c0c1ff]">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#dae2fd]">Upload Shelf QR Code Image</h4>
            <p className="text-[11px] text-[#c7c4d7]">Select a photo or screenshot containing a shelf QR code</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold px-4 py-2 rounded-xl text-xs shrink-0 transition-all active:scale-95 shadow-md"
        >
          Upload Photo
        </button>
      </div>
    </div>
  );
};
