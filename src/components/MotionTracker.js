"use client";
import React, { useEffect, useRef, useState, memo } from 'react';
import { analyzePose } from '@/utils/exerciseDetection';

const TARGET_FPS = 15;
const FRAME_MS = 1000 / TARGET_FPS;

const MotionTracker = ({ mode, onReady }) => {
  const videoRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);
  const repStateRef = useRef('up');
  const repCountRef = useRef(0);
  const isInitializingRef = useRef(false);
  const lastDetectTimeRef = useRef(0);
  const requestRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isInitializingRef.current || isActive || error) return;
    isInitializingRef.current = true;

    const setup = async () => {
      try {
        // Initialize Web Worker
        workerRef.current = new Worker(new URL('../workers/poseWorker.js', import.meta.url));
        
        workerRef.current.onmessage = (e) => {
          const { type, pose, error: workerError } = e.data;
          
          if (type === 'INIT_SUCCESS') {
            startCamera();
          } else if (type === 'INIT_ERROR') {
            throw new Error(workerError);
          } else if (type === 'POSE_DETECTED') {
            handlePose(pose);
          }
        };

        workerRef.current.postMessage({ type: 'INIT' });
      } catch (err) {
        handleError(err);
      }
    };

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not available. This usually happens on non-HTTPS connections or unsupported browsers.");
        }

        // Lower resolution for better performance
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: { ideal: 30 } }
        });
        streamRef.current = stream;

        if (videoRef.current) {
          if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
          }
          await videoRef.current.play();
          setIsActive(true);
          isInitializingRef.current = false;
          if (onReady) onReady();
          requestRef.current = requestAnimationFrame(detectLoop);
        }
      } catch (err) {
        handleError(err);
      }
    };

    setup();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (workerRef.current) workerRef.current.terminate();
      isInitializingRef.current = false;
    };
  }, [mode]); // Re-run if mode changes so refs can reset if needed, actually refs persist

  const handleError = (err) => {
    console.error("MotionTracker Error:", err);
    isInitializingRef.current = false;
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setError("CAMERA ACCESS DENIED. Please check your browser settings.");
    } else {
      setError("CAMERA ERROR: " + err.message);
    }
  };

  const handlePose = (pose) => {
    if (!pose) return;
    
    const result = analyzePose(pose, mode, repStateRef, repCountRef);
    if (result) {
      // Dispatch custom event to avoid React re-renders
      window.dispatchEvent(new CustomEvent('pose-update', { 
        detail: { reps: result.reps, action: result.action } 
      }));
    }
  };

  const detectLoop = async (time) => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      requestRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    if (time - lastDetectTimeRef.current >= FRAME_MS) {
      lastDetectTimeRef.current = time;
      
      try {
        // createImageBitmap is fast and doesn't block main thread like canvas.drawImage
        const imageBitmap = await createImageBitmap(videoRef.current);
        if (workerRef.current) {
          workerRef.current.postMessage({ type: 'DETECT', payload: { imageBitmap } }, [imageBitmap]);
        } else {
          imageBitmap.close();
        }
      } catch (e) {
        // Silently catch if video is not ready
      }
    }
    
    requestRef.current = requestAnimationFrame(detectLoop);
  };

  const handleRetry = () => {
    isInitializingRef.current = false;
    setError(null);
    setIsActive(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '12px',
      right: '12px',
      width: 'clamp(100px, 15vw, 160px)',
      height: 'clamp(75px, 11vw, 120px)',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '2px solid var(--accent)',
      zIndex: 200,
      background: '#000',
      boxShadow: '0 0 16px rgba(57,255,20,0.3)'
    }}>
      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} playsInline muted />
      {!isActive && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', fontSize: '9px', color: 'var(--accent)', textAlign: 'center', padding: '8px' }}>
          <div className="loader" style={{ marginBottom: '5px' }}></div>
          INIT AI...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,0,0,0.95)', fontSize: '9px', color: '#fff', textAlign: 'center', padding: '8px' }}>
          <div style={{ color: '#ff0055', fontWeight: 'bold', marginBottom: '4px' }}>⚠️</div>
          <button onClick={handleRetry} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '9px' }}>RETRY</button>
        </div>
      )}
    </div>
  );
};

export default memo(MotionTracker);
