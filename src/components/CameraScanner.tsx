'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

interface CameraScannerProps {
  onScanComplete: (result: any) => void;
  onClose: () => void;
}

export default function CameraScanner({ onScanComplete, onClose }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const startCamera = useCallback(async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Kamera error:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Clean up explicit
  const stopAndClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Gagal menangkap gambar.');
        setIsProcessing(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('image', blob, 'scan.jpg');
      
      try {
        const res = await fetch('/api/program/nutrition/scan', {
          method: 'POST',
          body: formData,
        });
        
        const data = await res.json();
        
        if (res.ok && data.results && data.results.length > 0) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          onScanComplete(data.results[0]);
        } else {
          setError(data.error || 'Gagal mengenali makanan. Coba foto lagi dengan pencahayaan baik.');
        }
      } catch (err) {
        setError('Terjadi kesalahan jaringan.');
      } finally {
        setIsProcessing(false);
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
        <button onClick={stopAndClose} className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-md">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <p className="text-white font-bold text-sm tracking-wider uppercase">Scan Makanan</p>
        <div className="w-10" />
      </div>
      
      {/* Viewfinder */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8 text-white">
            <p className="text-red-400 font-bold mb-4">⚠️ {error}</p>
            <button onClick={startCamera} className="bg-white/20 px-6 py-3 rounded-full font-bold">Coba Lagi</button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isProcessing ? 'opacity-30' : 'opacity-100'}`}
            />
            {/* Scanner Overlay */}
            {!isProcessing && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-[2rem] relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-[2rem]"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-[2rem]"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-[2rem]"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-[2rem]"></div>
                </div>
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-6 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                  Posisikan makanan di tengah
                </p>
              </div>
            )}
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-white font-bold text-sm uppercase tracking-widest bg-black/50 px-6 py-2 rounded-full">AI Menganalisis...</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Controls */}
      <div className="pb-safe bg-black">
        <div className="p-8 flex justify-center items-center h-32">
          {!error && (
            <button 
              disabled={isProcessing}
              onClick={captureAndScan}
              className={`w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center p-1 transition-transform ${isProcessing ? 'scale-90 opacity-50' : 'active:scale-95'}`}
            >
              <div className="w-full h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
            </button>
          )}
        </div>
      </div>
      
      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
