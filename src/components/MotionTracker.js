"use client";
import React, { useEffect, useRef, useState, memo } from 'react';
import { analyzePose, analyzeFingers } from '@/utils/exerciseDetection';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_FPS = 15;
const FRAME_MS = 1000 / TARGET_FPS;

const MotionTracker = ({ mode, onReady }) => {
  const videoRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [fingerCount, setFingerCount] = useState(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const workerRef = useRef(null);
  const repStateRef = useRef('up');
  const repCountRef = useRef(0);
  const isInitializingRef = useRef(false);
  const lastDetectTimeRef = useRef(0);
  const requestRef = useRef(null);
  const streamRef = useRef(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'SET_MODE', payload: { mode } });
    }
    repStateRef.current = 'up';
    repCountRef.current = 0;
    setFingerCount(mode === 'fingers' ? 0 : null);
  }, [mode]);

  useEffect(() => {
    if (isInitializingRef.current || isActive || error) return;
    isInitializingRef.current = true;

    const setup = async () => {
      try {
        workerRef.current = new Worker(new URL('../workers/poseWorker.js', import.meta.url));
        workerRef.current.onmessage = (e) => {
          const { type, pose, fingerCount: fc, workerError } = e.data;
          if (type === 'INIT_SUCCESS') {
            workerRef.current.postMessage({ type: 'SET_MODE', payload: { mode: modeRef.current } });
            startCamera();
          } else if (type === 'INIT_ERROR') {
            handleError(new Error(workerError));
          } else if (type === 'POSE_DETECTED') {
            handlePose(pose);
          } else if (type === 'HAND_DETECTED') {
            handleHand(fc);
          }
        };
        workerRef.current.postMessage({ type: 'INIT' });
      } catch (err) { handleError(err); }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: { ideal: 30 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsActive(true);
          isInitializingRef.current = false;
          if (onReady) onReady();
          requestRef.current = requestAnimationFrame(detectLoop);
        }
      } catch (err) { handleError(err); }
    };
    setup();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (workerRef.current) workerRef.current.terminate();
      isInitializingRef.current = false;
    };
  }, []);

  const handleError = (err) => {
    console.error(err);
    isInitializingRef.current = false;
    setError(err.name === 'NotAllowedError' ? "PERMISSION DENIED" : "HARDWARE ERROR");
  };

  const triggerBoostUI = () => {
    setIsBoosting(true);
    setTimeout(() => setIsBoosting(false), 200);
  };

  const handlePose = (pose) => {
    if (!pose) return;
    const result = analyzePose(pose, modeRef.current, repStateRef, repCountRef);
    if (result) {
      triggerBoostUI();
      window.dispatchEvent(new CustomEvent('pose-update', { detail: { reps: result.reps, action: result.action } }));
    }
  };

  const handleHand = (fc) => {
    setFingerCount(fc);
    const result = analyzeFingers(fc, repStateRef, repCountRef);
    if (result) {
      triggerBoostUI();
      window.dispatchEvent(new CustomEvent('pose-update', { detail: { reps: result.reps, action: result.action } }));
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
        const imageBitmap = await createImageBitmap(videoRef.current);
        if (workerRef.current) workerRef.current.postMessage({ type: 'DETECT', payload: { imageBitmap } }, [imageBitmap]);
        else imageBitmap.close();
      } catch (e) {}
    }
    requestRef.current = requestAnimationFrame(detectLoop);
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '200px', zIndex: 500 }}>
      {/* HUD Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="hud-text" style={{ fontSize: '10px' }}>LINK STATUS: <span style={{ color: isActive ? 'var(--accent)' : 'var(--danger)' }}>{isActive ? 'ACTIVE' : 'CONNECTING'}</span></span>
        <span className="hud-text" style={{ fontSize: '10px' }}>{isActive ? '30 FPS' : '0 FPS'}</span>
      </div>

      {/* Camera Feed Container */}
      <div style={{ position: 'relative', width: '100%', height: '150px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(57, 255, 20, 0.3)', background: '#000', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
        
        {/* Scanning Line */}
        {isActive && (
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }} 
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'rgba(57, 255, 20, 0.5)', zIndex: 10, boxShadow: '0 0 10px var(--accent)' }}
          />
        )}

        {/* Boost Flash Overlay */}
        <AnimatePresence>
          {isBoosting && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.4 }} 
              exit={{ opacity: 0 }} 
              style={{ position: 'absolute', inset: 0, background: 'var(--accent)', zIndex: 15 }}
            />
          )}
        </AnimatePresence>

        {/* Corner Brackets */}
        <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderLeft: '2px solid var(--accent)', borderTop: '2px solid var(--accent)', zIndex: 20 }} />
        <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRight: '2px solid var(--accent)', borderTop: '2px solid var(--accent)', zIndex: 20 }} />
        <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderLeft: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)', zIndex: 20 }} />
        <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderRight: '2px solid var(--accent)', borderBottom: '2px solid var(--accent)', zIndex: 20 }} />

        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: 0.6 }} playsInline muted />
        
        {!isActive && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 30 }}>
            <div className="loader"></div>
          </div>
        )}
      </div>

      {/* Mode Status HUD */}
      <div className="glass-card" style={{ marginTop: '10px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="hud-text" style={{ fontSize: '10px', opacity: 0.5 }}>EXERCISE DETECTOR</p>
        <p className="arcade-text" style={{ fontSize: '14px', color: 'var(--accent)' }}>{mode === 'jacks' ? 'JUMPING JACKS' : mode.toUpperCase()}</p>
        
        {mode === 'fingers' && (
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '24px' }}>{['✊', '☝️', '✌️', '🤟', '🖖', '🖐️'][Math.min(fingerCount || 0, 5)]}</span>
            <p className="hud-text" style={{ fontSize: '10px', color: fingerCount === 1 ? 'var(--accent)' : '#fff' }}>
              {fingerCount === 1 ? 'READY TO BOOST' : 'SHOW 1 FINGER'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MotionTracker);

